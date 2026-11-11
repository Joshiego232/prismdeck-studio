import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { makeShape, uid } from "@/lib/prism/factory";
import type { ShapeEl, ShapeKind } from "@/lib/prism/types";
import { ChevronDown, Search, Sparkles, X } from "lucide-react";

type Category = "Nature" | "Space" | "Buildings" | "Landscapes" | "Objects";
type Part = { shape: ShapeKind; x: number; y: number; w: number; h: number; fill: string; stroke?: string; strokeWidth?: number; rotation?: number; radius?: number; gradient?: string[]; depth?: boolean; name?: string };
type Preset = { id: string; name: string; category: Category; description: string; parts: Part[] };
const q = (shape: ShapeKind, x: number, y: number, w: number, h: number, fill: string, extra: Partial<Part> = {}): Part => ({ shape, x, y, w, h, fill, ...extra });

const PRESETS: Preset[] = [
  { id: "pine-tree", name: "Evergreen tree", category: "Nature", description: "Layered conifer with trunk, tiered foliage and highlights.", parts: [
    q("rect",365,420,70,150,"#8b542e"), q("triangle",205,250,390,300,"#176b45",{gradient:["#38b96b","#0d573c"],depth:true}), q("triangle",245,155,310,280,"#218653",{gradient:["#48c982","#146642"]}), q("triangle",285,65,230,250,"#2eaa68",{gradient:["#67dc91","#218653"]}),
    q("triangle",330,80,130,170,"#48c982"), q("star",374,30,52,52,"#ffd76a"), q("ellipse",315,500,24,13,"#a7e6a5"), q("ellipse",445,390,22,12,"#a7e6a5"),
  ]},
  { id: "oak-tree", name: "Oak tree", category: "Nature", description: "Rounded canopy built from overlapping foliage shapes.", parts: [
    q("rect",365,365,70,205,"#85502d"), q("rect",345,450,110,30,"#9a6238"), q("ellipse",180,170,245,260,"#1b784c"), q("ellipse",350,100,270,285,"#26975a"), q("ellipse",450,205,210,230,"#2eaa63"), q("ellipse",270,80,235,230,"#38b96b"), q("ellipse",300,205,210,220,"#258653"), q("ellipse",225,230,80,60,"#58cf7d"), q("ellipse",490,160,80,65,"#5bd184"),
  ]},
  { id: "palm-tree", name: "Tropical palm", category: "Nature", description: "Curved trunk with sweeping tropical fronds and coconuts.", parts: [
    q("parallelogram",365,255,85,315,"#a96b3e",{rotation:-8}), q("ellipse",350,205,110,75,"#8b552e"), q("triangle",175,95,300,180,"#168c62",{rotation:-18}), q("triangle",330,65,260,160,"#21a875",{rotation:8}), q("triangle",440,120,235,145,"#0d7954",{rotation:28}), q("triangle",200,175,260,120,"#28b879",{rotation:18}), q("triangle",385,170,250,120,"#37c98a",{rotation:-22}), q("ellipse",380,225,32,36,"#7b4a2a"), q("ellipse",415,235,30,34,"#986034"),
  ]},
  { id: "flower", name: "Colourful flower", category: "Nature", description: "Bright layered petals, centre, stem and leaves.", parts: [
    q("rect",389,280,22,280,"#25834a"), q("ellipse",300,390,130,55,"#42b96c",{rotation:-25}), q("ellipse",390,425,125,55,"#2b9b59",{rotation:22}), q("ellipse",330,75,140,160,"#ff5e8a"), q("ellipse",425,145,140,160,"#ff9b45"), q("ellipse",330,210,140,160,"#ffd34f"), q("ellipse",235,145,140,160,"#9b7bff"), q("ellipse",390,145,140,160,"#ff75bd"), q("ellipse",350,155,100,100,"#8b4b25"), q("ellipse",375,180,45,45,"#ffd76a"),
  ]},
  { id: "leaf-cluster", name: "Foliage cluster", category: "Nature", description: "A decorative arrangement of layered leaves and stems.", parts: [
    q("line",180,330,450,20,"#7b5532",{rotation:-15,strokeWidth:14}), q("ellipse",175,170,190,90,"#269b58",{rotation:-35}), q("ellipse",270,95,180,90,"#3cba6b",{rotation:-58}), q("ellipse",375,125,190,90,"#168454",{rotation:35}), q("ellipse",460,235,190,90,"#4acb78",{rotation:20}), q("ellipse",280,270,190,90,"#218f50",{rotation:18}), q("ellipse",105,270,180,90,"#63d27d",{rotation:-12}), q("line",200,220,100,8,"#a7e5a4",{rotation:-35}), q("line",490,180,100,8,"#a7e5a4",{rotation:25}),
  ]},
  { id: "bush", name: "Garden shrub", category: "Nature", description: "Full layered shrub with berry and leaf accents.", parts: [
    q("ellipse",130,300,540,245,"#176b43"), q("ellipse",210,210,250,245,"#238c50"), q("ellipse",365,185,250,250,"#2da65d"), q("ellipse",270,140,240,240,"#38b96b"), q("ellipse",185,335,65,55,"#69d986"), q("ellipse",500,290,60,55,"#69d986"), q("ellipse",365,270,24,24,"#f15c78"), q("ellipse",430,340,24,24,"#f15c78"), q("ellipse",290,365,22,22,"#f15c78"),
  ]},
  { id: "earth", name: "Planet Earth", category: "Space", description: "Blue planet with layered continents, atmosphere and clouds.", parts: [
    q("ellipse",125,65,550,470,"#287bd8",{stroke:"#8bdcff",strokeWidth:12,gradient:["#6ed4ff","#1250b6"],depth:true}), q("ellipse",235,145,165,105,"#42b66c",{rotation:-25}), q("ellipse",430,265,150,120,"#23975b",{rotation:22}), q("ellipse",330,360,110,75,"#4ac878"), q("ellipse",220,95,90,38,"#dff7ff",{rotation:-20}), q("ellipse",510,150,115,42,"#dff7ff",{rotation:20}), q("ellipse",160,330,100,35,"#dff7ff",{rotation:12}),
  ]},
  { id: "saturn", name: "Saturn", category: "Space", description: "Golden gas giant with a tilted multicolour ring system.", parts: [
    q("ellipse",80,210,640,190,"#d9a45d",{rotation:-14}), q("ellipse",115,225,570,150,"#f0c77d",{rotation:-14}), q("ellipse",220,95,360,360,"#d99b4e",{stroke:"#ffe0a1",strokeWidth:10,gradient:["#ffe2a0","#b56a36"],depth:true}), q("ellipse",265,145,270,270,"#f1bd70"), q("ellipse",280,185,240,34,"#c47d45",{rotation:10}), q("ellipse",295,275,220,28,"#f7d49a",{rotation:-8}), q("ellipse",310,335,180,24,"#bd7844",{rotation:8}),
  ]},
  { id: "mars", name: "Mars", category: "Space", description: "Rust-red planet with crater details and atmospheric glow.", parts: [
    q("ellipse",170,75,460,460,"#c85b3d",{stroke:"#f29a69",strokeWidth:12,gradient:["#f08b62","#8e302c"],depth:true}), q("ellipse",260,160,105,65,"#9f402f",{rotation:-20}), q("ellipse",445,260,90,75,"#a84732"), q("ellipse",300,365,70,52,"#e17a4f"), q("ellipse",390,120,125,35,"#f18b62",{rotation:18}), q("ellipse",225,275,50,35,"#f18b62"),
  ]},
  { id: "solar-system", name: "Solar system", category: "Space", description: "Sun and orbiting planets in a compact educational layout.", parts: [
    q("ellipse",45,205,190,190,"#ffbd3f",{stroke:"#ffe59a",strokeWidth:10,gradient:["#fff08b","#f18a24"],depth:true}), q("ellipse",245,110,310,310,"transparent",{stroke:"#65758f",strokeWidth:5}), q("ellipse",280,150,230,230,"transparent",{stroke:"#65758f",strokeWidth:4}), q("ellipse",315,185,160,160,"transparent",{stroke:"#65758f",strokeWidth:3}), q("ellipse",350,220,90,90,"transparent",{stroke:"#65758f",strokeWidth:3}), q("ellipse",275,265,48,48,"#a9b5c7"), q("ellipse",465,155,75,75,"#4f9fe8"), q("ellipse",505,340,90,90,"#d98c54"), q("ellipse",350,80,35,35,"#d6dce6"), q("ellipse",595,235,55,55,"#dfb76b"),
  ]},
  { id: "star-cluster", name: "Star constellation", category: "Space", description: "Connected stars with luminous points and orbit accents.", parts: [
    q("line",135,410,520,12,"#7ca6e8",{rotation:-30,strokeWidth:5}), q("line",260,170,330,12,"#7ca6e8",{rotation:25,strokeWidth:5}), q("line",480,320,220,12,"#7ca6e8",{rotation:-22,strokeWidth:5}), q("star",95,335,95,95,"#ffe17a"), q("star",245,95,115,115,"#fff3b0"), q("star",485,185,95,95,"#8bd8ff"), q("star",600,325,75,75,"#ffd36b"), q("star",325,370,70,70,"#c6a5ff"), q("star",520,440,45,45,"#fff3b0"),
  ]},
  { id: "crescent-moon", name: "Crescent moon", category: "Space", description: "Layered crescent with stars and subtle crater details.", parts: [
    q("ellipse",210,75,390,430,"#f5d98a"), q("ellipse",335,35,370,420,"#111a35"), q("star",105,120,65,65,"#ffe38a"), q("star",590,105,55,55,"#ffe38a"), q("star",620,390,42,42,"#b8d9ff"), q("ellipse",270,300,40,28,"#dfbd70"), q("ellipse",310,190,28,20,"#dfbd70"),
  ]},
  { id: "house", name: "Family house", category: "Buildings", description: "Colourful home with roof, windows, door and landscaping.", parts: [
    q("rect",185,260,430,300,"#f1c27b"), q("triangle",145,105,510,300,"#c94d45"), q("rect",360,390,100,170,"#75452f"), q("ellipse",435,460,12,12,"#f5d76e"), q("rect",230,325,100,105,"#75c9ed",{stroke:"#fff5d8",strokeWidth:10}), q("rect",470,325,100,105,"#75c9ed",{stroke:"#fff5d8",strokeWidth:10}), q("rect",275,475,42,85,"#a96b3e"), q("rect",510,475,42,85,"#a96b3e"), q("rect",150,555,510,18,"#5e9d4e"),
  ]},
  { id: "skyscraper", name: "Glass skyscraper", category: "Buildings", description: "Modern high-rise with glass panels, floors and rooftop detail.", parts: [
    q("rect",245,80,300,490,"#315b83",{stroke:"#8ed5f2",strokeWidth:10,gradient:["#5c9fc2","#203e68"],depth:true}), q("triangle",245,30,300,110,"#274664"), q("rect",275,115,52,410,"#75c9e9"), q("rect",345,115,52,410,"#4d9fc8"), q("rect",415,115,52,410,"#8ed9ee"), q("rect",485,115,35,410,"#4d9fc8"), q("line",245,235,300,10,"#c8edff",{strokeWidth:8}), q("line",245,365,300,10,"#c8edff",{strokeWidth:8}), q("rect",220,560,350,18,"#61748b"),
  ]},
  { id: "city-skyline", name: "City skyline", category: "Buildings", description: "Multi-building skyline with varied silhouettes and glowing windows.", parts: [
    q("rect",35,285,145,285,"#456b91"), q("rect",190,180,155,390,"#315579"), q("rect",360,245,130,325,"#527da5"), q("rect",505,110,145,460,"#294866"), q("triangle",505,35,145,120,"#3f6b91"), q("rect",75,330,28,35,"#ffd56b"), q("rect",125,330,28,35,"#ffd56b"), q("rect",225,235,32,38,"#8fe0f0"), q("rect",280,235,32,38,"#8fe0f0"), q("rect",225,315,32,38,"#ffd56b"), q("rect",390,300,28,35,"#ffd56b"), q("rect",445,300,28,35,"#8fe0f0"), q("rect",540,185,30,38,"#ffd56b"), q("rect",590,185,30,38,"#8fe0f0"), q("rect",540,270,30,38,"#8fe0f0"), q("rect",590,270,30,38,"#ffd56b"), q("rect",0,570,720,20,"#263f57"),
  ]},
  { id: "office-building", name: "Office building", category: "Buildings", description: "Contemporary office block with a glass facade and entrance.", parts: [
    q("rect",165,125,470,435,"#607f9b"), q("rect",195,160,410,350,"#a7d9eb"), q("rect",195,160,410,42,"#47799d"), q("rect",195,285,410,18,"#47799d"), q("rect",195,405,410,18,"#47799d"), q("rect",270,205,18,300,"#47799d"), q("rect",390,205,18,300,"#47799d"), q("rect",510,205,18,300,"#47799d"), q("rect",345,455,110,105,"#31506b"), q("rect",140,560,520,20,"#526a80"),
  ]},
  { id: "mountain-scene", name: "Mountain landscape", category: "Landscapes", description: "Layered peaks, snow caps, sun and foreground hills.", parts: [
    q("ellipse",530,65,125,125,"#ffd16b"), q("triangle",65,165,430,400,"#466e8d"), q("triangle",310,95,420,470,"#315675"), q("triangle",180,225,300,300,"#7194a8"), q("triangle",330,95,160,180,"#e8f4f4"), q("triangle",465,175,145,160,"#e8f4f4"), q("ellipse",0,465,470,150,"#347c65"), q("ellipse",330,455,520,160,"#286c58"),
  ]},
  { id: "rainbow", name: "Rainbow & clouds", category: "Landscapes", description: "Bright rainbow arcs framed by soft layered clouds.", parts: [
    q("ellipse",150,70,500,500,"#ed5a58"), q("ellipse",190,110,420,420,"#ffad4f"), q("ellipse",230,150,340,340,"#ffe16b"), q("ellipse",270,190,260,260,"#55c985"), q("ellipse",310,230,180,180,"#4e9ee8"), q("ellipse",350,270,100,100,"#9879dc"), q("rect",120,330,560,250,"#111a35"), q("ellipse",65,340,260,150,"#eaf4ff"), q("ellipse",475,340,260,150,"#eaf4ff"), q("ellipse",160,290,180,145,"#f7fbff"), q("ellipse",465,290,180,145,"#f7fbff"),
  ]},
  { id: "wind-turbine", name: "Wind turbine", category: "Objects", description: "Clean-energy turbine with three blades and a detailed tower.", parts: [
    q("rect",385,260,30,315,"#dce8f1"), q("ellipse",360,235,80,80,"#8cb4d1"), q("triangle",385,45,30,230,"#f4f7fb",{rotation:0}), q("triangle",210,270,210,35,"#f4f7fb",{rotation:-20}), q("triangle",410,260,205,35,"#f4f7fb",{rotation:145}), q("ellipse",382,257,36,36,"#ffd36b"), q("rect",270,575,260,15,"#7193a8"),
  ]},
  { id: "rocket", name: "Launch rocket", category: "Objects", description: "Detailed rocket with porthole, fins, flame and highlights.", parts: [
    q("roundRect",300,130,200,340,"#e8edf5",{radius:95,stroke:"#91a8c4",strokeWidth:8,gradient:["#ffffff","#a9c1d8"],depth:true}), q("triangle",300,30,200,180,"#e85c58"), q("triangle",230,360,110,150,"#e85c58"), q("triangle",460,360,110,150,"#e85c58"), q("ellipse",355,235,90,90,"#4aa5d6",{stroke:"#d7f3ff",strokeWidth:12}), q("rect",380,360,40,65,"#b9c8d8"), q("triangle",335,455,130,145,"#ff9c39"), q("triangle",365,480,70,100,"#ffe16b"), q("line",330,190,90,8,"#ffffff",{strokeWidth:8}),
  ]},
];

