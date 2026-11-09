import type { ShapeEl } from "./types";
import { uid } from "./factory";
import { isFeatureEnabled } from "./featureFlags";

const STORAGE_KEY = "prismdeck.custom-shapes.v1";

export interface CustomShapeDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: ShapeEl[];
  createdAt: number;
  updatedAt: number;
}

function assertOneGroup(elements: ShapeEl[]): string {
  if (elements.length < 2) throw new Error("Select at least two grouped shapes.");
  const groupId = elements[0]?.groupId;
  if (!groupId || elements.some(element => element.groupId !== groupId)) {
    throw new Error("All custom-shape members must belong to the same group.");
  }
  return groupId;
}

/**
 * Build a reusable, self-contained group definition. Geometry is normalized to the
 * group's top-left corner; every visual property (fill, gradient, stroke, opacity,
 * rotation, shadow, blur, text and shape kind) is retained.
 */
export function createCustomShapeDefinition(elements: ShapeEl[], name: string): CustomShapeDefinition {
  assertOneGroup(elements);
  const left = Math.min(...elements.map(element => element.x));
  const top = Math.min(...elements.map(element => element.y));
  const right = Math.max(...elements.map(element => element.x + element.w));
  const bottom = Math.max(...elements.map(element => element.y + element.h));
  const now = Date.now();

  const members = elements.map(element => {
    const copy = structuredClone(element);
    copy.x -= left;
    copy.y -= top;
    delete copy.groupId;
    delete copy.snapMemory;
    return copy;
  });

  return {
    id: uid("custom_shape_"),
    name: name.trim() || "Custom shape",
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
    elements: members,
    createdAt: now,
    updatedAt: now,
  };
}

/** Make fresh document elements from a library definition, retaining original styling. */
export function instantiateCustomShape(definition: CustomShapeDefinition, x: number, y: number): ShapeEl[] {
  if (!isFeatureEnabled("customShapeLibrary")) return [];
  const groupId = uid("g_");
  return definition.elements.map(element => {
    const copy = structuredClone(element);
    copy.id = uid("e_");
    copy.x += x;
    copy.y += y;
    copy.groupId = groupId;
    delete copy.snapMemory;
    return copy;
  });
}

function readStoredShapes(): CustomShapeDefinition[] {
  if (typeof window === "undefined" || !isFeatureEnabled("customShapeLibrary")) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CustomShapeDefinition =>
      !!item && typeof item === "object" &&
      typeof (item as CustomShapeDefinition).id === "string" &&
      typeof (item as CustomShapeDefinition).name === "string" &&
      Array.isArray((item as CustomShapeDefinition).elements),
    );
  } catch {
    return [];
  }
}

function writeStoredShapes(shapes: CustomShapeDefinition[]): boolean {
  if (typeof window === "undefined" || !isFeatureEnabled("customShapeLibrary")) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes));
    return true;
  } catch {
    return false;
  }
}

/** Storage APIs remain inactive while the custom-shape feature gate is off. */
export function listCustomShapes(): CustomShapeDefinition[] {
  return readStoredShapes();
}

export function saveCustomShape(definition: CustomShapeDefinition): boolean {
  if (!isFeatureEnabled("customShapeLibrary")) return false;
  const shapes = readStoredShapes().filter(shape => shape.id !== definition.id);
  return writeStoredShapes([...shapes, { ...definition, updatedAt: Date.now() }]);
}

export function deleteCustomShape(id: string): boolean {
  if (!isFeatureEnabled("customShapeLibrary")) return false;
  return writeStoredShapes(readStoredShapes().filter(shape => shape.id !== id));
}
