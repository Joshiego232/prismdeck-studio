import type { CharacterRig, RigBone, RigJoint, Vector2 } from "./model";

export type AnimationAssetCategory = "Characters" | "Trees" | "Foliage" | "Buildings";
export type VectorPartKind = "rect" | "ellipse" | "circle" | "line" | "path" | "polygon";

export interface VectorPart {
  id: string;
  kind: VectorPartKind;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  x2?: number;
  y2?: number;
  points?: string;
  path?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  opacity?: number;
  rx?: number;
}

export interface AnimationAsset {
  id: string;
  name: string;
  category: AnimationAssetCategory;
  width: number;
  height: number;
  description: string;
  tags: string[];
  parts: VectorPart[];
  rig?: CharacterRig;
}

const p = (id: string, kind: VectorPartKind, values: Omit<VectorPart, "id" | "kind">): VectorPart => ({ id, kind, ...values });
const ellipse = (id: string, x: number, y: number, width: number, height: number, fill: string, rotation = 0, stroke?: string) =>
  p(id, "ellipse", { x, y, width, height, fill, rotation, stroke, strokeWidth: stroke ? 2 : 0 });
const rect = (id: string, x: number, y: number, width: number, height: number, fill: string, rx = 0, stroke?: string) =>
  p(id, "rect", { x, y, width, height, fill, rx, stroke, strokeWidth: stroke ? 2 : 0 });
const path = (id: string, d: string, fill: string, stroke = "none", strokeWidth = 0) =>
  p(id, "path", { path: d, fill, stroke, strokeWidth });
const line = (id: string, x: number, y: number, x2: number, y2: number, stroke: string, strokeWidth = 3) =>
  p(id, "line", { x, y, x2, y2, stroke, strokeWidth });

function makeTree(index: number, name: string, palette: [string, string, string], form: number): AnimationAsset {
  const [leaf, light, dark] = palette;
  const parts: VectorPart[] = [
    path("roots", "M92 215 Q75 235 47 237 Q75 230 82 218 Q55 225 35 218 Q67 222 88 207 Q109 224 143 218 Q119 232 101 218 Q111 237 137 240 Q105 238 92 215Z", "#68452f"),
    path("trunk", "M82 230 Q88 180 78 142 Q69 105 82 73 Q91 93 98 126 Q105 166 101 230Z", "#805334", "#493522", 3),
    path("branch-left", "M84 157 Q52 129 39 94 Q61 122 91 135Z", "#805334"),
    path("branch-right", "M99 149 Q128 121 143 89 Q130 132 102 166Z", "#805334"),
  ];
  const crownY = form % 3 === 0 ? 46 : 57;
  const crownW = form % 4 === 0 ? 148 : 132;
  parts.push(ellipse("crown-core", 90-crownW/2, crownY, crownW, 126, dark));
  const clusters = [
    [48,58,63,70],[92,28,70,82],[129,62,66,74],[24,90,59,62],[90,95,86,78],[145,103,48,54],
    [65,8,50,46],[117,12,45,50],[9,69,39,48],[151,66,41,49]
  ];
  clusters.forEach(([x,y,w,h], i) => {
    parts.push(ellipse("leaf-cluster-"+i, x, y, w, h, i%3===0?dark:leaf, (i*13+index*7)%34-17));
  });
  for (let i=0;i<9;i++) {
    const x=34+(i*29+index*11)%116, y=35+(i*17+index*5)%102;
    parts.push(ellipse("sunlit-leaf-"+i, x, y, 17+(i%3)*5, 11+(i%2)*6, light, (i*19)%70-35));
  }
  if (index%4===1) {
    for(let i=0;i<6;i++) parts.push(ellipse("fruit-"+i, 35+(i*23)%112, 83+(i*31)%72, 10, 13, "#d96e47"));
  }
  if (index%5===2) parts.push(path("tree-cavity","M77 230 Q80 200 91 193 Q102 202 104 230Z","#3f342b"));
  return { id:"tree-"+(index+1), name, category:"Trees", width:180, height:250, description:"Layered tree illustration with independently editable foliage clusters, branches and trunk.", tags:["nature","environment","tree","vector","layered"], parts };
}

