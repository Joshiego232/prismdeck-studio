// Transition and animation preset definitions (Web Animations API keyframes).
import type { Animation, Transition } from "./types";

type Dir = Transition["direction"];
const vec = (d: Dir, n = 100): [number, number] =>
  d === "left" ? [-n, 0] : d === "right" ? [n, 0] : d === "up" ? [0, -n] : [0, n];

export interface TransitionPreset { id: string; label: string; directional?: boolean }
export const TRANSITIONS: TransitionPreset[] = [
  { id: "none", label: "None" }, { id: "fade", label: "Fade" }, { id: "dissolve", label: "Dissolve" },
  { id: "push", label: "Push", directional: true }, { id: "wipe", label: "Wipe", directional: true },
  { id: "split", label: "Split" }, { id: "reveal", label: "Reveal", directional: true },
  { id: "zoom", label: "Zoom" }, { id: "flip", label: "Flip", directional: true },
  { id: "cube", label: "Cube turn", directional: true }, { id: "gallery", label: "Gallery", directional: true },
  { id: "morph", label: "Morph" }, { id: "blur", label: "Blur" }, { id: "curtain", label: "Curtain" },
  { id: "spin", label: "Spin" }, { id: "glitch", label: "Glitch" }, { id: "slide", label: "Cover", directional: true },
];

export const EASINGS: { label: string; value: string }[] = [
  { label: "Smooth", value: "cubic-bezier(.4,0,.2,1)" }, { label: "Ease in-out", value: "cubic-bezier(.65,0,.35,1)" },
  { label: "Snappy", value: "cubic-bezier(.2,.8,.2,1)" }, { label: "Linear", value: "linear" },
  { label: "Back", value: "cubic-bezier(.34,1.56,.64,1)" }, { label: "Ease in", value: "cubic-bezier(.5,0,.75,0)" },
];

export interface TransitionFrames { incoming: Keyframe[]; outgoing: Keyframe[]; perspective?: boolean; inFront?: "in" | "out" }

