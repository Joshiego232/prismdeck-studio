import { describe, expect, it } from "vitest";
import {
  ANIMATION_ASSETS, ASSET_CATEGORY_COUNTS, BUILDING_ASSETS, DEFAULT_CHARACTER_ASSETS,
  FOLIAGE_ASSETS, HERO_CHARACTER_ASSETS, TREE_ASSETS,
} from "./assetLibrary";

describe("starter animation asset library",()=>{
  it("contains the requested category minimums",()=>{
    expect(TREE_ASSETS.length).toBeGreaterThanOrEqual(17);
    expect(FOLIAGE_ASSETS.length).toBeGreaterThanOrEqual(24);
    expect(BUILDING_ASSETS.length).toBeGreaterThanOrEqual(14);
    expect(HERO_CHARACTER_ASSETS.length).toBeGreaterThanOrEqual(17);
    expect(DEFAULT_CHARACTER_ASSETS.length).toBeGreaterThanOrEqual(12);
    expect(ANIMATION_ASSETS).toHaveLength(84);
  });
  it("has unique IDs and non-empty layered vector artwork",()=>{
    expect(new Set(ANIMATION_ASSETS.map(asset=>asset.id)).size).toBe(ANIMATION_ASSETS.length);
    expect(ANIMATION_ASSETS.every(asset=>asset.parts.length>=8)).toBe(true);
  });
  it("provides editable articulated rigs for all character assets",()=>{
    const characters=[...HERO_CHARACTER_ASSETS,...DEFAULT_CHARACTER_ASSETS];
    expect(characters.every(asset=>asset.rig && asset.rig.joints.length>=13 && asset.rig.bones.length>=12)).toBe(true);
    for(const asset of characters) {
      const jointIds=new Set(asset.rig!.joints.map(joint=>joint.id));
      expect(asset.rig!.bones.every(bone=>jointIds.has(bone.fromJointId)&&jointIds.has(bone.toJointId))).toBe(true);
    }
  });
  it("keeps the library category counts explicit",()=>{
    expect(ASSET_CATEGORY_COUNTS).toEqual({Characters:29,Trees:17,Foliage:24,Buildings:14});
  });
});
