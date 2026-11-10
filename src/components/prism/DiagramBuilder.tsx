import { useState } from "react";
import { GitBranch, X, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIAGRAM_PRESETS, type DiagramKind } from "@/lib/prism/diagrams";

const SAMPLE_LABELS: Record<DiagramKind, string> = {
  process: "Research\nPlan\nBuild\nReview",
  timeline: "Discover\nDesign\nLaunch\nGrow",
  hierarchy: "Leadership\nOperations\nMarketing\nProduct",
  cycle: "Plan\nExecute\nMeasure\nImprove",
  mindmap: "Main idea\nAudience\nBudget\nTimeline\nRisks",
};

export function DiagramBuilder({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (kind: DiagramKind, labels: string[]) => void;
}) {
  const [kind, setKind] = useState<DiagramKind>("process");
  const [rawLabels, setRawLabels] = useState(SAMPLE_LABELS.process);
  const labels = rawLabels.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const chooseKind = (next: DiagramKind) => { setKind(next); setRawLabels(SAMPLE_LABELS[next]); };

  return <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="diagram-dialog" role="dialog" aria-modal="true" aria-label="Smart diagram builder">
      <header className="diagram-dialog-header">
        <div><span className="eyebrow">SMART ARTWORK</span><h2>Smart Diagram Builder</h2><p>Build an editable, grouped diagram directly on your slide.</p></div>
        <Button size="icon" variant="ghost" title="Close diagram builder" onClick={onClose}><X /></Button>
      </header>
      <div className="diagram-kind-grid">
        {DIAGRAM_PRESETS.map(preset => <button type="button" key={preset.id} className={kind === preset.id ? "diagram-kind active" : "diagram-kind"} onClick={() => chooseKind(preset.id)}>
          <GitBranch size={18}/><strong>{preset.name}</strong><small>{preset.description}</small>
        </button>)}
      </div>
      <label className="diagram-label-editor">Diagram labels <span>{labels.length}/8 nodes</span>
        <textarea value={rawLabels} rows={7} onChange={event => setRawLabels(event.target.value)} placeholder="Enter one node per line…" />
      </label>
      <div className="diagram-dialog-footer"><span>Every node and connector remains editable after insertion.</span><Button disabled={labels.length < 2} onClick={() => onCreate(kind, labels)}><WandSparkles size={16}/> Create diagram</Button></div>
    </section>
  </div>;
}
