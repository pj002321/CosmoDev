"use client";

import { useEffect, useRef } from "react";
import TableOfContents from "@/components/post/TableOfContents";

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

  // Click an image to zoom in; click again to snap back to size.
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"));

    const onClick = (e: MouseEvent) => {
      (e.currentTarget as HTMLImageElement).classList.toggle("img-zoomed");
    };
    images.forEach((img) => img.addEventListener("click", onClick));
    return () => images.forEach((img) => img.removeEventListener("click", onClick));
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
