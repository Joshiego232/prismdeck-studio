import { useState } from "react";
import { Copy, Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck, MasterLayout, SlideMaster } from "@/lib/prism/types";
import { cloneSlideMaster, createSlideMaster, MASTER_LAYOUTS } from "@/lib/prism/masters";
import { PRESENTATION_THEMES } from "@/lib/prism/themes";

type MasterPatch = Partial<Pick<SlideMaster, "name" | "backgroundColor" | "accentColor" | "titleColor" | "footerText" | "showAccentRule" | "showSlideNumber" | "showTitlePlaceholder">>;

export function MasterSlidesDialog({ deck, slideId, onClose, onAdd, onPatch, onApply, onDelete, onThemeChange }: {
  deck: Deck;
  slideId: string;
  onClose: () => void;
  onAdd: (master: SlideMaster) => void;
  onPatch: (id: string, patch: MasterPatch) => void;
  onApply: (id: string, scope: "current" | "all") => void;
  onDelete: (id: string) => void;
  onThemeChange: (id: string) => void;
}) {
  const masters = deck.masters ?? [];
  const currentSlide = deck.slides.find(slide => slide.id === slideId);
  const [selectedId, setSelectedId] = useState(masters[0]?.id ?? "");
  const [scope, setScope] = useState<"current" | "all">("current");
  const selected = masters.find(master => master.id === selectedId) ?? masters[0];
  const assignedCount = masters.map(master => ({
    id: master.id, count: deck.slides.filter(slide => slide.masterId === master.id).length,
  }));

  const addMaster = (layout: MasterLayout) => {
    const master = createSlideMaster(layout);
    onAdd(master);
    setSelectedId(master.id);
  };

  return <div className="dialog-backdrop master-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="master-dialog" role="dialog" aria-modal="true" aria-label="Master slides and theme designer">
      <header className="master-dialog-header">
        <div><span className="eyebrow">DESIGN SYSTEM</span><h2>Master Slides & Theme Designer</h2><p>Manage reusable layouts and the visual identity of this presentation.</p></div>
        <Button title="Close master designer" size="icon" variant="ghost" onClick={onClose}><X /></Button>
      </header>
      <div className="master-dialog-body">
        <aside className="master-list-panel">
          <div className="master-section-heading"><strong>Master layouts</strong><span>{masters.length}</span></div>
          <div className="master-list">
            {masters.map(master => <button type="button" key={master.id} className={selected?.id === master.id ? "master-card active" : "master-card"} onClick={() => setSelectedId(master.id)}>
              <span className="master-card-preview" style={{ background: master.backgroundColor }}>
                {master.showAccentRule && <i style={{ background: master.accentColor }} />}
                <b style={{ color: master.titleColor }}>Aa</b><small style={{ color: master.titleColor }}>Title / content</small>
              </span>
              <span className="master-card-meta"><b>{master.name}</b><small>{assignedCount.find(item => item.id === master.id)?.count ?? 0} slides using this layout</small></span>
            </button>)}
          </div>
          <div className="master-add-panel">
            <label htmlFor="master-layout">Add layout</label>
            <select id="master-layout" value="" onChange={event => addMaster(event.target.value as MasterLayout)}>
              <option value="" disabled>Choose a layout…</option>
              {MASTER_LAYOUTS.map(layout => <option key={layout.id} value={layout.id}>{layout.name}</option>)}
            </select>
          </div>
        </aside>
        <main className="master-editor-panel">
          <div className="master-section-heading"><strong>Presentation themes</strong><span>6 presets</span></div>
          <div className="theme-preset-grid">
            {PRESENTATION_THEMES.map(theme => <button key={theme.id} type="button" className={deck.themeId === theme.id ? "theme-preset active" : "theme-preset"} onClick={() => onThemeChange(theme.id)}>
              <span style={{ background: theme.background }}><i style={{ background: theme.accent }} /><i style={{ background: theme.secondary }} /><b style={{ color: theme.foreground }}>Aa</b></span>
              <strong>{theme.name}{deck.themeId === theme.id ? " · Active" : ""}</strong>
            </button>)}
          </div>
          {selected ? <section className="master-properties">
            <div className="master-section-heading"><strong>Selected master</strong><span>{MASTER_LAYOUTS.find(item => item.id === selected.layout)?.name ?? selected.layout}</span></div>
            <p className="master-current-slide">Apply target: {currentSlide?.name ?? "Current slide"}</p>
            <label>Master name<input value={selected.name} onChange={event => onPatch(selected.id, { name: event.target.value })} /></label>
            <div className="master-colour-grid">
              <label>Background<input type="color" value={selected.backgroundColor} onChange={event => onPatch(selected.id, { backgroundColor: event.target.value })} /></label>
              <label>Accent<input type="color" value={selected.accentColor} onChange={event => onPatch(selected.id, { accentColor: event.target.value })} /></label>
              <label>Title colour<input type="color" value={selected.titleColor} onChange={event => onPatch(selected.id, { titleColor: event.target.value })} /></label>
            </div>
            <label>Footer text<input value={selected.footerText} placeholder="Optional company, course or presentation footer" onChange={event => onPatch(selected.id, { footerText: event.target.value })} /></label>
            <div className="master-toggle-row">
              <label><input type="checkbox" checked={selected.showAccentRule} onChange={event => onPatch(selected.id, { showAccentRule: event.target.checked })} /> Accent rule</label>
              <label><input type="checkbox" checked={selected.showTitlePlaceholder ?? false} onChange={event => onPatch(selected.id, { showTitlePlaceholder: event.target.checked })} /> Slide title</label>
              <label><input type="checkbox" checked={selected.showSlideNumber} onChange={event => onPatch(selected.id, { showSlideNumber: event.target.checked })} /> Slide number</label>
            </div>
            <div className="master-apply-row">
              <select value={scope} onChange={event => setScope(event.target.value as "current" | "all")}>
                <option value="current">Current slide only</option>
                <option value="all">All slides</option>
              </select>
              <Button onClick={() => onApply(selected.id, scope)}><Check size={15} /> Apply master</Button>
              <Button variant="outline" size="icon" title="Duplicate master" onClick={() => { const copy = cloneSlideMaster(selected); onAdd(copy); setSelectedId(copy.id); }}><Copy /></Button>
              <Button variant="ghost" size="icon" title="Delete master" onClick={() => { if (window.confirm(`Delete master “${selected.name}”? Slides using it will keep their current appearance.`)) { onDelete(selected.id); setSelectedId(masters.find(item => item.id !== selected.id)?.id ?? ""); } }}><Trash2 /></Button>
            </div>
          </section> : <div className="master-empty">Add a master layout to start building reusable slide designs.</div>}
        </main>
      </div>
      <footer className="master-dialog-footer"><span>Master changes are saved with the presentation.</span><Button variant="outline" onClick={onClose}>Done</Button></footer>
    </section>
  </div>;
}
