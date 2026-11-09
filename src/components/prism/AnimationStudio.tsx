import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent, type ReactNode } from "react";
import {
  ArrowDownToLine, ArrowLeft, AudioLines, ChevronDown, Circle, Clock3, Eye, EyeOff, Film, FolderOpen,
  Grid2X2, KeyRound, Layers3, Lock, Pause, Play, Plus, Redo2, RotateCcw, Save, Search, Settings2,
  SkipBack, SkipForward, Square, Trash2, Unlock, Video, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import {
  animationDurationSeconds, clampAnimationFrame, clonePose, createAnimationDocument, createId,
  evaluateLayerAtFrame, orderKeyframes, putKeyframe, removeKeyframe,
  type AnimationDocument, type AnimationLayer, type AnimationPose,
  type AnimationTransform, type KeyframeInterpolation, type Vector2,
} from "@/lib/prism/animation/model";
import {
  ANIMATION_ASSETS, ASSET_CATEGORY_COUNTS, findAnimationAsset,
  type AnimationAsset, type AnimationAssetCategory, type VectorPart,
} from "@/lib/prism/animation/assetLibrary";

const STORAGE_KEY = "prismdeck:animation-workspace:v2";
const CATEGORIES: Array<AnimationAssetCategory | "All"> = ["All", "Characters", "Trees", "Foliage", "Buildings"];
const FRAME_WIDTH = 10;
const DEFAULT_TRANSFORM: AnimationTransform = { x: 840, y: 350, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 };

function loadAnimationDocument(): AnimationDocument | null {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AnimationDocument;
        if (parsed.schema === 2 && Array.isArray(parsed.layers)) return parsed;
      }
    } catch { /* A damaged local copy should not prevent opening the workspace. */ }
  }
  return null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Part({ part }: { part: VectorPart }) {
  const common = {
    fill: part.fill ?? "none",
    stroke: part.stroke ?? "none",
    strokeWidth: part.strokeWidth ?? 0,
    opacity: part.opacity ?? 1,
    transform: part.rotation ? `rotate(${part.rotation} ${(part.x ?? 0) + (part.width ?? 0) / 2} ${(part.y ?? 0) + (part.height ?? 0) / 2})` : undefined,
  };
  if (part.kind === "rect") return <rect x={part.x ?? 0} y={part.y ?? 0} width={part.width ?? 0} height={part.height ?? 0} rx={part.rx ?? 0} {...common} />;
  if (part.kind === "ellipse") return <ellipse cx={(part.x ?? 0) + (part.width ?? 0)/2} cy={(part.y ?? 0) + (part.height ?? 0)/2} rx={(part.width ?? 0)/2} ry={(part.height ?? 0)/2} {...common} />;
  if (part.kind === "circle") return <circle cx={part.x ?? 0} cy={part.y ?? 0} r={part.radius ?? 0} {...common} />;
  if (part.kind === "line") return <line x1={part.x ?? 0} y1={part.y ?? 0} x2={part.x2 ?? 0} y2={part.y2 ?? 0} fill="none" {...common} strokeLinecap="round" />;
  if (part.kind === "polygon") return <polygon points={part.points ?? ""} {...common} />;
  return <path d={part.path ?? ""} {...common} strokeLinecap="round" strokeLinejoin="round" />;
}

function JointPoint({ point, selected, name, onPointerDown }: {
  point: Vector2; selected: boolean; name: string; onPointerDown: (event: PointerEvent<SVGCircleElement>) => void;
}) {
  return <circle cx={point.x} cy={point.y} r={selected ? 7 : 5} fill={selected ? "#f4c76a" : "#e6f4ff"}
    stroke="#182333" strokeWidth={2} className="anim-joint-handle" aria-label={name} onPointerDown={onPointerDown} />;
}

