import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { makeShape, uid } from "@/lib/prism/factory";
import type { ShapeEl, ShapeKind } from "@/lib/prism/types";
import { ChevronDown, Search, Sparkles, X } from "lucide-react";

type Category = "Trees" | "Grass & foliage" | "Flowers" | "Planets" | "Buildings" | "Landscapes" | "Objects";
type Part = { shape: ShapeKind; x: number; y: number; w: number; h: number; fill: string; stroke?: string; strokeWidth?: number; rotation?: number; radius?: number; gradient?: string[]; depth?: boolean; opacity?: number; name?: string };
type Preset = { id: string; name: string; category: Category; description: string; parts: Part[] };
const q = (shape: ShapeKind, x: number, y: number, w: number, h: number, fill: string, extra: Partial<Part> = {}): Part => ({ shape, x, y, w, h, fill, ...extra });
const ln = (x1: number, y1: number, x2: number, y2: number, color: string, width = 9): Part => {
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy) + 16;
  return q("line", (x1 + x2) / 2 - length / 2, (y1 + y2) / 2 - width / 2, length, width, color,
    { stroke: color, strokeWidth: width, rotation: Math.atan2(dy, dx) * 180 / Math.PI });
};
const ell = (x: number, y: number, w: number, h: number, color: string, rotation = 0, extra: Partial<Part> = {}) =>
  q("ellipse", x, y, w, h, color, { rotation, ...extra });
const preset = (id: string, name: string, category: Category, description: string, parts: Part[]): Preset =>
  ({ id, name, category, description, parts });

function makeTree(id: string, name: string, description: string, style: string,
  colors: { leaf: string; light: string; dark: string; trunk: string; fruit?: string; blossom?: string }): Preset {
  const p: Part[] = [];
  const leaf = colors.leaf, light = colors.light, dark = colors.dark, bark = colors.trunk;
  p.push(ell(165, 525, 390, 40, "#172d28", 0, { opacity: .22 }));
  if (style === "baobab") {
    p.push(q("trapezoid", 270, 300, 180, 270, bark, { gradient: ["#c78a52", "#70442d"], depth: true }));
    p.push(ell(245, 280, 230, 80, bark));
    p.push(ln(350, 350, 225, 195, bark, 27), ln(370, 350, 500, 185, bark, 27));
    p.push(ln(345, 365, 175, 290, bark, 22), ln(380, 365, 545, 270, bark, 22));
    p.push(ell(115, 112, 230, 135, leaf), ell(295, 80, 250, 145, leaf), ell(440, 115, 165, 120, leaf));
    p.push(ell(160, 128, 170, 82, light), ell(340, 98, 160, 85, light), ell(470, 142, 100, 62, light));
  } else if (style === "palm") {
    p.push(q("parallelogram", 322, 245, 82, 326, bark, { rotation: -4, gradient: ["#d99a58", "#79502f"], depth: true }));
    p.push(q("parallelogram", 334, 320, 36, 236, "#e2ad70", { rotation: -4, opacity: .68 }));
    p.push(ell(328, 218, 100, 65, dark));
    const fronds: Array<[number,number,number,number,number]> = [
      [365,245,115,72,-154],[365,242,165,82,-125],[365,238,190,78,-95],
      [365,238,185,75,-52],[365,242,155,78,-25],[365,248,105,64,8],
      [365,236,120,55,-178],[365,235,130,52,-8],
    ];
    fronds.forEach(([x,y,w,h,r],i) => p.push(q("triangle", x-w/2, y-h/2, w, h, i%2 ? leaf : dark, { rotation:r, gradient:i%2 ? [light,leaf] : [leaf,dark] })));
    p.push(ell(349, 224, 30, 34, "#8a5b35"), ell(382, 225, 30, 34, "#9a673b"), ell(365, 242, 28, 32, "#a87442"));
  } else if (style === "umbrella") {
    p.push(q("trapezoid", 329, 300, 62, 270, bark, { gradient: ["#b9824b","#70452c"], depth: true }));
    p.push(ln(360,365,205,245,bark,18),ln(360,360,515,238,bark,18),ln(360,355,270,185,bark,15),ln(360,350,455,180,bark,15));
    p.push(ell(105,145,510,250,dark), ell(145,115,430,220,leaf), ell(205,83,300,170,light));
    p.push(ell(145,195,160,115,leaf), ell(420,190,160,118,leaf), ell(260,230,190,110,dark));
  } else if (style === "weeping") {
    p.push(q("trapezoid", 328, 295, 64, 275, bark, { gradient: ["#bd8754","#69442e"], depth: true }));
    p.push(ln(355,365,245,215,bark,18),ln(365,360,475,215,bark,18),ln(355,325,300,180,bark,14),ln(375,325,425,175,bark,14));
    p.push(ell(185,80,350,225,dark), ell(215,75,290,190,leaf), ell(270,90,190,135,light));
    [[195,220,76,250,-6],[250,245,64,235,8],[315,230,60,270,-3],[378,235,65,265,5],[442,220,74,245,8],[510,215,65,220,-8],[225,190,48,205,-8],[470,185,48,205,8]].forEach(([x,y,w,h,r],i)=>p.push(ell(x,y,w,h,i%2?leaf:dark,r)));
    [220,275,330,390,445,500].forEach((x,i)=>p.push(ell(x,355+(i%2)*22,28,95,i%2?light:leaf,i%2?5:-5)));
  } else if (style === "conifer" || style === "cedar") {
    p.push(q("rect", 337, 330, 46, 240, bark, { gradient: ["#9e6b43","#5b3c2b"] }));
    const tiers = style === "cedar" ? [[180,280,360,170],[205,220,310,160],[235,160,250,150],[265,105,190,140],[295,55,130,125]] : [[165,240,390,300],[205,180,310,275],[240,120,240,245],[275,70,170,205],[310,32,100,150]];
    tiers.forEach(([x,y,w,h],i)=>{
      p.push(q("triangle",x,y,w,h,dark,{gradient:[leaf,dark],depth:i===0}));
      p.push(q("triangle",x+Math.round(w*.12),y+Math.round(h*.12),Math.round(w*.76),Math.round(h*.76),i%2?light:leaf,{gradient:[light,leaf]}));
    });
    [0,1,2,3,4].forEach(i=>{
      const y=265-i*46, spread=150-i*24;
      p.push(ln(360,y,360-spread,y-28,dark,12),ln(360,y,360+spread,y-28,leaf,12));
      p.push(ell(360-spread-18,y-43,52,24,light,-18),ell(360+spread-30,y-42,52,24,leaf,18));
    });
  } else if (style === "column") {
    p.push(q("trapezoid", 337, 280, 46, 290, bark, { gradient: ["#d3d0ba","#6b5947"], depth: true }));
    p.push(ln(360,360,275,215,bark,14),ln(360,350,445,205,bark,14));
    p.push(ell(250,55,220,390,dark),ell(267,70,185,360,leaf),ell(295,95,128,290,light));
    [[235,145,72,120],[405,155,76,125],[250,275,66,125],[402,290,66,122],[295,75,65,120],[365,65,70,115]].forEach(([x,y,w,h],i)=>p.push(ell(x,y,w,h,i%2?leaf:dark,i%2?8:-8)));
  } else if (style === "narrow") {
    p.push(q("trapezoid", 339, 255, 42, 315, bark, { gradient: ["#ddd7c8","#75634f"], depth: true }));
    p.push(ln(360,360,286,225,bark,13),ln(360,345,438,215,bark,13));
    p.push(q("triangle",245,60,230,375,dark,{gradient:[leaf,dark],depth:true}));
    p.push(q("triangle",275,85,170,320,leaf,{gradient:[light,leaf]}));
    [0,1,2,3,4,5].forEach(i=>p.push(ell(282+i*15,105+i*42,105-i*8,68,i%2?light:leaf,i%2?5:-5)));
  } else {
    p.push(q("trapezoid", 324, 285, 72, 285, bark, { gradient: ["#bd8450","#64412c"], depth: true }));
    p.push(ln(355,385,215,245,bark,19),ln(365,375,505,240,bark,19),ln(355,350,285,190,bark,15),ln(370,350,445,185,bark,15));
    p.push(ell(130,105,460,325,dark),ell(160,85,400,310,leaf),ell(245,65,250,220,light));
    const blobs: Array<[number,number,number,number,string,number]> = [
      [145,180,165,155,leaf,-8],[220,110,175,170,light,4],[330,92,180,170,leaf,-4],
      [430,145,150,155,light,8],[470,235,125,120,leaf,-4],[335,255,180,120,dark,0],
      [200,270,170,110,leaf,0],[265,190,190,150,leaf,0],
    ];
    blobs.forEach(([x,y,w,h,c,r])=>p.push(ell(x,y,w,h,c,r)));
    [[205,130],[290,105],[390,140],[490,190],[165,225],[275,245],[390,270],[475,270]].forEach(([x,y],i)=>p.push(ell(x,y,54,30,i%2?light:"#6ed18a",i%2?22:-18)));
  }
  if (id === "birch-tree" || id === "silver-birch") {
    p.push(q("rect", 344, 310, 10, 235, "#ffffff"),q("rect", 367, 290, 9, 260, "#f2eee2"));
    [[346,360,34,7],[365,410,28,6],[343,455,35,7],[368,505,25,6],[342,330,23,6]].forEach(([x,y,w,h])=>p.push(q("parallelogram",x,y,w,h,"#47525a",{rotation:-8})));
    p.push(ell(300,145,38,20,"#d5e7a7",-25),ell(420,180,35,18,"#d5e7a7",24),ell(345,100,35,18,"#d5e7a7",-8));
  }
  if (colors.fruit) {
    [[210,205],[285,155],[390,130],[485,205],[245,285],[390,270],[475,285],[330,220]].forEach(([x,y])=>{
      p.push(ell(x,y,25,28,colors.fruit!,0,{gradient:["#ff8a75",colors.fruit!],depth:true}),ln(x+13,y+1,x+17,y-8,"#6f4a30",4),ell(x+14,y-9,13,7,"#77c765",-25));
    });
  }
  if (colors.blossom) {
    [[205,170],[285,125],[385,115],[485,175],[245,265],[395,255],[465,260],[330,195],[155,235]].forEach(([x,y])=>{
      p.push(ell(x-13,y-5,25,19,colors.blossom!,-28),ell(x+2,y-11,25,19,colors.blossom!,30),ell(x+3,y+5,24,18,colors.blossom!,70),ell(x-15,y+8,24,18,colors.blossom!,-68),ell(x-3,y+1,12,12,"#f7cf70"));
    });
  }
  p.push(ell(175,548,370,22,"#4f9b62",0,{opacity:.9}));
  [[195,532,70,24,-18],[230,525,75,28,22],[460,530,70,25,-20],[495,525,66,22,15]].forEach(([x,y,w,h,r],i)=>p.push(q("triangle",x,y,w,h,i%2?light:leaf,{rotation:r})));
  return preset(id,name,"Trees",description,p);
}

