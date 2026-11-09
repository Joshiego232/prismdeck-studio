// Editor document store: deck, selection, undo/redo history, local autosave.
import { create } from "zustand";
import { produce, type Draft } from "immer";
import type { Deck, Slide, SlideElement } from "./types";
import { cloneElement, cloneSlide, makeDeck, makeSlide } from "./factory";
import { makeDemoDeck } from "./demo";
import { loadProject, saveProject } from "./projects";

const HISTORY_LIMIT = 120;

export type SaveState = "saved" | "saving" | "unsaved" | "error";

interface MutateOpts { history?: boolean; coalesce?: string | undefined }

export interface DeckState {
  deck: Deck;
  past: Deck[];
  future: Deck[];
  lastCoalesce: { key: string; at: number } | null;
  currentSlideId: string;
  selectedSlideIds: string[];
  selectedElementIds: string[];
  editingTextId: string | null;
  clipboard: SlideElement[];
  saveState: SaveState;

  mutate: (fn: (d: Draft<Deck>) => void, opts?: MutateOpts) => void;
  snapshot: () => void; // push history before a transient interaction (drag)
  undo: () => void;
  redo: () => void;
  loadDeck: (d: Deck) => void;

  selectSlide: (id: string, mode?: "single" | "toggle" | "range") => void;
  selectElements: (ids: string[]) => void;
  setEditingText: (id: string | null) => void;

  addSlide: (after?: string, s?: Slide) => string;
  duplicateSlides: (ids?: string[]) => void;
  deleteSlides: (ids?: string[]) => void;
  moveSlides: (ids: string[], toIndex: number) => void;