export const SHAPE_PRESET_CATEGORIES = ["All", "Nature", "Space", "Buildings", "Landscapes", "Objects"] as const;
export const SHAPE_PRESET_IDS = PRESETS.map(preset => preset.id);
export type ShapePresetCategory = typeof SHAPE_PRESET_CATEGORIES[number];
export function createShapePresetElements(id: string, slideWidth: number, slideHeight: number): ShapeEl[] {
  const preset = PRESETS.find(item => item.id === id);
  if (!preset) return [];
  const scale = Math.min(1, (slideWidth * 0.72) / 720, (slideHeight * 0.72) / 600);
  const groupId = uid("g_");
  const left = (slideWidth - 720 * scale) / 2;
  const top = (slideHeight - 600 * scale) / 2;
  return preset.parts.map((part, index) => {
    const element = makeShape(part.shape, {
      name: part.name ?? `${preset.name} · ${index + 1}`,
      x: left + part.x * scale, y: top + part.y * scale,
      w: Math.max(8, part.w * scale), h: Math.max(8, part.h * scale),
      fill: part.fill, fill2: part.gradient?.[part.gradient.length - 1] ?? part.fill,
      gradient: !!part.gradient, gradientColors: part.gradient ?? [part.fill, part.fill],
      gradientAngle: 135, gradientType: "linear",
      shadow: part.depth ? { on: true, x: 0, y: 7 * scale, blur: 16 * scale, color: "rgba(0,0,0,0.22)" } : { on: false, x: 0, y: 0, blur: 0, color: "rgba(0,0,0,0)" },
      stroke: part.stroke ?? (part.shape === "line" || part.shape === "arrow" ? part.fill : "transparent"), strokeWidth: (part.strokeWidth ?? (part.shape === "line" || part.shape === "arrow" ? 8 : 0)) * scale,
      rotation: part.rotation ?? 0, radius: (part.radius ?? 0) * scale,
      groupId,
    });
    return element;
  });
}

