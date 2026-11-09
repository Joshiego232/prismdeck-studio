// Local binary asset store (IndexedDB). Elements reference assets as "asset:<id>".
import { useEffect, useState } from "react";
import { uid } from "./factory";

export interface AssetMeta { id: string; name: string; mime: string; size: number; kind: "image" | "video" | "audio" | "font"; addedAt: number }

const DB = "prismdeck"; const STORE = "assets"; const META = "assetMeta";
let dbp: Promise<IDBDatabase> | null = null;

export const idbAvailable = () => typeof indexedDB !== "undefined";

function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(STORE); r.result.createObjectStore(META); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}
function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then((d) => new Promise<T>((res, rej) => {
    const r = fn(d.transaction(store, mode).objectStore(store));
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
}

const urlCache = new Map<string, string>();

export async function putAsset(blob: Blob, name: string, kind: AssetMeta["kind"], id = uid("m_")): Promise<AssetMeta> {
  const meta: AssetMeta = { id, name, mime: blob.type, size: blob.size, kind, addedAt: Date.now() };
  await tx(STORE, "readwrite", (s) => s.put(blob, id));
  await tx(META, "readwrite", (s) => s.put(meta, id));
  window.dispatchEvent(new CustomEvent("prism-assets-changed"));
  return meta;
}
export const getAssetBlob = (id: string) => tx<Blob | undefined>(STORE, "readonly", (s) => s.get(id));
export const listAssets = () => tx<AssetMeta[]>(META, "readonly", (s) => s.getAll());
export async function deleteAsset(id: string) {
  await tx(STORE, "readwrite", (s) => s.delete(id));
  await tx(META, "readwrite", (s) => s.delete(id));
  window.dispatchEvent(new CustomEvent("prism-assets-changed"));
}

export async function resolveSrc(src: string): Promise<string> {
  if (!src.startsWith("asset:")) return src;
  const id = src.slice(6);
  const hit = urlCache.get(id); if (hit) return hit;
  const blob = await getAssetBlob(id).catch(() => undefined);
  if (!blob) return "";
  const u = URL.createObjectURL(blob); urlCache.set(id, u); return u;
}

/** React hook: resolves asset: references to object URLs. */
export function useResolvedSrc(src: string): string {
  const [u, setU] = useState(() => (src.startsWith("asset:") ? urlCache.get(src.slice(6)) ?? "" : src));
  useEffect(() => {
    let live = true;
    resolveSrc(src).then((r) => live && setU(r));
    return () => { live = false; };
  }, [src]);
  return u;
}

export const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(b);
});
export async function dataUrlToBlob(d: string) { return (await fetch(d)).blob(); }

export function useAssets() {
  const [list, setList] = useState<AssetMeta[]>([]);
  useEffect(() => {
    const load = () => listAssets().then((l) => setList(l.sort((a, b) => b.addedAt - a.addedAt))).catch(() => setList([]));
    load(); window.addEventListener("prism-assets-changed", load);
    return () => window.removeEventListener("prism-assets-changed", load);
  }, []);
  return list;
}