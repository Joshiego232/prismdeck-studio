import type {
  AudioEl, Background, ChartEl, Deck, Effects, ImageEl, ShapeEl, ShapeKind, Slide, SlideElement,
  TextEl, Transition, VideoEl, Animation, AnimKind,
} from "./types";
import { DECK_SCHEMA_VERSION, DEFAULT_ADJUST } from "./types";

export const uid = (p = "") =>
  p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const baseEffects = (): Effects => ({
  shadow: { on: false, x: 0, y: 12, blur: 30, color: "rgba(0,0,0,0.35)" },
  blur: 0,
  glow: { on: false, size: 18, color: "#7c83ff" },
});

export const defaultBackground = (): Background => ({
  type: "solid", color: "#0f1220", color2: "#1d2450", angle: 135, gradientType: "linear", gradientColors: ["#0f1220", "#1d2450"], image: "", imageFit: "cover",
});

export const defaultTransition = (): Transition => ({
  type: "fade", duration: 600, easing: "cubic-bezier(.4,0,.2,1)", direction: "left",
});

export function makeSlide(partial: Partial<Slide> = {}): Slide {
  return {
    id: uid("s_"), name: "Untitled slide", background: defaultBackground(),
    transition: defaultTransition(), autoAdvance: 0, notes: "", elements: [], animations: [],
    ...partial,
  };
}

export function makeDeck(name = "Untitled deck", slides?: Slide[]): Deck {
  const now = Date.now();
  return {
    schema: DECK_SCHEMA_VERSION, id: uid("d_"), name, width: 1920, height: 1080,
    slides: slides ?? [makeSlide({ name: "Title" })], createdAt: now, updatedAt: now,
  };
}

const base = (type: SlideElement["type"], name: string, x: number, y: number, w: number, h: number) => ({
  id: uid("e_"), type, name, x, y, w, h, rotation: 0, opacity: 1, ...baseEffects(),
});

export function makeText(p: Partial<TextEl> = {}): TextEl {
  return {
    ...base("text", "Text", 160, 160, 900, 140),
    type: "text", text: "Double-click to edit text", fontFamily: "Space Grotesk", fontSize: 48,
    fontWeight: 500, italic: false, underline: false, strike: false, color: "#f2f4ff",
    align: "left", vAlign: "top", lineHeight: 1.2, letterSpacing: 0, list: "none", padding: 12,
    fill: "transparent", stroke: "transparent", strokeWidth: 0, radius: 0,
    ...p,
  } as TextEl;
}

export function makeShape(shape: ShapeKind, p: Partial<ShapeEl> = {}): ShapeEl {
  const line = shape === "line" || shape === "arrow";
  return {
    ...base("shape", shape.charAt(0).toUpperCase() + shape.slice(1), 700, 380, line ? 520 : 380, line ? 40 : 300),
    type: "shape", shape, fill: line ? "transparent" : "#6366f1", fill2: "#22d3ee", gradient: false,
    gradientAngle: 135, gradientType: "linear", gradientColors: ["#6366f1", "#22d3ee"], stroke: line ? "#22d3ee" : "transparent", strokeWidth: line ? 8 : 0,
    dash: "solid", radius: shape === "roundRect" ? 40 : 0, text: "", textColor: "#ffffff",
    fontSize: 36, fontFamily: "Space Grotesk",
    ...p,
  } as ShapeEl;
}

export function makeImage(src: string, p: Partial<ImageEl> = {}): ImageEl {
  return {
    ...base("image", "Image", 560, 240, 800, 520),
    type: "image", src, alt: "", fit: "cover", flipX: false, flipY: false,
    crop: { t: 0, r: 0, b: 0, l: 0 }, borderWidth: 0, borderColor: "#ffffff", radius: 0,
    adjust: { ...DEFAULT_ADJUST },
    ...p,
  } as ImageEl;
}

export function makeVideo(src: string, p: Partial<VideoEl> = {}): VideoEl {
  return {
    ...base("video", "Video", 460, 220, 1000, 562),
    type: "video", src, poster: "", loop: false, muted: true, volume: 1, autoplay: false,
    trimStart: 0, trimEnd: 0, fit: "cover", radius: 12,
    ...p,
  } as VideoEl;
}

export function makeAudio(src: string, p: Partial<AudioEl> = {}): AudioEl {
  return {
    ...base("audio", "Audio", 760, 480, 400, 110),
    type: "audio", src, label: "Audio clip", loop: false, volume: 1, autoplay: false,
    ...p,
  } as AudioEl;
}

export function makeChart(chartType: ChartEl["chartType"], p: Partial<ChartEl> = {}): ChartEl {
  return {
    ...base("chart", "Chart", 560, 260, 800, 520),
    type: "chart", chartType, title: "Quarterly growth",
    data: [
      { label: "Q1", value: 32 }, { label: "Q2", value: 48 },
      { label: "Q3", value: 41 }, { label: "Q4", value: 67 },
    ],
    color: "#22d3ee", textColor: "#dfe3ff",
    ...p,
  } as ChartEl;
}

export function makeAnimation(elementId: string, kind: AnimKind, effect: string, p: Partial<Animation> = {}): Animation {
  return {
    id: uid("a_"), elementId, kind, effect, duration: 600, delay: 0,
    easing: "cubic-bezier(.2,.8,.2,1)", direction: "up", trigger: "onClick", ...p,
  };
}

/** Deep clone with fresh ids (used by duplicate / paste). */
export function cloneElement(el: SlideElement, offset = 30): SlideElement {
  const c = structuredClone(el);
  c.id = uid("e_");
  c.x += offset; c.y += offset;
  return c;
}

export function cloneSlide(s: Slide): Slide {
  const c = structuredClone(s);
  const map = new Map<string, string>();
  c.id = uid("s_");
  c.name = s.name + " copy";
  delete c.section;
  const groupMap = new Map<string, string>();
  c.elements.forEach((e) => {
    const n = uid("e_"); map.set(e.id, n); e.id = n;
    if (e.groupId) {
      let nextGroup = groupMap.get(e.groupId);
      if (!nextGroup) { nextGroup = uid("g_"); groupMap.set(e.groupId, nextGroup); }
      e.groupId = nextGroup;
    }
  });
  c.animations = c.animations
    .filter((a) => map.has(a.elementId))
    .map((a) => ({ ...a, id: uid("a_"), elementId: map.get(a.elementId) ?? a.elementId }));
  return c;
}