import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Copy, Download, Grid2X2, ImagePlus, Layers, Maximize, MonitorPlay, MousePointer2, PanelLeftClose, PanelRightClose, Play, Plus, Redo2, Save, Settings2, Square, StickyNote, Trash2, Type, Undo2, Video, X, ZoomIn, ZoomOut, Triangle, Sparkles, MoveRight, BarChart3 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { useDeck, currentSlide, findSlide, startAutosave, saveNow } from "@/lib/prism/store";
import { usePrefs } from "@/lib/prism/prefs";
import { makeDemoDeck } from "@/lib/prism/demo";
import { loadProject, listProjects, readProject } from "@/lib/prism/projects";
import { makeText, makeShape, makeImage, makeVideo, makeChart, makeDeck, makeSlide } from "@/lib/prism/factory";
import { putAsset } from "@/lib/prism/assets";
import { DEFAULT_RIBBON, type RibbonTab } from "@/lib/prism/ribbon";
import { ANIMATIONS, TRANSITIONS, buildSteps } from "@/lib/prism/effects";
import { ScaledSlide } from "./ScaledSlide";
import { Inspector, TransitionControls } from "./Inspector";

export interface StudioProps { slideIndex: number; step: number; print: boolean; setCoordinate: (slide: number, step?: number) => void }
const TAB_LABELS: Record<RibbonTab, string> = { home: "Home", insert: "Insert", design: "Design", transitions: "Transitions", animations: "Animations", media: "Media", review: "Review", view: "View" };

function Tool({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick?: (() => void) | undefined; disabled?: boolean }) { return <Button variant="ghost" className="ribbon-tool" disabled={disabled} title={label} onClick={onClick}>{icon}<span>{label}</span></Button>; }
function ToolGroup({ label, children }: { label: string; children: ReactNode }) { return <div className="ribbon-group"><div className="ribbon-group-tools">{children}</div><span className="ribbon-group-label">{label}</span></div>; }