function AnimatedAsset({ asset, pose, selected, onJointPointerDown, onLayerPointerDown }: {
  asset: AnimationAsset;
  pose: AnimationPose;
  selected: boolean;
  onJointPointerDown: (event: PointerEvent<SVGCircleElement>, jointId: string) => void;
  onLayerPointerDown: (event: PointerEvent<SVGGElement>) => void;
}) {
  const transform = pose.transform;
  const joints = asset.rig?.joints.map(joint => ({
    ...joint, point: pose.joints[joint.id] ?? joint.position,
  })) ?? [];
  return <g transform={`translate(${transform.x} ${transform.y}) rotate(${transform.rotation} ${asset.width/2} ${asset.height/2}) scale(${transform.scaleX} ${transform.scaleY})`}
    opacity={transform.opacity} onPointerDown={onLayerPointerDown} style={{ cursor: selected ? "move" : "pointer" }}>
    {asset.parts.filter(part => part.id.startsWith("cape") || part.id.startsWith("roots")).map(part => <Part key={part.id} part={part} />)}
    {asset.rig?.bones.map(bone => {
      const from = pose.joints[bone.fromJointId] ?? asset.rig?.joints.find(joint => joint.id === bone.fromJointId)?.position;
      const to = pose.joints[bone.toJointId] ?? asset.rig?.joints.find(joint => joint.id === bone.toJointId)?.position;
      if (!from || !to) return null;
      return <line key={bone.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke={bone.color} strokeWidth={bone.thickness} strokeLinecap={bone.cap} />;
    })}
    {asset.parts.filter(part => !part.id.startsWith("cape") && !part.id.startsWith("roots")).map(part => <Part key={part.id} part={part} />)}
    {selected && <rect x={-7} y={-7} width={asset.width+14} height={asset.height+14} fill="none" stroke="#65d7ef" strokeWidth={2} strokeDasharray="7 5" pointerEvents="none" />}
    {selected && joints.map(joint => <JointPoint key={joint.id} point={joint.point} selected name={joint.name}
      onPointerDown={event => onJointPointerDown(event, joint.id)} />)}
  </g>;
}

function IconButton({ title, onClick, children, disabled = false, active = false }: {
  title: string; onClick: () => void; children: ReactNode; disabled?: boolean; active?: boolean;
}) {
  return <Button type="button" size="icon" variant={active ? "secondary" : "ghost"} className="anim-icon-button"
    title={title} aria-label={title} disabled={disabled} onClick={onClick}>{children}</Button>;
}

function makeLayer(asset: AnimationAsset, index: number): AnimationLayer {
  const transform = { ...DEFAULT_TRANSFORM, x: 770 + (index % 4) * 42, y: 310 + (index % 3) * 35 };
  const pose: AnimationPose = {
    transform,
    joints: Object.fromEntries((asset.rig?.joints ?? []).map(joint => [joint.id, { ...joint.position }])),
  };
  return {
    id: createId("layer_"), name: asset.name, assetId: asset.id, visible: true, locked: false,
    opacity: 1, basePose: clonePose(pose),
    keyframes: [{ id: createId("key_"), frame: 0, pose: clonePose(pose), interpolation: "ease-in-out" }],
  };
}

export function AnimationStudio({ onExit }: { onExit: () => void }) {
  const [document, setDocument] = useState<AnimationDocument>(() => createAnimationDocument("Untitled animation"));
  const [frame, setFrame] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [category, setCategory] = useState<AnimationAssetCategory | "All">("Characters");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(0.72);
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(true);
  const [timelineHeight, setTimelineHeight] = useState(246);
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef(frame);
  const dragRef = useRef<{ kind: "layer" | "joint"; layerId: string; jointId?: string; start: Vector2; pose: AnimationPose } | null>(null);

  const selectedLayer = document.layers.find(layer => layer.id === selectedLayerId) ?? null;
  const selectedAsset = selectedLayer ? findAnimationAsset(selectedLayer.assetId) : undefined;
  const selectedPose = selectedLayer ? evaluateLayerAtFrame(selectedLayer, frame) : null;
  const keyAtFrame = selectedLayer?.keyframes.find(key => key.frame === frame);
  const allAssets = ANIMATION_ASSETS;
  const filteredAssets = useMemo(() => allAssets.filter(asset =>
    (category === "All" || asset.category === category)
    && (search.trim() === "" || `${asset.name} ${asset.description} ${asset.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()))
  ), [allAssets, category, search]);

  useEffect(() => {
    const restored = loadAnimationDocument();
    if (restored) setDocument(restored);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
        setSaved(true);
      } catch {
        setSaved(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [document]);

  useEffect(() => { frameRef.current = frame; }, [frame]);

  useEffect(() => {
    if (!playing) return;
    let animationFrame = 0;
    let startTime = 0;
    const startFrame = frameRef.current;
    const advance = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = Math.floor((timestamp - startTime) * document.fps / 1000);
      const rawFrame = startFrame + elapsed;
      if (rawFrame >= document.durationFrames) {
        if (document.loop) setFrame(rawFrame % document.durationFrames);
        else { setFrame(document.durationFrames - 1); setPlaying(false); return; }
      } else setFrame(rawFrame);
      animationFrame = requestAnimationFrame(advance);
    };
    animationFrame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(animationFrame);
  }, [playing, document.fps, document.durationFrames, document.loop]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (["INPUT","TEXTAREA","SELECT"].includes(target.tagName) || target.isContentEditable)) return;
      if (event.code === "Space") { event.preventDefault(); setPlaying(value => !value); }
      else if (event.key === "ArrowRight") { event.preventDefault(); setFrame(value => clampAnimationFrame(value + (event.shiftKey ? 5 : 1), document.durationFrames)); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); setFrame(value => clampAnimationFrame(value - (event.shiftKey ? 5 : 1), document.durationFrames)); }
      else if (event.key.toLowerCase() === "k") { event.preventDefault(); addKeyframe(); }
      else if (event.key === "Escape") { setPlaying(false); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [document, selectedLayerId, frame]);

  const updateDocument = useCallback((updater: (current: AnimationDocument) => AnimationDocument) => {
    setDocument(current => ({ ...updater(current), updatedAt: Date.now() }));
    setSaved(false);
  }, []);

  const setSafeFrame = (value: number) => setFrame(clampAnimationFrame(value, document.durationFrames));

  const addAsset = (asset: AnimationAsset) => {
    const layer = makeLayer(asset, document.layers.length);
    updateDocument(current => ({ ...current, layers: [...current.layers, layer] }));
    setSelectedLayerId(layer.id);
    toast.success(`${asset.name} added to the scene`);
  };

  const updateLayer = (id: string, updater: (layer: AnimationLayer) => AnimationLayer) => {
    updateDocument(current => ({ ...current, layers: current.layers.map(layer => layer.id === id ? updater(layer) : layer) }));
  };

  const updatePose = (id: string, updater: (pose: AnimationPose) => AnimationPose) => {
    updateLayer(id, layer => {
      const pose = updater(evaluateLayerAtFrame(layer, frame));
      const next = putKeyframe(layer, frame, pose, keyAtFrame?.interpolation ?? "ease-in-out");
      return { ...next, basePose: frame === 0 ? clonePose(pose) : next.basePose };
    });
  };

  function addKeyframe() {
    if (!selectedLayer) { toast.error("Select an animation layer first."); return; }
    const pose = evaluateLayerAtFrame(selectedLayer, frame);
    updateLayer(selectedLayer.id, layer => putKeyframe(layer, frame, pose));
    toast.success(`Keyframe added at frame ${frame + 1}`);
  }

  const deleteCurrentKeyframe = () => {
    if (!selectedLayer || !keyAtFrame) return;
    updateLayer(selectedLayer.id, layer => removeKeyframe(layer, keyAtFrame.id));
  };

  const changeStagePoint = (event: { clientX: number; clientY: number }): Vector2 => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const ratio = Math.min(rect.width / document.width, rect.height / document.height);
    const left = (rect.width - document.width * ratio) / 2;
    const top = (rect.height - document.height * ratio) / 2;
    return { x: (event.clientX - rect.left - left) / ratio, y: (event.clientY - rect.top - top) / ratio };
  };

  const beginLayerDrag = (event: PointerEvent<SVGGElement>, layer: AnimationLayer) => {
    if (layer.locked || !selectedLayer) {
      if (layer.locked) return;
    }
    event.stopPropagation();
    setSelectedLayerId(layer.id);
    const pose = evaluateLayerAtFrame(layer, frame);
    dragRef.current = { kind: "layer", layerId: layer.id, start: changeStagePoint(event), pose };
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const beginJointDrag = (event: PointerEvent<SVGCircleElement>, layer: AnimationLayer, jointId: string) => {
    event.stopPropagation();
    event.preventDefault();
    if (layer.locked) return;
    setSelectedLayerId(layer.id);
    const pose = evaluateLayerAtFrame(layer, frame);
    dragRef.current = { kind: "joint", layerId: layer.id, jointId, start: changeStagePoint(event), pose };
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const moveStagePointer = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const current = changeStagePoint(event);
    const dx = current.x - drag.start.x, dy = current.y - drag.start.y;
    if (drag.kind === "layer") {
      updatePose(drag.layerId, pose => ({ ...pose, transform: { ...drag.pose.transform, x: drag.pose.transform.x + dx, y: drag.pose.transform.y + dy } }));
      return;
    }
    const layer = document.layers.find(item => item.id === drag.layerId);
    const asset = layer ? findAnimationAsset(layer.assetId) : undefined;
    if (!layer || !asset || !drag.jointId) return;
    const t = drag.pose.transform;
    const cx=asset.width/2, cy=asset.height/2;
    const px=current.x-t.x-cx, py=current.y-t.y-cy, angle=-t.rotation*Math.PI/180;
    const rotated={x:px*Math.cos(angle)-py*Math.sin(angle),y:px*Math.sin(angle)+py*Math.cos(angle)};
    const local={x:rotated.x/Math.max(.01,t.scaleX)+cx,y:rotated.y/Math.max(.01,t.scaleY)+cy};
    updatePose(drag.layerId, pose => ({ ...pose, joints: { ...pose.joints, [drag.jointId!]: local } }));
  };

  const endStagePointer = () => { dragRef.current = null; };

  const updateTransform = (key: keyof AnimationTransform, raw: number) => {
    if (!selectedLayer || !Number.isFinite(raw)) return;
    updatePose(selectedLayer.id, pose => ({ ...pose, transform: { ...pose.transform, [key]: key === "opacity" ? Math.max(0,Math.min(1,raw)) : raw } }));
  };

  const updateLayerMeta = (patch: Partial<Pick<AnimationLayer,"name"|"visible"|"locked">>) => {
    if (selectedLayer) updateLayer(selectedLayer.id, layer => ({ ...layer, ...patch }));
  };

  const changeInterpolation = (value: KeyframeInterpolation) => {
    if (!selectedLayer) return;
    if (!keyAtFrame) {
      const pose = evaluateLayerAtFrame(selectedLayer, frame);
      updateLayer(selectedLayer.id, layer => putKeyframe(layer, frame, pose, value));
      return;
    }
    updateLayer(selectedLayer.id, layer => ({ ...layer, keyframes: layer.keyframes.map(key => key.id === keyAtFrame.id ? { ...key, interpolation: value } : key) }));
  };

  const removeLayer = (id: string) => {
    updateDocument(current => ({ ...current, layers: current.layers.filter(layer => layer.id !== id) }));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const addEmptyProject = () => {
    if (document.layers.length && !window.confirm("Create a new animation project? Your current project has been saved locally.")) return;
    const next = createAnimationDocument("Untitled animation");
    setDocument(next); setFrame(0); setSelectedLayerId(null); setPlaying(false);
  };

  const exportProject = () => downloadBlob(new Blob([JSON.stringify(document,null,2)],{type:"application/json"}), `${document.name.replace(/[^a-z0-9-_]+/gi,"-") || "animation"}.prismanim.json`);

  const exportCurrentFrame = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll(".anim-selection-box,.anim-joint-handle,.anim-stage-grid").forEach(node=>node.remove());
    clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
    const xml = new XMLSerializer().serializeToString(clone);
    downloadBlob(new Blob([xml],{type:"image/svg+xml"}), `frame-${String(frame+1).padStart(4,"0")}.svg`);
  };

  const rulerFrames = Array.from({length:document.durationFrames},(_,index)=>index);
  const seconds = animationDurationSeconds(document);
  const selectedKeyframes = selectedLayer ? orderKeyframes(selectedLayer.keyframes) : [];
  const assetCount = ANIMATION_ASSETS.length;

  return <div className="animation-studio">
    <Toaster theme="dark" position="bottom-right" richColors />
    <header className="anim-header">
      <div className="anim-brand"><div className="anim-brand-mark"><Film size={18}/></div><div><strong>PrismDeck</strong><span>ANIMATION STUDIO</span></div></div>
      <Button type="button" variant="ghost" size="sm" className="anim-back" onClick={onExit}><ArrowLeft size={15}/> Slides</Button>
      <div className="anim-header-divider"/>
      <input className="anim-project-name" aria-label="Animation project name" value={document.name} onChange={event=>updateDocument(current=>({...current,name:event.target.value}))}/>
      <span className={`anim-save-state ${saved?"":"is-saving"}`}><span/>{saved?"Saved locally":"Saving…"}</span>
      <div className="anim-header-actions">
        <IconButton title="New animation project" onClick={addEmptyProject}><Plus/></IconButton>
        <IconButton title="Export animation project" onClick={exportProject}><ArrowDownToLine/></IconButton>
        <Button type="button" variant="outline" size="sm" className="anim-export-frame" onClick={exportCurrentFrame}>Export frame</Button>
        <Button type="button" variant="ghost" size="icon" onClick={()=>setShowSettings(value=>!value)} title="Animation settings"><Settings2/></Button>
      </div>
    </header>

    {showSettings && <section className="anim-settings-popover">
      <label>Frame rate <select value={document.fps} onChange={event=>updateDocument(current=>({...current,fps:Number(event.target.value)}))}>{[12,15,18,24,25,30,48,50,60].map(value=><option key={value} value={value}>{value} FPS</option>)}</select></label>
      <label>Duration (frames) <input type="number" min={12} max={3600} value={document.durationFrames} onChange={event=>{const value=Math.max(12,Math.min(3600,Number(event.target.value)||120));updateDocument(current=>({...current,durationFrames:value}));setFrame(current=>Math.min(current,value-1));}}/></label>
      <label>Canvas <select value={`${document.width}x${document.height}`} onChange={event=>{const [width,height]=event.target.value.split("x").map(Number);updateDocument(current=>({...current,width,height}));}}><option value="1920x1080">1920 × 1080 · 16:9</option><option value="1440x1080">1440 × 1080 · 4:3</option><option value="1080x1920">1080 × 1920 · Portrait</option><option value="1200x1200">1200 × 1200 · Square</option></select></label>
      <label>Loop playback <input type="checkbox" checked={document.loop} onChange={event=>updateDocument(current=>({...current,loop:event.target.checked}))}/></label>
      <label>Stage background <input type="color" value={document.background} onChange={event=>updateDocument(current=>({...current,background:event.target.value}))}/></label>
      <span>{seconds.toFixed(2)} seconds total</span>
    </section>}

    <div className="anim-workspace">
      <aside className="anim-assets-panel">
        <div className="anim-panel-heading"><div><strong>Asset library</strong><span>{assetCount} animation-ready assets</span></div><Grid2X2 size={16}/></div>
        <div className="anim-search"><Search size={14}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search assets…"/></div>
        <div className="anim-category-tabs">{CATEGORIES.map(item=><button key={item} type="button" className={category===item?"active":""} onClick={()=>setCategory(item)}>{item==="All"?"All":item}<small>{item==="All"?assetCount:item==="Characters"?ASSET_CATEGORY_COUNTS.Characters:ASSET_CATEGORY_COUNTS[item]}</small></button>)}</div>
        <div className="anim-asset-grid">
          {filteredAssets.map(asset=><button key={asset.id} type="button" className="anim-asset-card" title={asset.description} onClick={()=>addAsset(asset)}>
            <svg viewBox={`0 0 ${asset.width} ${asset.height}`} role="img" aria-label={asset.name}>
              {asset.rig?.bones.map(bone=>{const from=asset.rig?.joints.find(j=>j.id===bone.fromJointId)?.position;const to=asset.rig?.joints.find(j=>j.id===bone.toJointId)?.position;return from&&to?<line key={bone.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={bone.color} strokeWidth={bone.thickness} strokeLinecap="round"/>:null})}
              {asset.parts.map(part=><Part key={part.id} part={part}/>)}
            </svg>
            <span>{asset.name}</span>
            {asset.rig && <small><KeyRound size={10}/> Rigged</small>}
          </button>)}
          {filteredAssets.length===0 && <div className="anim-empty-assets">No assets match your search.</div>}
        </div>
        <div className="anim-library-footer"><span>VECTOR ASSETS</span><span>EDITABLE · RIG-READY</span></div>
      </aside>

      <main className="anim-center">
        <div className="anim-stage-toolbar">
          <div className="anim-stage-breadcrumb"><span>SCENE</span><ChevronDown size={12}/><strong>{document.name}</strong></div>
          <div className="anim-stage-tools">
            <span>{document.width} × {document.height}</span>
            <IconButton title="Zoom out" onClick={()=>setZoom(value=>Math.max(.25,value-.1))}><ZoomOut/></IconButton>
            <span>{Math.round(zoom*100)}%</span>
            <IconButton title="Zoom in" onClick={()=>setZoom(value=>Math.min(1.5,value+.1))}><ZoomIn/></IconButton>
            <IconButton title="Fit stage" onClick={()=>setZoom(.72)}><RotateCcw/></IconButton>
          </div>
        </div>
        <div className="anim-stage-wrap">
          <svg ref={svgRef} className="anim-stage" viewBox={`0 0 ${document.width} ${document.height}`} style={{width:`${zoom*100}%`,background:document.background}}
            onPointerMove={moveStagePointer} onPointerUp={endStagePointer} onPointerCancel={endStagePointer}
            onPointerDown={event=>{if(event.target===event.currentTarget)setSelectedLayerId(null);}}>
            <defs><pattern id="anim-stage-grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,.055)" strokeWidth="2"/></pattern></defs>
            <rect className="anim-stage-grid" width={document.width} height={document.height} fill="url(#anim-stage-grid)" pointerEvents="none"/>
            {document.layers.filter(layer=>layer.visible).map(layer=>{
              const asset=findAnimationAsset(layer.assetId);
              if(!asset)return null;
              const pose=evaluateLayerAtFrame(layer,frame);
              return <AnimatedAsset key={layer.id} asset={asset} pose={pose} selected={layer.id===selectedLayerId}
                onLayerPointerDown={event=>beginLayerDrag(event,layer)}
                onJointPointerDown={(event,jointId)=>beginJointDrag(event,layer,jointId)}/>;
            })}
          </svg>
          {document.layers.length===0 && <div className="anim-stage-empty"><div className="anim-empty-icon"><Film size={24}/></div><strong>Your animation starts here</strong><span>Add a character, tree, building or foliage asset from the library.</span></div>}
          <div className="anim-stage-readout"><span>FRAME {String(frame+1).padStart(3,"0")}</span><span>{document.fps} FPS</span><span>{selectedAsset?.name??"NO SELECTION"}</span></div>
        </div>
        <div className="anim-transport">
          <div className="anim-transport-left">
            <IconButton title="First frame" onClick={()=>setSafeFrame(0)}><SkipBack/></IconButton>
            <IconButton title="Previous frame" onClick={()=>setSafeFrame(frame-1)}><ArrowLeft/></IconButton>
            <Button type="button" size="icon" className="anim-play-button" title={playing?"Pause":"Play"} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={18}/>:<Play size={18}/>}</Button>
            <IconButton title="Next frame" onClick={()=>setSafeFrame(frame+1)}><ArrowDownToLine/></IconButton>
            <IconButton title="Last frame" onClick={()=>setSafeFrame(document.durationFrames-1)}><SkipForward/></IconButton>
          </div>
          <div className="anim-frame-display"><span>FRAME</span><input aria-label="Current frame" type="number" min={1} max={document.durationFrames} value={frame+1} onChange={event=>setSafeFrame(Number(event.target.value)-1)}/><span>/ {document.durationFrames}</span></div>
          <div className="anim-transport-right">
            <IconButton title="Add keyframe · K" onClick={addKeyframe} disabled={!selectedLayer}><KeyRound/></IconButton>
            <IconButton title="Delete keyframe at playhead" onClick={deleteCurrentKeyframe} disabled={!keyAtFrame}><Trash2/></IconButton>
            <span className="anim-transport-separator"/>
            <span>{(frame/document.fps).toFixed(2)}s</span>
          </div>
        </div>
      </main>

      <aside className="anim-inspector-panel">
        <div className="anim-panel-heading"><div><strong>Object inspector</strong><span>{selectedLayer?selectedLayer.name:"Scene settings"}</span></div><Settings2 size={16}/></div>
        {selectedLayer && selectedPose ? <>
          <div className="anim-inspector-section">
            <label className="anim-field-label">Layer name</label>
            <input className="anim-text-field" value={selectedLayer.name} onChange={event=>updateLayerMeta({name:event.target.value})}/>
            <div className="anim-inspector-actions">
              <button type="button" onClick={()=>updateLayerMeta({visible:!selectedLayer.visible})}>{selectedLayer.visible?<Eye size={14}/>:<EyeOff size={14}/>} {selectedLayer.visible?"Visible":"Hidden"}</button>
              <button type="button" onClick={()=>updateLayerMeta({locked:!selectedLayer.locked})}>{selectedLayer.locked?<Lock size={14}/>:<Unlock size={14}/>} {selectedLayer.locked?"Locked":"Unlocked"}</button>
            </div>
          </div>
          <div className="anim-inspector-section">
            <div className="anim-section-title">TRANSFORM <span>FRAME {frame+1}</span></div>
            <div className="anim-transform-grid">
              {([{key:"x",label:"X"},{key:"y",label:"Y"},{key:"scaleX",label:"Scale X"},{key:"scaleY",label:"Scale Y"},{key:"rotation",label:"Rotation"},{key:"opacity",label:"Opacity"}] as const).map(field=><label key={field.key}><span>{field.label}</span><input type="number" step={(field.key.startsWith("scale") || field.key === "opacity") ? 0.1 : 1} value={Number(selectedPose.transform[field.key].toFixed(2))} onChange={event=>updateTransform(field.key,Number(event.target.value))}/></label>)}
            </div>
            <div className="anim-slider-field"><label>Rotation</label><input type="range" min={-180} max={180} value={selectedPose.transform.rotation} onChange={event=>updateTransform("rotation",Number(event.target.value))}/></div>
            <div className="anim-slider-field"><label>Opacity</label><input type="range" min={0} max={1} step={.01} value={selectedPose.transform.opacity} onChange={event=>updateTransform("opacity",Number(event.target.value))}/></div>
          </div>
          <div className="anim-inspector-section">
            <div className="anim-section-title">KEYFRAME <span>{keyAtFrame?"KEY EXISTS":"INTERPOLATED"}</span></div>
            <label className="anim-field-label">Outgoing tween</label>
            <select className="anim-select" value={keyAtFrame?.interpolation??"ease-in-out"} onChange={event=>changeInterpolation(event.target.value as KeyframeInterpolation)}>
              <option value="hold">Hold · no movement</option><option value="linear">Linear</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in / out</option>
            </select>
            <div className="anim-keyframe-status">{selectedKeyframes.length} keyframes · automatic inbetweens enabled</div>
            <Button type="button" variant="outline" size="sm" className="anim-wide-button" onClick={addKeyframe}><KeyRound size={14}/> Set keyframe at frame {frame+1}</Button>
          </div>
          {selectedAsset?.rig && <div className="anim-inspector-section"><div className="anim-section-title">CHARACTER RIG <span>{selectedAsset.rig.joints.length} JOINTS</span></div><p className="anim-helper-copy">Select a rig joint on the stage and drag it to pose this character. Add keyframes at different times to animate the pose.</p></div>}
          <div className="anim-inspector-section"><Button type="button" variant="ghost" size="sm" className="anim-delete-layer" onClick={()=>removeLayer(selectedLayer.id)}><Trash2 size={14}/> Remove layer</Button></div>
        </> : <div className="anim-scene-settings">
          <p>Select an object on the stage or from the layer list to edit its transform and animation.</p>
          <label>Frame rate <strong>{document.fps} fps</strong></label>
          <label>Duration <strong>{document.durationFrames} frames</strong></label>
          <label>Length <strong>{seconds.toFixed(2)} seconds</strong></label>
          <label>Objects <strong>{document.layers.length}</strong></label>
        </div>}
        <div className="anim-inspector-footer"><span/>VECTOR / KEYFRAME WORKSPACE</div>
      </aside>
    </div>

    <section className="anim-timeline" style={{height:timelineHeight}}>
      <div className="anim-timeline-top">
        <div className="anim-timeline-title"><Layers3 size={15}/><strong>Timeline</strong><span>{document.layers.length} layers</span></div>
        <div className="anim-timeline-controls"><span>INBETWEENS <b>ON</b></span><IconButton title="Decrease timeline height" onClick={()=>setTimelineHeight(value=>Math.max(170,value-24))}><ArrowLeft/></IconButton><IconButton title="Increase timeline height" onClick={()=>setTimelineHeight(value=>Math.min(430,value+24))}><ArrowDownToLine/></IconButton></div>
      </div>
      <div className="anim-timeline-scroll">
        <div className="anim-timeline-grid">
          <div className="anim-timeline-label-head">LAYERS / OBJECTS</div>
          <div className="anim-ruler" style={{width:document.durationFrames*FRAME_WIDTH}}>
            {rulerFrames.map(index=><button key={index} type="button" className={`anim-ruler-tick ${index%12===0?"major":""}`} style={{left:index*FRAME_WIDTH}} onClick={()=>setSafeFrame(index)}>{index%12===0?<span>{index+1}</span>:null}</button>)}
            <div className="anim-playhead" style={{left:frame*FRAME_WIDTH}}/>
          </div>
          {document.layers.map((layer,index)=>{
            const selected=layer.id===selectedLayerId;
            return <div className={`anim-timeline-row ${selected?"selected":""}`} key={layer.id}>
              <div className="anim-layer-label">
                <button type="button" className="anim-layer-eye" title={layer.visible?"Hide layer":"Show layer"} onClick={()=>updateLayer(layer.id,current=>({...current,visible:!current.visible}))}>{layer.visible?<Eye size={13}/>:<EyeOff size={13}/>}</button>
                <button type="button" className="anim-layer-lock" title={layer.locked?"Unlock layer":"Lock layer"} onClick={()=>updateLayer(layer.id,current=>({...current,locked:!current.locked}))}>{layer.locked?<Lock size={13}/>:<Unlock size={13}/>}</button>
                <button type="button" className="anim-layer-select" onClick={()=>setSelectedLayerId(layer.id)}><span>{index+1}</span>{layer.name}</button>
                <button type="button" className="anim-layer-delete" title="Remove layer" onClick={()=>removeLayer(layer.id)}><X size={12}/></button>
              </div>
              <div className="anim-key-track" style={{width:document.durationFrames*FRAME_WIDTH}} onClick={event=>{const rect=event.currentTarget.getBoundingClientRect();setSafeFrame(Math.floor((event.clientX-rect.left)/FRAME_WIDTH));}}>
                {Array.from({length:Math.ceil(document.durationFrames/12)},(_,i)=><span key={i} className="anim-track-gridline" style={{left:i*12*FRAME_WIDTH}}/>)}
                {layer.keyframes.map(key=><button key={key.id} type="button" className={`anim-key-diamond ${key.frame===frame?"current":""}`} style={{left:key.frame*FRAME_WIDTH}} title={`Keyframe ${key.frame+1} · ${key.interpolation}`} onClick={event=>{event.stopPropagation();setSelectedLayerId(layer.id);setSafeFrame(key.frame);}}/> )}
                <div className="anim-row-playhead" style={{left:frame*FRAME_WIDTH}}/>
              </div>
            </div>;
          })}
          {document.layers.length===0 && <div className="anim-timeline-empty"><Clock3 size={15}/> Add an asset to create your first animation track.</div>}
        </div>
      </div>
      <div className="anim-timeline-foot"><span>0</span><span>KEYFRAMES {document.layers.reduce((count,layer)=>count+layer.keyframes.length,0)}</span><span>PLAYHEAD {String(frame+1).padStart(3,"0")}</span><span>{document.fps} FPS</span><span>{seconds.toFixed(2)} SEC</span></div>
    </section>
    <footer className="anim-statusbar"><span><span className="anim-status-dot"/>ANIMATION MODE</span><span>SPACE Play / Pause</span><span>← → Step frame</span><span>K Add keyframe</span><span>Local project · {saved?"Saved":"Saving"}</span></footer>
  </div>;
}
