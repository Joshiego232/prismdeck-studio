import { createFileRoute } from "@tanstack/react-router";
import Studio from "@/components/prism/Studio";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({ slide: Math.max(1, Number(search["slide"]) || 1), step: Math.max(0, Number(search["step"]) || 0), print: search["print"] === true || search["print"] === "true" }),
  head: () => ({ meta: [
    { title: "PrismDeck Studio — Presentation workspace" },
    { name: "description", content: "Create, refine, and present your story in PrismDeck Studio's interactive presentation workspace." },
    { property: "og:title", content: "PrismDeck Studio — Presentation workspace" },
    { property: "og:description", content: "A precise creative workspace for editable slides, motion, and fullscreen presentations." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});
function Index() {
  const search = Route.useSearch(), navigate = Route.useNavigate();
  return <Studio slideIndex={search["slide"]} step={search["step"]} print={search["print"]} setCoordinate={(slide, step = 0) => { navigate({ search: previous => ({ ...previous, slide, step }), replace: true }); }} />;
}