  addElement: (el: SlideElement, slideId?: string) => void;
  updateElements: (ids: string[], patch: Record<string, unknown>, coalesce?: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  paste: () => void;
  reorderElement: (id: string, where: "front" | "back" | "forward" | "backward" | number) => void;
}

export const currentSlide = (s: Pick<DeckState, "deck" | "currentSlideId">): Slide =>
  s.deck.slides.find((x) => x.id === s.currentSlideId) ?? s.deck.slides[0] ?? initialDeck().slides.find(() => true) as Slide;

export const findSlide = (d: Draft<Deck> | Deck, id: string) => d.slides.find((s) => s.id === id);

function initialDeck(): Deck {
  // Deterministic shell for SSR; the editor restores local content after mounting.
  return { schema: 1, id: "initial", name: "PrismDeck Studio", width: 1920, height: 1080,
    createdAt: 0, updatedAt: 0, slides: [{ id: "initial-slide", name: "Title", notes: "",
      background: { type: "solid", color: "transparent", color2: "transparent", angle: 0, image: "", imageFit: "cover" },
      transition: { type: "fade", duration: 600, easing: "ease", direction: "left" },
      autoAdvance: 0, elements: [], animations: [] }] };
}

export const useDeck = create<DeckState>()((set, get) => {
  const d0 = initialDeck();
  const pushHistory = (st: DeckState) => ({ past: [...st.past, st.deck].slice(-HISTORY_LIMIT), future: [] as Deck[] });

  return {
    deck: d0, past: [], future: [], lastCoalesce: null,
    currentSlideId: (d0.slides[0]?.id ?? "initial-slide"), selectedSlideIds: [(d0.slides[0]?.id ?? "initial-slide")],
    selectedElementIds: [], editingTextId: null, clipboard: [], saveState: "saved",

    mutate: (fn, opts = {}) => set((st) => {
      const next = produce(st.deck, (d) => { fn(d); d.updatedAt = Date.now(); });
      if (next === st.deck) return {};
      const now = Date.now();
      let hist = {};
      if (opts.history !== false) {
        const same = opts.coalesce && st.lastCoalesce?.key === opts.coalesce && now - st.lastCoalesce.at < 1200;
        if (!same) hist = pushHistory(st);
      }
      return { deck: next, ...hist, lastCoalesce: opts.coalesce ? { key: opts.coalesce, at: now } : null, saveState: "unsaved" };
    }),
    snapshot: () => set((st) => ({ ...pushHistory(st), lastCoalesce: null })),
    undo: () => set((st) => {
      const prev = st.past[st.past.length - 1]; if (!prev) return {};
      return fixSel({ ...st, deck: prev, past: st.past.slice(0, -1), future: [st.deck, ...st.future], saveState: "unsaved", lastCoalesce: null });
    }),
    redo: () => set((st) => {
      const nx = st.future[0]; if (!nx) return {};
      return fixSel({ ...st, deck: nx, past: [...st.past, st.deck], future: st.future.slice(1), saveState: "unsaved", lastCoalesce: null });
    }),
    loadDeck: (d) => set({ deck: d, past: [], future: [], currentSlideId: (d.slides[0]?.id ?? "initial-slide"), selectedSlideIds: [(d.slides[0]?.id ?? "initial-slide")], selectedElementIds: [], editingTextId: null, saveState: "unsaved" }),

    selectSlide: (id, mode = "single") => set((st) => {
      if (mode === "toggle") {
        const has = st.selectedSlideIds.includes(id);
        const sel = has && st.selectedSlideIds.length > 1 ? st.selectedSlideIds.filter((x) => x !== id) : has ? st.selectedSlideIds : [...st.selectedSlideIds, id];
        return { selectedSlideIds: sel, currentSlideId: id, selectedElementIds: [], editingTextId: null };
      }
      if (mode === "range") {
        const ids = st.deck.slides.map((s) => s.id);
        const a = ids.indexOf(st.currentSlideId), b = ids.indexOf(id);
        return { selectedSlideIds: ids.slice(Math.min(a, b), Math.max(a, b) + 1), selectedElementIds: [], editingTextId: null };
      }
      return { currentSlideId: id, selectedSlideIds: [id], selectedElementIds: [], editingTextId: null };
    }),
    selectElements: (ids) => set((st) => ({ selectedElementIds: ids, editingTextId: ids.includes(st.editingTextId ?? "") ? st.editingTextId : null })),
    setEditingText: (id) => set({ editingTextId: id }),

    addSlide: (after, s) => {
      const slide = s ?? makeSlide({ name: `Slide ${get().deck.slides.length + 1}` });
      const cur = currentSlide(get());
      if (!s) { slide.background = structuredClone(cur.background); slide.transition = structuredClone(cur.transition); }
      get().mutate((d) => {
        const i = d.slides.findIndex((x) => x.id === (after ?? get().currentSlideId));
        d.slides.splice(i + 1, 0, slide);
      });
      get().selectSlide(slide.id);
      return slide.id;
    },
    duplicateSlides: (ids) => {
      const sel = ids ?? get().selectedSlideIds;
      let lastId = "";
      get().mutate((d) => {
        for (const id of sel) {
          const i = d.slides.findIndex((x) => x.id === id); if (i < 0) continue;
          const c = cloneSlide(d.slides[i] as Slide); lastId = c.id;
          d.slides.splice(i + 1, 0, c);
        }
      });
      if (lastId) get().selectSlide(lastId);
    },
    deleteSlides: (ids) => {
      const sel = new Set(ids ?? get().selectedSlideIds);
      const st = get();
      if (sel.size >= st.deck.slides.length) {
        // keep at least one slide
        const fresh = makeSlide({ name: "Slide 1" });
        st.mutate((d) => { d.slides = [fresh]; });
        st.selectSlide(fresh.id); return;
      }
      const idx = st.deck.slides.findIndex((s) => s.id === st.currentSlideId);
      st.mutate((d) => {
        // carry a section label forward so dividers aren't lost silently
        d.slides.forEach((s, i) => { if (sel.has(s.id) && s.section) { const n = d.slides.slice(i + 1).find((x) => !sel.has(x.id)); if (n && !n.section) n.section = s.section; } });
        d.slides = d.slides.filter((s) => !sel.has(s.id));
      });
      const rest = get().deck.slides;
      const target = rest[Math.min(idx, rest.length - 1)];
      if (target) get().selectSlide(target.id);
    },
    moveSlides: (ids, toIndex) => get().mutate((d) => {
      const set = new Set(ids);
      const moving = d.slides.filter((s) => set.has(s.id));
      const before = d.slides.slice(0, toIndex).filter((s) => !set.has(s.id)).length;
      const rest = d.slides.filter((s) => !set.has(s.id));
      rest.splice(before, 0, ...moving);
      d.slides = rest;
    }),

    addElement: (el, slideId) => {
      get().mutate((d) => { findSlide(d, slideId ?? get().currentSlideId)?.elements.push(el as Draft<SlideElement>); });
      set({ selectedElementIds: [el.id] });
    },
    updateElements: (ids, patch, coalesce) => get().mutate((d) => {
      const s = findSlide(d, get().currentSlideId); if (!s) return;
      for (const e of s.elements) if (ids.includes(e.id)) Object.assign(e, patch);
    }, { coalesce }),
    deleteSelected: () => {
      const ids = new Set(get().selectedElementIds); if (!ids.size) return;
      get().mutate((d) => {
        const s = findSlide(d, get().currentSlideId); if (!s) return;
        s.elements = s.elements.filter((e) => !ids.has(e.id) || e.locked);
        s.animations = s.animations.filter((a) => s.elements.some((e) => e.id === a.elementId));
      });
      set({ selectedElementIds: [] });
    },
    duplicateSelected: () => {
      const s = currentSlide(get());
      const clones = s.elements.filter((e) => get().selectedElementIds.includes(e.id)).map((e) => cloneElement(e));
      if (!clones.length) return;
      get().mutate((d) => { findSlide(d, s.id)?.elements.push(...(clones as Draft<SlideElement>[])); });
      set({ selectedElementIds: clones.map((c) => c.id) });
    },
    copySelected: () => {
      const s = currentSlide(get());
      set({ clipboard: s.elements.filter((e) => get().selectedElementIds.includes(e.id)).map((e) => structuredClone(e)) });
    },
    paste: () => {
      const clones = get().clipboard.map((e) => cloneElement(e, 40)); if (!clones.length) return;
      get().mutate((d) => { findSlide(d, get().currentSlideId)?.elements.push(...(clones as Draft<SlideElement>[])); });
      set({ selectedElementIds: clones.map((c) => c.id), clipboard: clones.map((c) => structuredClone(c)) });
    },
    reorderElement: (id, where) => get().mutate((d) => {
      const s = findSlide(d, get().currentSlideId); if (!s) return;
      const i = s.elements.findIndex((e) => e.id === id); if (i < 0) return;
      const [el] = s.elements.splice(i, 1);
      if (!el) return;
      const n = s.elements.length;
      const to = typeof where === "number" ? where : where === "front" ? n : where === "back" ? 0 : where === "forward" ? Math.min(n, i + 1) : Math.max(0, i - 1);
      s.elements.splice(to, 0, el);
    }),
  };
});

function fixSel(st: DeckState): Partial<DeckState> {
  const ids = st.deck.slides.map((s) => s.id);
  const cur = ids.includes(st.currentSlideId) ? st.currentSlideId : (ids[0] ?? "initial-slide");
  const slide = st.deck.slides.find((s) => s.id === cur);
  if (!slide) return {};
  return {
    deck: st.deck, past: st.past, future: st.future, saveState: st.saveState, lastCoalesce: null,
    currentSlideId: cur,
    selectedSlideIds: st.selectedSlideIds.filter((x) => ids.includes(x)).length ? st.selectedSlideIds.filter((x) => ids.includes(x)) : [cur],
    selectedElementIds: st.selectedElementIds.filter((x) => slide.elements.some((e) => e.id === x)),
  };
}

/** Debounced local autosave. Call once from the editor shell. */
export function startAutosave(getDelay: () => number, enabled: () => boolean) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    try { saveProject(useDeck.getState().deck); useDeck.setState({ saveState: "saved" }); }
    catch { useDeck.setState({ saveState: "error" }); }
  };
  const unsub = useDeck.subscribe((s, p) => {
    if (s.deck === p.deck || !enabled()) return;
    useDeck.setState({ saveState: "saving" });
    clearTimeout(t); t = setTimeout(flush, getDelay());
  });
  const onUnload = () => { if (useDeck.getState().saveState !== "saved") flush(); };
  window.addEventListener("beforeunload", onUnload);
  return () => { unsub(); clearTimeout(t); window.removeEventListener("beforeunload", onUnload); };
}
export const saveNow = () => { saveProject(useDeck.getState().deck); useDeck.setState({ saveState: "saved" }); };