import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Camera, ChevronRight, Contrast, Droplets, Gauge, RotateCcw, SlidersHorizontal, Sparkles, Sun, Thermometer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SlideElement, VisualAdjustments } from "@/lib/prism/types";
import { resolveVisualAdjustments, buildVisualFilter, buildVisualBoxShadow } from "@/lib/prism/visualAdjustments";
import { useResolvedSrc } from "@/lib/prism/assets";

type AdjustKey = keyof VisualAdjustments;
type View = "quick" | "studio";
type StudioTab = "Light" | "Color" | "Detail" | "Effects";

type SliderSpec = { key: AdjustKey; label: string; min: number; max: number; step?: number; unit?: string; hint?: string };
const QUICK: SliderSpec[] = [
  { key: "exposure", label: "Exposure", min: -2, max: 2, step: .05, unit: " EV", hint: "Overall exposure compensation" },
  { key: "brightness", label: "Brightness", min: -100, max: 100, hint: "Lift or lower the overall image" },
  { key: "contrast", label: "Contrast", min: -100, max: 100, hint: "Separate bright and dark tones" },
  { key: "saturation", label: "Saturation", min: -100, max: 150, hint: "Control colour intensity" },
  { key: "highlights", label: "Highlights", min: -100, max: 100, hint: "Recover or lift bright areas" },
  { key: "shadows", label: "Shadows", min: -100, max: 100, hint: "Open or deepen dark areas" },
  { key: "temperature", label: "Temperature", min: -100, max: 100, hint: "Cool blue to warm amber" },
];
const SLIDERS: Record<Exclude<StudioTab,"Effects">, SliderSpec[]> = {
  Light: [
    { key: "exposure", label: "Exposure", min: -2, max: 2, step: .05, unit: " EV" },
    { key: "brightness", label: "Brightness", min: -100, max: 100 },
    { key: "contrast", label: "Contrast", min: -100, max: 100 },
    { key: "highlights", label: "Highlights", min: -100, max: 100 },
    { key: "whites", label: "Whites", min: -100, max: 100 },
    { key: "shadows", label: "Shadows", min: -100, max: 100 },
    { key: "blacks", label: "Blacks", min: -100, max: 100 },
  ],
  Color: [
    { key: "temperature", label: "Temperature", min: -100, max: 100, hint: "Blue to amber" },
    { key: "tint", label: "Tint", min: -100, max: 100, hint: "Green to magenta" },
    { key: "saturation", label: "Saturation", min: -100, max: 150 },
    { key: "vibrance", label: "Vibrance", min: -100, max: 100 },
    { key: "hue", label: "Hue shift", min: -180, max: 180, unit: "°" },
  ],
  Detail: [
    { key: "clarity", label: "Clarity", min: -100, max: 100 },
    { key: "sharpness", label: "Sharpness", min: 0, max: 100 },
    { key: "fade", label: "Fade", min: 0, max: 100 },
    { key: "vignette", label: "Vignette", min: 0, max: 100 },
  ],
};

const LOOKS: Array<{ name: string; values: Partial<VisualAdjustments>; description: string }> = [
  { name: "Vivid", description: "Rich colour and crisp contrast", values: { saturation: 28, vibrance: 42, contrast: 14, clarity: 12 } },
  { name: "Cinematic", description: "Cool shadows and soft highlights", values: { contrast: 20, saturation: -12, shadows: -22, highlights: -25, temperature: -12, vignette: 32, fade: 8 } },
  { name: "Golden hour", description: "Warm amber light", values: { temperature: 48, saturation: 12, highlights: 12, exposure: .2 } },
  { name: "Cool studio", description: "Clean blue-tinted finish", values: { temperature: -42, tint: -8, contrast: 10, saturation: -5 } },
  { name: "Matte", description: "Lifted blacks and gentle contrast", values: { blacks: 32, contrast: -18, fade: 24, saturation: -8 } },
  { name: "Monochrome", description: "Black and white tonal treatment", values: { saturation: -100, contrast: 18, clarity: 12 } },
];