function flowerHead(p:Part[],cx:number,cy:number,size:number,color:string){
  for(let i=0;i<8;i++){const a=i*Math.PI/4;p.push(ell(cx+Math.cos(a)*size*.45-size*.22,cy+Math.sin(a)*size*.45-size*.15,size*.44,size*.30,color,a*180/Math.PI));}
  p.push(ell(cx-size*.18,cy-size*.18,size*.36,size*.36,"#a96c36"),ell(cx-size*.08,cy-size*.09,size*.16,size*.16,"#ffd879"));
}
function makeGrass(id:string,name:string,kind:"tuft"|"meadow"|"reeds"|"fern"|"bamboo"|"wheat"):Preset{
  const p:Part[]=[];
  if(kind==="tuft"||kind==="meadow"){
    p.push(ell(90,515,540,52,"#315b3e",0,{opacity:.22}));
    const blades:Array<[number,number,number,number,number]>=[[115,510,110,260,-30],[150,515,88,300,-18],[190,515,78,260,-8],[235,515,84,320,12],[280,520,90,270,-12],[320,515,100,330,4],[370,520,95,285,17],[420,515,90,310,28],[465,520,85,250,14],[510,515,100,295,-20],[550,520,80,225,-8],[585,520,70,200,20]];
    blades.forEach(([x,y,w,h,r],i)=>p.push(q("triangle",x,y-h,w,h,i%3===0?"#3b9c58":i%3===1?"#65c96e":"#26844b",{rotation:r,gradient:[i%2?"#8be28a":"#4ec46d",i%2?"#287b48":"#17603c"]})));
    if(kind==="meadow")[[175,220,"#f2c65f"],[310,155,"#ed7197"],[465,235,"#9b8af0"],[555,170,"#f5a44f"]].forEach(([x,y,c])=>flowerHead(p,Number(x),Number(y),34,String(c)));
  }else if(kind==="reeds"){
    [170,245,330,420,510,585].forEach((x,i)=>{
      p.push(ln(x,535,x+(i%2?18:-10),135+(i%3)*35,"#4d9d65",12));
      p.push(q("roundRect",x-10,110+(i%3)*35,22,90,i%2?"#8c5d39":"#a56d42",{radius:11,rotation:i%2?8:-5}));
      p.push(q("triangle",x-55,390,70,180,"#4a9b5d",{rotation:-20}),q("triangle",x,400,75,165,"#2b7b4b",{rotation:18}));
    });
    p.push(ell(90,530,540,28,"#305b43",0,{opacity:.25}));
  }else if(kind==="fern"){
    p.push(ln(350,545,360,100,"#3b995b",12));
    for(let i=0;i<9;i++){const y=490-i*43,spread=35+i*10;p.push(q("triangle",350-spread-45,y-38,95,55,i%2?"#48b86a":"#2c8f53",{rotation:-24}),q("triangle",350+spread-35,y-38,95,55,i%2?"#61ca7a":"#24834b",{rotation:24}),ln(350,y,350-spread,y-22,"#237c49",5),ln(350,y,350+spread,y-22,"#237c49",5));}
  }else if(kind==="bamboo"){
    [170,260,355,455,555].forEach((x,i)=>{
      p.push(q("roundRect",x,100+(i%2)*30,42,440,i%2?"#6bbd6a":"#3d9858",{radius:18,gradient:["#8cdb7e","#286b46"],depth:true}));
      for(let j=0;j<5;j++)p.push(q("rect",x-1,170+j*76+(i%2)*30,44,7,"#1f7045"));
      p.push(q("triangle",x-65,145+(i%2)*30,95,48,"#46a95e",{rotation:-20}),q("triangle",x+18,210,90,42,"#6acb70",{rotation:25}));
    });
  }else{
    [165,280,390,505].forEach((x,i)=>{
      p.push(ln(x,545,x+(i%2?12:-10),140+(i%2)*38,"#478f4e",8));
      p.push(ell(x-18,125+(i%2)*38,36,120,i%2?"#c9a24f":"#dfbd68",i%2?8:-6));
      p.push(ell(x-7,145+(i%2)*38,14,88,"#f1d98c"),q("triangle",x-65,385,80,160,"#469d53",{rotation:-25}),q("triangle",x+4,400,78,150,"#2f8349",{rotation:18}));
    });
  }
  const desc=kind==="tuft"?"A layered clump of individually readable grass blades with a clean ground line.":kind==="meadow"?"A meadow strip with organized grass blades and spaced wildflowers.":kind==="reeds"?"Reeds and cattails with individual stems, seed heads and long leaves.":kind==="fern"?"A structured fern frond with paired leaflets along a central stem.":kind==="bamboo"?"A small bamboo grove with segmented culms and fresh side leaves.":"Golden wheat stalks with seed heads and long grain leaves.";
  return preset(id,name,"Grass & foliage",desc,p);
}

