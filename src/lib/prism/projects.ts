// Local project repository (localStorage). Swap for a sync-capable backend later behind this API.
import type { Deck } from "./types";

const INDEX = "prismdeck:projects";
const CURRENT = "prismdeck:current";
const key = (id: string) => `prismdeck:deck:${id}`;

export interface ProjectInfo { id: string; name: string; updatedAt: number; slides: number }

export function listProjects(): ProjectInfo[] {
  try { return JSON.parse(localStorage.getItem(INDEX) || "[]"); } catch { return []; }
}
export function saveProject(d: Deck) {
  localStorage.setItem(key(d.id), JSON.stringify(d));
  localStorage.setItem(CURRENT, d.id);
  const list = listProjects().filter((p) => p.id !== d.id);
  list.unshift({ id: d.id, name: d.name, updatedAt: d.updatedAt, slides: d.slides.length });
  localStorage.setItem(INDEX, JSON.stringify(list.slice(0, 30)));
}
export function readProject(id: string): Deck | null {
  try { const r = localStorage.getItem(key(id)); return r ? (JSON.parse(r) as Deck) : null; } catch { return null; }
}
export function loadProject(): Deck | null {
  const id = localStorage.getItem(CURRENT);
  return id ? readProject(id) : null;
}
export function deleteProject(id: string) {
  localStorage.removeItem(key(id));
  localStorage.setItem(INDEX, JSON.stringify(listProjects().filter((p) => p.id !== id)));
}
export const isFirstRun = () => !localStorage.getItem(CURRENT);