function Slider({ spec, value, onChange }: { spec: SliderSpec; value: number; onChange: (value: number) => void }) {
  const percent = ((value - spec.min) / (spec.max - spec.min)) * 100;
  const isCentered = spec.min < 0 && spec.max > 0;
  return <label className="photo-slider-row" title={spec.hint}>
    <span className="photo-slider-heading"><span>{spec.label}</span><output>{Number.isInteger(value) ? value : value.toFixed(2)}{spec.unit ?? ""}</output></span>
    <span className="photo-slider-track-wrap">
      <span className="photo-slider-scale"><i /><i /><i /><i /><i /><i /><i /></span>
      {isCentered && <span className="photo-slider-zero" />}
      <input
        type="range" min={spec.min} max={spec.max} step={spec.step ?? 1} value={value}
        aria-label={spec.label}
        style={{ "--photo-progress": percent + "%" } as CSSProperties}
        onChange={event => onChange(Number(event.target.value))}
      />
    </span>
    {spec.hint && <span className="photo-slider-hint">{spec.hint}</span>}
  </label>;
}

function Histogram() {
  const bars = [12,18,13,24,19,35,28,46,38,57,43,62,49,72,55,83,64,74,52,68,47,56,34,44,29,36,18,25,13,20,9,15];
  return <svg className="photo-histogram" viewBox="0 0 320 88" preserveAspectRatio="none" aria-label="Tonal distribution preview">
    <defs><linearGradient id="photo-histogram-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#72d5eb" stopOpacity=".55"/><stop offset="1" stopColor="#72d5eb" stopOpacity=".03"/></linearGradient></defs>
    {bars.map((height,index)=><rect key={index} x={index*10+1} y={86-height} width="7" height={height} rx="2" fill="url(#photo-histogram-fill)"/>)}
    <path d="M0 87 H320" stroke="rgba(164,188,219,.25)" strokeWidth="1"/>
    <path d="M0 1 V87 M80 1 V87 M160 1 V87 M240 1 V87 M319 1 V87" stroke="rgba(164,188,219,.12)" strokeDasharray="3 5"/>
  </svg>;
}

function PreviewArtwork({ element, source, filter, shadow }: { element: SlideElement; source: string; filter?: string; shadow?: string }) {
  const style: CSSProperties = { filter, boxShadow: shadow };
  if (element.type === "image" && source) return <img className="photo-preview-image" src={source} alt={element.alt || "Selected image preview"} style={style}/>;
  if (element.type === "video" && source) return <img className="photo-preview-image" src={source} alt={element.name + " preview"} style={style}/>;
  return <svg className="photo-preview-art" viewBox="0 0 360 190" style={style} aria-label="Live adjustment preview">
    <defs><linearGradient id="photo-preview-sky" x2="0" y2="1"><stop stopColor="#182c55"/><stop offset="1" stopColor="#7b9db0"/></linearGradient><linearGradient id="photo-preview-hill" x2="0" y2="1"><stop stopColor="#70bd9c"/><stop offset="1" stopColor="#1b594d"/></linearGradient></defs>
    <rect width="360" height="190" fill="url(#photo-preview-sky)"/>
    <circle cx="275" cy="47" r="25" fill="#f4d18a"/>
    <path d="M0 145 74 66 120 122 187 40 285 145Z" fill="#526f93"/>
    <path d="m153 79 34-39 40 60-26-12-13 12Z" fill="#e9eef0" opacity=".9"/>
    <path d="M0 145 Q76 117 145 148 T290 140 T360 146 V190 H0Z" fill="url(#photo-preview-hill)"/>
    <path d="M0 164 Q80 143 150 168 T300 159 T360 163" fill="none" stroke="#a6d4ba" strokeWidth="3" opacity=".65"/>
    <path d="M40 152v-24m0 8-10-9m10 9 11-12m55 29v-34m0 14-13-14m13 14 14-16m170 12v-26m0 11-11-12m11 12 12-14" stroke="#163f37" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
}