function makeFlower(id:string,name:string,kind:string):Preset{
  const p:Part[]=[],stem="#3c9555";
  if(kind==="sunflower"){
    p.push(ell(265,515,190,24,"#305a3e",0,{opacity:.22}),q("rect",350,265,22,280,stem),ell(250,370,140,52,"#53ae60",-28),ell(350,420,135,48,"#3d9a52",22));
    for(let i=0;i<16;i++){const a=i*Math.PI/8;p.push(ell(360+Math.cos(a)*100-25,230+Math.sin(a)*100-52,54,105,"#f6c846",a*180/Math.PI,{gradient:["#ffe47a","#e79b26"]}));}
    p.push(ell(285,155,150,150,"#6f472d",0,{depth:true}),ell(305,175,110,110,"#8f5a32"));
    for(let i=0;i<12;i++){const a=i*Math.PI/6;p.push(ell(350+Math.cos(a)*36,220+Math.sin(a)*36,8,8,"#e6bb68"));}
  }else if(kind==="tulip"){
    p.push(q("rect",350,255,20,305,stem),q("triangle",225,340,145,190,"#419a59",{rotation:-20}),q("triangle",345,360,150,180,"#5fbd65",{rotation:18}));
    p.push(ell(285,85,100,205,"#e84f68",-12,{gradient:["#ff8e9a","#bd2d58"]}),ell(340,55,105,235,"#fa6b79",0,{gradient:["#ffabb0","#da405d"]}),ell(392,90,90,200,"#d94064",12,{gradient:["#fb7585","#a8274e"]}));
  }else if(kind==="rose"){
    p.push(q("rect",355,240,20,320,stem),q("triangle",230,345,150,190,"#2d8a4f",{rotation:-24}),q("triangle",350,375,140,165,"#4aa95b",{rotation:20}));
    p.push(ell(280,60,170,180,"#9e244c"),ell(300,75,145,155,"#d83c67"),ell(325,100,105,120,"#f06483"),ell(345,125,68,78,"#a92451"),ell(355,140,38,42,"#ff9aaa"),ell(310,55,48,38,"#ff91a6",-30),ell(390,90,45,36,"#f8879e",35));
  }else if(kind==="lavender"){
    p.push(q("rect",350,240,16,320,stem),q("rect",285,275,14,280,stem),q("rect",425,285,14,270,stem));
    [[350,80],[285,130],[425,145]].forEach(([x,y])=>{for(let i=0;i<7;i++)p.push(ell(x-18+(i%2)*18,y+i*22,34,26,i%2?"#a48bea":"#7d65cf",i%2?16:-15));});
    p.push(ell(260,365,120,48,"#3e9e56",-28),ell(370,400,125,45,"#51b76b",22));
  }else if(kind==="hibiscus"){
    p.push(q("rect",355,250,20,310,stem),ell(270,60,90,165,"#f05288",-20),ell(335,38,90,175,"#ff82a6"),ell(405,75,95,150,"#e83e77",30),ell(390,175,105,105,"#fa7194",60),ell(275,170,105,100,"#ed5a88",-60),ell(340,135,100,95,"#d92d66"),ln(370,180,500,90,"#f5c75c",9),ell(492,78,32,22,"#ffd76b"));
  }else if(kind==="bluebells"){
    p.push(q("rect",345,260,16,300,stem),q("rect",430,295,14,260,stem),q("rect",265,305,14,250,stem),q("triangle",205,380,135,160,"#429c58",{rotation:-25}),q("triangle",390,385,140,150,"#55b866",{rotation:20}));
    [[345,100],[430,155],[265,175]].forEach(([x,y],j)=>{for(let i=0;i<4;i++)p.push(q("roundRect",x-22+i*10,y+i*38,42,60,j%2?"#8d8af0":"#6885dc",{radius:20,rotation:(i-1.5)*5,gradient:["#b4b7ff","#5966c8"]}));});
  }else if(kind==="cherry"){
    p.push(q("rect",350,250,22,310,"#80523b"),ln(360,340,250,185,"#80523b",15),ln(360,340,475,180,"#80523b",15));
    [[180,100],[290,55],[410,85],[500,140],[230,220],[390,215]].forEach(([x,y],i)=>{for(let j=0;j<5;j++){const a=j*Math.PI*2/5;p.push(ell(x+Math.cos(a)*27-16,y+Math.sin(a)*24-13,34,28,i%2?"#ffd0e0":"#f49fbd",a*180/Math.PI));}p.push(ell(x-8,y-6,18,18,"#f8d77d"));});
  }else{
    p.push(q("rect",350,255,20,305,stem),q("triangle",235,370,135,175,"#369653",{rotation:-25}),q("triangle",360,390,130,155,"#4fb764",{rotation:20}));
    for(let i=0;i<9;i++){const x=160+i*48,y=260-(i%3)*72;flowerHead(p,x,y,kind==="wildflowers"?34:28,["#f2c95b","#f18aa5","#9b8bed","#f7f3e7"][i%4]);}
  }
  p.push(ell(260,548,210,20,"#244632",0,{opacity:.2}));
  const desc=kind==="sunflower"?"Tall sunflower with a full petal ring, seed head and broad leaves.":kind==="tulip"?"Three-petal tulip with a sculpted cup, upright stem and long leaves.":kind==="rose"?"Layered rose bloom with curled petal rings, stem and leaves.":kind==="lavender"?"Three lavender flower spikes with clustered florets and narrow foliage.":kind==="hibiscus"?"Tropical hibiscus with five broad petals and a projecting stamen.":kind==="bluebells"?"Drooping bluebell stems with individual bell-shaped flowers.":kind==="cherry"?"Cherry blossom branch with five-petal flowers and warm centres.":"A botanical flower illustration with a distinct stem, leaves and spaced blooms.";
  return preset(id,name,"Flowers",desc,p);
}

