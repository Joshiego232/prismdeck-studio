import { useState, type MouseEvent, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline, Layers, ChevronUp, ChevronDown, ChevronRight, Trash2, Copy, Eye, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeck, currentSlide, findSlide } from "@/lib/prism/store";
import { FONT_CATALOGUE, loadWebFont } from "@/lib/prism/fonts";
import { TRANSITIONS, ANIMATIONS, EASINGS } from "@/lib/prism/effects";
import { makeAnimation } from "@/lib/prism/factory";
import { normalizeGradientColors } from "@/lib/prism/gradients";
import type { Animation, Background, Deck, GradientType, Slide, SlideElement } from "@/lib/prism/types";
import { parseChartData, serializeChartData } from "@/lib/prism/charts";
import { PhotoEffectsStudio } from "./PhotoEffectsStudio";
import { DEFAULT_ADJUST, type VisualAdjustments } from "@/lib/prism/types";
import { DEFAULT_VISUAL_ADJUSTMENTS, toLegacyImageAdjustments } from "@/lib/prism/visualAdjustments";

export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="property-field"><span>{label}</span>{children}</label>; }
export function Numeric({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) { return <Field label={label}><input aria-label={label} type="number" value={Math.round(value * 100) / 100} min={min} max={max} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))); }} /></Field>; }

function GradientEditor({ colors, angle, type, onColorsChange, onAngleChange, onTypeChange }: {
  colors: string[];
  angle: number;
  type: GradientType;
  onColorsChange: (colors: string[]) => void;
  onAngleChange: (angle: number) => void;
  onTypeChange: (type: GradientType) => void;
}) {
  const stops = normalizeGradientColors(colors);
  return <>
    <Field label="Gradient design"><select value={type} onChange={e => onTypeChange(e.target.value as GradientType)}>
      <option value="linear">Linear</option>
      <option value="radial">Radial</option>
      <option value="reverse-radial">Reverse radial</option>
      <option value="conic">Conic</option>
      <option value="diamond">Diamond</option>
    </select></Field>
    <Numeric label="Gradient rotation (°)" value={angle} min={0} max={360} onChange={onAngleChange} />
    <div className="gradient-stops">
      <div className="section-label">Gradient colours · {stops.length}/6</div>
      {stops.map((color, index) => <div className="gradient-stop-row" key={index}>
        <span className="gradient-stop-label">Stop {index + 1}</span>
        <input aria-label={`Gradient colour ${index + 1}`} type="color" value={color} onChange={e => onColorsChange(stops.map((item, i) => i === index ? e.target.value : item))} />
        <Button title={`Remove colour ${index + 1}`} variant="ghost" size="icon" disabled={stops.length <= 2} onClick={() => onColorsChange(stops.filter((_, i) => i !== index))}><Trash2 /></Button>
      </div>)}
      <Button variant="outline" size="sm" disabled={stops.length >= 6} onClick={() => onColorsChange([...stops, stops[stops.length - 1] ?? "#ffffff"])}><Plus /> Add colour</Button>
    </div>
  </>;
}

