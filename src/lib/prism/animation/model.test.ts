import { describe, expect, it } from "vitest";
import {
  animationDurationSeconds, clampAnimationFrame, createAnimationDocument, evaluateLayerAtFrame,
  orderKeyframes, putKeyframe, type AnimationLayer, type AnimationPose,
} from "./model";

const pose = (x:number, y:number, handX:number):AnimationPose=>({
  transform:{x,y,scaleX:1,scaleY:1,rotation:0,opacity:1},
  joints:{hand:{x:handX,y:120}},
});
const layer:AnimationLayer={
  id:"layer-a",name:"Rigged character",assetId:"character-1",visible:true,locked:false,opacity:1,
  basePose:pose(0,0,20),
  keyframes:[
    {id:"start",frame:0,pose:pose(0,0,20),interpolation:"linear"},
    {id:"end",frame:24,pose:pose(240,120,100),interpolation:"linear"},
  ],
};

describe("Animation Mode keyframe engine",()=>{
  it("clamps the playhead into the document frame range",()=>{
    expect(clampAnimationFrame(-3,48)).toBe(0);
    expect(clampAnimationFrame(70,48)).toBe(47);
    expect(clampAnimationFrame(12.9,48)).toBe(12);
  });
  it("orders keyframes without mutating their source",()=>{
    const keys=[layer.keyframes[1]!,layer.keyframes[0]!];
    expect(orderKeyframes(keys).map(key=>key.frame)).toEqual([0,24]);
    expect(keys[0]?.frame).toBe(24);
  });
  it("automatically interpolates every inbetween transform and rig joint",()=>{
    const halfway=evaluateLayerAtFrame(layer,12);
    expect(halfway.transform.x).toBe(120);
    expect(halfway.transform.y).toBe(60);
    expect(halfway.joints.hand).toEqual({x:60,y:120});
  });
  it("supports hold interpolation without creating movement",()=>{
    const holdLayer={...layer,keyframes:layer.keyframes.map(key=>key.frame===0?{...key,interpolation:"hold" as const}:key)};
    expect(evaluateLayerAtFrame(holdLayer,12)).toEqual(pose(0,0,20));
  });
  it("supports easing curves for natural motion",()=>{
    const eased={...layer,keyframes:layer.keyframes.map(key=>key.frame===0?{...key,interpolation:"ease-in-out" as const}:key)};
    expect(evaluateLayerAtFrame(eased,6).transform.x).toBeLessThan(60);
    expect(evaluateLayerAtFrame(eased,18).transform.x).toBeGreaterThan(180);
  });
  it("inserts or replaces a keyframe at a frame",()=>{
    const inserted=putKeyframe(layer,12,pose(80,30,55));
    expect(inserted.keyframes).toHaveLength(3);
    const replaced=putKeyframe(inserted,12,pose(90,35,60));
    expect(replaced.keyframes).toHaveLength(3);
    expect(evaluateLayerAtFrame(replaced,12).transform.x).toBe(90);
  });
  it("creates a standalone animation project with 24 FPS defaults",()=>{
    const document=createAnimationDocument("Test animation");
    expect(document.name).toBe("Test animation");
    expect(document.fps).toBe(24);
    expect(document.durationFrames).toBe(120);
    expect(document.layers).toEqual([]);
  });
  it("converts timeline frames to seconds",()=>{
    expect(animationDurationSeconds({durationFrames:72,fps:24})).toBe(3);
  });
});