function planetPreset(id:string,name:string,description:string,kind:string):Preset{
  const p:Part[]=[];
  const base=(color:string,edge:string,colors:string[])=>p.push(ell(145,45,430,430,color,0,{stroke:edge,strokeWidth:9,gradient:colors,depth:true}));
  if(kind==="sun"){
    for(let i=0;i<12;i++){const a=i*Math.PI/6;p.push(q("triangle",335+Math.cos(a)*195-22,260+Math.sin(a)*195-50,44,105,"#f4a52e",{rotation:a*180/Math.PI+90,gradient:["#ffe58a","#ef9223"]}));}
    base("#ffba3e","#ffe58a",["#fff07f","#ff9b21"]);p.push(ell(220,125,140,55,"#ffe77b",25,{opacity:.55}),ell(390,310,120,55,"#f18a24",-20,{opacity:.45}));
  }else if(kind==="saturn"){
    p.push(ell(65,200,590,180,"#b57d49",-12,{stroke:"#f5d49b",strokeWidth:14}),ell(90,218,540,140,"#f1d09a",-12,{stroke:"#d2a06a",strokeWidth:12}));
    base("#d4a15d","#ffe2aa",["#ffe2a3","#b8753e"]);p.push(ell(205,155,300,55,"#f4cf91",8),ell(205,305,300,48,"#ad6c43",-4),ell(260,370,180,28,"#e7bd7e",5));
  }else if(kind==="jupiter"){
    base("#ca9a6c","#f2d4a0",["#f3d3a1","#9f684f"]);
    [[170,115,385,38,"#e4ba8a"],[165,175,395,42,"#9e654d"],[155,242,410,48,"#edd0a4"],[170,320,385,46,"#a8664c"],[205,385,320,35,"#e5bc8e"]].forEach(([x,y,w,h,c])=>p.push(q("roundRect",Number(x),Number(y),Number(w),Number(h),String(c),{radius:18})));
    p.push(ell(435,260,115,62,"#b95c48"),ell(455,275,72,32,"#d47a5c"));
  }else if(kind==="earth"){
    base("#267ac8","#9ce8ff",["#79d7f6","#1354ad"]);
    p.push(q("ellipse",220,105,145,90,"#50b86a",{rotation:-25}),q("ellipse",385,235,140,120,"#29985a",{rotation:20}),q("ellipse",300,345,120,72,"#4dc878",{rotation:-20}),q("triangle",435,105,80,75,"#3ba965",{rotation:25}));
    p.push(ell(180,90,150,38,"#effaff",12,{opacity:.62}),ell(435,155,120,32,"#f4fbff",-16,{opacity:.66}),ell(250,395,130,30,"#f4fbff",8,{opacity:.58}));
  }else if(kind==="mars"||kind==="mercury"||kind==="moon"||kind==="pluto"){
    const colors=kind==="mars"?["#f48c61","#863b30"]:kind==="mercury"?["#d7d4ce","#777a80"]:kind==="pluto"?["#e1c5a5","#9e7968"]:["#f0eee5","#92959c"];
    base(colors[0],kind==="mars"?"#f6b083":"#eeeeeb",colors);
    const crater=kind==="mars"?"#97483b":"#929398";
    [[220,140,82,50],[410,165,95,64],[300,280,62,44],[445,350,54,38],[205,340,65,48],[360,105,42,28]].forEach(([x,y,w,h])=>{p.push(ell(x,y,w,h,crater,0,{opacity:.62}),ell(x+8,y+6,w*.68,h*.45,colors[0],0,{opacity:.65}));});
    if(kind==="pluto")p.push(ell(340,265,115,75,"#f1dfc6",-15));
  }else if(kind==="venus"){
    base("#d49a50","#f5d28d",["#ffe4a1","#a8663c"]);
    [[190,130,300,45,"#f4c879"],[220,210,280,48,"#b97842"],[175,300,340,38,"#f3d59a"],[275,365,210,28,"#a96740"]].forEach(([x,y,w,h,c])=>p.push(ell(Number(x),Number(y),Number(w),Number(h),String(c),-12)));
  }else if(kind==="uranus"){
    p.push(ell(120,205,485,120,"#a5dce2",-26,{stroke:"#d5ffff",strokeWidth:12}));base("#55b9d0","#c9f7f5",["#d1ffff","#3788b5"]);p.push(ell(225,135,260,44,"#a2e2df",15,{opacity:.48}));
  }else if(kind==="neptune"){
    base("#205cc0","#8dc8ff",["#76b8ff","#152d8f"]);p.push(ell(190,145,330,50,"#356fd6",-10),ell(180,260,350,42,"#153eaa",8),ell(220,340,270,36,"#4c8ee2",-4),ell(430,255,75,43,"#e0a1a0",8));
  }else{
    base("#ad9d88","#e4d5b8",["#f2e3c7","#796c60"]);p.push(ell(220,165,135,48,"#e7d8bd",-15),ell(370,275,170,42,"#7b766d",10),ell(290,360,130,32,"#e4d6c4",-8));
  }
  return preset(id,name,"Planets",description,p);
}

