// Curated web-font catalogue (Google Fonts CDN), on-demand loading and local font registration.
import { getAssetBlob } from "./assets";

export type FontCategory = "sans" | "serif" | "display" | "mono" | "handwritten" | "custom" | "system";
export interface FontEntry { family: string; category: FontCategory; source: "google" | "custom" | "system" }

const G: Record<Exclude<FontCategory, "custom" | "system">, string[]> = {
  sans: ["IBM Plex Sans", "Manrope", "DM Sans", "Work Sans", "Rubik", "Nunito Sans", "Outfit", "Plus Jakarta Sans", "Figtree", "Sora", "Lexend", "Karla", "Barlow", "Mulish", "Archivo", "Red Hat Display"],
  serif: ["Playfair Display", "Lora", "Merriweather", "Libre Baskerville", "Cormorant Garamond", "EB Garamond", "Crimson Pro", "DM Serif Display", "Fraunces", "Source Serif 4", "Spectral"],
  display: ["Space Grotesk", "Bebas Neue", "Oswald", "Anton", "Archivo Black", "Syne", "Unbounded", "Righteous", "Bricolage Grotesque", "Big Shoulders Display"],
  mono: ["JetBrains Mono", "IBM Plex Mono", "Fira Code", "Space Mono", "DM Mono", "Source Code Pro"],
  handwritten: ["Caveat", "Pacifico", "Dancing Script", "Kalam", "Patrick Hand", "Shadows Into Light", "Satisfy"],
};

export const FONT_CATALOGUE: FontEntry[] = Object.entries(G).flatMap(([cat, fams]) =>
  fams.map((family) => ({ family, category: cat as FontCategory, source: "google" as const })));

const FALLBACK: Record<FontCategory, string> = {
  sans: "ui-sans-serif, system-ui, sans-serif", serif: "Georgia, 'Times New Roman', serif",
  display: "ui-sans-serif, system-ui, sans-serif", mono: "ui-monospace, Menlo, Consolas, monospace",
  handwritten: "cursive", custom: "system-ui, sans-serif", system: "system-ui, sans-serif",
};

export function fontStack(family: string): string {
  const e = FONT_CATALOGUE.find((f) => f.family === family);
  return `"${family}", ${FALLBACK[e?.category ?? "sans"]}`;
}

const loaded = new Set<string>(["IBM Plex Sans", "Space Grotesk", "JetBrains Mono"]);
export function loadWebFont(family: string) {
  if (typeof document === "undefined" || loaded.has(family)) return;
  if (!FONT_CATALOGUE.some((f) => f.family === family)) return; // system or custom
  loaded.add(family);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap`;
  document.head.appendChild(l);
}

export interface CustomFontMeta { family: string; assetId?: string; url?: string; format: string; addedAt: number }

export async function registerFontFromBuffer(family: string, buf: ArrayBuffer) {
  const face = new FontFace(family, buf);
  await face.load();
  document.fonts.add(face);
}

export async function registerCustomFont(meta: CustomFontMeta): Promise<void> {
  if (meta.assetId) {
    const blob = await getAssetBlob(meta.assetId);
    if (!blob) throw new Error("Font file missing from local storage");
    await registerFontFromBuffer(meta.family, await blob.arrayBuffer());
  } else if (meta.url) {
    if (/\.css(\?|$)|fonts\.googleapis\.com\/css/.test(meta.url)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = meta.url; document.head.appendChild(l);
      await document.fonts.load(`16px "${meta.family}"`);
    } else {
      const face = new FontFace(meta.family, `url(${JSON.stringify(meta.url)})`);
      await face.load(); document.fonts.add(face);
    }
  }
}

export const FONT_EXT = /\.(ttf|otf|woff2?)$/i;
export function familyFromFileName(n: string) {
  return n.replace(FONT_EXT, "").replace(/[-_]+(Regular|Bold|Italic|Medium|Light|VariableFont.*)$/i, "").replace(/[-_]/g, " ").trim();
}

/** Fonts referenced by deck elements; load them all. */
export function loadDeckFonts(families: Iterable<string>) { for (const f of families) loadWebFont(f); }