function Preview({ preset }: { preset: Preset }) {
  const polygons: Partial<Record<ShapeKind, string>> = {
    triangle: "50,0 100,100 0,100", rightTriangle: "0,0 100,100 0,100",
    star: "50,0 61,35 98,35 68,57 79,95 50,72 21,95 32,57 2,35 39,35",
    diamond: "50,0 100,50 50,100 0,50", pentagon: "50,0 100,38 82,100 18,100 0,38",
    hexagon: "25,0 75,0 100,50 75,100 25,100 0,50", trapezoid: "18,0 82,0 100,100 0,100",
    parallelogram: "20,0 100,0 80,100 0,100",
  };
  return <svg viewBox="0 0 720 600" className="shape-preset-art" aria-hidden="true">
    {preset.parts.map((part, index) => {
      const common = { fill: part.fill, stroke: part.stroke ?? "none", strokeWidth: part.strokeWidth ?? 0, opacity: 0.98 };
      const transform = `rotate(${part.rotation ?? 0} ${part.x + part.w / 2} ${part.y + part.h / 2})`;
      if (part.shape === "line" || part.shape === "arrow") return <line key={index} x1={part.x} y1={part.y + part.h / 2} x2={part.x + part.w} y2={part.y + part.h / 2} stroke={part.fill} strokeWidth={Math.max(4, part.strokeWidth ?? 5)} transform={transform} />;
      if (part.shape === "ellipse") return <ellipse key={index} cx={part.x + part.w / 2} cy={part.y + part.h / 2} rx={part.w / 2} ry={part.h / 2} {...common} transform={transform} />;
      const points = polygons[part.shape];
      if (points) return <polygon key={index} points={points.split(" ").map(point => { const [x,y] = point.split(",").map(Number); return `${part.x + (x ?? 0) * part.w / 100},${part.y + (y ?? 0) * part.h / 100}`; }).join(" ")} {...common} transform={transform} />;
      return <rect key={index} x={part.x} y={part.y} width={part.w} height={part.h} rx={part.shape === "roundRect" ? Math.min(part.h / 2, 40) : 0} {...common} transform={transform} />;
    })}
  </svg>;
}