function makeHouse(id:string,name:string,kind:string):Preset{
  const p:Part[]=[];
  const addWindow=(x:number,y:number,w=62,h=68,frame="#f2e7d2",glass="#71b9dc")=>{
    p.push(q("rect",x,y,w,h,frame),q("rect",x+7,y+7,w-14,h-14,glass),q("rect",x+w/2-3,y+7,6,h-14,frame),q("rect",x+7,y+h/2-3,w-14,6,frame),ell(x+11,y+10,Math.max(8,w*.24),Math.max(8,h*.18),"#e6f8ff",0,{opacity:.55}));
  };
  if(kind==="house"||kind==="cottage"||kind==="cabin"){
    p.push(ell(90,535,550,32,"#263c32",0,{opacity:.2}));
    const wall=kind==="cabin"?"#9a6746":kind==="cottage"?"#efdfbf":"#e8ba83",roof=kind==="cabin"?"#4d3832":kind==="cottage"?"#4e6470":"#a94742";
    p.push(q("rect",155,245,410,310,wall,{gradient:[kind==="cabin"?"#c28a61":"#ffe0ad",wall],depth:true}),q("triangle",115,85,490,275,roof,{gradient:[kind==="cottage"?"#718b9c":"#e87a60",roof],depth:true}));
    p.push(q("rect",205,285,110,105,"#d7f2f8"));addWindow(215,295,90,85);addWindow(425,295,90,85);
    p.push(q("roundRect",325,390,90,165,kind==="cabin"?"#573b2d":"#87543a",{radius:8}),ell(390,470,10,10,"#f5d27b"),q("rect",495,115,45,120,"#a99a86"),q("rect",485,100,65,22,"#76665a"),q("rect",130,545,470,20,"#9b754b"));
    if(kind==="cabin")for(let y=270;y<540;y+=38)p.push(q("rect",158,y,405,7,"#744d38",{opacity:.55}));
    if(kind==="cottage")p.push(q("triangle",340,90,140,110,"#dfe8e4"),q("rect",365,170,92,76,"#dbe8e7"));
  }else if(kind==="glass"){
    p.push(ell(160,555,420,24,"#263e53",0,{opacity:.2}),q("rect",220,75,280,485,"#315a7e",{gradient:["#7ed0e5","#214269"],stroke:"#aacfe2",strokeWidth:9,depth:true}),q("triangle",220,22,280,105,"#294a6b"));
    for(let col=0;col<4;col++)for(let row=0;row<7;row++){p.push(q("rect",240+col*62,112+row*61,45,42,(row+col)%3===0?"#c3eff5":"#6bb6d3",{stroke:"#d9f4f8",strokeWidth:3}),q("rect",244+col*62,116+row*61,12,32,"#ffffff",{opacity:.28}));}
    p.push(q("rect",338,485,55,75,"#263e58"),q("rect",325,60,70,20,"#a9dcea"));
  }else if(kind==="apartment"){
    p.push(ell(120,555,500,26,"#273f51",0,{opacity:.2}),q("rect",165,125,390,430,"#b5b7b7",{gradient:["#e3e6e6","#778c9b"],depth:true}),q("rect",145,105,430,32,"#596d80"));
    for(let col=0;col<4;col++)for(let row=0;row<5;row++)addWindow(190+col*85,165+row*72,60,48,"#e5e2d9",row%2?"#70b4d1":"#8cc9dc");
    p.push(q("rect",315,470,85,85,"#53677b"),q("rect",305,450,105,20,"#e3e3dc"),q("rect",130,555,470,18,"#667d8e"),q("rect",180,90,80,18,"#7b8a99"),q("rect",465,90,80,18,"#7b8a99"));
  }else if(kind==="art-deco"){
    p.push(ell(130,555,470,26,"#273a4c",0,{opacity:.2}),q("rect",250,180,230,380,"#d2b18a",{gradient:["#efd7b3","#997d64"],depth:true}),q("rect",220,150,290,35,"#7a654f"),q("rect",285,85,160,75,"#c9a77a"),q("triangle",275,30,180,75,"#79634d"),q("rect",305,220,120,42,"#6f7d8a"));
    for(let row=0;row<4;row++)for(let col=0;col<3;col++)addWindow(285+col*55,290+row*58,38,42,"#6e5d4d","#8cc7da");
    p.push(q("rect",332,480,65,80,"#654a38"),q("rect",240,555,250,18,"#745d49"));
  }else if(kind==="school"){
    p.push(ell(105,550,510,28,"#263c32",0,{opacity:.2}),q("rect",145,210,440,340,"#e8d2a4",{gradient:["#fff0c9","#c39e69"],depth:true}),q("triangle",120,115,490,125,"#bd514a"),q("rect",300,135,130,72,"#f2e3c4"),q("rect",335,345,70,205,"#73513c"),ell(390,450,9,9,"#f5d46f"));
    for(let col=0;col<4;col++)addWindow(180+col*92,250,62,64);
    p.push(q("rect",125,550,485,18,"#8b7656"),q("triangle",310,80,110,72,"#f3e5c7"));
  }else if(kind==="factory"){
    p.push(ell(90,550,540,28,"#273a43",0,{opacity:.2}),q("rect",110,285,500,270,"#8295a4",{gradient:["#b6c4ce","#536b7d"],depth:true}),q("rect",145,170,78,150,"#657b8a"),q("rect",475,105,72,215,"#586e7e"),q("rect",490,78,42,35,"#d45f52"),q("triangle",100,185,230,115,"#708797"),q("triangle",320,175,260,125,"#708797"));
    for(let col=0;col<5;col++)addWindow(135+col*88,345,62,66,"#d8e2e6","#527d96");
    p.push(q("rect",330,465,100,90,"#394f60"),q("rect",90,550,550,18,"#536b79"));
  }else if(kind==="greenhouse"){
    p.push(q("rect",155,290,410,270,"#a9d9d3",{opacity:.55,stroke:"#5a9f9b",strokeWidth:8}),q("triangle",125,105,470,220,"#8dd7d0",{opacity:.48,stroke:"#5a9f9b",strokeWidth:8}),q("rect",345,235,28,320,"#5f9c8e"),q("rect",160,415,400,15,"#5f9c8e"));
    for(let col=0;col<4;col++)p.push(q("rect",195+col*88,320,10,115,"#5f9c8e"));
    p.push(ell(235,440,48,80,"#54a96b"),ell(325,420,45,100,"#40a65e"),ell(420,435,48,85,"#64b96c"),ell(495,450,43,70,"#39965a"));
  }else if(kind==="church"){
    p.push(ell(130,555,460,24,"#273e4c",0,{opacity:.2}),q("rect",205,255,320,300,"#e1d7c2",{gradient:["#fff5db","#b3a48a"],depth:true}),q("triangle",175,145,380,155,"#5d6b7c"),q("rect",335,55,60,210,"#c9c3b7"),q("triangle",315,5,100,95,"#6f7f8f"),q("rect",330,345,75,210,"#6b5544"),ell(350,285,42,70,"#78a8ca"),ell(430,320,55,55,"#78a8ca"),ell(250,320,55,55,"#78a8ca"),q("rect",355,20,20,90,"#d8d3c8"),q("rect",320,45,90,15,"#d8d3c8"));
  }else{
    p.push(ell(110,555,520,25,"#263c32",0,{opacity:.2}),q("rect",160,245,400,310,"#d1b18a",{gradient:["#f0d4ac","#8b694e"],depth:true}),q("triangle",125,120,470,180,"#596e7b"),q("rect",200,280,90,80,"#84c5dc"),q("rect",420,280,90,80,"#84c5dc"),q("rect",335,400,72,155,"#604632"));
    for(let i=0;i<5;i++)p.push(q("rect",165,270+i*54,390,6,"#7e634b",{opacity:.45}));
    p.push(q("rect",300,160,120,85,"#8d735a"),q("triangle",285,95,150,90,"#6f5848"));
  }
  const desc=kind==="glass"?"A glass office tower with a precise window grid, structural mullions and rooftop cap.":kind==="apartment"?"A mid-rise apartment block with repeated framed windows, roofline and entrance.":kind==="art-deco"?"A stepped Art Deco tower with a central crown, warm stone facade and vertical window rhythm.":kind==="school"?"A welcoming school building with a main entrance, central pediment and balanced window bays.":kind==="factory"?"An industrial factory with sawtooth roof, chimneys, broad windows and loading doors.":kind==="greenhouse"?"A glass greenhouse with framed roof panels and visible planted interior.":kind==="church"?"A small church with tower, cross, arched windows and a clear nave silhouette.":"A carefully layered residential building with roof, facade, door and divided windows.";
  return preset(id,name,"Buildings",desc,p);
}

