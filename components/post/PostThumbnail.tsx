"use client";

import { useEffect, useRef, useState } from "react";

export default function PostThumbnail({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // cached images can fire `load` before this component's listener
    // attaches, so check `.complete` once on mount as a fallback.
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt=""
      onLoad={() => setLoaded(true)}
      className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