export function PhotoEffectsStudio({ elements, onAdjust, onEffectPatch, onReset }: {
  elements: SlideElement[];
  onAdjust: (adjustments: VisualAdjustments) => void;
  onEffectPatch: (patch: Record<string, unknown>) => void;
  onReset: () => void;
}) {
  const [view,setView]=useState<View|null>(null);
  const [tab,setTab]=useState<StudioTab>("Light");
  const element=elements[0];
  const adjustments=element?resolveVisualAdjustments(element):null;
  const previewSource=useResolvedSrc(element?.type==="image"?element.src:element?.type==="video"?element.poster:"");
  useEffect(()=>{
    if(!view)return;
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setView(null);};
    document.addEventListener("keydown",close);
    return()=>document.removeEventListener("keydown",close);
  },[view]);
  if(!element||!adjustments)return null;
  const visualFilter=buildVisualFilter({...element,visualAdjustments:adjustments});
  const visualShadow=buildVisualBoxShadow({...element,visualAdjustments:adjustments});
  const update=(key:AdjustKey,value:number)=>onAdjust({...adjustments,[key]:value});
  const applyLook=(values:Partial<VisualAdjustments>)=>onAdjust({...adjustments,...values});
  const shadowAmount=element.shadow.on?Math.min(100,Math.round(element.shadow.blur*1.7)):0;
  const glowAmount=element.glow.on?Math.min(100,Math.round(element.glow.size*2.2)):0;
  const tabs:StudioTab[]=["Light","Color","Detail","Effects"];
  return <>
    <div className="photo-editor-launchers">
      <Button type="button" variant="outline" className="photo-launch-quick" onClick={()=>setView("quick")}><Camera size={15}/> Quick Edit</Button>
      <Button type="button" variant="outline" className="photo-launch-full" onClick={()=>setView("studio")}><SlidersHorizontal size={15}/> Photo & Effects Studio <ChevronRight size={14}/></Button>
    </div>
    {view&&typeof document!=="undefined"&&createPortal(
      <div className="photo-studio-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setView(null);}}>
        <section className={"photo-studio-window "+(view==="quick"?"photo-studio-quick":"")} role="dialog" aria-modal="true" aria-label={view==="quick"?"Quick photo editor":"Photo and effects studio"}>
          <header className="photo-studio-header">
            <div className="photo-studio-brand"><div className="photo-studio-mark"><SlidersHorizontal size={17}/></div><div><strong>{view==="quick"?"Quick Edit":"Photo & Effects Studio"}</strong><small>NON-DESTRUCTIVE VISUAL ADJUSTMENTS · {elements.length} SELECTED</small></div></div>
            <div className="photo-studio-header-actions"><Button type="button" variant="ghost" size="sm" onClick={()=>setView(view==="quick"?"studio":"quick")}>{view==="quick"?"Open full studio":"Quick edit"}</Button><Button type="button" variant="ghost" size="icon" aria-label="Close editor" onClick={()=>setView(null)}><X size={18}/></Button></div>
          </header>
          <div className="photo-studio-body">
            <aside className="photo-studio-preview-column">
              <div className="photo-preview-topline"><span><i/> LIVE LOOK PREVIEW</span><small>{element.name}</small></div>
              <div className="photo-preview-stage"><PreviewArtwork element={element} source={previewSource} filter={visualFilter} shadow={visualShadow}/></div>
              <div className="photo-histogram-label"><span>TONAL DISTRIBUTION</span><span>SHADOWS <b>·</b> HIGHLIGHTS</span></div>
              <Histogram/>
              <div className="photo-preview-meta"><span>{element.type.toUpperCase()} OBJECT</span><span>{elements.length>1?"MULTI-SELECTION":"LIVE CANVAS SYNC"}</span></div>
              <p className="photo-preview-note">Changes update the selected object on your slide as you move each control.</p>
              <div className="photo-adjustment-summary"><span>Exposure</span><b>{adjustments.exposure>0?"+":""}{adjustments.exposure.toFixed(2)} EV</b><span>Colour</span><b>{adjustments.saturation>0?"+":""}{adjustments.saturation}</b><span>Detail</span><b>{adjustments.clarity>0?"+":""}{adjustments.clarity}</b></div>
            </aside>
            <main className="photo-studio-controls">
              {view==="quick"?<>
                <div className="photo-panel-heading"><div><span>FAST ADJUSTMENTS</span><h2>Quick Edit</h2><p>Make a polished correction in seconds. Fine-tune with the full studio whenever you need more control.</p></div><Sun size={24}/></div>
                <div className="photo-quick-look-grid">{LOOKS.map(look=><button type="button" key={look.name} title={look.description} onClick={()=>applyLook(look.values)}><span className={"photo-look-swatch photo-look-"+look.name.toLowerCase().replace(" ","-")}/><strong>{look.name}</strong><small>{look.description}</small></button>)}</div>
                <div className="photo-control-section"><div className="photo-section-title"><Sun size={15}/><span>Light & colour</span><small>LIVE</small></div>{QUICK.map(spec=><Slider key={spec.key} spec={spec} value={adjustments[spec.key]} onChange={value=>update(spec.key,value)}/>)}</div>
              </>:<>
                <div className="photo-panel-heading"><div><span>PRECISION ADJUSTMENTS</span><h2>Image controls</h2><p>Shape the tonal range, colour response and finishing effects of any selected visual.</p></div><Gauge size={25}/></div>
                <nav className="photo-studio-tabs" aria-label="Adjustment categories">{tabs.map(item=><button type="button" key={item} className={tab===item?"active":""} onClick={()=>setTab(item)}>{item}</button>)}</nav>
                {tab!=="Effects"?<div className="photo-control-section photo-advanced-controls">
                  <div className="photo-section-title">{tab==="Light"?<Sun size={15}/>:tab==="Color"?<Droplets size={15}/>:<Contrast size={15}/>}<span>{tab==="Light"?"Tone curve & tonal range":tab==="Color"?"Colour grading":"Detail & finishing"}</span><small>MASTER</small></div>
                  {tab==="Light"&&<div className="photo-tone-curve"><svg viewBox="0 0 300 112" role="img" aria-label="Tone curve guide"><path d="M8 104 H292 M8 8 V104" stroke="rgba(148,177,214,.25)" strokeDasharray="3 5" fill="none"/><path d="M8 8 V104 H292" stroke="rgba(148,177,214,.35)" fill="none"/><path d={"M8 104 C 66 "+(96-adjustments.blacks*.16)+" 96 "+(65-adjustments.shadows*.12)+" 150 "+(56-adjustments.exposure*5)+" S 235 "+(25-adjustments.highlights*.12)+" 292 "+(8-adjustments.whites*.08)} stroke="#6dd8ed" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M8 104 C 66 96 96 65 150 56 S 235 25 292 8 L292 104Z" fill="url(#photoCurveFill)" opacity=".12"/><defs><linearGradient id="photoCurveFill"><stop stopColor="#6dd8ed"/><stop offset="1" stopColor="#7b8cff"/></linearGradient></defs></svg><span>INPUT TONAL RANGE <b/> OUTPUT</span></div>}
                  {(SLIDERS[tab]??[]).map(spec=><Slider key={spec.key} spec={spec} value={adjustments[spec.key]} onChange={value=>update(spec.key,value)}/>)}
                </div>:<div className="photo-control-section photo-advanced-controls">
                  <div className="photo-section-title"><Sparkles size={15}/><span>Atmosphere & finish</span><small>EFFECTS</small></div>
                  <div className="photo-effect-control"><div><strong>Soft shadow</strong><small>Lift the selected object from its background.</small></div><Slider spec={{key:"brightness",label:"Shadow strength",min:0,max:100}} value={shadowAmount} onChange={value=>onEffectPatch({shadow:{...element.shadow,on:value>0,x:element.shadow.x||0,y:Math.round(4+value*.12),blur:Math.round(value*.34),color:element.shadow.color||"rgba(0,0,0,.35)"}})}/></div>
                  <div className="photo-effect-control"><div><strong>Outer glow</strong><small>Add a soft coloured halo around the object.</small></div><Slider spec={{key:"contrast",label:"Glow intensity",min:0,max:100}} value={glowAmount} onChange={value=>onEffectPatch({glow:{...element.glow,on:value>0,size:Math.round(value*.42),color:element.glow.color||"#7c83ff"}})}/></div>
                  <div className="photo-effect-control"><div><strong>Optical softness</strong><small>Apply a controlled blur to the entire element.</small></div><Slider spec={{key:"clarity",label:"Blur radius",min:0,max:24,unit:" px"}} value={element.blur} onChange={value=>onEffectPatch({blur:value})}/></div>
                  <Slider spec={{key:"vignette",label:"Vignette",min:0,max:100}} value={adjustments.vignette} onChange={value=>update("vignette",value)}/>
                  <Slider spec={{key:"fade",label:"Fade",min:0,max:100}} value={adjustments.fade} onChange={value=>update("fade",value)}/>
                  <div className="photo-effects-tip">Glow, shadow, blur and tonal controls are stored with the selected object and remain editable later.</div>
                </div>}
              </>}
              <footer className="photo-studio-footer"><span>ADJUSTMENTS APPLY TO ALL {elements.length} SELECTED OBJECT{elements.length===1?"":"S"}</span><div><Button type="button" variant="ghost" size="sm" onClick={onReset}><RotateCcw size={14}/> Reset all</Button><Button type="button" size="sm" onClick={()=>setView(null)}>Done</Button></div></footer>
            </main>
          </div>
        </section>
      </div>,document.body
    )}
  </>;
}