const PRESETS:Preset[]=[
  makeTree("birch-tree","Silver birch","Pale trunk with black bark marks, fine branches and an airy crown.","column",{leaf:"#78a95b",light:"#a7c879",dark:"#4f7c48",trunk:"#e7e2d3"}),
  makeTree("oak-tree","English oak","Broad domed crown, thick branching structure and deep green leaf clusters.","round",{leaf:"#25804c",light:"#66b96a",dark:"#145d39",trunk:"#91613e"}),
  makeTree("cedar-tree","Atlas cedar","Strong trunk and broad, layered evergreen shelves with cool blue-green needles.","cedar",{leaf:"#397c75",light:"#74b4a2",dark:"#1d4f50",trunk:"#755139"}),
  makeTree("pine-tree","Scots pine","Tall conical silhouette with distinct whorls of branches and needle tiers.","conifer",{leaf:"#276d4b",light:"#54a66d",dark:"#174b39",trunk:"#8b603d"}),
  makeTree("apple-tree","Apple tree","Rounded orchard crown with visible red apples, little leaves and stout limbs.","round",{leaf:"#32894c",light:"#7ac66a",dark:"#1c663b",trunk:"#98643c",fruit:"#d94343"}),
  makeTree("maple-tree","Sugar maple","Wide balanced crown with a branching framework and rich green foliage.","round",{leaf:"#347f4b",light:"#85c86e",dark:"#1d6039",trunk:"#865a3b"}),
  makeTree("norway-spruce","Norway spruce","Dense narrow conical crown with descending branch tiers.","conifer",{leaf:"#175b49",light:"#3e9873",dark:"#0c3c36",trunk:"#73513a"}),
  makeTree("silver-fir","Silver fir","Symmetrical evergreen with layered branches and silvery needle highlights.","conifer",{leaf:"#306c65",light:"#8abdb0",dark:"#1b4a4b",trunk:"#816047"}),
  makeTree("italian-cypress","Italian cypress","Tall narrow columnar silhouette with tightly packed foliage.","narrow",{leaf:"#286a4b",light:"#5b9c6e",dark:"#174b38",trunk:"#76513a"}),
  makeTree("coast-redwood","Coast redwood","Towering straight trunk with a high slim crown and red-brown bark.","narrow",{leaf:"#28634b",light:"#659a68",dark:"#174736",trunk:"#a45f3d"}),
  makeTree("giant-sequoia","Giant sequoia","Broad redwood trunk, tapering crown and textured bark.","narrow",{leaf:"#316d4c",light:"#75a96d",dark:"#1a5039",trunk:"#9a5837"}),
  makeTree("weeping-willow","Weeping willow","Domed canopy with long hanging fronds that frame the trunk.","weeping",{leaf:"#5a9d54",light:"#a4ce70",dark:"#347443",trunk:"#806044"}),
  makeTree("cherry-blossom","Cherry blossom","Graceful branching tree with pink blossom clusters and warm bark.","round",{leaf:"#75a96b",light:"#b7ce85",dark:"#44794d",trunk:"#916246",blossom:"#f49ebc"}),
  makeTree("magnolia-tree","Magnolia","Broad glossy foliage with large cream-white blossoms.","round",{leaf:"#285e42",light:"#5c9661",dark:"#143f32",trunk:"#805a3d",blossom:"#f5e7d0"}),
  makeTree("baobab-tree","Baobab","Massive bottle-shaped trunk with a sparse high crown and spreading limbs.","baobab",{leaf:"#578e4e",light:"#91b965",dark:"#2b673f",trunk:"#a87448"}),
  makeTree("acacia-tree","Umbrella acacia","Flat umbrella canopy with branching trunk and delicate foliage.","umbrella",{leaf:"#6c9b52",light:"#b0c86c",dark:"#3e7045",trunk:"#805d3d"}),
  makeTree("date-palm","Date palm","Textured palm trunk and a radial crown of long arching fronds.","palm",{leaf:"#288c5d",light:"#67c887",dark:"#126344",trunk:"#a87443"}),
  makeTree("olive-tree","Olive tree","Irregular airy crown in muted silver-green with small olives.","round",{leaf:"#708a58",light:"#b1ba7c",dark:"#4b6744",trunk:"#8f6846",fruit:"#74844b"}),
  makeTree("poplar-tree","Lombardy poplar","Narrow upright crown with straight trunk and close-set foliage.","column",{leaf:"#438b58",light:"#93bf72",dark:"#2b6b49",trunk:"#88745b"}),
  makeTree("dogwood-tree","Flowering dogwood","Compact rounded crown with pale blossoms and clear branching.","round",{leaf:"#3e8b57",light:"#8bc87c",dark:"#266c45",trunk:"#835b40",blossom:"#f7e9df"}),

  makeGrass("grass-tuft","Grass blades","tuft"),makeGrass("meadow-strip","Flowering meadow","meadow"),makeGrass("cattails","Cattails & reeds","reeds"),
  makeGrass("fern-frond","Fern frond","fern"),makeGrass("bamboo-grove","Bamboo grove","bamboo"),makeGrass("wheat-stalks","Wheat stalks","wheat"),

  makeFlower("daisy","White daisy","daisy"),makeFlower("sunflower","Sunflower","sunflower"),makeFlower("tulip","Tulip","tulip"),makeFlower("rose","Red rose","rose"),
  makeFlower("lavender","Lavender","lavender"),makeFlower("hibiscus","Hibiscus","hibiscus"),makeFlower("bluebells","Bluebells","bluebells"),makeFlower("cherry-sprig","Cherry blossom sprig","cherry"),

  planetPreset("sun","Sun","Radiant star with warm layered surface and evenly spaced rays.","sun"),
  planetPreset("mercury","Mercury","Small rocky planet with grey crater basins and illuminated rims.","mercury"),
  planetPreset("venus","Venus","Golden cloud-covered planet with broad atmospheric bands.","venus"),
  planetPreset("earth","Earth","Blue oceans, distinct continents, polar cloud bands and bright atmosphere.","earth"),
  planetPreset("moon","Earth's Moon","Pale lunar surface with crater depressions and raised rims.","moon"),
  planetPreset("mars","Mars","Rust-red planet with crater details and subtle surface variation.","mars"),
  planetPreset("jupiter","Jupiter","Banded gas giant with layered atmospheric belts and its Great Red Spot.","jupiter"),
  planetPreset("saturn","Saturn","Golden gas giant with a broad tilted ring system and atmospheric bands.","saturn"),
  planetPreset("uranus","Uranus","Pale cyan ice giant with a delicate tilted ring.","uranus"),
  planetPreset("neptune","Neptune","Deep-blue ice giant with flowing cloud bands and a storm feature.","neptune"),
  planetPreset("pluto","Pluto","Icy dwarf planet with varied terrain and a pale heart-shaped region.","pluto"),

  makeHouse("family-house","Family home","house"),makeHouse("country-cottage","Country cottage","cottage"),makeHouse("log-cabin","Log cabin","cabin"),
  makeHouse("glass-tower","Glass skyscraper","glass"),makeHouse("apartment-block","Apartment building","apartment"),makeHouse("art-deco-tower","Art Deco tower","art-deco"),
  makeHouse("school-building","School building","school"),makeHouse("factory-building","Industrial factory","factory"),makeHouse("greenhouse","Glass greenhouse","greenhouse"),
  makeHouse("small-church","Village church","church"),makeHouse("townhouse","Townhouse","townhouse"),

  preset("mountain-range","Alpine mountain range","Landscapes","Layered peaks, snow faces, distant sun and foothills.",[
    ell(535,65,105,105,"#ffd16b"),q("triangle",45,165,390,390,"#456e8d"),q("triangle",300,95,400,460,"#315675"),
    q("triangle",140,240,290,290,"#7695a9"),q("triangle",320,95,160,180,"#f0f5ef"),q("triangle",468,180,135,150,"#e9f1ed"),
    ell(0,480,470,145,"#347c65"),ell(330,470,520,150,"#286c58"),ell(70,510,580,85,"#3f8c64")
  ]),
  preset("rainbow-clouds","Rainbow & clouds","Landscapes","Layered rainbow framed by soft cloud banks.",[
    ell(135,75,450,460,"#e65f62"),ell(175,115,370,380,"#f49b4f"),ell(215,155,290,300,"#f4d35e"),
    ell(255,195,210,220,"#5bc783"),ell(295,235,130,140,"#5aa6e2"),ell(335,275,50,60,"#997ce0"),
    q("rect",100,365,520,210,"#111a35"),ell(40,330,270,175,"#edf5ff"),ell(450,330,270,175,"#edf5ff"),
    ell(145,285,185,140,"#f8fbff"),ell(415,285,185,140,"#f8fbff")
  ]),
  preset("wind-turbine","Wind turbine","Objects","Three-blade clean-energy turbine with tapered tower and hub.",[
    q("trapezoid",382,275,36,285,"#e2edf4",{gradient:["#ffffff","#9ab8cf"],depth:true}),
    q("triangle",380,45,42,220,"#f5f8fb"),q("triangle",180,255,210,45,"#e9f3f8",{rotation:-18}),q("triangle",405,255,210,45,"#dcebf3",{rotation:145}),
    ell(360,235,80,80,"#7aabc8",{stroke:"#e8f7ff",strokeWidth:7}),ell(386,258,28,28,"#ffd36b"),q("rect",260,560,280,18,"#7393a6")
  ]),
  preset("rocket","Launch rocket","Objects","Multi-part launch vehicle with nose cone, fins, porthole, panel seams and flame.",[
    q("roundRect",300,130,200,340,"#e8edf5",{radius:95,stroke:"#91a8c4",strokeWidth:8,gradient:["#ffffff","#a9c1d8"],depth:true}),
    q("triangle",300,30,200,180,"#e85c58"),q("triangle",230,360,110,150,"#e85c58"),q("triangle",460,360,110,150,"#e85c58"),
    ell(350,220,105,105,"#4aa5d6",{stroke:"#d7f3ff",strokeWidth:12}),ell(368,238,35,28,"#dff7ff",0,{opacity:.6}),
    q("rect",380,360,40,65,"#b9c8d8"),q("triangle",335,455,130,145,"#ff9c39"),q("triangle",365,480,70,100,"#ffe16b"),
    q("rect",322,185,76,8,"#8c9eaf"),q("rect",322,420,76,8,"#8c9eaf")
  ]),
];

