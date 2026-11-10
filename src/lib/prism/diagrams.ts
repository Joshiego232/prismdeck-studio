import type { ShapeEl, ShapeKind } from "./types";
import { makeShape, uid } from "./factory";

export type DiagramKind = "process" | "timeline" | "hierarchy" | "cycle" | "mindmap";

export const DIAGRAM_PRESETS: Array<{ id: DiagramKind; name: string; description: string }> = [
  { id: "process", name: "Process", description: "A left-to-right sequence of steps." },
  { id: "timeline", name: "Timeline", description: "Milestones arranged along a time axis." },
  { id: "hierarchy", name: "Hierarchy", description: "A parent node with supporting branches." },
  { id: "cycle", name: "Cycle", description: "A repeating circular process." },
  { id: "mindmap", name: "Mind map", description: "A central idea with connected topics." },
];

const COLORS = ["#2563eb", "#0891b2", "#0f766e", "#7c3aed", "#c2410c", "#be185d"];

function node(label: string, x: number, y: number, w: number, h: number, groupId: string, index: number, shape: ShapeKind = "roundRect"): ShapeEl {
  return makeShape(shape, {
    name: label || `Diagram node ${index + 1}`,
    x, y, w, h, fill: COLORS[index % COLORS.length]!, fill2: COLORS[(index + 1) % COLORS.length]!,
    stroke: "#ffffff", strokeWidth: 2, text: label, textColor: "#ffffff", fontSize: 27,
    radius: shape === "roundRect" ? 18 : 0, groupId,
  });
}

function connector(x: number, y: number, w: number, h: number, groupId: string, vertical = false): ShapeEl {
  return makeShape("arrow", {
    name: "Diagram connector", x, y, w, h, rotation: vertical ? 90 : 0,
    fill: "#94a3b8", stroke: "#94a3b8", strokeWidth: 3, opacity: 0.9, groupId,
  });
}

export function createDiagramElements(kind: DiagramKind, inputLabels: string[], deckWidth: number, deckHeight: number): ShapeEl[] {
  const labels = inputLabels.map(label => label.trim()).filter(Boolean).slice(0, 8);
  if (labels.length < 2) throw new Error("Enter at least two diagram labels.");
  const groupId = uid("diagram_");
  const elements: ShapeEl[] = [];
  const cx = Math.round(deckWidth / 2), cy = Math.round(deckHeight / 2);
  const nodeW = kind === "hierarchy" || kind === "mindmap" ? 330 : Math.min(270, Math.floor((deckWidth - 180 - (labels.length - 1) * 65) / labels.length));
  const nodeH = 118;

  if (kind === "process") {
    const gap = 65, total = labels.length * nodeW + (labels.length - 1) * gap;
    let x = cx - total / 2;
    labels.forEach((label, i) => {
      if (i) elements.push(connector(x - gap + 18, cy - 9, gap - 34, 18, groupId));
      elements.push(node(label, x, cy - nodeH / 2, nodeW, nodeH, groupId, i));
      x += nodeW + gap;
    });
  } else if (kind === "timeline") {
    const gap = 92, total = labels.length * 245 + (labels.length - 1) * gap;
    let x = cx - total / 2;
    elements.push(makeShape("line", { name: "Timeline axis", x, y: cy, w: total, h: 10, stroke: "#94a3b8", strokeWidth: 8, groupId }));
    labels.forEach((label, i) => {
      const boxX = x + i * (245 + gap);
      elements.push(node(label, boxX, cy - 150, 245, 108, groupId, i));
      elements.push(makeShape("line", { name: "Timeline marker", x: boxX + 116, y: cy - 42, w: 8, h: 42, stroke: COLORS[i % COLORS.length]!, strokeWidth: 8, groupId }));
      elements.push(makeShape("ellipse", { name: "Timeline milestone", x: boxX + 105, y: cy - 12, w: 30, h: 30, fill: COLORS[i % COLORS.length]!, stroke: "#ffffff", strokeWidth: 2, groupId }));
    });
  } else if (kind === "hierarchy") {
    const root = labels[0]!;
    const children = labels.slice(1);
    const childW = Math.min(245, Math.floor((deckWidth - 160 - (children.length - 1) * 38) / children.length));
    const total = children.length * childW + (children.length - 1) * 38;
    const startX = cx - total / 2;
    elements.push(node(root, cx - nodeW / 2, cy - 245, nodeW, nodeH, groupId, 0));
    elements.push(makeShape("line", { name: "Hierarchy stem", x: cx - 4, y: cy - 127, w: 8, h: 84, stroke: "#94a3b8", strokeWidth: 6, groupId }));
    elements.push(makeShape("line", { name: "Hierarchy branch", x: startX + childW / 2, y: cy - 49, w: total - childW, h: 8, stroke: "#94a3b8", strokeWidth: 6, groupId }));
    children.forEach((label, i) => {
      const x = startX + i * (childW + 38);
      elements.push(makeShape("line", { name: "Hierarchy connector", x: x + childW / 2 - 4, y: cy - 49, w: 8, h: 49, stroke: "#94a3b8", strokeWidth: 6, groupId }));
      elements.push(node(label, x, cy, childW, 105, groupId, i + 1));
    });
  } else {
    const root = labels[0]!;
    const branches = labels.slice(1);
    const radiusX = Math.min(590, deckWidth * 0.32), radiusY = Math.min(310, deckHeight * 0.29);
    const centerX = cx - nodeW / 2, centerY = cy - nodeH / 2;
    elements.push(node(root, centerX, centerY, nodeW, nodeH, groupId, 0, "ellipse"));
    branches.forEach((label, i) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * i) / branches.length;
      const x = cx + Math.cos(angle) * radiusX - 125;
      const y = cy + Math.sin(angle) * radiusY - 53;
      elements.push(connector((cx + x + 125) / 2, (cy + y + 53) / 2 - 7, Math.max(70, Math.abs(x + 125 - cx)), 14, groupId, Math.abs(y + 53 - cy) > Math.abs(x + 125 - cx)));
      elements.push(node(label, x, y, 250, 106, groupId, i + 1, kind === "cycle" ? "ellipse" : "roundRect"));
    });
  }
  return elements;
}
