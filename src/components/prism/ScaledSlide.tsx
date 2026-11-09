import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { Deck, Slide, SlideElement, TextEl } from "@/lib/prism/types";
import { gradientCss } from "@/lib/prism/gradients";
import { isFeatureEnabled } from "@/lib/prism/featureFlags";
import { collectSnapTargets, findAxisSnap } from "@/lib/prism/snapGuides";
import { useDeck } from "@/lib/prism/store";
import { fontStack, loadWebFont } from "@/lib/prism/fonts";
import { useResolvedSrc } from "@/lib/prism/assets";
import { animFrames, buildSteps, prefersReducedMotion, transitionFrames } from "@/lib/prism/effects";

function ElementContent({ el, presenting, fillStyle }: { el: SlideElement; presenting: boolean; fillStyle?: CSSProperties }) {
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
  const colors = el.gradientColors?.length ? el.gradientColors : [el.fill, el.fill2];
  const fill = el.gradient ? gradientCss(el.gradientType, el.gradientAngle, colors) : el.fill;
  if (el.shape === "line" || el.shape === "arrow") return <svg viewBox={`0 0 ${el.w} ${el.h}`} className="h-full w-full"><line x1="0" y1={el.h / 2} x2={el.w - 15} y2={el.h / 2} stroke={el.stroke} strokeWidth={el.strokeWidth} />{el.shape === "arrow" && <path d={`M ${el.w - 30} 0 L ${el.w} ${el.h / 2} L ${el.w - 30} ${el.h}`} stroke={el.stroke} strokeWidth={el.strokeWidth} fill="none" />}</svg>;
  const clip: Record<string, string> = {
    triangle: "polygon(50% 0,100% 100%,0 100%)",
    rightTriangle: "polygon(0 0,100% 100%,0 100%)",
    diamond: "polygon(50% 0,100% 50%,50% 100%,0 50%)",
    star: "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 95%,50% 72%,21% 95%,32% 57%,2% 35%,39% 35%)",
    chevron: "polygon(0 0,75% 0,100% 50%,75% 100%,0 100%,25% 50%)",
    pentagon: "polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)",
    hexagon: "polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)",
    octagon: "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)",
    trapezoid: "polygon(18% 0,82% 0,100% 100%,0 100%)",
    parallelogram: "polygon(20% 0,100% 0,80% 100%,0 100%)",
    plus: "polygon(35% 0,65% 0,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0 65%,0 35%,35% 35%)",
    cross: "polygon(35% 0,65% 0,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0 65%,0 35%,35% 35%)",
    heart: "polygon(50% 92%,8% 52%,4% 30%,15% 12%,34% 8%,50% 27%,66% 8%,85% 12%,96% 30%,92% 52%)",
    cloud: "polygon(18% 75%,5% 65%,4% 48%,13% 34%,29% 31%,34% 14%,49% 5%,64% 11%,70% 27%,88% 25%,98% 42%,94% 60%,82% 69%,82% 82%,18% 82%)",
    callout: "polygon(0 0,100% 0,100% 76%,66% 76%,52% 100%,52% 76%,0 76%)",
  };
  return <div className="flex h-full w-full items-center justify-center" style={{ background: fill, color: el.textColor, fontSize: el.fontSize, fontFamily: fontStack(el.fontFamily), border: `${el.strokeWidth}px ${el.dash === "solid" ? "solid" : el.dash} ${el.stroke}`, borderRadius: el.shape === "ellipse" ? "50%" : el.radius, clipPath: clip[el.shape], ...fillStyle }}>{el.text}</div>;
}