const treeData: Array<[string,[string,string,string],number]> = [
  ["Oak Tree",["#447c42","#86aa59","#315b37"],0],["Maple Tree",["#b85f37","#e59a48","#823f32"],1],
  ["Golden Birch",["#8f9c43","#c8c66a","#596b36"],2],["Pine Evergreen",["#276b58","#569678","#194c49"],3],
  ["Cedar Tree",["#315e4d","#719d67","#203f3b"],4],["Cherry Blossom",["#cc8da7","#f0c5d3","#9e668b"],5],
  ["Willow Tree",["#6a965c","#b5c98a","#416d4c"],6],["Palm Tree",["#357f66","#83ae63","#775239"],7],
  ["Baobab Tree",["#6d8a4d","#a4b86a","#776047"],8],["Autumn Flame",["#bb542f","#ec9c3c","#79392d"],9],
  ["Silver Poplar",["#708d75","#b5c7ac","#4c6d68"],10],["Rainforest Canopy",["#1f7755","#5caa69","#15513e"],11],
  ["Cypress Tree",["#386c56","#6a9870","#254e45"],12],["Acacia Tree",["#6d934b","#b4bf62","#77573b"],13],
  ["Snow Spruce",["#477a71","#a4c8b5","#315c5b"],14],["Flowering Dogwood",["#50844e","#e8c6d0","#385c3e"],15],
  ["Desert Joshua Tree",["#799452","#b6bb75","#8b6242"],16],
];
export const TREE_ASSETS = treeData.map(([name, colors, form], index) => makeTree(index,name,colors,form));

function makeFoliage(index: number, name: string, color: string, highlight: string, pattern: number): AnimationAsset {
  const parts: VectorPart[] = [];
  const cx=90;
  if(pattern%4===0) {
    parts.push(path("stem","M90 235 Q84 145 89 30", "#577d43", "none"));
    for(let i=0;i<9;i++) {
      const y=40+i*21, side=i%2===0?-1:1, len=30+(i*7+index*3)%25;
      parts.push(path("fern-leaf-"+i, `M90 ${y+22} Q${90+side*len*.7} ${y+6} ${90+side*len} ${y-7} Q${90+side*len*.5} ${y+18} 90 ${y+22}Z`, i%2?color:highlight));
      for(let j=1;j<=3;j++) parts.push(line("fern-vein-"+i+"-"+j,90,y+18,90+side*len*j/4,y+18-j*7,"#b5c88a",2));
    }
  } else if(pattern%4===1) {
    parts.push(path("grass-base","M22 230 Q90 245 158 230Z","#537a3c"));
    for(let i=0;i<13;i++) {
      const x=25+i*11, top=36+(i*37+index*11)%100;
      parts.push(path("blade-"+i,`M90 232 Q${x-15} 150 ${x} ${top} Q${x+9} 157 90 232Z`,i%3===0?highlight:color));
    }
  } else if(pattern%4===2) {
    for(let i=0;i<8;i++) {
      const x=17+(i%4)*38, y=86+Math.floor(i/4)*62;
      parts.push(ellipse("bush-cluster-"+i,x,y,68,78,i%3===0?highlight:color,(i%2?12:-12)));
      parts.push(ellipse("bush-shine-"+i,x+18,y+14,20,12,"#c3d58b",(i%2?18:-18)));
    }
  } else {
    parts.push(path("succulent-base","M90 235 Q65 248 45 238 Q70 224 90 226 Q110 224 135 238 Q115 248 90 235Z","#7c664a"));
    for(let i=0;i<12;i++) {
      const angle=i*30, r=56+(i%3)*8;
      const rad=angle*Math.PI/180, x=90+Math.cos(rad)*r*.45, y=160+Math.sin(rad)*r*.55;
      parts.push(ellipse("succulent-leaf-"+i,x-13,y-48,27,91,i%3===0?highlight:color,angle-90,"#355e45"));
    }
  }
  if(index%3===0) {
    for(let i=0;i<5;i++) {
      const x=50+i*20, y=54+(i%2)*17;
      for(let j=0;j<5;j++) parts.push(ellipse("petal-"+i+"-"+j,x+Math.cos(j*1.256)*10,y+Math.sin(j*1.256)*10,13,17,"#eeb5bf",j*72));
      parts.push(ellipse("flower-center-"+i,x-5,y-5,10,10,"#e2ae49"));
    }
  }
  return {id:"foliage-"+(index+1),name,category:"Foliage",width:180,height:250,description:"Decorative botanical vector asset built from editable leaf, stem and flower components.",tags:["foliage","plant","nature","vector","layered"],parts};
}
const foliageNames = [
  "Royal Fern","Feather Fern","Sword Fern","Tropical Elephant Ear","Monstera Leaves","Fan Palm Undergrowth",
  "Wild Meadow Grass","Tall Prairie Grass","Reed Clump","Golden Pampas","Round Garden Shrub","Boxwood Cluster",
  "Flowering Hydrangea","Wild Rose Bush","Lavender Clump","Desert Succulent","Aloe Rosette","Agave Plant",
  "Hanging Ivy","Creeping Groundcover","Jungle Vine","Water Lily Cluster","Broadleaf Host Plant","Autumn Groundcover",
];
export const FOLIAGE_ASSETS = foliageNames.map((name,index)=>makeFoliage(index,name,
  ["#39724e","#548c55","#286b60","#72954c","#326c47","#638d50"][index%6],
  ["#9cba70","#a6c77c","#8dbb83","#b8c97e"][index%4],index));