export function transitionFrames(t: Transition): TransitionFrames {
  const [x, y] = vec(t.direction);
  const pct = (a: number, b: number) => `translate(${a}%, ${b}%)`;
  switch (t.type) {
    case "none": return { incoming: [{ opacity: 1 }, { opacity: 1 }], outgoing: [{ opacity: 0 }, { opacity: 0 }] };
    case "fade": return { incoming: [{ opacity: 0 }, { opacity: 1 }], outgoing: [{ opacity: 1 }, { opacity: 0 }] };
    case "dissolve": return { incoming: [{ opacity: 0, filter: "contrast(2) brightness(1.4)" }, { opacity: 1, filter: "none" }], outgoing: [{ opacity: 1 }, { opacity: 1 }] };
    case "push": return { incoming: [{ transform: pct(-x, -y) }, { transform: pct(0, 0) }], outgoing: [{ transform: pct(0, 0) }, { transform: pct(x, y) }] };
    case "slide": return { incoming: [{ transform: pct(-x, -y) }, { transform: pct(0, 0) }], outgoing: [{ opacity: 1 }, { opacity: 1 }] };
    case "reveal": return { incoming: [{ opacity: 1 }, { opacity: 1 }], outgoing: [{ transform: pct(0, 0) }, { transform: pct(x, y) }], inFront: "out" };
    case "wipe": {
      const from = t.direction === "left" ? "inset(0 0 0 100%)" : t.direction === "right" ? "inset(0 100% 0 0)" : t.direction === "up" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)";
      return { incoming: [{ clipPath: from }, { clipPath: "inset(0 0 0 0)" }], outgoing: [{ opacity: 1 }, { opacity: 1 }] };
    }
    case "split": return { incoming: [{ clipPath: "inset(0 50% 0 50%)" }, { clipPath: "inset(0 0% 0 0%)" }], outgoing: [{ opacity: 1 }, { opacity: 0.6 }] };
    case "zoom": return { incoming: [{ transform: "scale(.6)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], outgoing: [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.4)", opacity: 0 }] };
    case "flip": {
      const ax = t.direction === "up" || t.direction === "down" ? "X" : "Y";
      const s = t.direction === "left" || t.direction === "down" ? 1 : -1;
      return { perspective: true, incoming: [{ transform: `rotate${ax}(${-90 * s}deg)`, opacity: 0, offset: 0 }, { transform: `rotate${ax}(${-90 * s}deg)`, opacity: 0, offset: 0.5 }, { transform: `rotate${ax}(0)`, opacity: 1 }], outgoing: [{ transform: `rotate${ax}(0)`, opacity: 1 }, { transform: `rotate${ax}(${90 * s}deg)`, opacity: 0, offset: 0.5 }, { transform: `rotate${ax}(${90 * s}deg)`, opacity: 0 }] };
    }
    case "cube": {
      const s = t.direction === "right" ? -1 : 1;
      return { perspective: true, incoming: [{ transform: `translateX(${50 * s}%) rotateY(${-90 * s}deg) translateX(${50 * s}%)`, filter: "brightness(.5)" }, { transform: "translateX(0) rotateY(0) translateX(0)", filter: "brightness(1)" }], outgoing: [{ transform: "translateX(0) rotateY(0) translateX(0)", filter: "brightness(1)" }, { transform: `translateX(${-50 * s}%) rotateY(${90 * s}deg) translateX(${-50 * s}%)`, filter: "brightness(.5)" }] };
    }
    case "gallery": return { incoming: [{ transform: `${pct(-x * 1.1, -y * 1.1)} scale(.75)`, offset: 0 }, { transform: `${pct(-x * 0.1, -y * 0.1)} scale(.75)`, offset: 0.6 }, { transform: "translate(0,0) scale(1)" }], outgoing: [{ transform: "translate(0,0) scale(1)" }, { transform: `${pct(x * 0.1, y * 0.1)} scale(.75)`, offset: 0.4 }, { transform: `${pct(x * 1.1, y * 1.1)} scale(.75)` }] };
    case "morph": return { incoming: [{ opacity: 0 }, { opacity: 1 }], outgoing: [{ opacity: 1 }, { opacity: 0 }] };
    case "blur": return { incoming: [{ opacity: 0, filter: "blur(40px)" }, { opacity: 1, filter: "blur(0)" }], outgoing: [{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(40px)" }] };
    case "curtain": return { incoming: [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }], outgoing: [{ transform: "scaleY(1)", filter: "brightness(1)" }, { transform: "scaleY(1)", filter: "brightness(.3)" }] };
    case "spin": return { incoming: [{ transform: "rotate(-180deg) scale(0)", opacity: 0 }, { transform: "rotate(0) scale(1)", opacity: 1 }], outgoing: [{ transform: "rotate(0) scale(1)", opacity: 1 }, { transform: "rotate(180deg) scale(0)", opacity: 0 }] };
    case "glitch": return {
      incoming: [
        { opacity: 0, transform: "translate(0,0)", filter: "none" },
        { opacity: 1, transform: "translate(-3%,1%)", filter: "hue-rotate(90deg) saturate(3)", offset: 0.2 },
        { opacity: 0.3, transform: "translate(4%,-1%)", filter: "invert(1)", offset: 0.35 },
        { opacity: 1, transform: "translate(-1%,0)", filter: "hue-rotate(-60deg)", offset: 0.55 },
        { opacity: 1, transform: "translate(0,0)", filter: "none" },
      ],
      outgoing: [{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }],
    };
    default: return { incoming: [{ opacity: 0 }, { opacity: 1 }], outgoing: [{ opacity: 1 }, { opacity: 0 }] };
  }
}

export interface AnimPreset { id: string; label: string; kind: Animation["kind"]; directional?: boolean }
export const ANIMATIONS: AnimPreset[] = [
  { id: "fadeIn", label: "Fade in", kind: "entrance" }, { id: "slideIn", label: "Fly in", kind: "entrance", directional: true },
  { id: "zoomIn", label: "Zoom in", kind: "entrance" }, { id: "rise", label: "Rise up", kind: "entrance" },
  { id: "wipeIn", label: "Wipe", kind: "entrance", directional: true }, { id: "blurIn", label: "Focus", kind: "entrance" },
  { id: "bounceIn", label: "Bounce", kind: "entrance" }, { id: "flipIn", label: "Flip in", kind: "entrance" },
  { id: "pulse", label: "Pulse", kind: "emphasis" }, { id: "spin", label: "Spin", kind: "emphasis" },
  { id: "shake", label: "Shake", kind: "emphasis" }, { id: "glow", label: "Flash", kind: "emphasis" },
  { id: "wobble", label: "Wobble", kind: "emphasis" },
  { id: "float", label: "Float", kind: "emphasis" }, { id: "heartbeat", label: "Heartbeat", kind: "emphasis" },
  { id: "rubberBand", label: "Rubber band", kind: "emphasis" }, { id: "swing", label: "Swing", kind: "emphasis" },
  { id: "rollIn", label: "Roll in", kind: "entrance" }, { id: "rollOut", label: "Roll out", kind: "exit" },
  { id: "fadeOut", label: "Fade out", kind: "exit" }, { id: "slideOut", label: "Fly out", kind: "exit", directional: true },
  { id: "zoomOut", label: "Zoom out", kind: "exit" }, { id: "sink", label: "Sink", kind: "exit" },
];

export function animFrames(a: Pick<Animation, "effect" | "direction">, baseRot = 0): Keyframe[] {
  const [x, y] = vec(a.direction, 300);
  const r = `rotate(${baseRot}deg)`;
  switch (a.effect) {
    case "fadeIn": return [{ opacity: 0 }, { opacity: 1 }];
    case "slideIn": return [{ opacity: 0, transform: `translate(${x}px, ${y}px) ${r}` }, { opacity: 1, transform: `translate(0,0) ${r}` }];
    case "zoomIn": return [{ opacity: 0, transform: `scale(.3) ${r}` }, { opacity: 1, transform: `scale(1) ${r}` }];
    case "rise": return [{ opacity: 0, transform: `translateY(80px) ${r}` }, { opacity: 1, transform: `translateY(0) ${r}` }];
    case "wipeIn": {
      const from = a.direction === "left" ? "inset(0 100% 0 0)" : a.direction === "right" ? "inset(0 0 0 100%)" : a.direction === "up" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)";
      return [{ clipPath: from }, { clipPath: "inset(0 0 0 0)" }];
    }
    case "blurIn": return [{ opacity: 0, filter: "blur(30px)" }, { opacity: 1, filter: "blur(0)" }];
    case "bounceIn": return [{ opacity: 0, transform: `scale(.3) ${r}` }, { opacity: 1, transform: `scale(1.08) ${r}`, offset: 0.6 }, { transform: `scale(.96) ${r}`, offset: 0.8 }, { opacity: 1, transform: `scale(1) ${r}` }];
    case "flipIn": return [{ opacity: 0, transform: `perspective(1200px) rotateX(90deg) ${r}` }, { opacity: 1, transform: `perspective(1200px) rotateX(0) ${r}` }];
    case "pulse": return [{ transform: `scale(1) ${r}` }, { transform: `scale(1.12) ${r}` }, { transform: `scale(1) ${r}` }];
    case "spin": return [{ transform: `rotate(${baseRot}deg)` }, { transform: `rotate(${baseRot + 360}deg)` }];
    case "shake": return [0, -24, 24, -16, 16, -6, 0].map((d) => ({ transform: `translateX(${d}px) ${r}` }));
    case "glow": return [{ filter: "brightness(1)" }, { filter: "brightness(1.8) drop-shadow(0 0 30px white)" }, { filter: "brightness(1)" }];
    case "wobble": return [0, -8, 6, -4, 2, 0].map((d) => ({ transform: `rotate(${baseRot + d}deg)` }));
    case "float": return [{ transform: `translateY(0) ${r}` }, { transform: `translateY(-28px) ${r}` }, { transform: `translateY(0) ${r}` }];
    case "heartbeat": return [{ transform: `scale(1) ${r}` }, { transform: `scale(1.12) ${r}`, offset: 0.18 }, { transform: `scale(1) ${r}`, offset: 0.36 }, { transform: `scale(1.16) ${r}`, offset: 0.54 }, { transform: `scale(1) ${r}` }];
    case "rubberBand": return [{ transform: `scale3d(1,1,1) ${r}` }, { transform: `scale3d(1.22,.78,1) ${r}`, offset: 0.3 }, { transform: `scale3d(.82,1.18,1) ${r}`, offset: 0.5 }, { transform: `scale3d(1.08,.92,1) ${r}`, offset: 0.7 }, { transform: `scale3d(1,1,1) ${r}` }];
    case "swing": return [0, 12, -8, 5, -3, 0].map((d) => ({ transform: `rotate(${baseRot + d}deg)` }));
    case "rollIn": return [{ opacity: 0, transform: `translateX(-180px) rotate(-120deg) ${r}` }, { opacity: 1, transform: `translateX(0) rotate(0deg) ${r}` }];
    case "rollOut": return [{ opacity: 1, transform: `translateX(0) rotate(0deg) ${r}` }, { opacity: 0, transform: `translateX(180px) rotate(120deg) ${r}` }];
    case "fadeOut": return [{ opacity: 1 }, { opacity: 0 }];
    case "slideOut": return [{ opacity: 1, transform: `translate(0,0) ${r}` }, { opacity: 0, transform: `translate(${-x}px, ${-y}px) ${r}` }];
    case "zoomOut": return [{ opacity: 1, transform: `scale(1) ${r}` }, { opacity: 0, transform: `scale(.3) ${r}` }];
    case "sink": return [{ opacity: 1, transform: `translateY(0) ${r}` }, { opacity: 0, transform: `translateY(80px) ${r}` }];
    default: return [{ opacity: 0 }, { opacity: 1 }];
  }
}

export interface AnimStep { items: { anim: Animation; offset: number }[] }

/** Groups a slide's animation list into click steps. Step 0 holds anims that run automatically on entry. */
export function buildSteps(anims: Animation[]): AnimStep[] {
  const steps: AnimStep[] = [{ items: [] }];
  let cursorEnd = 0; let prevStart = 0;
  anims.forEach((a, i) => {
    void i;
    if (a.trigger === "onClick") {
      steps.push({ items: [] }); cursorEnd = 0; prevStart = 0;
    }
    const cur = steps[steps.length - 1];
    const start = a.trigger === "afterPrevious" ? cursorEnd : a.trigger === "withPrevious" ? prevStart : 0;
    if (!cur) return;
    cur.items.push({ anim: a, offset: start });
    prevStart = start;
    cursorEnd = Math.max(cursorEnd, start + a.delay + a.duration);
  });
  return steps;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}