import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { Deck, Slide, SlideElement, TextEl } from "@/lib/prism/types";
import { useDeck } from "@/lib/prism/store";
import { fontStack, loadWebFont } from "@/lib/prism/fonts";
import { useResolvedSrc } from "@/lib/prism/assets";
import { animFrames, buildSteps, prefersReducedMotion, transitionFrames } from "@/lib/prism/effects";

function ElementContent({ el, presenting }: { el: SlideElement; presenting: boolean }) {
  const src = useResolvedSrc("src" in el ? el.src : "");
  useEffect(() => { if ("fontFamily" in el) loadWebFont(el.fontFamily); }, [el]);
  if (el.type === "text") return <TextContent el={el} presenting={presenting} />;
  if (el.type === "image") return <img draggable={false} src={src} alt={el.alt} className="h-full w-full" style={{ objectFit: el.fit, borderRadius: el.radius, filter: `brightness(${1 + el.adjust.brightness / 100}) contrast(${1 + el.adjust.contrast / 100}) saturate(${1 + el.adjust.saturation / 100})`, transform: `scale(${el.flipX ? -1 : 1},${el.flipY ? -1 : 1})` }} />;
  if (el.type === "video") return <video src={src} poster={el.poster} controls={presenting} autoPlay={presenting && el.autoplay} muted={el.muted} loop={el.loop} className="h-full w-full" style={{ objectFit: el.fit }} />;
  if (el.type === "audio") return <audio src={src} controls autoPlay={presenting && el.autoplay} loop={el.loop} />;
  if (el.type === "chart") {
    const max = Math.max(1, ...el.data.map(d => d.value));
    return <div style={{ color: el.textColor }} className="flex h-full flex-col gap-8 p-8"><h3 className="slide-body">{el.title}</h3><div className="flex flex-1 items-end gap-8 border-b border-current">{el.data.map((d, i) => <div key={i} className="flex h-full flex-1 flex-col justify-end gap-4 text-center"><span className="slide-body">{d.value}</span><div style={{ background: el.color, height: `${Math.max(2, d.value / max * 75)}%` }} /><span className="slide-caption pb-4">{d.label}</span></div>)}</div></div>;
  }
  const fill = el.gradient ? `linear-gradient(${el.gradientAngle}deg, ${el.fill}, ${el.fill2})` : el.fill;
  if (el.shape === "line" || el.shape === "arrow") return <svg viewBox={`0 0 ${el.w} ${el.h}`} className="h-full w-full"><line x1="0" y1={el.h / 2} x2={el.w - 15} y2={el.h / 2} stroke={el.stroke} strokeWidth={el.strokeWidth} />{el.shape === "arrow" && <path d={`M ${el.w - 30} 0 L ${el.w} ${el.h / 2} L ${el.w - 30} ${el.h}`} stroke={el.stroke} strokeWidth={el.strokeWidth} fill="none" />}</svg>;
  const clip: Record<string, string> = { triangle: "polygon(50% 0,100% 100%,0 100%)", diamond: "polygon(50% 0,100% 50%,50% 100%,0 50%)", star: "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 95%,50% 72%,21% 95%,32% 57%,2% 35%,39% 35%)", chevron: "polygon(0 0,75% 0,100% 50%,75% 100%,0 100%,25% 50%)" };
  return <div className="flex h-full w-full items-center justify-center" style={{ background: fill, color: el.textColor, fontSize: el.fontSize, fontFamily: fontStack(el.fontFamily), border: `${el.strokeWidth}px ${el.dash === "solid" ? "solid" : el.dash} ${el.stroke}`, borderRadius: el.shape === "ellipse" ? "50%" : el.radius, clipPath: clip[el.shape] }}>{el.text}</div>;
}

function TextContent({ el, presenting }: { el: TextEl; presenting: boolean }) {
  const editing = useDeck(s => s.editingTextId === el.id) && !presenting;
  const style: CSSProperties = { fontFamily: fontStack(el.fontFamily), fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, lineHeight: el.lineHeight, letterSpacing: el.letterSpacing, textAlign: el.align, fontStyle: el.italic ? "italic" : "normal", textDecoration: [el.underline ? "underline" : "", el.strike ? "line-through" : ""].join(" "), padding: el.padding, background: el.fill, borderRadius: el.radius, whiteSpace: "pre-wrap", overflowWrap: "break-word" };
  return <div className="flex h-full w-full flex-col" style={{ ...style, justifyContent: el.vAlign === "middle" ? "center" : el.vAlign === "bottom" ? "end" : "start" }}>
    {editing ? <textarea autoFocus aria-label="Edit slide text" className="h-full w-full resize-none border-none bg-transparent outline-none" defaultValue={el.text} onPointerDown={e => e.stopPropagation()} onBlur={e => { useDeck.getState().updateElements([el.id], { text: e.target.value }); useDeck.getState().setEditingText(null); }} onKeyDown={e => { e.stopPropagation(); if (e.key === "Escape") e.currentTarget.blur(); }} /> : el.text.split("\n").map((line, i) => <div key={i}>{el.list === "bullet" ? "•  " : el.list === "number" ? `${i + 1}.  ` : ""}{line || "\u00a0"}</div>)}
  </div>;
}