function makeBuilding(index:number,name:string,style:number,facade:string,trim:string):AnimationAsset {
  const parts:VectorPart[]=[];
  const widths=[142,154,132,164,148], x=90-widths[style%5]/2, w=widths[style%5];
  const floors=5+(index%7), floorH=25, top=248-floors*floorH;
  parts.push(rect("foundation",x-8,238,w+16,12,"#37404b",2));
  parts.push(rect("building-body",x,top,w,248-top,facade,3,trim));
  if(style%5===0) parts.push(path("angular-roof",`M${x-5} ${top+5} L90 ${top-28} L${x+w+5} ${top+5}Z`,trim));
  else if(style%5===1) parts.push(rect("roof-cap",x-5,top-9,w+10,10,trim,2));
  else if(style%5===2) parts.push(rect("parapet",x+4,top-18,w-8,18,trim,2));
  else if(style%5===3) parts.push(path("stepped-roof",`M${x-6} ${top+8} L${x-6} ${top-4} L${x+20} ${top-4} L${x+20} ${top-18} L${x+w-20} ${top-18} L${x+w-20} ${top-4} L${x+w+6} ${top-4} L${x+w+6} ${top+8}Z`,trim));
  else parts.push(rect("roof-terrace",x+8,top-12,w-16,12,trim,3));
  parts.push(rect("street-entry",82,208,18,40,"#243744",2,"#9aa6aa"));
  parts.push(rect("door-glass",84,214,6,25,"#71b7c8",1));
  const col=style%3===0?"#b9e7f0":style%3===1?"#d5b881":"#7b9ca8";
  for(let floor=0;floor<floors;floor++) {
    for(let colIndex=0;colIndex<Math.max(2,Math.floor(w/29));colIndex++) {
      const wx=x+12+colIndex*27, wy=top+14+floor*floorH;
      if(style%4===2) {
        parts.push(rect("window-"+floor+"-"+colIndex,wx,wy,15,18,col,1,"#46545c"));
        parts.push(line("sill-"+floor+"-"+colIndex,wx-2,wy+19,wx+17,wy+19,trim,2));
      } else {
        parts.push(rect("window-"+floor+"-"+colIndex,wx,wy,17,17,col,2,"#475963"));
        parts.push(line("mullion-v-"+floor+"-"+colIndex,wx+8,wy,wx+8,wy+17,"#52616b",1.5));
        if(style%3===0) parts.push(rect("balcony-"+floor+"-"+colIndex,wx-3,wy+18,22,3,trim,1));
      }
    }
    parts.push(line("floor-line-"+floor,x+2,top+(floor+1)*floorH,x+w-2,top+(floor+1)*floorH,"#687681",1.5));
  }
  if(index%3===0) parts.push(rect("neon-sign",x+25,top+8,w-50,9,"#e4a55a",3));
  if(index%4===1) parts.push(ellipse("roof-dish",x+w-23,top-29,13,13,"#92b8bd"));
  return {id:"building-"+(index+1),name,category:"Buildings",width:180,height:260,description:"Multi-storey city building assembled from editable facade, roof, window, sign and entrance parts.",tags:["city","architecture","building","environment","vector","layered"],parts};
}
const buildingData:Array<[string,number,string,string]>=[
 ["Glass Spine Tower",0,"#526b7b","#8ec2ca"],["Art Deco Crown",1,"#8e7567","#d7b578"],
 ["Brick Clockhouse",2,"#875a4c","#d7b18a"],["Modernist Offices",3,"#657f8c","#b2d0d3"],
 ["Corner Brownstone",4,"#8b6656","#d9bd9b"],["Skyline Hotel",0,"#536a85","#e6c27e"],
 ["Industrial Depot",2,"#73716d","#c49a65"],["Terrace Apartments",3,"#927c70","#dfbf96"],
 ["Rooftop Loft",4,"#7b8580","#d0c4a5"],["Civic Hall",1,"#a38c72","#e2d2b5"],
 ["Market Arcade",2,"#9b7457","#e6c48d"],["Harbour Tower",0,"#506e7e","#9ec9ce"],
 ["Museum Atrium",3,"#8b9c99","#d8d6c7"],["Urban Warehouse",4,"#6f7774","#c1a77d"],
];
export const BUILDING_ASSETS=buildingData.map(([name,style,facade,trim],index)=>makeBuilding(index,name,style,facade,trim));

