import { describe, expect, it } from "vitest";
import { makeShape } from "./factory";
import { createCustomShapeDefinition, instantiateCustomShape } from "./customShapes";
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

  it("keeps the custom-shape library and instantiation disabled until authorized", () => {
    expect(FEATURE_FLAGS.customShapeLibrary).toBe(false);
    const source = makeShape("star", { groupId: "group-a" });
    const companion = makeShape("ellipse", { groupId: "group-a", x: 900 });
    const definition = createCustomShapeDefinition([source, companion], "Hidden preset");
    expect(instantiateCustomShape(definition, 400, 400)).toEqual([]);
  });

  it("rejects selections that are not one complete multi-object group", () => {
    const first = makeShape("star", { groupId: "group-a" });
    const second = makeShape("ellipse", { groupId: "group-b" });
    expect(() => createCustomShapeDefinition([first, second], "Invalid")).toThrow(
      "All custom-shape members must belong to the same group.",
    );
  });
});