export default function Studio({ slideIndex, step, print, setCoordinate }: StudioProps) {
  const st = useDeck(), prefs = usePrefs(), slide = currentSlide(st);
  const [tab, setTab] = useState<RibbonTab>("home"), [mode, setMode] = useState("Properties"), [grid, setGrid] = useState(false), [notes, setNotes] = useState(true);
  const [presenting, setPresenting] = useState(false), [previewKey, setPreviewKey] = useState(0), [zoom, setZoom] = useState(1), [projectsOpen, setProjectsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null), stage = useRef<HTMLDivElement>(null), touch = useRef<{ x: number; y: number } | null>(null);
  const selected = slide.elements.find(e => st.selectedElementIds.includes(e.id));
  const index = st.deck.slides.findIndex(s => s.id === slide.id);
  const safeSave = () => { try { saveNow(); toast.success("Deck saved to this browser"); } catch { toast.error("Could not save. Export a copy to keep your work."); } };
  const go = useCallback((n: number, nextStep = 0) => {
    const deck = useDeck.getState().deck; const target = deck.slides[Math.max(0, Math.min(n, deck.slides.length - 1))];
    if (!target) return; useDeck.getState().selectSlide(target.id); setCoordinate(deck.slides.indexOf(target) + 1, nextStep);
  }, [setCoordinate]);
  const advance = useCallback((direction: number) => {
    const state = useDeck.getState(), s = currentSlide(state), i = state.deck.slides.indexOf(s);
    const count = buildSteps(s.animations).length - 1;
    if (presenting && direction > 0 && step < count) return setCoordinate(i + 1, step + 1);
    if (presenting && direction < 0 && step > 0) return setCoordinate(i + 1, step - 1);
    go(i + direction);
  }, [presenting, step, setCoordinate, go]);
  const exit = useCallback(() => { setPresenting(false); setCoordinate(useDeck.getState().deck.slides.findIndex(s => s.id === useDeck.getState().currentSlideId) + 1, 0); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }, [setCoordinate]);
  const present = useCallback(() => { setGrid(false); setPresenting(true); setCoordinate(useDeck.getState().deck.slides.findIndex(s => s.id === useDeck.getState().currentSlideId) + 1, 0); document.documentElement.requestFullscreen?.().catch(() => toast("Presenting in this window")); }, [setCoordinate]);
  useEffect(() => {
    const local = loadProject(); useDeck.getState().loadDeck(local ?? makeDemoDeck());
    const target = useDeck.getState().deck.slides[Math.max(0, slideIndex - 1)]; if (target) useDeck.getState().selectSlide(target.id);
    setReady(true);
    return startAutosave(() => usePrefs.getState().autosaveDelay, () => usePrefs.getState().autosave);
  }, []);
  useEffect(() => { if (ready) { const target = st.deck.slides[Math.min(st.deck.slides.length - 1, Math.max(0, slideIndex - 1))]; if (target && target.id !== st.currentSlideId) st.selectSlide(target.id); } }, [slideIndex, ready]);
  useEffect(() => { if (ready && index >= 0 && index + 1 !== slideIndex) setCoordinate(index + 1, 0); document.title = `${index + 1}/${st.deck.slides.length} — ${slide.name} · PrismDeck Studio`; }, [st.currentSlideId, st.deck.slides.length, slide.name, ready]);
  useEffect(() => {
    const changed = () => { if (!document.fullscreenElement) setPresenting(false); };
    document.addEventListener("fullscreenchange", changed); return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;
      const state = useDeck.getState(); const cmd = e.metaKey || e.ctrlKey;
      if (e.key === "F5") { e.preventDefault(); present(); return; }
      if (e.key === "Escape") { exit(); state.selectElements([]); return; }
      if (presenting) { if (["ArrowRight", "ArrowDown", " "].includes(e.key)) { e.preventDefault(); advance(1); } if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); advance(-1); } return; }
      if (cmd && e.key.toLowerCase() === "s") { e.preventDefault(); safeSave(); }
      if (cmd && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? state.redo() : state.undo(); }
      if (cmd && e.key.toLowerCase() === "y") { e.preventDefault(); state.redo(); }
      if (cmd && e.key.toLowerCase() === "c") state.copySelected();
      if (cmd && e.key.toLowerCase() === "v") { e.preventDefault(); state.paste(); }
      if (cmd && e.key.toLowerCase() === "d") { e.preventDefault(); state.selectedElementIds.length ? state.duplicateSelected() : state.duplicateSlides(); }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); state.selectedElementIds.length ? state.deleteSelected() : state.deleteSlides(); }
      if (e.key.toLowerCase() === "g" && !cmd) setGrid(g => !g);
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        if (state.selectedElementIds.length) {
          const delta = e.shiftKey ? 10 : 1;
          state.mutate(d => { const s = findSlide(d, state.currentSlideId); for (const el of s?.elements ?? []) if (state.selectedElementIds.includes(el.id) && !el.locked) { if (e.key === "ArrowRight") el.x += delta; if (e.key === "ArrowLeft") el.x -= delta; if (e.key === "ArrowDown") el.y += delta; if (e.key === "ArrowUp") el.y -= delta; } }, { coalesce: "nudge" });
        } else advance(e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [presenting, advance, present, exit]);
  useEffect(() => { if (!presenting || !slide.autoAdvance) return; const t = setTimeout(() => go(index + 1), slide.autoAdvance * 1000); return () => clearTimeout(t); }, [presenting, slide.id, slide.autoAdvance, index, go]);
  useEffect(() => { if (print && ready) { const t = setTimeout(() => window.print(), 1000); return () => clearTimeout(t); }     return undefined;
  }, [print, ready]);
  const exportDeck = () => { const blob = new Blob([JSON.stringify(st.deck, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${st.deck.name}.prismdeck.json`; a.click(); URL.revokeObjectURL(url); toast.success("Project copy exported"); };
  const upload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
      if (!kind) { toast.error("Choose an image or video file"); continue; }
      try { const asset = await putAsset(file, file.name, kind); st.addElement(kind === "image" ? makeImage(`asset:${asset.id}`, { name: file.name }) : makeVideo(`asset:${asset.id}`, { name: file.name })); toast.success(`${kind === "image" ? "Image" : "Video"} added`); }
      catch { toast.error("The file could not be imported"); }
    }
  };
  const actions: Record<string, () => void> = {
    "slide.new": () => st.addSlide(), "slide.duplicate": () => st.duplicateSlides(), "slide.delete": () => st.deleteSlides(),
    "edit.undo": st.undo, "edit.redo": st.redo, "insert.text": () => st.addElement(makeText()), "insert.heading": () => st.addElement(makeText({ name: "Heading", text: "Your headline", fontSize: 88, w: 1300, h: 220, fontWeight: 700 })),
    "insert.rect": () => st.addElement(makeShape("rect")), "insert.ellipse": () => st.addElement(makeShape("ellipse")), "insert.arrow": () => st.addElement(makeShape("arrow")),
    "insert.image": () => fileInput.current?.click(), "insert.video": () => fileInput.current?.click(), "review.notes": () => setNotes(n => !n), "view.grid": () => setGrid(g => !g), "view.fit": () => setZoom(1),
    "design.169": () => st.mutate(d => { d.width = 1920; d.height = 1080; }), "design.43": () => st.mutate(d => { d.width = 1440; d.height = 1080; }),
  };
  const toolMeta: Record<string, { icon: ReactNode; label: string }> = {
    "slide.new": { icon: <Plus />, label: "New slide" }, "slide.duplicate": { icon: <Copy />, label: "Duplicate" }, "slide.delete": { icon: <Trash2 />, label: "Delete" }, "edit.undo": { icon: <Undo2 />, label: "Undo" }, "edit.redo": { icon: <Redo2 />, label: "Redo" },
    "insert.text": { icon: <Type />, label: "Text box" }, "insert.heading": { icon: <Type />, label: "Heading" }, "insert.rect": { icon: <Square />, label: "Rectangle" }, "insert.ellipse": { icon: <Circle />, label: "Ellipse" }, "insert.arrow": { icon: <MoveRight />, label: "Arrow" },
    "insert.image": { icon: <ImagePlus />, label: "Image" }, "insert.video": { icon: <Video />, label: "Video" }, "review.notes": { icon: <StickyNote />, label: "Notes" }, "view.grid": { icon: <Grid2X2 />, label: "Slide sorter" }, "view.fit": { icon: <Maximize />, label: "Fit canvas" }, "design.169": { icon: <MonitorPlay />, label: "16:9" }, "design.43": { icon: <Square />, label: "4:3" },
  };
  const basicGroups = (prefs.ribbon?.tabs?.[tab] ?? DEFAULT_RIBBON.tabs[tab]).filter(g => !g.hidden);
  const swipeProps = { onTouchStart: (e: React.TouchEvent) => { const point = e.touches[0]; if (point) touch.current = { x: point.clientX, y: point.clientY }; }, onTouchEnd: (e: React.TouchEvent) => { const start = touch.current; touch.current = null; const point = e.changedTouches[0]; if (!start || !point) return; const dx = point.clientX - start.x, dy = point.clientY - start.y; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) advance(dx < 0 ? 1 : -1); } };
  if (print) return <div className="print-deck">{st.deck.slides.map(s => <div className="print-page" key={s.id}><ScaledSlide slide={s} deck={st.deck} /></div>)}</div>;
  return <div className="studio dark" data-accent="cyan">
    <Toaster theme="dark" position="bottom-right" richColors />
    <input className="hidden" ref={fileInput} type="file" accept="image/*,video/*" multiple onChange={e => { upload(e.target.files); e.target.value = ""; }} />
    {presenting ? <div className="presentation" {...swipeProps}><ScaledSlide key={slide.id} slide={slide} deck={st.deck} presenting step={step} /><div className="presentation-controls"><Button title="Previous slide" variant="ghost" size="icon" onClick={() => advance(-1)}><ChevronLeft /></Button><span>{index + 1} / {st.deck.slides.length}{step > 0 ? ` · ${step}` : ""}</span><Button title="Next slide or animation" variant="ghost" size="icon" onClick={() => advance(1)}><ChevronRight /></Button><Button title="Exit presentation" variant="ghost" size="icon" onClick={exit}><X /></Button></div></div> : <>
    <header className="studio-header"><div className="studio-brand"><div className="brand-mark"><Triangle /></div><span>PrismDeck <span className="brand-studio">Studio</span></span></div><span className="header-divider" /><div className="deck-title"><input aria-label="Deck name" value={st.deck.name} onChange={e => st.mutate(d => { d.name = e.target.value; }, { coalesce: "name" })} /><ChevronDown size={13} /></div><div className="save-indicator"><span className="status-dot" />{st.saveState === "saved" ? "Saved locally" : st.saveState === "error" ? "Save failed" : "Saving…"}</div><div className="header-actions"><Button title="Save deck" size="icon" variant="ghost" onClick={safeSave}><Save /></Button><Button variant="ghost" size="sm" onClick={exportDeck}><Download /><span className="hide-small">Export</span></Button><Button onClick={present} size="sm" className="present-button"><Play size={14} fill="currentColor" />Present</Button></div></header>
    <nav className="studio-tabs"><Button variant="ghost" size="sm" className="file-tab" onClick={() => setProjectsOpen(true)}>File</Button>{(Object.keys(TAB_LABELS) as RibbonTab[]).map(t => <Button key={t} size="sm" variant="ghost" className={tab === t ? "active-tab" : ""} onClick={() => { setTab(t); if (t === "transitions" || t === "animations") setMode("Motion"); }}>{TAB_LABELS[t]}</Button>)}<div className="tab-spacer" /><Button title="Toggle inspector" size="icon" variant="ghost" onClick={() => prefs.set({ showInspector: !prefs.showInspector })}><PanelRightClose /></Button></nav>
    <div className="studio-ribbon">
      {tab === "transitions" ? <><ToolGroup label="Playback"><Tool icon={<Play />} label="Preview" onClick={() => setPreviewKey(k => k + 1)} /></ToolGroup><ToolGroup label="Transition gallery">{TRANSITIONS.slice(0, 10).map(t => <Button variant="ghost" className={`effect-tile ${slide.transition.type === t.id ? "effect-selected" : ""}`} key={t.id} onClick={() => st.mutate(d => { const s = findSlide(d, slide.id); if (s) s.transition.type = t.id; })}><span className={`effect-symbol effect-${t.id}`} /><span>{t.label}</span></Button>)}</ToolGroup></> : tab === "animations" ? <><ToolGroup label="Playback"><Tool icon={<Play />} label="Preview" onClick={() => setPreviewKey(k => k + 1)} /></ToolGroup><ToolGroup label="Entrance & emphasis">{ANIMATIONS.slice(0, 10).map(a => <Tool key={a.id} icon={<Sparkles />} label={a.label} disabled={!selected} onClick={() => { const element = selected; if (!element) return; import("@/lib/prism/factory").then(({ makeAnimation }) => st.mutate(d => findSlide(d, slide.id)?.animations.push(makeAnimation(element.id, a.kind, a.id)))); }} />)}</ToolGroup></> : <>
        {basicGroups.map(g => <ToolGroup key={g.id} label={g.label}>{g.tools.filter(t => !t.hidden && actions[t.id] && toolMeta[t.id]).map(t => <Tool key={t.id} {...toolMeta[t.id]} disabled={t.id === "edit.undo" ? !st.past.length : t.id === "edit.redo" ? !st.future.length : false} onClick={actions[t.id]} />)}</ToolGroup>)}
        {tab === "home" && <><ToolGroup label="Insert"><Tool icon={<Type />} label="Text box" onClick={actions["insert.text"]} /><Tool icon={<Square />} label="Shape" onClick={actions["insert.rect"]} /><Tool icon={<ImagePlus />} label="Image" onClick={actions["insert.image"]} /></ToolGroup><ToolGroup label="Arrange"><Tool icon={<Layers />} label="Layers" onClick={() => { setMode("Layers"); prefs.set({ showInspector: true }); }} /><Tool icon={<Copy />} label="Duplicate" onClick={st.duplicateSelected} disabled={!selected} /></ToolGroup></>}
        {tab === "insert" && <ToolGroup label="Data"><Tool icon={<BarChart3 />} label="Bar chart" onClick={() => st.addElement(makeChart("bar", { title: "Sample data — replace with yours" }))} /></ToolGroup>}
        {tab === "view" && <ToolGroup label="Panels"><Tool icon={<PanelLeftClose />} label="Navigator" onClick={() => prefs.set({ showNavigator: !prefs.showNavigator })} /><Tool icon={<PanelRightClose />} label="Inspector" onClick={() => prefs.set({ showInspector: !prefs.showInspector })} /><Tool icon={<Grid2X2 />} label="Grid lines" onClick={() => prefs.set({ showGrid: !prefs.showGrid })} /></ToolGroup>}
      </>}
      <div className="ribbon-end"><span className="workspace-badge"><span className="status-dot" /> EDITING</span></div>
    </div>
    <div className={`studio-workspace ${!prefs.showNavigator ? "navigator-hidden" : ""} ${!prefs.showInspector ? "inspector-hidden" : ""}`}>
      {prefs.showNavigator && <aside className="slide-navigator scrollbar-thin"><div className="navigator-heading"><span>Slides <span className="count-badge">{st.deck.slides.length}</span></span><Button title="Slide sorter" size="icon" variant="ghost" onClick={() => setGrid(g => !g)}><Grid2X2 /></Button></div><div className="thumbnail-list">{st.deck.slides.map((s, i) => <div key={s.id} className="thumbnail-item" draggable onDragStart={e => e.dataTransfer.setData("text/prism-slide", s.id)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/prism-slide"); if (id) st.moveSlides([id], i); }}>
        {s.section && <div className="section-divider"><ChevronDown size={11} />{s.section}</div>}<div className="thumbnail-row"><span className={`thumbnail-number ${s.id === slide.id ? "text-primary" : ""}`}>{i + 1}</span><Button variant="ghost" aria-label={`Slide ${i + 1}: ${s.name}`} className={`thumbnail ${s.id === slide.id ? "thumbnail-active" : ""}`} onClick={e => { st.selectSlide(s.id, e.shiftKey ? "range" : e.metaKey || e.ctrlKey ? "toggle" : "single"); setCoordinate(i + 1, 0); }}><ScaledSlide slide={s} deck={st.deck} /></Button></div><div className="thumbnail-caption"><span>{s.name}</span>{s.animations.length > 0 && <Sparkles size={11} />}</div></div>)}</div><div className="navigator-bottom"><Button variant="outline" size="sm" onClick={() => st.addSlide()}><Plus /> New slide</Button></div></aside>}
      <main className="canvas-column"><div className="canvas-heading"><div className="flex items-center gap-2"><span className="text-muted-foreground">{grid ? "Slide sorter" : "Canvas"}</span><ChevronRight size={12} /><span>{grid ? `${st.deck.slides.length} slides` : slide.name}</span></div><span className="canvas-dimensions">{st.deck.width} × {st.deck.height}</span></div>
        {grid ? <div className="slide-grid scrollbar-thin">{st.deck.slides.map((s, i) => <div key={s.id}><Button variant="ghost" className="grid-thumbnail" onClick={() => { go(i); setGrid(false); }}><ScaledSlide slide={s} deck={st.deck} /></Button><div className="mt-2 flex items-center justify-between text-xs"><span>{i + 1} · {s.name}</span><Button title="Duplicate slide" variant="ghost" size="icon" onClick={() => st.duplicateSlides([s.id])}><Copy /></Button></div></div>)}</div> : <div className="canvas-stage" ref={stage} {...swipeProps} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); upload(e.dataTransfer.files); }}><div className="canvas-surround" style={{ transform: `scale(${zoom})` }}><div className="canvas-slide" style={{ aspectRatio: `${st.deck.width}/${st.deck.height}` }}><ScaledSlide slide={slide} deck={st.deck} editable previewKey={previewKey} showGrid={prefs.showGrid} /></div><div className="canvas-bottom-label"><span>{String(index + 1).padStart(2, "0")}</span><span>{slide.name}</span></div></div><div className="canvas-nav"><Button title="Previous slide" size="icon" variant="ghost" disabled={index === 0} onClick={() => go(index - 1)}><ChevronLeft /></Button><span>{index + 1} <span className="text-muted-foreground">/ {st.deck.slides.length}</span></span><Button title="Next slide" size="icon" variant="ghost" disabled={index === st.deck.slides.length - 1} onClick={() => go(index + 1)}><ChevronRight /></Button></div></div>}
        <div className="notes-heading"><Button size="sm" variant="ghost" onClick={() => setNotes(n => !n)}><StickyNote /><span>Speaker notes</span><ChevronDown className={notes ? "rotate-180" : ""} /></Button><span className="text-[10px] text-muted-foreground">{slide.notes.length} characters</span></div>{notes && <textarea className="speaker-notes" aria-label="Speaker notes" placeholder="Add speaker notes…" value={slide.notes} onChange={e => st.mutate(d => { const s = findSlide(d, slide.id); if (s) s.notes = e.target.value; }, { coalesce: "notes" })} />}
      </main>
      {prefs.showInspector && <Inspector mode={mode} onMode={setMode} />}
    </div>
    <footer className="studio-status"><div className="flex items-center gap-4"><span>Slide {index + 1} of {st.deck.slides.length}</span><span className="status-muted">{selected ? `${st.selectedElementIds.length} object selected` : "No selection"}</span></div><div className="status-controls"><Button title="Toggle notes" size="icon" variant="ghost" onClick={() => setNotes(n => !n)}><StickyNote /></Button><Button title="Normal view" size="icon" variant="ghost" className={!grid ? "text-primary" : ""} onClick={() => setGrid(false)}><MonitorPlay /></Button><Button title="Slide sorter" size="icon" variant="ghost" className={grid ? "text-primary" : ""} onClick={() => setGrid(true)}><Grid2X2 /></Button><span className="status-divider" /><Button title="Zoom out" size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut /></Button><input type="range" aria-label="Canvas zoom" min="0.5" max="1.5" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} /><span className="zoom-value">{Math.round(zoom * 100)}%</span><Button title="Zoom in" size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}><ZoomIn /></Button><Button title="Fit canvas" size="icon" variant="ghost" onClick={() => setZoom(1)}><Maximize /></Button></div></footer>
    </>}
    {projectsOpen && <div className="dialog-backdrop" onClick={() => setProjectsOpen(false)}><div className="project-dialog" role="dialog" aria-label="Projects" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><h2 className="font-display text-xl">Your workspace</h2><Button title="Close projects" size="icon" variant="ghost" onClick={() => setProjectsOpen(false)}><X /></Button></div><div className="my-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => { st.loadDeck(makeDeck("Untitled deck", [makeSlide()])); setProjectsOpen(false); go(0); }}><Plus />Blank deck</Button><Button variant="outline" size="sm" onClick={() => { st.loadDeck(makeDemoDeck()); setProjectsOpen(false); go(0); }}>Open demo</Button><Button variant="outline" size="sm" onClick={exportDeck}><Download />Export project</Button><Button variant="outline" size="sm" onClick={() => { const url = new URL(window.location.href); url.searchParams.set("print", "true"); window.open(url, "_blank"); toast("Choose Save as PDF in the print dialog"); }}>Export PDF</Button></div><h3 className="section-label mb-3">Recent decks</h3>{listProjects().map(p => <Button key={p.id} variant="ghost" className="recent-project" onClick={() => { const d = readProject(p.id); if (d) { st.loadDeck(d); setProjectsOpen(false); go(0); } }}><span>{p.name}</span><span className="text-xs text-muted-foreground">{p.slides} slides</span></Button>)}</div></div>}
  </div>;
}