export const SHAPE_PRESET_CATEGORIES=["All","Trees","Grass & foliage","Flowers","Planets","Buildings","Landscapes","Objects"] as const;
export type ShapePresetCategory=typeof SHAPE_PRESET_CATEGORIES[number];
export const SHAPE_PRESET_IDS=PRESETS.map(item=>item.id);
export const SHAPE_PRESET_COUNTS=Object.fromEntries(SHAPE_PRESET_CATEGORIES.slice(1).map(category=>[category,PRESETS.filter(item=>item.category===category).length])) as Record<Category,number>;

export function createShapePresetElements(id:string,slideWidth:number,slideHeight:number):ShapeEl[]{
  const item=PRESETS.find(entry=>entry.id===id);if(!item)return[];
  const scale=Math.min(1,(slideWidth*.76)/720,(slideHeight*.82)/600),left=(slideWidth-720*scale)/2,top=(slideHeight-600*scale)/2,groupId=uid("g_");
  return item.parts.map((part,index)=>makeShape(part.shape,{
    name:part.name??(item.name+" · "+String(index+1).padStart(2,"0")),
    x:left+part.x*scale,y:top+part.y*scale,w:Math.max(4,part.w*scale),h:Math.max(4,part.h*scale),
    fill:part.fill,fill2:part.gradient?.[part.gradient.length-1]??part.fill,gradient:!!part.gradient,
    gradientColors:part.gradient??[part.fill,part.fill],gradientAngle:135,gradientType:"linear",
    stroke:part.stroke??(part.shape==="line"||part.shape==="arrow"?part.fill:"transparent"),
    strokeWidth:(part.strokeWidth??(part.shape==="line"||part.shape==="arrow"?8:0))*scale,
    rotation:part.rotation??0,radius:(part.radius??0)*scale,opacity:part.opacity??1,groupId,
    shadow:part.depth?{on:true,x:0,y:7*scale,blur:16*scale,color:"rgba(0,0,0,0.22)"}:{on:false,x:0,y:0,blur:0,color:"rgba(0,0,0,0)"},
  }));
}

