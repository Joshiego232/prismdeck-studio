import { makeAnimation, makeChart, makeDeck, makeImage, makeShape, makeSlide, makeText } from "./factory";
import type { Deck } from "./types";
import mountainCover from "@/assets/mountain-cover.svg";

const IMG1 = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80";
const IMG2 = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80";

/** Built fresh each call — never at module scope. */
export function makeDemoDeck(): Deck {
  // Slide 1 — title
  const kicker = makeText({ name: "Kicker", text: "PRISMDECK STUDIO · DEMO", x: 160, y: 300, w: 900, h: 60, fontSize: 26, letterSpacing: 6, color: "#22d3ee", fontFamily: "JetBrains Mono", fontWeight: 600 });
  const title = makeText({ name: "Title", text: "Stories that move\nwith your audience.", x: 150, y: 370, w: 1300, h: 300, fontSize: 112, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 });
  const sub = makeText({ name: "Subtitle", text: "A new perspective. A lasting impression.", x: 160, y: 700, w: 1100, h: 70, fontSize: 36, color: "#d8e5e8", fontFamily: "IBM Plex Sans", fontWeight: 400 });
  const s1 = makeSlide({
    name: "Title", section: "Introduction",
    background: { type: "image", color: "#0b0e1a", color2: "#1b1f4a", angle: 135, image: mountainCover, imageFit: "cover" },
    elements: [kicker, title, sub],
    notes: "Welcome everyone. This is a demo deck — every element here is editable.",
    animations: [
      makeAnimation(kicker.id, "entrance", "fadeIn", { trigger: "withPrevious", delay: 200 }),
      makeAnimation(title.id, "entrance", "slideIn", { trigger: "afterPrevious", direction: "up" }),
      makeAnimation(sub.id, "entrance", "fadeIn", { trigger: "afterPrevious" }),
    ],
  });
  s1.transition.type = "fade";

  // Slide 2 — image + text layout
  const img = makeImage(IMG1, { name: "Hero photo", alt: "Earth at night from orbit", x: 960, y: 0, w: 960, h: 1080, adjust: { brightness: 0, exposure: 0, saturation: 20, contrast: 10, highlights: 0, shadows: 0, temperature: -10, tint: 0, sharpness: 0 } });
  const h2 = makeText({ name: "Heading", text: "One canvas.\nEvery screen.", x: 120, y: 200, w: 780, h: 260, fontSize: 88, fontWeight: 700, lineHeight: 1.05 });
  const bullets = makeText({ name: "Bullets", text: "Design on a precise 1920×1080 stage\nPresent fullscreen or to a second display\nEverything saves locally, automatically", list: "bullet", x: 120, y: 520, w: 780, h: 300, fontSize: 36, fontFamily: "IBM Plex Sans", fontWeight: 400, lineHeight: 1.6, color: "#c9cdea" });
  const s2 = makeSlide({ name: "Overview", background: { type: "solid", color: "#0f1220", color2: "#000", angle: 0, image: "", imageFit: "cover" }, elements: [img, h2, bullets], notes: "Point out the image adjustments in the inspector.", animations: [makeAnimation(bullets.id, "entrance", "slideIn", { direction: "left" })] });
  s2.transition = { type: "push", duration: 700, easing: "cubic-bezier(.65,0,.35,1)", direction: "left" };

  // Slide 3 — shapes diagram
  const step = (i: number, label: string, color: string) =>
    makeShape("roundRect", { name: `Step ${i}`, x: 140 + i * 560, y: 430, w: 480, h: 260, fill: color, radius: 36, text: label, fontSize: 40, shadow: { on: true, x: 0, y: 20, blur: 40, color: "rgba(0,0,0,0.4)" } });
  const a = step(0, "Draft", "#4f46e5"), b = step(1, "Refine", "#0891b2"), c = step(2, "Present", "#db2777");
  const ar1 = makeShape("arrow", { x: 640, y: 540, w: 60, h: 40, stroke: "#e2e8f0", strokeWidth: 6 });
  const ar2 = makeShape("arrow", { x: 1200, y: 540, w: 60, h: 40, stroke: "#e2e8f0", strokeWidth: 6 });
  const h3 = makeText({ name: "Heading", text: "A workflow in three moves", x: 140, y: 170, w: 1500, h: 130, fontSize: 80, fontWeight: 700, align: "left" });
  const star = makeShape("star", { name: "Star", x: 1660, y: 150, w: 140, h: 140, fill: "#facc15" });
  const s3 = makeSlide({
    name: "Workflow", section: "Process",
    background: { type: "gradient", color: "#111827", color2: "#0c4a6e", angle: 160, image: "", imageFit: "cover" },
    elements: [h3, a, ar1, b, ar2, c, star], notes: "Each step pops in on click.",
    animations: [
      makeAnimation(a.id, "entrance", "zoomIn"), makeAnimation(b.id, "entrance", "zoomIn"),
      makeAnimation(c.id, "entrance", "zoomIn"), makeAnimation(star.id, "emphasis", "spin", { trigger: "withPrevious", delay: 300 }),
    ],
  });
  s3.transition = { type: "cube", duration: 900, easing: "cubic-bezier(.65,0,.35,1)", direction: "left" };

  // Slide 4 — chart
  const h4 = makeText({ name: "Heading", text: "Momentum, measured", x: 140, y: 120, w: 1200, h: 120, fontSize: 76, fontWeight: 700 });
  const chart = makeChart("bar", { x: 140, y: 280, w: 1000, h: 680, title: "Sample data — replace with yours" });
  const note = makeText({ name: "Callout", text: "Every milestone tells a story.\nMake yours count.", x: 1240, y: 400, w: 540, h: 300, fontSize: 34, fill: "#1e293b", radius: 24, padding: 36, fontFamily: "IBM Plex Sans", fontWeight: 400, color: "#e2e8f0", vAlign: "middle" });
  const s4 = makeSlide({ name: "Chart", background: { type: "solid", color: "#0b1020", color2: "#000", angle: 0, image: "", imageFit: "cover" }, elements: [h4, chart, note], notes: "Figures are placeholders.", animations: [makeAnimation(chart.id, "entrance", "rise", { trigger: "withPrevious" })] });
  s4.transition = { type: "zoom", duration: 700, easing: "cubic-bezier(.4,0,.2,1)", direction: "left" };

  // Slide 5 — closing with image background
  const h5 = makeText({ name: "Closing", text: "Your turn.", x: 0, y: 380, w: 1920, h: 200, fontSize: 160, fontWeight: 700, align: "center", fontFamily: "Playfair Display" });
  const sub5 = makeText({ name: "Hint", text: "The next great story starts here.", x: 260, y: 620, w: 1400, h: 80, fontSize: 34, align: "center", color: "#e5e7eb", fontFamily: "IBM Plex Sans", fontWeight: 400 });
  const s5 = makeSlide({ name: "Closing", section: "Wrap-up", background: { type: "image", color: "#000", color2: "#000", angle: 0, image: IMG2, imageFit: "cover" }, elements: [h5, sub5], animations: [makeAnimation(h5.id, "emphasis", "pulse", { trigger: "withPrevious", delay: 400 })], notes: "Thank the audience." });
  s5.transition = { type: "curtain", duration: 900, easing: "cubic-bezier(.65,0,.35,1)", direction: "left" };

  return makeDeck("PrismDeck Demo", [s1, s2, s3, s4, s5]);
}