interface CharacterStyle {
  name:string; category:AnimationAssetCategory; skin:string; hair:string; shirt:string; pants:string;
  accent:string; hairStyle:number; accessory:number; description:string;
}
const joints:RigJoint[]=[
 {id:"head",name:"Head",position:{x:90,y:36}},
 {id:"neck",name:"Neck",position:{x:90,y:68}},
 {id:"shoulderL",name:"Left shoulder",position:{x:62,y:82}},
 {id:"elbowL",name:"Left elbow",position:{x:43,y:116}},
 {id:"handL",name:"Left hand",position:{x:28,y:148}},
 {id:"shoulderR",name:"Right shoulder",position:{x:118,y:82}},
 {id:"elbowR",name:"Right elbow",position:{x:137,y:116}},
 {id:"handR",name:"Right hand",position:{x:152,y:148}},
 {id:"hip",name:"Hip",position:{x:90,y:158}},
 {id:"kneeL",name:"Left knee",position:{x:70,y:205}},
 {id:"footL",name:"Left foot",position:{x:62,y:246}},
 {id:"kneeR",name:"Right knee",position:{x:110,y:205}},
 {id:"footR",name:"Right foot",position:{x:118,y:246}},
];
function makeCharacter(index:number,style:CharacterStyle):AnimationAsset {
 const bones:RigBone[]=[
  ["neck","head",12,style.skin],["neck","shoulderL",17,style.shirt],["neck","shoulderR",17,style.shirt],
  ["shoulderL","elbowL",16,style.shirt],["elbowL","handL",12,style.skin],["shoulderR","elbowR",16,style.shirt],["elbowR","handR",12,style.skin],
  ["neck","hip",38,style.shirt],["hip","kneeL",21,style.pants],["kneeL","footL",16,style.pants],["hip","kneeR",21,style.pants],["kneeR","footR",16,style.pants],
 ].map(([from,to,thickness,color],i)=>({id:"bone-"+i,name:String(i),fromJointId:String(from),toJointId:String(to),thickness:Number(thickness),color:String(color),cap:"round" as const}));
 const rig:CharacterRig={id:"rig-"+index,name:style.name+" rig",joints:structuredClone(joints),bones,pivot:{x:90,y:140},defaultColor:style.shirt,defaultThickness:15};
 const parts:VectorPart[]=[];
 // Head and face details.
 parts.push(ellipse("head-base",65,9,50,56,style.skin,0,"#392d30"));
 parts.push(ellipse("ear-left",58,33,12,17,style.skin),ellipse("ear-right",110,33,12,17,style.skin));
 parts.push(ellipse("eye-left",77,31,5,7,"#272a36"),ellipse("eye-right",99,31,5,7,"#272a36"));
 parts.push(path("nose","M90 37 L86 44 L92 45","none","#704b46",2));
 parts.push(path("mouth","M82 51 Q90 56 98 51","none","#653e3d",2));
 if(style.hairStyle===0) parts.push(path("hair","M62 29 Q56 -1 82 2 L90 -5 L99 5 Q126 -2 119 35 Q108 18 101 22 L91 11 L79 25 L70 16Z",style.hair));
 else if(style.hairStyle===1) parts.push(path("hair","M62 24 Q55 2 75 0 Q99 -7 117 14 L111 36 Q99 19 84 21 L70 34Z",style.hair));
 else if(style.hairStyle===2) parts.push(path("hair","M61 27 Q52 5 75 1 L117 4 Q128 22 114 37 Q106 18 95 17 L82 28 L70 18Z",style.hair));
 else parts.push(path("hair","M65 17 Q84 -8 109 7 L120 30 Q103 23 100 14 Q88 30 74 27 L63 39Z",style.hair));
 // Costume trim, belt, cuffs and footwear are separate shapes in the asset definition.
 parts.push(rect("belt",70,151,40,9,style.accent,3));
 parts.push(rect("buckle",86,151,9,9,"#f5d47c",2));
 parts.push(ellipse("boot-left",48,236,29,15,style.accent),ellipse("boot-right",105,236,29,15,style.accent));
 parts.push(path("boot-sole","M46 249 Q60 243 78 249 L77 255 L44 255Z","#34333b"));
 parts.push(path("boot-sole-r","M103 249 Q119 243 134 249 L136 255 L104 255Z","#34333b"));
 parts.push(rect("wrist-cuff-l",20,139,17,8,style.accent,3),rect("wrist-cuff-r",144,139,17,8,style.accent,3));
 // Individual costume accents.
 if(style.accessory===0) parts.push(path("cape","M70 73 L48 86 L33 197 L77 166 L90 89 L103 166 L147 197 L132 86 L110 73Z",style.accent,"#362f48",2));
 if(style.accessory===1) parts.push(path("scarf","M67 62 Q90 75 113 62 L119 78 Q92 91 61 78Z",style.accent));
 if(style.accessory===2) parts.push(rect("utility-strap",74,76,9,76,style.accent,4));
 if(style.accessory===3) parts.push(path("shoulder-armor","M54 72 L91 66 L126 73 L118 92 L90 84 L62 94Z",style.accent));
 parts.push(path("chest-mark","M78 91 L90 83 L102 91 L99 111 L90 119 L81 111Z",style.accent,"#fff3d4",2));
 parts.push(line("chest-mark-line",90,90,90,111,"#fff3d4",2));
 if(index%3===0) parts.push(ellipse("cheek-light",70,43,8,4,"#efb4a3",0));
 if(index%4===2) parts.push(path("headband","M61 21 Q90 10 119 21 L118 29 Q90 18 62 30Z",style.accent));
 return {id:"character-"+index,name:style.name,category:"Characters",width:180,height:260,description:style.description,tags:["character","rigged","keyframe-ready","original-design","vector"],parts,rig};
}