function Preview({item}:{item:Preset}){
  const polygons:Partial<Record<ShapeKind,string>>={
    triangle:"50,0 100,100 0,100",rightTriangle:"0,0 100,100 0,100",star:"50,0 61,35 98,35 68,57 79,95 50,72 21,95 32,57 2,35 39,35",
    diamond:"50,0 100,50 50,100 0,50",pentagon:"50,0 100,38 82,100 18,100 0,38",hexagon:"25,0 75,0 100,50 75,100 25,100 0,50",
    octagon:"30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30",trapezoid:"18,0 82,0 100,100 0,100",
    parallelogram:"20,0 100,0 80,100 0,100",heart:"50,92 8,52 4,30 15,12 34,8 50,27 66,8 85,12 96,30 92,52",
    cloud:"18,75 5,65 4,48 13,34 29,31 34,14 49,5 64,11 70,27 88,25 98,42 94,60 82,69 82,82",
    chevron:"0,0 75,0 100,50 75,100 0,100 25,50",plus:"35,0 65,0 65,35 100,35 100,65 65,65 65,100 35,100 35,65 0,65 0,35 35,35"
  };
  const fillFor=(part:Part,index:number)=>part.gradient?"url(#preset-"+item.id+"-"+index+")":part.fill;
  return <svg viewBox="0 0 720 600" className="shape-preset-art" aria-hidden="true">
    <defs>{item.parts.map((part,index)=>part.gradient?<linearGradient key={index} id={"preset-"+item.id+"-"+index} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={part.gradient[0]}/><stop offset="100%" stopColor={part.gradient[part.gradient.length-1]}/></linearGradient>:null)}</defs>
    {item.parts.map((part,index)=>{
      const common={fill:fillFor(part,index),stroke:part.stroke??"none",strokeWidth:part.strokeWidth??0,opacity:part.opacity??1};
      const transform="rotate("+(part.rotation??0)+" "+(part.x+part.w/2)+" "+(part.y+part.h/2)+")";
      if(part.shape==="line"||part.shape==="arrow")return <line key={index} x1={part.x} y1={part.y+part.h/2} x2={part.x+part.w-15} y2={part.y+part.h/2} stroke={part.stroke??part.fill} strokeWidth={Math.max(4,part.strokeWidth??8)} transform={transform}/>;
      if(part.shape==="ellipse")return <ellipse key={index} cx={part.x+part.w/2} cy={part.y+part.h/2} rx={part.w/2} ry={part.h/2} {...common} transform={transform}/>;
      const shape=polygons[part.shape];
      if(shape)return <polygon key={index} points={shape.split(" ").map(point=>{const [x,y]=point.split(",").map(Number);return (part.x+(x??0)*part.w/100)+","+(part.y+(y??0)*part.h/100);}).join(" ")} {...common} transform={transform}/>;
      return <rect key={index} x={part.x} y={part.y} width={part.w} height={part.h} rx={part.shape==="roundRect"?Math.min(part.h/2,40):0} {...common} transform={transform}/>;
    })}
  </svg>;
}

export function ShapePresetGallery({onInsert}:{onInsert:(id:string)=>void}){
  const anchor=useRef<HTMLDivElement>(null),menu=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false),[category,setCategory]=useState<ShapePresetCategory>("All"),[search,setSearch]=useState("");
  const [position,setPosition]=useState({top:0,left:12});
  const filtered=useMemo(()=>PRESETS.filter(item=>(category==="All"||item.category===category)&&(item.name+" "+item.description+" "+item.category).toLowerCase().includes(search.toLowerCase().trim())),[category,search]);
  useEffect(()=>{
    if(!open)return;
    const close=(event:PointerEvent)=>{const target=event.target as Node;if(!anchor.current?.contains(target)&&!menu.current?.contains(target))setOpen(false);};
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    document.addEventListener("pointerdown",close);document.addEventListener("keydown",key);
    return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",key);};
  },[open]);
  const toggle=()=>{
    if(!open){const rect=anchor.current?.getBoundingClientRect();if(rect)setPosition({top:Math.max(12,Math.min(rect.bottom+8,window.innerHeight-700)),left:Math.max(12,Math.min(rect.left,window.innerWidth-760))});}
    setOpen(value=>!value);
  };
  return <>
    <div ref={anchor} className="shape-picker-anchor">
      <Button type="button" variant="ghost" className="shape-picker-trigger shape-preset-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}><Sparkles size={17}/><span>Illustrations</span><ChevronDown size={13}/></Button>
    </div>
    {open&&typeof document!=="undefined"&&createPortal(
      <section ref={menu} className="shape-preset-gallery" role="dialog" aria-label="Illustration and shape presets" style={{top:position.top,left:position.left}}>
        <header className="shape-preset-header"><div><strong>Illustrations & shape presets</strong><small>{PRESETS.length} illustrations · native editable layers</small></div><Button size="icon" variant="ghost" onClick={()=>setOpen(false)} aria-label="Close presets"><X size={17}/></Button></header>
        <div className="shape-preset-search"><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search birch, oak, Jupiter, apartments…" aria-label="Search illustrations"/></div>
        <nav className="shape-preset-categories" aria-label="Preset categories">{SHAPE_PRESET_CATEGORIES.map(item=><button key={item} type="button" className={category===item?"active":""} onClick={()=>setCategory(item)}>{item}{item!=="All"&&<span>{SHAPE_PRESET_COUNTS[item]}</span>}</button>)}</nav>
        <div className="shape-preset-grid">{filtered.map(item=><button key={item.id} type="button" className="shape-preset-card" onClick={()=>{onInsert(item.id);setOpen(false);}}>
          <span className="shape-preset-preview"><Preview item={item}/></span><span className="shape-preset-card-title">{item.name}</span><span className="shape-preset-card-meta">{item.category} · {item.parts.length} editable layers</span><span className="shape-preset-card-description">{item.description}</span>
        </button>)}</div>
        {!filtered.length&&<p className="shape-preset-empty">No illustrations match that search. Try another name or category.</p>}
        <footer className="shape-preset-footer">Insert a complete illustration. Move and scale it as one group, or ungroup it to edit each leaf, petal, window, planet detail or architectural feature.</footer>
      </section>,document.body
    )}
  </>;
}
