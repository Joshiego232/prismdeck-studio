// PrismDeck native document model. Versioned so future migrations / cloud sync can evolve it.
export const DECK_SCHEMA_VERSION = 1;

export type ElementType = "text" | "shape" | "image" | "video" | "audio" | "chart";
export type MasterLayout = "title" | "title-content" | "section" | "minimal" | "two-column";
export interface SlideAction { kind: "next" | "previous" | "first" | "last" | "go-to"; targetSlideId?: string }
export type ShapeKind =
  | "rect" | "roundRect" | "ellipse" | "triangle" | "diamond" | "star"
  | "chevron" | "callout" | "line" | "arrow" | "pentagon" | "hexagon" | "octagon"
  | "trapezoid" | "parallelogram" | "rightTriangle" | "plus" | "cross" | "heart" | "cloud";

export type GradientType = "linear" | "radial" | "reverse-radial" | "conic" | "diamond";

export const SHAPE_KINDS: ShapeKind[] = [
  "rect", "roundRect", "ellipse", "triangle", "rightTriangle", "diamond", "pentagon",
  "hexagon", "octagon", "trapezoid", "parallelogram", "star", "chevron", "callout",
  "plus", "cross", "heart", "cloud", "line", "arrow",
];

export interface Effects {
  shadow: { on: boolean; x: number; y: number; blur: number; color: string };
  blur: number;
  glow: { on: boolean; size: number; color: string };
}

interface BaseEl extends Effects {
  id: string;
  type: ElementType;
  name: string;
  x: number; y: number; w: number; h: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
  hyperlink?: string;
  /** Last layout bounds, retained as optional alignment guides when enabled. */
  snapMemory?: { x: number; y: number; w: number; h: number };
  /** In-presentation navigation action attached to a clickable object. */
  slideAction?: SlideAction;
}

export interface TextProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: string;
  align: "left" | "center" | "right" | "justify";
  vAlign: "top" | "middle" | "bottom";
  lineHeight: number;
  letterSpacing: number;
  list: "none" | "bullet" | "number";
  padding: number;
}

export interface TextEl extends BaseEl, TextProps {
  type: "text";
  fill: string; // "transparent" allowed
  stroke: string;
  strokeWidth: number;
  radius: number;
}

export interface ShapeEl extends BaseEl {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  fill2: string;
  gradient: boolean;
  gradientAngle: number;
  gradientType?: GradientType;
  gradientColors?: string[];
  stroke: string;
  strokeWidth: number;
  dash: "solid" | "dashed" | "dotted";
  radius: number;
  text: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
}

export interface ImageAdjust {
  brightness: number; exposure: number; saturation: number; contrast: number;
  highlights: number; shadows: number; temperature: number; tint: number; sharpness: number;
}
export const DEFAULT_ADJUST: ImageAdjust = {
  brightness: 0, exposure: 0, saturation: 0, contrast: 0,
  highlights: 0, shadows: 0, temperature: 0, tint: 0, sharpness: 0,
};

export interface ImageEl extends BaseEl {
  type: "image";
  src: string; // https URL, data URL, or "asset:<id>"
  alt: string;
  fit: "cover" | "contain" | "fill";
  flipX: boolean; flipY: boolean;
  crop: { t: number; r: number; b: number; l: number }; // percent
  borderWidth: number; borderColor: string; radius: number;
  adjust: ImageAdjust;
}

export interface VideoEl extends BaseEl {
  type: "video";
  src: string;
  poster: string;
  loop: boolean; muted: boolean; volume: number;
  autoplay: boolean;
  trimStart: number; trimEnd: number; // seconds, 0 = none
  fit: "cover" | "contain" | "fill";
  radius: number;
}

export interface AudioEl extends BaseEl {
  type: "audio";
  src: string;
  label: string;
  loop: boolean; volume: number; autoplay: boolean;
}

export interface ChartEl extends BaseEl {
  type: "chart";
  chartType: "bar" | "column" | "horizontal" | "line" | "area" | "pie" | "donut";
  data: { label: string; value: number }[];
  color: string;
  textColor: string;
  title: string;
  showLegend?: boolean;
  showValues?: boolean;
  axisLabel?: string;
  dataSourceLabel?: string;
}

export type SlideElement = TextEl | ShapeEl | ImageEl | VideoEl | AudioEl | ChartEl;

export type AnimKind = "entrance" | "emphasis" | "exit";
export interface Animation {
  id: string;
  elementId: string;
  kind: AnimKind;
  effect: string;
  duration: number; // ms
  delay: number; // ms
  easing: string;
  direction: "left" | "right" | "up" | "down";
  trigger: "onClick" | "withPrevious" | "afterPrevious";
  repeatCount?: number;
  alternate?: boolean;
  motionPath?: Array<{ x: number; y: number }>;
}

export interface Transition {
  type: string;
  duration: number;
  easing: string;
  direction: "left" | "right" | "up" | "down";
}

export interface Background {
  type: "solid" | "gradient" | "image";
  color: string;
  color2: string;
  angle: number;
  gradientType?: GradientType;
  gradientColors?: string[];
  image: string;
  imageFit: "cover" | "contain";
}

export interface Slide {
  id: string;
  name: string;
  section?: string; // section divider label shown above this slide
  masterId?: string;
  hidden?: boolean;
  background: Background;
  transition: Transition;
  autoAdvance: number; // seconds, 0 = off
  notes: string;
  elements: SlideElement[];
  animations: Animation[];
}

export interface SlideMaster {
  id: string;
  name: string;
  layout: MasterLayout;
  backgroundColor: string;
  accentColor: string;
  titleColor: string;
  footerText: string;
  showAccentRule: boolean;
  showSlideNumber: boolean;
}

export interface Deck {
  schema: number;
  id: string;
  name: string;
  width: number;
  height: number;
  themeId?: string;
  masters?: SlideMaster[];
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
}