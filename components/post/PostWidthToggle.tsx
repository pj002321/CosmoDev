"use client";

import { useState } from "react";

export default function PostWidthToggle({
  backLink,
  children,
}: {
  backLink: React.ReactNode;
  children: React.ReactNode;
}) {
  const [wide, setWide] = useState(false);

  return (
    <div className={`mx-auto px-6 py-12 transition-[max-width] duration-200 ${wide ? "max-w-7xl" : "max-w-3xl"}`}>
      <div className="flex items-center justify-between">
        {backLink}
        <div className="flex border border-border rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setWide(false)}
            className={`font-mono text-xs px-2 py-1 ${!wide ? "bg-surface text-accent" : "text-muted hover:text-accent"}`}
          >
            좁게
          </button>
          <button
            type="button"
            onClick={() => setWide(true)}
            className={`font-mono text-xs px-2 py-1 ${wide ? "bg-surface text-accent" : "text-muted hover:text-accent"}`}
          >
            넓게
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