const heroStyles:CharacterStyle[]=[
 {name:"Solar Saiyan Warrior",category:"Characters",skin:"#e4ad87",hair:"#efc94e",shirt:"#e47a32",pants:"#335b9b",accent:"#f8d978",hairStyle:0,accessory:3,description:"Original spiky-haired cosmic martial artist with a fully jointed body rig."},
 {name:"Crimson Shinobi",category:"Characters",skin:"#d99a78",hair:"#292a37",shirt:"#d65b48",pants:"#30394f",accent:"#e9b75d",hairStyle:1,accessory:1,description:"Original agile ninja hero with a flexible scarf and full-body rig."},
 {name:"Neon Tech Hero",category:"Characters",skin:"#b97959",hair:"#3d302c",shirt:"#276d58",pants:"#3b4b4d",accent:"#a1ed87",hairStyle:2,accessory:2,description:"Original young technology hero with bright utility accents and articulated limbs."},
 {name:"Scarlet Velocity",category:"Characters",skin:"#c98770",hair:"#462f31",shirt:"#b53142",pants:"#7f283a",accent:"#ffd078",hairStyle:3,accessory:2,description:"Original scarlet speedster suit with gold trim and an animation-ready rig."},
 {name:"Obsidian Velocity",category:"Characters",skin:"#b87765",hair:"#171d2b",shirt:"#262b3b",pants:"#151b2c",accent:"#69cde1",hairStyle:1,accessory:3,description:"Original dark speedster with cool electric accents and articulated joints."},
 {name:"Solar Sentinel",category:"Characters",skin:"#d89c7d",hair:"#5d392c",shirt:"#27528e",pants:"#263d68",accent:"#d34e4e",hairStyle:2,accessory:0,description:"Original caped solar guardian with a strong heroic silhouette."},
 {name:"Lunar Blade",category:"Characters",skin:"#d6aa99",hair:"#7a8192",shirt:"#596b91",pants:"#343c5d",accent:"#a8d9e9",hairStyle:3,accessory:1,description:"Original moonlit swordswoman with flowing scarf details."},
 {name:"Storm Mage",category:"Characters",skin:"#c88d70",hair:"#313b65",shirt:"#4d5994",pants:"#37375e",accent:"#80d9e8",hairStyle:0,accessory:1,description:"Original storm caster with layered robes and luminous costume accents."},
 {name:"Mecha Pilot",category:"Characters",skin:"#ddb08c",hair:"#4a3031",shirt:"#a4acb4",pants:"#4b596b",accent:"#e5a34c",hairStyle:1,accessory:2,description:"Original sci-fi pilot in a detailed utility flight suit."},
 {name:"Cyber Ninja",category:"Characters",skin:"#b77f69",hair:"#151e30",shirt:"#293f5e",pants:"#182b42",accent:"#55d7c8",hairStyle:2,accessory:3,description:"Original cybernetic shadow fighter with luminous teal details."},
 {name:"Astral Archer",category:"Characters",skin:"#dcae91",hair:"#7d4e3e",shirt:"#557f70",pants:"#394c43",accent:"#e6c978",hairStyle:3,accessory:2,description:"Original fantasy archer with a layered tunic and utility strap."},
 {name:"Void Knight",category:"Characters",skin:"#bd8977",hair:"#201e2c",shirt:"#41354f",pants:"#28263d",accent:"#b17adc",hairStyle:0,accessory:0,description:"Original armored void knight with a flowing cape silhouette."},
 {name:"Crystal Mage",category:"Characters",skin:"#d7a58d",hair:"#9a6da3",shirt:"#725a90",pants:"#4a416a",accent:"#90dbe7",hairStyle:1,accessory:1,description:"Original crystal caster with pastel magical accents."},
 {name:"Frost Runner",category:"Characters",skin:"#e1b69c",hair:"#c7dce8",shirt:"#5f9ab4",pants:"#526f8c",accent:"#e6f4f4",hairStyle:2,accessory:2,description:"Original arctic runner with insulated suit styling."},
 {name:"Jade Titan",category:"Characters",skin:"#8c604d",hair:"#252b26",shirt:"#4b805c",pants:"#335642",accent:"#b5dc7e",hairStyle:3,accessory:3,description:"Original powerful forest guardian with jade armour accents."},
 {name:"Star Ranger",category:"Characters",skin:"#d7a184",hair:"#453a55",shirt:"#526a9a",pants:"#343e6b",accent:"#e9a968",hairStyle:0,accessory:2,description:"Original interstellar explorer with a flight-ready costume."},
 {name:"Ember Alchemist",category:"Characters",skin:"#c8876f",hair:"#8f3c32",shirt:"#984936",pants:"#52404a",accent:"#f2b15f",hairStyle:1,accessory:1,description:"Original flame alchemist with copper and ember details."},
];
const defaultStyles:CharacterStyle[]=[
 ["Everyday Boy","#d8a27e","#513a31","#4380a6","#394b63","#e3b36e",0],
 ["Everyday Girl","#e5b69a","#593b38","#9b668f","#56506e","#e9c6aa",1],
 ["Young Teen","#bd866b","#2a2832","#668c76","#3f5149","#e0bd71",2],
 ["Adult Man","#a97459","#49342d","#54708d","#37465b","#c38d5d",3],
 ["Adult Woman","#d6a68b","#4b2f34","#8e637c","#534656","#d4b27a",1],
 ["Elderly Man","#b88970","#a6a0a0","#6e747e","#5c5b60","#caa66f",2],
 ["Elderly Woman","#d8ae97","#c4b5a7","#8b7d9b","#5b596a","#d7c4a1",3],
 ["Athlete","#a66d54","#1e2027","#367b65","#333f48","#d5aa5d",0],
 ["Dancer","#e0aa8c","#312532","#9d5480","#49445c","#e5c16f",1],
 ["Scientist","#d1a184","#4c3f38","#d5dce0","#65717b","#5a98b2",2],
 ["Traveller","#b98167","#34332e","#ad7954","#4d514d","#d1b27a",3],
 ["Musician","#dfb399","#3b2d37","#724b7e","#3e374e","#d69f58",0],
].map((v,i)=>({name:v[0],category:"Characters",skin:v[1],hair:v[2],shirt:v[3],pants:v[4],accent:v[5],hairStyle:v[6],accessory:i%4,description:"Everyday human character with a complete editable joint rig and separately layered costume details."} as CharacterStyle));

export const HERO_CHARACTER_ASSETS=heroStyles.map((style,index)=>makeCharacter(index+1,style));
export const DEFAULT_CHARACTER_ASSETS=defaultStyles.map((style,index)=>makeCharacter(index+101,style));

export const ANIMATION_ASSETS:AnimationAsset[]=[
 ...HERO_CHARACTER_ASSETS,
 ...DEFAULT_CHARACTER_ASSETS,
 ...TREE_ASSETS,
 ...FOLIAGE_ASSETS,
 ...BUILDING_ASSETS,
];

export const ASSET_CATEGORY_COUNTS = {
  Characters: HERO_CHARACTER_ASSETS.length + DEFAULT_CHARACTER_ASSETS.length,
  Trees: TREE_ASSETS.length,
  Foliage: FOLIAGE_ASSETS.length,
  Buildings: BUILDING_ASSETS.length,
} as const;

export function findAnimationAsset(id:string):AnimationAsset|undefined {
  return ANIMATION_ASSETS.find(asset=>asset.id===id);
}

export function assetJointPose(asset:AnimationAsset):Record<string,Vector2> {
  return Object.fromEntries((asset.rig?.joints ?? []).map(joint=>[joint.id,{...joint.position}]));
}