export function ShapePresetGallery({ onInsert }: { onInsert: (id: string) => void }) {
  const anchor = useRef<HTMLDivElement>(null), menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [category, setCategory] = useState<ShapePresetCategory>("All"), [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 12 });
  const filtered = useMemo(() => PRESETS.filter(preset => (category === "All" || preset.category === category) && `${preset.name} ${preset.description} ${preset.category}`.toLowerCase().includes(search.toLowerCase().trim())), [category, search]);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { const target = event.target as Node; if (!anchor.current?.contains(target) && !menu.current?.contains(target)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [open]);
  const toggle = () => {
    if (!open) { const rect = anchor.current?.getBoundingClientRect(); if (rect) setPosition({ top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 620)), left: Math.max(12, Math.min(rect.left, window.innerWidth - 690)) }); }
    setOpen(value => !value);
  };
  return <>
    <div ref={anchor} className="shape-picker-anchor">
      <Button type="button" variant="ghost" className="shape-picker-trigger shape-preset-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        <Sparkles size={17} /><span>Illustrations</span><ChevronDown size={13} />
      </Button>
    </div>
    {open && typeof document !== "undefined" && createPortal(
      <section ref={menu} className="shape-preset-gallery" role="dialog" aria-label="Illustration and shape presets" style={{ top: position.top, left: position.left }}>
        <header className="shape-preset-header"><div><strong>Illustrations & shape presets</strong><small>{filtered.length} editable designs · grouped shape layers</small></div><Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close presets"><X size={17} /></Button></header>
        <div className="shape-preset-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search trees, planets, buildings…" aria-label="Search illustrations" /></div>
        <nav className="shape-preset-categories" aria-label="Preset categories">{SHAPE_PRESET_CATEGORIES.map(item => <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</nav>
        <div className="shape-preset-grid">{filtered.map(preset => <button key={preset.id} type="button" className="shape-preset-card" onClick={() => { onInsert(preset.id); setOpen(false); }}>
          <span className="shape-preset-preview"><Preview preset={preset} /></span><span className="shape-preset-card-title">{preset.name}</span><span className="shape-preset-card-meta">{preset.category} · {preset.parts.length} layers</span>
        </button>)}</div>
        {!filtered.length && <p className="shape-preset-empty">No presets match that search. Try another name or category.</p>}
        <footer className="shape-preset-footer">Select an illustration to add it to the centre of your slide. Ungroup it to edit each layer.</footer>
      </section>, document.body
    )}
  </>;
}
