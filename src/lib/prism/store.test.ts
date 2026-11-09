import { beforeEach, describe, expect, it } from "vitest";
import { makeDeck, makeSlide, makeText } from "./factory";
import { useDeck } from "./store";

function createDeck(slideCount = 1) {
  return makeDeck(
    "Store test deck",
    Array.from({ length: slideCount }, (_, index) => makeSlide({ name: `Slide ${index + 1}` })),
  );
}

describe("PrismDeck editor store", () => {
  beforeEach(() => {
    useDeck.getState().loadDeck(createDeck());
  });

  it("groups selected objects and ungroups the complete group", () => {
    const state = useDeck.getState();
    const slide = state.deck.slides[0]!;
    const first = makeText({ name: "First object" });
    const second = makeText({ name: "Second object" });
    state.mutate((deck) => {
      deck.slides[0]!.elements.push(first, second);
    });
    state.selectElements([first.id, second.id]);
    useDeck.getState().groupElements();

    const grouped = useDeck.getState().deck.slides[0]!.elements;
    const groupId = grouped.find((element) => element.id === first.id)?.groupId;
    expect(groupId).toBeTruthy();
    expect(grouped.find((element) => element.id === second.id)?.groupId).toBe(groupId);

    useDeck.getState().ungroupElements();
    const ungrouped = useDeck.getState().deck.slides[0]!.elements;
    expect(ungrouped.find((element) => element.id === first.id)?.groupId).toBeUndefined();
    expect(ungrouped.find((element) => element.id === second.id)?.groupId).toBeUndefined();
    expect(useDeck.getState().selectedElementIds).toEqual([first.id, second.id]);
  });

  it("duplicates a selected group with a new shared group id", () => {
    const state = useDeck.getState();
    const first = makeText({ name: "Grouped A" });
    const second = makeText({ name: "Grouped B" });
    state.mutate((deck) => {
      deck.slides[0]!.elements.push(first, second);
    });
    state.selectElements([first.id, second.id]);
    useDeck.getState().groupElements();
    const originalGroupId = useDeck.getState().deck.slides[0]!.elements.find((element) => element.id === first.id)?.groupId;

    useDeck.getState().duplicateSelected();
    const after = useDeck.getState();
    const duplicates = after.deck.slides[0]!.elements.filter((element) => after.selectedElementIds.includes(element.id));
    expect(duplicates).toHaveLength(2);
    expect(duplicates[0]?.groupId).toBeTruthy();
    expect(duplicates[0]?.groupId).toBe(duplicates[1]?.groupId);
    expect(duplicates[0]?.groupId).not.toBe(originalGroupId);
  });

  it("duplicates a slide with fresh slide, object, animation, and group IDs", () => {
    const state = useDeck.getState();
    const source = state.deck.slides[0]!;
    const first = makeText({ name: "Grouped title" });
    const second = makeText({ name: "Grouped subtitle" });
    state.mutate((deck) => {
      deck.slides[0]!.elements.push(first, second);
      deck.slides[0]!.animations.push({
        id: "animation-source",
        elementId: first.id,
        kind: "entrance",
        effect: "fadeIn",
        duration: 400,
        delay: 0,
        easing: "linear",
        direction: "up",
        trigger: "onClick",
      });
    });
    useDeck.getState().selectElements([first.id, second.id]);
    useDeck.getState().groupElements();
    const sourceNow = useDeck.getState().deck.slides[0]!;
    const sourceGroup = sourceNow.elements.find((item) => item.id === first.id)?.groupId;
    useDeck.getState().selectSlide(source.id);

    const duplicatedId = useDeck.getState().duplicateSlides([source.id]);
    const after = useDeck.getState();
    const copy = after.deck.slides.find((item) => item.id === duplicatedId);
    expect(duplicatedId).toBeTruthy();
    expect(after.deck.slides).toHaveLength(2);
    expect(after.currentSlideId).toBe(duplicatedId);
    expect(after.selectedSlideIds).toEqual([duplicatedId]);
    expect(copy?.id).not.toBe(source.id);
    expect(copy?.elements).toHaveLength(2);
    expect(copy?.elements[0]?.id).not.toBe(first.id);
    expect(copy?.elements[0]?.groupId).toBeTruthy();
    expect(copy?.elements[0]?.groupId).toBe(copy?.elements[1]?.groupId);
    expect(copy?.elements[0]?.groupId).not.toBe(sourceGroup);
    expect(copy?.animations).toHaveLength(1);
    expect(copy?.animations[0]?.elementId).toBe(copy?.elements[0]?.id);
    expect(copy?.animations[0]?.id).not.toBe("animation-source");
  });

  it("keeps the clicked slide active when extending a range selection", () => {
    const deck = createDeck(3);
    useDeck.getState().loadDeck(deck);
    useDeck.getState().selectSlide(deck.slides[0]!.id);
    useDeck.getState().selectSlide(deck.slides[2]!.id, "range");

    const selected = useDeck.getState();
    expect(selected.currentSlideId).toBe(deck.slides[2]!.id);
    expect(selected.selectedSlideIds).toEqual(deck.slides.map((slide) => slide.id));
  });
});