export function TransitionControls({ slide }: { slide: Slide }) {
  const patch = (p: Partial<Slide["transition"]>) => useDeck.getState().mutate(d => { const s = findSlide(d, slide.id); if (s) Object.assign(s.transition, p); });
  return <><Field label="Transition"><select value={slide.transition.type} onChange={e => patch({ type: e.target.value })}>{TRANSITIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></Field><div className="property-grid"><Numeric label="Duration (ms)" value={slide.transition.duration} min={0} max={10000} onChange={duration => patch({ duration })} /><Field label="Direction"><select value={slide.transition.direction} onChange={e => patch({ direction: e.target.value as Slide["transition"]["direction"] })}>{["left", "right", "up", "down"].map(d => <option key={d}>{d}</option>)}</select></Field></div><Field label="Easing"><select value={slide.transition.easing} onChange={e => patch({ easing: e.target.value })}>{EASINGS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}</select></Field></>;
}

export function AnimationControls({ slide, el }: { slide: Slide; el?: SlideElement | undefined }) {
  const animations = slide.animations.filter(a => a.elementId === el?.id);
  const patch = (id: string, p: Partial<Animation>) => useDeck.getState().mutate(d => {
    const animation = findSlide(d, slide.id)?.animations.find(item => item.id === id);
    if (animation) Object.assign(animation, p);
  });
  const move = (id: string, direction: -1 | 1) => useDeck.getState().mutate(d => {
    const current = findSlide(d, slide.id);
    if (!current) return;
    const from = current.animations.findIndex(item => item.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= current.animations.length) return;
    [current.animations[from], current.animations[to]] = [current.animations[to]!, current.animations[from]!];
  });
  const remove = (id: string) => useDeck.getState().mutate(d => {
    const current = findSlide(d, slide.id);
    if (current) current.animations = current.animations.filter(item => item.id !== id);
  });
  return <>
    <Field label="Add animation"><select disabled={!el} value="" onChange={event => {
      const preset = ANIMATIONS.find(item => item.id === event.target.value);
      if (el && preset) useDeck.getState().mutate(d => findSlide(d, slide.id)?.animations.push(makeAnimation(el.id, preset.kind, preset.id)));
    }}><option value="">{el ? "Choose an effect…" : "Select an object"}</option>{ANIMATIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
    {animations.map((animation, index) => <div className="animation-entry" key={animation.id}>
      <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{index + 1}. {ANIMATIONS.find(item => item.id === animation.effect)?.label ?? animation.effect}</span><div className="flex items-center">
        <Button title="Move animation earlier" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(animation.id, -1)}><ChevronUp /></Button>
        <Button title="Move animation later" variant="ghost" size="icon" disabled={index === animations.length - 1} onClick={() => move(animation.id, 1)}><ChevronDown /></Button>
        <Button variant="ghost" size="icon" title="Remove animation" onClick={() => remove(animation.id)}><Trash2 /></Button>
      </div></div>
      <Field label="Start"><select value={animation.trigger} onChange={event => patch(animation.id, { trigger: event.target.value as Animation["trigger"] })}><option value="onClick">On click</option><option value="withPrevious">With previous</option><option value="afterPrevious">After previous</option></select></Field>
      <div className="property-grid"><Numeric label="Duration (ms)" value={animation.duration} min={50} max={30000} onChange={duration => patch(animation.id, { duration })} /><Numeric label="Delay (ms)" value={animation.delay} min={0} max={30000} onChange={delay => patch(animation.id, { delay })} /></div>
      <div className="property-grid"><Numeric label="Repeat count" value={animation.repeatCount ?? 1} min={1} max={20} onChange={repeatCount => patch(animation.id, { repeatCount })} /><Field label="Direction"><select value={animation.direction} onChange={event => patch(animation.id, { direction: event.target.value as Animation["direction"] })}>{["left", "right", "up", "down"].map(direction => <option key={direction}>{direction}</option>)}</select></Field></div>
      <Field label="Easing"><select value={animation.easing} onChange={event => patch(animation.id, { easing: event.target.value })}>{EASINGS.map(easing => <option key={easing.value} value={easing.value}>{easing.label}</option>)}</select></Field>
      <label className="flex items-center gap-2 text-[10px] text-muted-foreground"><input type="checkbox" checked={!!animation.motionPath?.length} onChange={event => patch(animation.id, { motionPath: event.target.checked ? [{ x: 0, y: 0 }, { x: 240, y: 0 }] : undefined })} /> Use custom motion path</label>
      {animation.motionPath?.length && <div className="property-grid">
        <Numeric label="Path end X (px)" value={animation.motionPath[1]?.x ?? 240} onChange={x => patch(animation.id, { motionPath: [{ x: 0, y: 0 }, { x, y: animation.motionPath?.[1]?.y ?? 0 }] })} />
        <Numeric label="Path end Y (px)" value={animation.motionPath[1]?.y ?? 0} onChange={y => patch(animation.id, { motionPath: [{ x: 0, y: 0 }, { x: animation.motionPath?.[1]?.x ?? 240, y }] })} />
      </div>}
      <label className="flex items-center gap-2 text-[10px] text-muted-foreground"><input type="checkbox" checked={animation.alternate ?? false} onChange={event => patch(animation.id, { alternate: event.target.checked })} /> Alternate direction on each repeat</label>
    </div>)}
  </>;
}

function ChartCsvEditor({ data, onApply }: { data: Array<{ label: string; value: number }>; onApply: (data: Array<{ label: string; value: number }>) => void }) {
  const [draft, setDraft] = useState(() => serializeChartData(data));
  const [message, setMessage] = useState("");
  return <div className="chart-csv-editor">
    <label>Paste spreadsheet data <small>Label, value — one row per line</small>
      <textarea rows={5} value={draft} onChange={event => setDraft(event.target.value)} placeholder={"Category,Value\nNorth,42\nSouth,58"} />
    </label>
    <Button type="button" variant="outline" size="sm" onClick={() => {
      const parsed = parseChartData(draft);
      if (parsed.length < 2) { setMessage("Add at least two valid label/value rows."); return; }
      onApply(parsed);
      setMessage(`Imported ${parsed.length} data points.`);
    }}>Import data</Button>
    {message && <small className="chart-import-message">{message}</small>}
  </div>;
}

export function Inspector({ mode, onMode }: { mode: string; onMode: (s: string) => void }) {
  const st = useDeck(), slide = currentSlide(st);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  const layerRows: Array<{ kind: "group"; groupId: string; members: SlideElement[] } | { kind: "element"; element: SlideElement }> = [];
  const seenGroupIds = new Set<string>();
  for (const element of [...slide.elements].reverse()) {
    if (!element.groupId) { layerRows.push({ kind: "element", element }); continue; }
    if (seenGroupIds.has(element.groupId)) continue;
    seenGroupIds.add(element.groupId);
    layerRows.push({ kind: "group", groupId: element.groupId, members: [...slide.elements].reverse().filter(member => member.groupId === element.groupId) });
  }
  const selectLayerElements = (event: MouseEvent<HTMLButtonElement>, ids: string[]) => {
    const mode = event.shiftKey ? "add" : event.metaKey || event.ctrlKey ? "toggle" : "single";
    st.selectElements(ids, mode);
  };
  const renderLayerObject = (element: SlideElement) => <div key={element.id} draggable onDragStart={event => {
    event.dataTransfer.setData("application/x-prism-layer-ids", JSON.stringify([element.id]));
    event.dataTransfer.effectAllowed = "move";
    event.currentTarget.classList.add("layer-dragging");
  }} onDragEnd={event => event.currentTarget.classList.remove("layer-dragging")} onDragOver={event => event.preventDefault()} onDrop={event => {
    event.preventDefault();
    const sourceIds = JSON.parse(event.dataTransfer.getData("application/x-prism-layer-ids") || "[]") as string[];
    if (sourceIds.length && !sourceIds.includes(element.id)) st.reorderElements(sourceIds, element.id);
  }} className={`layer-row layer-child layer-draggable ${st.selectedElementIds.includes(element.id) ? "selected-layer" : ""}`}>
    <span className="layer-drag-grip" title="Drag to reorder">⋮⋮</span>
    <Button variant="ghost" className="min-w-0 flex-1 justify-start truncate" onClick={event => selectLayerElements(event, [element.id])}>{element.name}</Button>
    <Button variant="ghost" size="icon" title="Toggle visibility" onClick={() => st.updateElements([element.id], { hidden: !element.hidden })}><Eye className={element.hidden ? "opacity-30" : ""} /></Button>
    <Button variant="ghost" size="icon" title="Toggle lock" onClick={() => st.updateElements([element.id], { locked: !element.locked })}><Lock className={element.locked ? "" : "opacity-30"} /></Button>
  </div>;
  const el = slide.elements.find(e => st.selectedElementIds.includes(e.id));
  const update = (p: Record<string, unknown>) => st.updateElements(st.selectedElementIds, p, "inspector");
  const selectedVisualElements = slide.elements.filter(item => st.selectedElementIds.includes(item.id) && item.type !== "audio");
  const selectedVisualIds = selectedVisualElements.map(item => item.id);
  const updateVisualAdjustments = (adjustments: VisualAdjustments) => st.mutate(d => {
    const current = findSlide(d, slide.id);
    const ids = new Set(selectedVisualIds);
    for (const item of current?.elements ?? []) {
      if (!ids.has(item.id) || item.type === "audio") continue;
      item.visualAdjustments = { ...adjustments };
      if (item.type === "image") item.adjust = { ...toLegacyImageAdjustments(adjustments) };
    }
  }, { coalesce: "photo-effects" });
  const updatePhotoEffects = (patch: Record<string, unknown>) => st.updateElements(selectedVisualIds, patch, "photo-effects");
  const resetPhotoEffects = () => st.mutate(d => {
    const current = findSlide(d, slide.id);
    const ids = new Set(selectedVisualIds);
    for (const item of current?.elements ?? []) {
      if (!ids.has(item.id) || item.type === "audio") continue;
      item.visualAdjustments = { ...DEFAULT_VISUAL_ADJUSTMENTS };
      item.blur = 0;
      item.shadow = { ...item.shadow, on: false };
      item.glow = { ...item.glow, on: false };
      if (item.type === "image") item.adjust = { ...DEFAULT_ADJUST };
    }
  }, { coalesce: "photo-effects" });
  const selectedShapeIds = slide.elements.filter(item => item.type === "shape" && st.selectedElementIds.includes(item.id)).map(item => item.id);
  const updateShapes = (p: Record<string, unknown>) => { if (selectedShapeIds.length) st.updateElements(selectedShapeIds, p, "shape-inspector"); };
  const patchSlide = (p: Partial<Slide>) => st.mutate(d => { const s = findSlide(d, slide.id); if (s) Object.assign(s, p); });
  const patchBackground = (p: Partial<Background>) => patchSlide({ background: { ...slide.background, ...p } });
  const backgroundColors = normalizeGradientColors(slide.background.gradientColors, slide.background.color, slide.background.color2);
  const shapeColors = el?.type === "shape" ? normalizeGradientColors(el.gradientColors, el.fill, el.fill2) : ["#6366f1", "#22d3ee"];

  return <aside className="inspector scrollbar-thin">
    <div className="inspector-heading"><span>Inspector</span><span className="text-[10px] uppercase text-muted-foreground">{mode === "Slide customisation" ? "Slide" : el?.type ?? "Slide"}</span></div>
    <div className="inspector-tabs">{["Properties", "Slide customisation", "Motion", "Layers"].map(m => <Button key={m} variant="ghost" size="sm" className={mode === m ? "active-tab" : ""} onClick={() => onMode(m)}>{m}</Button>)}</div>

    {mode === "Layers" ? <div className="p-3">
      <div className="section-label mb-3"><Layers size={14} /> Objects · {slide.elements.length}</div>
      {layerRows.map(row => {
        if (row.kind === "element") return renderLayerObject(row.element);
        const memberIds = row.members.map(member => member.id);
        const selectedCount = memberIds.filter(id => st.selectedElementIds.includes(id)).length;
        const groupClass = selectedCount === memberIds.length ? "selected-layer" : selectedCount > 0 ? "selected-layer-partial" : "";
        const expanded = expandedGroups.has(row.groupId);
        return <div key={row.groupId} className="layer-group">
          <div className={`layer-row layer-group-row layer-draggable ${groupClass}`} draggable onDragStart={event => { event.dataTransfer.setData("application/x-prism-layer-ids", JSON.stringify(memberIds)); event.dataTransfer.effectAllowed = "move"; }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const sourceIds = JSON.parse(event.dataTransfer.getData("application/x-prism-layer-ids") || "[]") as string[]; if (sourceIds.length && !sourceIds.some(id => memberIds.includes(id)) && memberIds[0]) st.reorderElements(sourceIds, memberIds[0]); }}>
            <Button type="button" variant="ghost" size="icon" className="layer-expander" title={expanded ? "Collapse group" : "Expand group"} aria-label={expanded ? "Collapse group" : "Expand group"} aria-expanded={expanded} onClick={() => setExpandedGroups(current => {
              const n = new Set(current); if (n.has(row.groupId)) n.delete(row.groupId); else n.add(row.groupId); return n;
            })}>{expanded ? <ChevronDown /> : <ChevronRight />}</Button>
            <Button type="button" variant="ghost" className="min-w-0 flex-1 justify-start truncate" onClick={event => selectLayerElements(event, memberIds)}>
              <Layers size={13} /><span>Group: {row.members[0]?.name ?? "Untitled"}</span><small className="layer-group-count">{row.members.length} objects</small>
            </Button>
          </div>
          {expanded && <div className="layer-group-children">{row.members.map(renderLayerObject)}</div>}
        </div>;
      })}
    </div> : mode === "Slide customisation" ? <>
      <section className="inspector-section">
        <h3>Slide customisation</h3>
        <Field label="Slide name"><input value={slide.name} onChange={e => patchSlide({ name: e.target.value })} /></Field>
        <Field label="Section label"><input placeholder="Optional section name" value={slide.section ?? ""} onChange={e => patchSlide({ section: e.target.value || undefined })} /></Field>
        <div className="property-grid">
          <Field label="Automatic advance"><select value={slide.autoAdvance > 0 ? "on" : "off"} onChange={e => patchSlide({ autoAdvance: e.target.value === "on" ? Math.max(1, slide.autoAdvance || 5) : 0 })}><option value="off">Off</option><option value="on">On</option></select></Field>
          <Field label="Slide visibility"><select value={slide.hidden ? "hidden" : "visible"} onChange={e => patchSlide({ hidden: e.target.value === "hidden" })}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></Field>
        </div>
        {slide.autoAdvance > 0 && <Numeric label="Advance after (seconds)" value={slide.autoAdvance} min={0.5} max={3600} onChange={autoAdvance => patchSlide({ autoAdvance })} />}
        <div className="property-grid">
          <Field label="Slide width"><input disabled value={st.deck.width} /></Field>
          <Field label="Slide height"><input disabled value={st.deck.height} /></Field>
        </div>
        <p className="text-[10px] text-muted-foreground">Change the canvas dimensions from Design → Slide size.</p>
      </section>
      <section className="inspector-section">
        <h3>Background</h3>
        <Field label="Background style"><select value={slide.background.type} onChange={e => patchBackground({ type: e.target.value as Background["type"] })}><option value="solid">Solid colour</option><option value="gradient">Gradient</option><option value="image">Image</option></select></Field>
        {slide.background.type === "solid" && <Field label="Background colour"><input aria-label="Background colour" type="color" value={slide.background.color.startsWith("#") ? slide.background.color : "#151515"} onChange={e => patchBackground({ color: e.target.value })} /></Field>}
        {slide.background.type === "image" && <>
          <Field label="Image URL"><input type="url" placeholder="https://…" value={slide.background.image} onChange={e => patchBackground({ image: e.target.value })} /></Field>
          <Field label="Image fit"><select value={slide.background.imageFit} onChange={e => patchBackground({ imageFit: e.target.value as Background["imageFit"] })}><option value="cover">Cover</option><option value="contain">Contain</option></select></Field>
        </>}
        {slide.background.type === "gradient" && <GradientEditor
          colors={backgroundColors}
          angle={slide.background.angle}
          type={slide.background.gradientType ?? "linear"}
          onTypeChange={gradientType => patchBackground({ gradientType })}
          onAngleChange={angle => patchBackground({ angle })}
          onColorsChange={gradientColors => patchBackground({ gradientColors, color: gradientColors[0] ?? slide.background.color, color2: gradientColors[gradientColors.length - 1] ?? slide.background.color2 })}
        />}
      </section>
      <section className="inspector-section">
        <h3>Slide transition</h3>
        <TransitionControls slide={slide} />
      </section>
      <section className="inspector-section">
        <h3>Speaker notes</h3>
        <Field label="Notes"><textarea rows={5} value={slide.notes} onChange={e => patchSlide({ notes: e.target.value })} placeholder="Notes for this slide…" /></Field>
      </section>
    </> : mode === "Motion" ? <>
      <section className="inspector-section"><h3>Slide transition</h3><TransitionControls slide={slide} /></section>
      <section className="inspector-section"><h3>Object animation</h3><AnimationControls slide={slide} el={el} /></section>
    </> : <>
      <section className="inspector-section">
        <div className="flex items-center justify-between"><h3>{el ? "Transform" : "Slide settings"}</h3>{el && <span className="selection-count">{st.selectedElementIds.length} selected</span>}</div>
        {el ? <>
          <Field label="Object name"><input value={el.name} onChange={e => update({ name: e.target.value })} /></Field>
          <div className="property-grid">
            <Numeric label="X" value={el.x} onChange={x => update({ x })} />
            <Numeric label="Y" value={el.y} onChange={y => update({ y })} />
            <Numeric label="Width" value={el.w} min={40} onChange={w => update({ w })} />
            <Numeric label="Height" value={el.h} min={40} onChange={h => update({ h })} />
            <Numeric label="Rotation" value={el.rotation} onChange={rotation => update({ rotation })} />
            <Numeric label="Opacity (%)" value={el.opacity * 100} min={0} max={100} onChange={v => update({ opacity: v / 100 })} />
          </div>
        </> : <>
          <p className="text-[10px] text-muted-foreground">Choose the Slide customisation tab for slide background, automatic advance, visibility, notes and transition settings.</p>
          <Field label="Slide name"><input value={slide.name} onChange={e => patchSlide({ name: e.target.value })} /></Field>
        </>}
      </section>

      {selectedVisualElements.length > 0 && <section className="inspector-section">
        <h3>Photo & visual effects</h3>
        <p className="text-[10px] text-muted-foreground">Professional tonal, colour, detail and glow controls for images, shapes, text, charts and video.</p>
        <PhotoEffectsStudio elements={selectedVisualElements} slide={slide} deck={st.deck as Deck} onAdjust={updateVisualAdjustments} onEffectPatch={updatePhotoEffects} onReset={resetPhotoEffects} />
      </section>}

      {el?.type === "text" && <section className="inspector-section">
        <h3>Typography</h3>
        <Field label="Font family"><select value={el.fontFamily} onChange={e => { loadWebFont(e.target.value); update({ fontFamily: e.target.value }); }}>{FONT_CATALOGUE.map(f => <option key={f.family}>{f.family}</option>)}</select></Field>
        <div className="property-grid">
          <Numeric label="Font size" value={el.fontSize} min={8} onChange={fontSize => update({ fontSize })} />
          <Field label="Weight"><select value={el.fontWeight} onChange={e => update({ fontWeight: Number(e.target.value) })}>{[400, 500, 600, 700].map(w => <option key={w} value={w}>{w}</option>)}</select></Field>
        </div>
        <div className="flex gap-1">{[{ Icon: Bold, key: "fontWeight", active: el.fontWeight === 700, value: el.fontWeight === 700 ? 400 : 700 }, { Icon: Italic, key: "italic", active: el.italic, value: !el.italic }, { Icon: Underline, key: "underline", active: el.underline, value: !el.underline }].map(({ Icon, key, active, value }) => <Button key={key} title={key} size="icon" variant={active ? "secondary" : "ghost"} onClick={() => update({ [key]: value })}><Icon /></Button>)}<span className="mx-1 border-l border-border" />{[{ Icon: AlignLeft, value: "left" }, { Icon: AlignCenter, value: "center" }, { Icon: AlignRight, value: "right" }].map(({ Icon, value }) => <Button key={value} title={`Align ${value}`} size="icon" variant={el.align === value ? "secondary" : "ghost"} onClick={() => update({ align: value })}><Icon /></Button>)}</div>
        <Field label="Text color"><input type="color" value={el.color} onChange={e => update({ color: e.target.value })} /></Field>
        <Field label="Text"><textarea aria-label="Object text" rows={4} value={el.text} onChange={e => update({ text: e.target.value })} /></Field>
        <Numeric label="Line height" value={el.lineHeight} min={0.5} max={4} onChange={lineHeight => update({ lineHeight })} />
      </section>}

      {el?.type === "shape" && <section className="inspector-section">
        <h3>Appearance</h3>
        <Field label="Fill style"><select value={el.gradient ? "gradient" : "solid"} onChange={e => {
          const gradient = e.target.value === "gradient";
          updateShapes(gradient ? {
            gradient: true,
            gradientType: el.gradientType ?? "linear",
            gradientColors: shapeColors,
            gradientAngle: el.gradientAngle ?? 135,
            fill: shapeColors[0] ?? el.fill,
            fill2: shapeColors[shapeColors.length - 1] ?? el.fill2,
          } : { gradient: false });
        }}><option value="solid">Solid colour</option><option value="gradient">Gradient</option></select></Field>
        {el.gradient ? <GradientEditor
          colors={shapeColors}
          angle={el.gradientAngle}
          type={el.gradientType ?? "linear"}
          onTypeChange={gradientType => updateShapes({ gradientType })}
          onAngleChange={gradientAngle => updateShapes({ gradientAngle })}
          onColorsChange={gradientColors => updateShapes({ gradientColors, fill: gradientColors[0] ?? el.fill, fill2: gradientColors[gradientColors.length - 1] ?? el.fill2 })}
        /> : <Field label="Fill colour"><input type="color" value={el.fill === "transparent" ? "#000000" : el.fill} onChange={e => updateShapes({ fill: e.target.value })} /></Field>}
        <Field label="Label"><input value={el.text} onChange={e => updateShapes({ text: e.target.value })} /></Field>
        <Numeric label="Corner radius" value={el.radius} min={0} onChange={radius => updateShapes({ radius })} />
      </section>}

      {el && <section className="inspector-section">
        <h3>Interaction & navigation</h3>
        <Field label="Click action"><select value={el.slideAction?.kind ?? "none"} onChange={event => {
          const kind = event.target.value;
          update({ slideAction: kind === "none" ? undefined : { kind: kind as NonNullable<typeof el.slideAction>["kind"] } });
        }}>
          <option value="none">No slide action</option>
          <option value="next">Next slide</option>
          <option value="previous">Previous slide</option>
          <option value="first">First slide</option>
          <option value="last">Last slide</option>
          <option value="go-to">Go to specific slide</option>
        </select></Field>
        {el.slideAction?.kind === "go-to" && <Field label="Destination slide"><select value={el.slideAction.targetSlideId ?? ""} onChange={event => update({ slideAction: { kind: "go-to", targetSlideId: event.target.value } })}>
          <option value="">Choose destination…</option>{st.deck.slides.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.name}</option>)}
        </select></Field>}
        <Field label="External hyperlink"><input type="url" placeholder="https://example.com" value={el.hyperlink ?? ""} onChange={event => update({ hyperlink: event.target.value || undefined })} /></Field>
        <p className="text-[10px] text-muted-foreground">Actions activate when this object is clicked during a presentation. Slide actions take priority over external links.</p>
      </section>}
      {el?.type === "image" && <section className="inspector-section"><h3>Image</h3><Field label="Fit"><select value={el.fit} onChange={e => update({ fit: e.target.value })}>{["cover", "contain", "fill"].map(v => <option key={v}>{v}</option>)}</select></Field></section>}
      {el?.type === "chart" && <section className="inspector-section">
        <h3>Chart designer</h3>
        <Field label="Chart title"><input value={el.title} onChange={event => update({ title: event.target.value })} /></Field>
        <Field label="Chart style"><select value={el.chartType} onChange={event => update({ chartType: event.target.value as typeof el.chartType })}>
          <option value="bar">Vertical bars</option><option value="column">Columns</option><option value="horizontal">Horizontal bars</option><option value="line">Line</option><option value="area">Area</option><option value="pie">Pie</option><option value="donut">Doughnut</option>
        </select></Field>
        <div className="property-grid">
          <Field label="Series colour"><input type="color" value={el.color} onChange={event => update({ color: event.target.value })} /></Field>
          <Field label="Text colour"><input type="color" value={el.textColor} onChange={event => update({ textColor: event.target.value })} /></Field>
        </div>
        <Field label="Axis caption"><input value={el.axisLabel ?? ""} onChange={event => update({ axisLabel: event.target.value })} placeholder="Optional units or context" /></Field>
        <div className="chart-display-options">
          <label><input type="checkbox" checked={el.showValues ?? false} onChange={event => update({ showValues: event.target.checked })} /> Show values</label>
          <label><input type="checkbox" checked={el.showLegend ?? true} onChange={event => update({ showLegend: event.target.checked })} /> Show legend</label>
        </div>
        <div className="chart-data-list">
          <div className="flex items-center justify-between"><strong>Data points</strong><Button size="sm" variant="outline" onClick={() => update({ data: [...el.data, { label: `Item ${el.data.length + 1}`, value: 0 }] })}><Plus size={13}/> Add row</Button></div>
          {el.data.map((datum, index) => <div className="chart-data-row" key={index}>
            <Field label={`Label ${index + 1}`}><input value={datum.label} onChange={event => update({ data: el.data.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} /></Field>
            <Numeric label="Value" value={datum.value} onChange={value => update({ data: el.data.map((item, i) => i === index ? { ...item, value } : item) })} />
            <Button title={`Remove row ${index + 1}`} variant="ghost" size="icon" disabled={el.data.length <= 2} onClick={() => update({ data: el.data.filter((_, i) => i !== index) })}><Trash2 /></Button>
          </div>)}
        </div>
        <ChartCsvEditor key={el.id} data={el.data} onApply={data => update({ data })} />
      </section>}
      {el && <section className="inspector-section"><h3>Arrange</h3><div className="flex gap-1"><Button title="Bring forward" variant="ghost" size="icon" onClick={() => st.reorderElement(el.id, "forward")}><ChevronUp /></Button><Button title="Send backward" variant="ghost" size="icon" onClick={() => st.reorderElement(el.id, "backward")}><ChevronDown /></Button><Button title="Duplicate object" variant="ghost" size="icon" onClick={st.duplicateSelected}><Copy /></Button><Button title="Delete object" variant="ghost" size="icon" onClick={st.deleteSelected}><Trash2 /></Button></div></section>}
    </>}

    <div className="inspector-footer"><span className="status-dot" /> Local workspace</div>
  </aside>;
}
