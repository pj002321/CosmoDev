"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Heading = { id: string; text: string; level: number };

const PANEL_WIDTH = 224; // matches w-56
const GAP = 24;
const EDGE_MARGIN = 24;

export default function TableOfContents({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3"));
    setHeadings(
      elements.map((el) => ({ id: el.id, text: el.textContent ?? "", level: Number(el.tagName[1]) }))
    );

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -70% 0px" }
    );
    elements.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [containerRef]);

  // Track the article's own right edge (it resizes when the 좁게/넓게
  // toggle animates) so the panel only shows when it actually fits beside
  // the content, instead of overlapping it at a fixed viewport breakpoint.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const update = () => {
      const rect = root.getBoundingClientRect();
      const proposedLeft = rect.right + GAP;
      const fits = proposedLeft + PANEL_WIDTH + EDGE_MARGIN <= window.innerWidth;
      setLeft(fits ? proposedLeft : null);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(root);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerRef]);

  if (headings.length === 0 || left === null) return null;

  // Portaled to <body>: app/template.tsx's page-load animation leaves a
  // non-"none" transform on an ancestor, which would otherwise turn it into
  // the containing block for `position: fixed` and make this scroll with
  // the page instead of staying put.
  return createPortal(
    <nav
      aria-label="목차"
      style={{ left }}
      className="fixed top-32 w-56 max-h-[70vh] overflow-y-auto font-mono text-xs"
    >
      <p className="text-muted uppercase tracking-wide mb-2 px-2">목차</p>
      <ul className="space-y-1 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", `#${h.id}`);
              }}
              className={`block py-1 border-l-2 -ml-px transition-colors ${
                activeId === h.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
              } ${h.level === 1 ? "pl-3" : h.level === 2 ? "pl-5" : "pl-7"}`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>,
    document.body
  );
}