function TextContent({ el, presenting }: { el: TextEl; presenting: boolean }) {
  const editing = useDeck(s => s.editingTextId === el.id) && !presenting;
  const style: CSSProperties = { fontFamily: fontStack(el.fontFamily), fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, lineHeight: el.lineHeight, letterSpacing: el.letterSpacing, textAlign: el.align, fontStyle: el.italic ? "italic" : "normal", textDecoration: [el.underline ? "underline" : "", el.strike ? "line-through" : ""].join(" "), padding: el.padding, background: el.fill, borderRadius: el.radius, whiteSpace: "pre-wrap", overflowWrap: "break-word" };
  return <div className="flex h-full w-full flex-col" style={{ ...style, justifyContent: el.vAlign === "middle" ? "center" : el.vAlign === "bottom" ? "end" : "start" }}>
    {editing ? <textarea autoFocus aria-label="Edit slide text" className="h-full w-full resize-none border-none bg-transparent outline-none" defaultValue={el.text} onPointerDown={e => e.stopPropagation()} onBlur={e => { useDeck.getState().updateElements([el.id], { text: e.target.value }); useDeck.getState().setEditingText(null); }} onKeyDown={e => { e.stopPropagation(); if (e.key === "Escape") e.currentTarget.blur(); }} /> : el.text.split("\n").map((line, i) => <div key={i}>{el.list === "bullet" ? "•  " : el.list === "number" ? `${i + 1}.  ` : ""}{line || "\u00a0"}</div>)}
  </div>;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export function ScaledSlide({ slide, deck, editable = false, presenting = false, step = 0, previewKey = 0, showGrid = false, morphFrom }: { slide: Slide; deck: Pick<Deck, "width" | "height">; editable?: boolean; presenting?: boolean; step?: number; previewKey?: number; showGrid?: boolean; morphFrom?: Slide }) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1);
  const selected = useDeck(s => s.selectedElementIds);
  const [snapGuides, setSnapGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const background = useResolvedSrc(slide.background.image);
  const morphSources = new Map<string, SlideElement>();
  const usedMorphIds = new Set<string>();
  if (morphFrom && slide.transition.type === "morph") {
    for (const next of slide.elements) {
      const previous = morphFrom.elements.find(old => !usedMorphIds.has(old.id) && old.id === next.id)
        ?? morphFrom.elements.find(old => !usedMorphIds.has(old.id) && old.type === next.type && old.name === next.name)
        ?? (() => {
          const candidates = morphFrom.elements.filter(old => !usedMorphIds.has(old.id) && old.type === next.type);
          return candidates.length === 1 ? candidates[0] : undefined;
        })();
      if (previous) { morphSources.set(next.id, previous); usedMorphIds.add(previous.id); }
    }
  }
  const morphGhosts = morphFrom && slide.transition.type === "morph"
    ? morphFrom.elements.filter(old => !usedMorphIds.has(old.id) && !old.hidden)
    : [];
  useEffect(() => {
    const el = host.current; if (!el) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setScale(Math.min(entry.contentRect.width / deck.width, entry.contentRect.height / deck.height)); });
    observer.observe(el); return () => observer.disconnect();
  }, [deck.width, deck.height]);
  useEffect(() => {
    if ((!presenting && !previewKey) || !scene.current || prefersReducedMotion()) return;
    const el = scene.current;
    const animations: globalThis.Animation[] = [];
    if (step === 0 && slide.transition.type === "morph" && morphFrom) {
      const duration = slide.transition.duration;
      for (const next of slide.elements) {
        const node = el.querySelector<HTMLElement>(`[data-element-id="${next.id}"]`);
        if (!node) continue;
        const previous = morphSources.get(next.id);
        if (previous) {
          const sx = Math.max(0.05, previous.w / Math.max(1, next.w));
          const sy = Math.max(0.05, previous.h / Math.max(1, next.h));
          node.style.transformOrigin = "top left";
          animations.push(node.animate([
            { transform: `translate(${previous.x - next.x}px, ${previous.y - next.y}px) rotate(${previous.rotation}deg) scale(${sx}, ${sy})`, opacity: previous.opacity },
            { transform: `rotate(${next.rotation}deg) scale(1, 1)`, opacity: next.opacity },
          ], { duration, easing: slide.transition.easing, fill: "both" }));
        } else {
          animations.push(node.animate([{ opacity: 0, transform: "scale(.92)" }, { opacity: next.opacity, transform: "scale(1)" }], { duration, easing: slide.transition.easing, fill: "both" }));
        }
      }
      for (const ghost of morphGhosts) {
        const node = el.querySelector<HTMLElement>(`[data-morph-ghost="${ghost.id}"]`);
        if (node) animations.push(node.animate([{ opacity: ghost.opacity }, { opacity: 0, transform: `rotate(${ghost.rotation}deg) scale(.92)` }], { duration, easing: slide.transition.easing, fill: "both" }));
      }
      if (slide.background.type === "solid" && morphFrom.background.type === "solid") {
        animations.push(el.animate([{ backgroundColor: morphFrom.background.color }, { backgroundColor: slide.background.color }], { duration, easing: slide.transition.easing }));
      }
    } else if (step === 0) {
      animations.push(el.animate(transitionFrames(slide.transition).incoming, { duration: slide.transition.duration, easing: slide.transition.easing }));
    }
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
  }, [slide.id, presenting, step, previewKey, morphFrom]);

  const manipulate = (event: PointerEvent, el: SlideElement, mode: "move" | "resize" | "rotate", handle: ResizeHandle = "se") => {
    const state = useDeck.getState();
    if (!editable || el.locked || state.editingTextId) return;
    event.stopPropagation();
    event.preventDefault();

    const groupIds = el.groupId
      ? slide.elements.filter(item => item.groupId === el.groupId).map(item => item.id)
      : [el.id];
    const targetIds = state.selectedElementIds.includes(el.id)
      ? [...new Set([...state.selectedElementIds, ...groupIds])]
      : event.shiftKey
        ? [...new Set([...state.selectedElementIds, ...groupIds])]
        : groupIds;
    state.selectElements(targetIds);
    state.snapshot();

    const startX = event.clientX, startY = event.clientY;
    const visibleHostWidth = host.current?.getBoundingClientRect().width ?? 0;
    const interactionScale = visibleHostWidth > 0 ? visibleHostWidth / deck.width : scale;
    const selectedIds = new Set(targetIds);
    const originals = slide.elements.filter(item => selectedIds.has(item.id));
    if (!originals.length) return;
    const groupLeft = Math.min(...originals.map(item => item.x));
    const groupTop = Math.min(...originals.map(item => item.y));
    const groupRight = Math.max(...originals.map(item => item.x + item.w));
    const groupBottom = Math.max(...originals.map(item => item.y + item.h));
    const groupWidth = Math.max(1, groupRight - groupLeft);
    const groupHeight = Math.max(1, groupBottom - groupTop);
    const peers = slide.elements.filter(item => !selectedIds.has(item.id) && !item.hidden);
    const rememberPreviousPosition = isFeatureEnabled("rememberedPositionSnapping");
    const snapTargets = collectSnapTargets(
      rememberPreviousPosition ? [...peers, ...originals] : peers,
      deck.width,
      deck.height,
      rememberPreviousPosition,
    );
    const xTargets = snapTargets.x;
    const yTargets = snapTargets.y;
    const threshold = 8 / Math.max(interactionScale, 0.1);

    const move = (ev: globalThis.PointerEvent) => {
      const rawDx = (ev.clientX - startX) / interactionScale;
      const rawDy = (ev.clientY - startY) / interactionScale;

      if (mode === "move") {
        const xSnap = findAxisSnap(
          [groupLeft + rawDx, groupLeft + rawDx + groupWidth / 2, groupRight + rawDx],
          xTargets,
          threshold,
        );
        const ySnap = findAxisSnap(
          [groupTop + rawDy, groupTop + rawDy + groupHeight / 2, groupBottom + rawDy],
          yTargets,
          threshold,
        );
        const dx = rawDx + (xSnap?.delta ?? 0);
        const dy = rawDy + (ySnap?.delta ?? 0);
        setSnapGuides({ x: xSnap?.guide ?? null, y: ySnap?.guide ?? null });
        useDeck.getState().mutate(d => {
          const current = d.slides.find(item => item.id === slide.id);
          if (!current) return;
          for (const original of originals) {
            const item = current.elements.find(candidate => candidate.id === original.id);
            if (!item || item.locked) continue;
            item.x = Math.round(original.x + dx);
            item.y = Math.round(original.y + dy);
          }
        }, { history: false });
        return;
      }

      if (mode === "rotate") {
        setSnapGuides({ x: null, y: null });
        useDeck.getState().mutate(d => {
          const current = d.slides.find(item => item.id === slide.id);
          if (!current) return;
          for (const original of originals) {
            const item = current.elements.find(candidate => candidate.id === original.id);
            if (item && !item.locked) item.rotation = Math.round(original.rotation + rawDx / 4);
          }
        }, { history: false });
        return;
      }

      const hasWest = handle.includes("w");
      const hasEast = handle.includes("e");
      const hasNorth = handle.includes("n");
      const hasSouth = handle.includes("s");
      let left = groupLeft + (hasWest ? rawDx : 0);
      let right = groupRight + (hasEast ? rawDx : 0);
      let top = groupTop + (hasNorth ? rawDy : 0);
      let bottom = groupBottom + (hasSouth ? rawDy : 0);

      // Snap the actively dragged edge (or the centre line for an opposite-axis side handle).
      const xAnchors = hasWest ? [left] : hasEast ? [right] : [(left + right) / 2];
      const yAnchors = hasNorth ? [top] : hasSouth ? [bottom] : [(top + bottom) / 2];
      const xSnap = findAxisSnap(xAnchors, xTargets, threshold);
      const ySnap = findAxisSnap(yAnchors, yTargets, threshold);
      if (xSnap) {
        if (hasWest) left += xSnap.delta;
        else if (hasEast) right += xSnap.delta;
        else { left += xSnap.delta; right += xSnap.delta; }
      }
      if (ySnap) {
        if (hasNorth) top += ySnap.delta;
        else if (hasSouth) bottom += ySnap.delta;
        else { top += ySnap.delta; bottom += ySnap.delta; }
      }

      if (ev.shiftKey) {
        // Shift locks the original aspect ratio. Side handles grow around the opposite centre line.
        const scaleX = Math.max(40 / groupWidth, (right - left) / groupWidth);
        const scaleY = Math.max(40 / groupHeight, (bottom - top) / groupHeight);
        if ((hasWest || hasEast) && (hasNorth || hasSouth)) {
          const uniform = Math.max(40 / groupWidth, 40 / groupHeight,
            Math.abs(scaleX - 1) >= Math.abs(scaleY - 1) ? scaleX : scaleY);
          if (hasWest) left = right - groupWidth * uniform;
          else right = left + groupWidth * uniform;
          if (hasNorth) top = bottom - groupHeight * uniform;
          else bottom = top + groupHeight * uniform;
        } else if (hasWest || hasEast) {
          const uniform = scaleX;
          const height = groupHeight * uniform;
          const centreY = groupTop + groupHeight / 2;
          top = centreY - height / 2;
          bottom = centreY + height / 2;
        } else if (hasNorth || hasSouth) {
          const uniform = scaleY;
          const width = groupWidth * uniform;
          const centreX = groupLeft + groupWidth / 2;
          left = centreX - width / 2;
          right = centreX + width / 2;
        }
      }

      if (right - left < 40) {
        if (hasWest) left = right - 40;
        else right = left + 40;
      }
      if (bottom - top < 40) {
        if (hasNorth) top = bottom - 40;
        else bottom = top + 40;
      }
      setSnapGuides({ x: xSnap?.guide ?? null, y: ySnap?.guide ?? null });

      const nextWidth = Math.max(40, right - left);
      const nextHeight = Math.max(40, bottom - top);
      const scaleX = nextWidth / groupWidth;
      const scaleY = nextHeight / groupHeight;
      useDeck.getState().mutate(d => {
        const current = d.slides.find(item => item.id === slide.id);
        if (!current) return;
        for (const original of originals) {
          const item = current.elements.find(candidate => candidate.id === original.id);
          if (!item || item.locked) continue;
          item.x = Math.round(left + (original.x - groupLeft) * scaleX);
          item.y = Math.round(top + (original.y - groupTop) * scaleY);
          item.w = Math.max(40, original.w * scaleX);
          item.h = Math.max(40, original.h * scaleY);
        }
      }, { history: false });
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (mode !== "rotate" && isFeatureEnabled("rememberedPositionSnapping")) {
        useDeck.getState().mutate(d => {
          const current = d.slides.find(item => item.id === slide.id);
          if (!current) return;
          for (const original of originals) {
            const item = current.elements.find(candidate => candidate.id === original.id);
            if (item && !item.locked) {
              item.snapMemory = { x: original.x, y: original.y, w: original.w, h: original.h };
            }
          }
        }, { history: false });
      }
      setSnapGuides({ x: null, y: null });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };
  return <div ref={host} className={`scaled-host ${editable ? "editable-host" : ""}`} onPointerDown={() => editable && useDeck.getState().selectElements([])}>
    <div className="slide-wrapper" style={{ width: deck.width, height: deck.height, marginLeft: -deck.width / 2, marginTop: -deck.height / 2, transform: `scale(${scale})` }}>
      <div ref={scene} className="slide-content h-full w-full" style={{ background: slide.background.type === "gradient" ? gradientCss(slide.background.gradientType, slide.background.angle, slide.background.gradientColors?.length ? slide.background.gradientColors : [slide.background.color, slide.background.color2]) : slide.background.color }}>
        {slide.background.type === "image" && <img src={background} alt="" className="absolute inset-0 h-full w-full" style={{ objectFit: slide.background.imageFit }} />}
        {showGrid && <div className="stage-grid pointer-events-none absolute inset-0" style={{ backgroundSize: "40px 40px" }} />}
        {slide.elements.filter(e => !e.hidden).map(el => {
          const groupShapes = el.type === "shape" && el.groupId
            ? slide.elements.filter((item): item is Extract<SlideElement, { type: "shape" }> => item.type === "shape" && item.groupId === el.groupId)
            : [];
          const gradientSource = groupShapes.find(item => item.gradient) ?? (el.type === "shape" ? el : undefined);
          let groupFillStyle: CSSProperties | undefined;
          if (el.type === "shape" && gradientSource?.gradient && groupShapes.length > 1) {
            const groupLeft = Math.min(...groupShapes.map(item => item.x));
            const groupTop = Math.min(...groupShapes.map(item => item.y));
            const groupWidth = Math.max(1, Math.max(...groupShapes.map(item => item.x + item.w)) - groupLeft);
            const groupHeight = Math.max(1, Math.max(...groupShapes.map(item => item.y + item.h)) - groupTop);
            groupFillStyle = {
              backgroundImage: gradientCss(gradientSource.gradientType, gradientSource.gradientAngle, gradientSource.gradientColors?.length ? gradientSource.gradientColors : [gradientSource.fill, gradientSource.fill2]),
              backgroundSize: `${groupWidth}px ${groupHeight}px`,
              backgroundPosition: `-${el.x - groupLeft}px -${el.y - groupTop}px`,
              backgroundRepeat: "no-repeat",
            };
          }
          return <div key={el.id} data-element-id={el.id} data-object-name={el.name} className={`slide-object ${editable ? "editable-object" : ""} ${editable && selected.includes(el.id) ? "object-selected" : ""}`} style={{ left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rotation}deg)`, opacity: el.opacity, cursor: presenting && el.hyperlink ? "pointer" : undefined, filter: el.blur ? `blur(${el.blur}px)` : undefined, boxShadow: el.shadow.on ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}` : undefined }} onPointerDown={e => manipulate(e, el, "move")} onClick={e => { if (presenting && el.hyperlink) { e.stopPropagation(); const raw = el.hyperlink.trim(); const href = /^(https?:|mailto:|tel:)/i.test(raw) ? raw : `https://${raw}`; try { const parsed = new URL(href); if (["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) window.open(href, "_blank", "noopener,noreferrer"); } catch { /* Ignore invalid presentation links. */ } } }} onDoubleClick={e => { if (editable && el.type === "text") { e.stopPropagation(); useDeck.getState().setEditingText(el.id); } }}>
            <ElementContent el={el} presenting={presenting} fillStyle={groupFillStyle} />
            {editable && selected.includes(el.id) && <>
              {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as ResizeHandle[]).map(handle => <span key={handle} className="resize-handle" data-handle={handle} role="presentation" aria-label={`Resize ${handle}`} onPointerDown={e => manipulate(e, el, "resize", handle)} />)}
              <span className="rotate-handle" onPointerDown={e => manipulate(e, el, "rotate")} />
            </>}
          </div>;
        })}
        {editable && snapGuides.x !== null && <div className="snap-guide snap-guide-x" style={{ left: snapGuides.x }} />}
        {editable && snapGuides.y !== null && <div className="snap-guide snap-guide-y" style={{ top: snapGuides.y }} />}
        {morphGhosts.map(ghost => <div key={`morph-${ghost.id}`} data-morph-ghost={ghost.id} className="slide-object morph-ghost" style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h, transform: `rotate(${ghost.rotation}deg)`, opacity: ghost.opacity, pointerEvents: "none" }}><ElementContent el={ghost} presenting={presenting} /></div>)}
      </div>
    </div>
  </div>;
}