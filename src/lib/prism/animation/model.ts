export interface Vector2 { x: number; y: number }

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

export interface CharacterRig {
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
  /** Joint positions in the asset's local coordinate space. */
  joints: Record<string, Vector2>;
}

export interface AnimationTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
}

export interface AnimationPose {
  transform: AnimationTransform;
  joints: Record<string, Vector2>;
}

export interface AnimationKeyframe {
  id: string;
  frame: number;
  pose: AnimationPose;
  /** The outgoing interpolation curve from this keyframe to the next one. */
  interpolation: KeyframeInterpolation;
  label?: string;
}

export interface AnimationLayer {
  id: string;
  name: string;
  assetId: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  basePose: AnimationPose;
  keyframes: AnimationKeyframe[];
}

export interface CharacterAnimationDocument {
  schema: 2;
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  loop: boolean;
  background: string;
  layers: AnimationLayer[];
  createdAt: number;
  updatedAt: number;
}

export type AnimationDocument = CharacterAnimationDocument;

export const createId = (prefix = "anim_") =>
  prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export function clampAnimationFrame(frame: number, durationFrames: number): number {
  const maxFrame = Math.max(0, Math.floor(durationFrames) - 1);
  return Math.min(maxFrame, Math.max(0, Math.floor(Number.isFinite(frame) ? frame : 0)));
}

export function orderKeyframes(keyframes: AnimationKeyframe[]): AnimationKeyframe[] {
  return [...keyframes].sort((a, b) => a.frame - b.frame || a.id.localeCompare(b.id));
}

export function animationDurationSeconds(document: Pick<CharacterAnimationDocument, "durationFrames" | "fps">): number {
  const fps = Math.max(1, Math.min(240, Number.isFinite(document.fps) ? document.fps : 24));
  return Math.max(0, document.durationFrames) / fps;
}

export function clonePose(pose: AnimationPose): AnimationPose {
  return {
    transform: { ...pose.transform },
    joints: Object.fromEntries(Object.entries(pose.joints).map(([id, point]) => [id, { ...point }])),
  };
}

export function interpolateAmount(amount: number, interpolation: KeyframeInterpolation): number {
  const t = Math.min(1, Math.max(0, amount));
  if (interpolation === "hold") return 0;
  if (interpolation === "ease-in") return t * t;
  if (interpolation === "ease-out") return 1 - (1 - t) * (1 - t);
  if (interpolation === "ease-in-out") return t * t * (3 - 2 * t);
  return t;
}

export function interpolatePose(
  from: AnimationPose,
  to: AnimationPose,
  amount: number,
  interpolation: KeyframeInterpolation,
): AnimationPose {
  const t = interpolateAmount(amount, interpolation);
  const mix = (a: number, b: number) => a + (b - a) * t;
  const transform: AnimationTransform = {
    x: mix(from.transform.x, to.transform.x),
    y: mix(from.transform.y, to.transform.y),
    scaleX: mix(from.transform.scaleX, to.transform.scaleX),
    scaleY: mix(from.transform.scaleY, to.transform.scaleY),
    rotation: mix(from.transform.rotation, to.transform.rotation),
    opacity: mix(from.transform.opacity, to.transform.opacity),
  };
  const joints: Record<string, Vector2> = {};
  for (const id of new Set([...Object.keys(from.joints), ...Object.keys(to.joints)])) {
    const a = from.joints[id], b = to.joints[id];
    if (a && b) joints[id] = { x: mix(a.x, b.x), y: mix(a.y, b.y) };
    else if (a ?? b) joints[id] = { ...(a ?? b)! };
  }
  return { transform, joints };
}

/** Evaluate the current pose; every frame between keys is calculated automatically. */
export function evaluateLayerAtFrame(layer: AnimationLayer, frame: number): AnimationPose {
  const keys = orderKeyframes(layer.keyframes);
  if (!keys.length) return clonePose(layer.basePose);
  const currentFrame = Math.max(0, frame);
  const first = keys[0]!;
  if (currentFrame <= first.frame) return clonePose(first.pose);
  const last = keys[keys.length - 1]!;
  if (currentFrame >= last.frame) return clonePose(last.pose);

  for (let index = 0; index < keys.length - 1; index++) {
    const from = keys[index]!, to = keys[index + 1]!;
    if (currentFrame < from.frame || currentFrame > to.frame) continue;
    if (from.interpolation === "hold") return clonePose(from.pose);
    const span = Math.max(1, to.frame - from.frame);
    return interpolatePose(from.pose, to.pose, (currentFrame - from.frame) / span, from.interpolation);
  }
  return clonePose(last.pose);
}

export function putKeyframe(
  layer: AnimationLayer,
  frame: number,
  pose: AnimationPose,
  interpolation: KeyframeInterpolation = "ease-in-out",
): AnimationLayer {
  const nextFrame = Math.max(0, Math.floor(frame));
  const withoutFrame = layer.keyframes.filter(key => key.frame !== nextFrame);
  return {
    ...layer,
    keyframes: orderKeyframes([...withoutFrame, {
      id: createId("key_"),
      frame: nextFrame,
      pose: clonePose(pose),
      interpolation,
    }]),
  };
}

export function removeKeyframe(layer: AnimationLayer, keyframeId: string): AnimationLayer {
  return { ...layer, keyframes: layer.keyframes.filter(key => key.id !== keyframeId) };
}

export function createAnimationDocument(name = "Untitled animation"): AnimationDocument {
  const now = Date.now();
  return {
    schema: 2,
    id: createId("project_"),
    name,
    width: 1920,
    height: 1080,
    fps: 24,
    durationFrames: 120,
    loop: true,
    background: "#202532",
    layers: [],
    createdAt: now,
    updatedAt: now,
  };
}
