import { describe, expect, it } from "vitest";
import { makeShape } from "./factory";
import { createCustomShapeDefinition, deleteCustomShape, instantiateCustomShape, listCustomShapes, saveCustomShape, updateCustomShape } from "./customShapes";
import { FEATURE_FLAGS } from "./featureFlags";

describe("reusable custom-shape foundations", () => {
  it("preserves member geometry and visual styling in a normalized definition", () => {
    const first = makeShape("star", {
      x: 120,
      y: 80,
      w: 180,
      h: 140,
      fill: "#ff8800",
      gradient: true,
      gradientType: "radial",
      gradientColors: ["#ff8800", "#ffcc00", "#ffffff"],
      groupId: "source-group",
    });
    const second = makeShape("hexagon", {
      x: 340,
      y: 150,
      w: 100,
      h: 100,
      fill: "#1155cc",
      stroke: "#ffffff",
      strokeWidth: 4,
      groupId: "source-group",
    });

    const definition = createCustomShapeDefinition([first, second], "Festival badge");
    expect(definition.name).toBe("Festival badge");
    expect(definition.width).toBe(320);
    expect(definition.height).toBe(170);
    expect(definition.elements[0]?.x).toBe(0);
    expect(definition.elements[0]?.y).toBe(0);
    expect(definition.elements[0]?.shape).toBe("star");
    expect(definition.elements[0]?.fill).toBe("#ff8800");
    expect(definition.elements[0]?.gradientColors).toEqual(["#ff8800", "#ffcc00", "#ffffff"]);
    expect(definition.elements[1]?.x).toBe(220);
    expect(definition.elements[1]?.y).toBe(70);
    expect(definition.elements[1]?.shape).toBe("hexagon");
    expect(definition.elements[1]?.stroke).toBe("#ffffff");
    expect(definition.elements.every(element => !element.groupId)).toBe(true);
  });

  it("instantiates a fresh group while preserving each member's individual styling", () => {
    expect(FEATURE_FLAGS.customShapeLibrary).toBe(true);
    const source = makeShape("star", { groupId: "group-a", fill: "#ff8800", gradient: true, gradientColors: ["#ff8800", "#fff000"] });
    const companion = makeShape("ellipse", { groupId: "group-a", x: 900, fill: "#1155cc", gradient: false });
    const definition = createCustomShapeDefinition([source, companion], "Festival badge");
    const inserted = instantiateCustomShape(definition, 400, 400);
    expect(inserted).toHaveLength(2);
    expect(inserted[0]?.id).not.toBe(source.id);
    expect(inserted[0]?.groupId).toBeTruthy();
    expect(inserted[0]?.groupId).toBe(inserted[1]?.groupId);
    expect(inserted[0]?.fill).toBe("#ff8800");
    expect(inserted[0]?.gradientColors).toEqual(["#ff8800", "#fff000"]);
    expect(inserted[1]?.fill).toBe("#1155cc");
    expect(inserted[1]?.gradient).toBe(false);
  });

  it("persists reusable definitions in the workspace library", () => {
    const first = makeShape("star", { groupId: "library-group", fill: "#ff8800" });
    const second = makeShape("ellipse", { groupId: "library-group", fill: "#1155cc", x: 900 });
    const definition = createCustomShapeDefinition([first, second], "Two-tone mark");
    expect(saveCustomShape(definition)).toBe(true);
    expect(listCustomShapes().some(shape => shape.id === definition.id)).toBe(true);
    expect(deleteCustomShape(definition.id)).toBe(true);
    expect(listCustomShapes().some(shape => shape.id === definition.id)).toBe(false);
  });

  it("renames and folders a library item without changing its artwork", () => {
    const first = makeShape("star", { groupId: "folder-group", fill: "#aabbcc" });
    const second = makeShape("ellipse", { groupId: "folder-group", x: 900 });
    const definition = createCustomShapeDefinition([first, second], "Original name");
    expect(saveCustomShape(definition)).toBe(true);
    expect(updateCustomShape(definition.id, { name: "Renamed badge", folder: "Brand assets" })).toBe(true);
    const updated = listCustomShapes().find(item => item.id === definition.id);
    expect(updated?.name).toBe("Renamed badge");
    expect(updated?.folder).toBe("Brand assets");
    expect(updated?.elements[0]?.fill).toBe("#aabbcc");
    expect(deleteCustomShape(definition.id)).toBe(true);
  });

  it("rejects selections that are not one complete multi-object group", () => {
    const first = makeShape("star", { groupId: "group-a" });
    const second = makeShape("ellipse", { groupId: "group-b" });
    expect(() => createCustomShapeDefinition([first, second], "Invalid")).toThrow(
      "All custom-shape members must belong to the same group.",
    );
  });
});
