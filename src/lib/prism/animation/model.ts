/** Data-only foundation for the future character/rig animation workspace. No UI is mounted yet. */

export interface Vector2 {
  x: number;
  y: number;
}

export interface RigJoint {
  id: string;
  name: string;
  position: Vector2;
  locked?: boolean;
}

export interface RigBone {
  id: string;
  name: string;
  fromJointId: string;
  toJointId: string;
  thickness: number;
  color: string;
  cap: "round" | "butt" | "square";
}

export interface StickFigureRig {
  id: string;
  name: string;
  joints: RigJoint[];
  bones: RigBone[];
  pivot: Vector2;
  defaultColor: string;
  defaultThickness: number;
}

export type KeyframeInterpolation = "hold" | "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface RigPose {
  /** Joint positions are stored in the rig's local coordinate space. */
  joints: Record<string, Vector2>;
}

export interface RigKeyframe {
  id: string;
  frame: number;
  pose: RigPose;
  interpolation: KeyframeInterpolation;
  label?: string;
}

export interface AnimationLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  rigId: string;
  keyframes: RigKeyframe[];
}

export interface CharacterAnimationDocument {
  schema: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  loop: boolean;
  background: string;
  rigs: StickFigureRig[];
  layers: AnimationLayer[];
  createdAt: number;
  updatedAt: number;
}

/** Clamp a frame to the valid timeline range. */
export function clampAnimationFrame(frame: number, durationFrames: number): number {
  const maxFrame = Math.max(0, Math.floor(durationFrames) - 1);
  return Math.min(maxFrame, Math.max(0, Math.floor(Number.isFinite(frame) ? frame : 0)));
}

/** Return a stable frame-ordered view without mutating the document. */
export function orderKeyframes(keyframes: RigKeyframe[]): RigKeyframe[] {
  return [...keyframes].sort((a, b) => a.frame - b.frame || a.id.localeCompare(b.id));
}

/** Estimate timeline duration in seconds from frame count and frame rate. */
export function animationDurationSeconds(document: Pick<CharacterAnimationDocument, "durationFrames" | "fps">): number {
  const fps = Math.max(1, Math.min(240, Number.isFinite(document.fps) ? document.fps : 24));
  return Math.max(0, document.durationFrames) / fps;
}
