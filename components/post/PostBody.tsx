"use client";

import { useEffect, useRef } from "react";
import TableOfContents from "@/components/post/TableOfContents";

const LONG_PRESS_MS = 1250;

export default function PostBody({
  contentHtml,
  letterSpacing,
  lineHeight,
}: {
  contentHtml: string;
  letterSpacing: number | null;
  lineHeight: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Long-press an image to zoom in; press it again to snap back to size.
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"));

    const cleanups = images.map((img) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
      };
      const onDown = (e: PointerEvent) => {
        if (img.classList.contains("img-zoomed")) {
          img.classList.remove("img-zoomed");
          return;
        }
        img.setPointerCapture(e.pointerId);
        timer = setTimeout(() => img.classList.add("img-zoomed"), LONG_PRESS_MS);
      };

      img.addEventListener("pointerdown", onDown);
      img.addEventListener("pointerup", cancel);
      img.addEventListener("pointercancel", cancel);
      return () => {
        cancel();
        img.removeEventListener("pointerdown", onDown);
        img.removeEventListener("pointerup", cancel);
        img.removeEventListener("pointercancel", cancel);
      };
    });

    return () => cleanups.forEach((fn) => fn());
  }, [contentHtml]);

  return (
    <>
      <div
        ref={ref}
        className="prose-post"
        style={{
          letterSpacing: letterSpacing !== null ? `${letterSpacing}em` : undefined,
          lineHeight: lineHeight ?? undefined,
        }}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      <TableOfContents containerRef={ref} />
    </>
  );
}
