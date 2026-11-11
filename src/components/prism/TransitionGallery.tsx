import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Clock3, Play, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRANSITIONS, type TransitionPreset } from "@/lib/prism/effects";
import type { Slide } from "@/lib/prism/types";

const CATEGORIES: Array<TransitionPreset["category"]> = ["Subtle", "Dynamic", "Dramatic"];
const FEATURED = ["none", "morph", "fade", "push", "wipe"];

function TransitionGlyph({ effect, large = false, animate = false }: { effect: string; large?: boolean; animate?: boolean }) {
  return <div className={`transition-glyph ${large ? "transition-glyph-large" : ""} ${animate ? "transition-glyph-animate" : ""}`} data-effect={effect} aria-hidden="true">
    <span className="transition-glyph-old"><i /><b /></span>
    <span className="transition-glyph-new"><i /><b /></span>
    <span className="transition-glyph-accent" />
    {effect === "dissolve" && <span className="transition-glyph-pixels"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>}
    {effect === "morph" && <span className="transition-glyph-morph-link" />}
  </div>;
}

function TransitionTile({ preset, selected, onSelect, onHover }: {
  preset: TransitionPreset;
  selected: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}) {
  return <button type="button" className={`transition-tile ${selected ? "selected" : ""}`}
    onClick={onSelect} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
    onFocus={() => onHover(true)} onBlur={() => onHover(false)}
    aria-pressed={selected} title={preset.description}>
    <span className="transition-tile-art"><TransitionGlyph effect={preset.id} animate /></span>
    <span className="transition-tile-label">{preset.label}</span>
    {selected && <span className="transition-tile-check"><Check size={11} /></span>}
  </button>;
}

export function TransitionGallery({ slide, onApply, onPreview, onApplyAll, onPatch }: {
  slide: Slide;
  onApply: (id: string) => void;
  onPreview: () => void;
  onApplyAll: () => void;
  onPatch: (patch: Partial<Slide["transition"]>) => void;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [hoveredId, setHoveredId] = useState(slide.transition.type);
  const active = TRANSITIONS.find(preset => preset.id === slide.transition.type) ?? TRANSITIONS[0]!;
  const hovered = TRANSITIONS.find(preset => preset.id === hoveredId) ?? active;
  const featured = useMemo(() => FEATURED.map(id => TRANSITIONS.find(preset => preset.id === id)).filter((preset): preset is TransitionPreset => !!preset), []);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (anchor.current?.contains(target) || document.querySelector(".transition-gallery-popover")?.contains(target)) return;
      setOpen(false);
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const rect = anchor.current?.getBoundingClientRect();
      if (rect) {
        const width = Math.min(760, window.innerWidth - 28);
        const height = Math.min(590, window.innerHeight - 28);
        setPosition({
          top: Math.max(14, Math.min(rect.bottom + 8, window.innerHeight - height - 14)),
          left: Math.max(14, Math.min(rect.left, window.innerWidth - width - 14)),
        });
      }
      setHoveredId(slide.transition.type);
    }
    setOpen(value => !value);
  };

  const selectPreset = (id: string) => {
    onApply(id);
    setHoveredId(id);
    setOpen(false);
  };

  return <>
    <div className="transition-ribbon-control" ref={anchor}>
      <div className="transition-featured-strip" aria-label="Featured transitions">
        {featured.map(preset => <button type="button" key={preset.id}
          className={`transition-featured-tile ${slide.transition.type === preset.id ? "selected" : ""}`}
          onClick={() => { onApply(preset.id); onPreview(); }} title={preset.description}
          aria-label={`Apply ${preset.label} transition`}>
          <TransitionGlyph effect={preset.id} animate />
          <span>{preset.label}</span>
          {slide.transition.type === preset.id && <i />}
        </button>)}
      </div>
      <Button type="button" className="transition-more-button" variant="ghost" onClick={toggle} aria-expanded={open}>
        All transitions <ChevronDown size={13} />
      </Button>
    </div>
    {open && typeof document !== "undefined" && createPortal(
      <section className="transition-gallery-popover" role="dialog" aria-label="Transition gallery" style={{ top: position.top, left: position.left }}>
        <header className="transition-gallery-header">
          <div><span className="transition-gallery-eyebrow">SLIDE MOTION</span><h2>Transition Gallery</h2><p>Select a transition to apply it to the current slide.</p></div>
          <Button variant="ghost" size="icon" title="Close transition gallery" onClick={() => setOpen(false)}><X /></Button>
        </header>
        <div className="transition-gallery-body">
          <aside className="transition-live-preview">
            <div className="transition-live-preview-stage">
              <TransitionGlyph effect={hovered.id} large animate />
              <span className="transition-preview-effect-label">{hovered.label}</span>
            </div>
            <strong>{hovered.label}</strong>
            <p>{hovered.description}</p>
            <span className="transition-preview-hint"><Sparkles size={12} /> Hover a tile to animate its preview</span>
          </aside>
          <div className="transition-gallery-list">
            {CATEGORIES.map(category => <section className="transition-category" key={category}>
              <div className="transition-category-heading">{category}<span>{TRANSITIONS.filter(preset => preset.category === category).length} effects</span></div>
              <div className="transition-tile-grid">
                {TRANSITIONS.filter(preset => preset.category === category).map(preset =>
                  <TransitionTile key={preset.id} preset={preset} selected={slide.transition.type === preset.id}
                    onHover={value => value && setHoveredId(preset.id)} onSelect={() => selectPreset(preset.id)} />
                )}
              </div>
            </section>)}
          </div>
        </div>
        <footer className="transition-gallery-footer">
          <span>{active.label} is applied to slide {slide.name || "current slide"}.</span>
          <div className="transition-gallery-footer-actions"><Button variant="outline" size="sm" onClick={() => { onApplyAll(); setOpen(false); }}>Apply to all</Button><Button variant="outline" size="sm" onClick={() => { onPreview(); setOpen(false); }}><Play size={14} /> Preview on slide</Button></div>
        </footer>
      </section>,
      document.body
    )}
  </>;
}

export function TransitionTimingControls({ slide, onPatch, onApplyAll, onPreview }: {
  slide: Slide;
  onPatch: (patch: Partial<Slide["transition"]>) => void;
  onApplyAll: () => void;
  onPreview: () => void;
}) {
  return <div className="transition-timing-tools">
    <label className="transition-timing-field"><Clock3 size={13} /><span>Duration</span>
      <input aria-label="Transition duration in seconds" type="number" min="0.1" max="10" step="0.1" value={Math.round(slide.transition.duration / 100) / 10}
        onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0.1 && value <= 10) onPatch({ duration: Math.round(value * 1000) }); }} />
      <small>s</small>
    </label>
    <label className="transition-timing-field"><span>Direction</span>
      <select aria-label="Transition direction" value={slide.transition.direction} onChange={event => onPatch({ direction: event.target.value as Slide["transition"]["direction"] })}>
        <option value="left">From left</option><option value="right">From right</option><option value="up">From top</option><option value="down">From bottom</option>
      </select>
    </label>
    <Button variant="ghost" size="sm" onClick={onPreview}><Play size={13} /> Preview</Button>
    <Button variant="outline" size="sm" onClick={onApplyAll}>Apply to all</Button>
  </div>;
}