export function ScaledSlide({ slide, deck, editable = false, presenting = false, step = 0, previewKey = 0, showGrid = false }: { slide: Slide; deck: Pick<Deck, "width" | "height">; editable?: boolean; presenting?: boolean; step?: number; previewKey?: number; showGrid?: boolean }) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1);
  const selected = useDeck(s => s.selectedElementIds);
  const background = useResolvedSrc(slide.background.image);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setScale(Math.min(entry.contentRect.width / deck.width, entry.contentRect.height / deck.height)); });
    observer.observe(el); return () => observer.disconnect();
  }, [deck.width, deck.height]);
  useEffect(() => {
    if ((!presenting && !previewKey) || !scene.current || prefersReducedMotion()) return;
    const el = scene.current;
    const animations: globalThis.Animation[] = [];
    if (step === 0) animations.push(el.animate(transitionFrames(slide.transition).incoming, { duration: slide.transition.duration, easing: slide.transition.easing }));
    const steps = buildSteps(slide.animations);
    const visible = new Set(steps.slice(0, step + 1).flatMap(s => s.items.map(i => i.anim.elementId)));
    for (const a of slide.animations) {
      const node = el.querySelector<HTMLElement>(`[data-element-id="${a.elementId}"]`);
      if (node && a.kind === "entrance") node.style.visibility = visible.has(a.elementId) ? "visible" : "hidden";
    }
    for (const { anim, offset } of steps[step]?.items ?? []) {
      const node = el.querySelector<HTMLElement>(`[data-element-id="${anim.elementId}"]`);
      const object = slide.elements.find(e => e.id === anim.elementId);
      if (node) { node.style.visibility = "visible"; animations.push(node.animate(animFrames(anim, object?.rotation), { duration: anim.duration, delay: anim.delay + offset, easing: anim.easing, fill: "both" })); }
    }
    return () => { animations.forEach(a => a.cancel()); el.querySelectorAll<HTMLElement>("[data-element-id]").forEach(n => n.style.visibility = ""); };
  }, [slide.id, presenting, step, previewKey]);

  const manipulate = (event: PointerEvent, el: SlideElement, mode: "move" | "resize" | "rotate") => {
    if (!editable || el.locked || useDeck.getState().editingTextId) return;
    event.stopPropagation(); event.preventDefault();
    useDeck.getState().selectElements(event.shiftKey ? [...new Set([...selected, el.id])] : [el.id]);
    useDeck.getState().snapshot();
    const x = event.clientX, y = event.clientY;
    const targets = useDeck.getState().selectedElementIds;
    const originals = slide.elements.filter(e => targets.includes(e.id));
    const move = (ev: globalThis.PointerEvent) => {
      const dx = (ev.clientX - x) / scale, dy = (ev.clientY - y) / scale;
      useDeck.getState().mutate(d => {
        const s = d.slides.find(s => s.id === slide.id); if (!s) return;
        for (const original of originals) {
          const item = s.elements.find(e => e.id === original.id); if (!item || item.locked) continue;
          if (mode === "move") { item.x = Math.round(original.x + dx); item.y = Math.round(original.y + dy); }
          if (mode === "resize") { item.w = Math.max(40, original.w + dx); item.h = Math.max(40, original.h + dy); }
          if (mode === "rotate") item.rotation = Math.round(original.rotation + dx / 4);
        }
      }, { history: false });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up, { once: true });
  };
  return <div ref={host} className={`scaled-host ${editable ? "editable-host" : ""}`} onPointerDown={() => editable && useDeck.getState().selectElements([])}>
    <div className="slide-wrapper" style={{ width: deck.width, height: deck.height, marginLeft: -deck.width / 2, marginTop: -deck.height / 2, transform: `scale(${scale})` }}>
      <div ref={scene} className="slide-content h-full w-full" style={{ background: slide.background.type === "gradient" ? `linear-gradient(${slide.background.angle}deg,${slide.background.color},${slide.background.color2})` : slide.background.color }}>
        {slide.background.type === "image" && <img src={background} alt="" className="absolute inset-0 h-full w-full" style={{ objectFit: slide.background.imageFit }} />}
        {showGrid && <div className="stage-grid pointer-events-none absolute inset-0" style={{ backgroundSize: "40px 40px" }} />}
        {slide.elements.filter(e => !e.hidden).map(el => <div key={el.id} data-element-id={el.id} data-object-name={el.name} className={`slide-object ${editable ? "editable-object" : ""} ${editable && selected.includes(el.id) ? "object-selected" : ""}`} style={{ left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rotation}deg)`, opacity: el.opacity, filter: el.blur ? `blur(${el.blur}px)` : undefined, boxShadow: el.shadow.on ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}` : undefined }} onPointerDown={e => manipulate(e, el, "move")} onDoubleClick={e => { if (editable && el.type === "text") { e.stopPropagation(); useDeck.getState().setEditingText(el.id); } }}>
          <ElementContent el={el} presenting={presenting} />
          {editable && selected.includes(el.id) && <><span className="resize-handle" onPointerDown={e => manipulate(e, el, "resize")} /><span className="rotate-handle" onPointerDown={e => manipulate(e, el, "rotate")} /></>}
        </div>)}
      </div>
    </div>
  </div>;
}