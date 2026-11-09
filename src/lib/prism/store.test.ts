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
