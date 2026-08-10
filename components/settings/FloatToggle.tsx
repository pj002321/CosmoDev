"use client";

import { useRouter } from "next/navigation";
import { FLOAT_COOKIE, type FloatSetting } from "@/lib/floatSetting";

export default function FloatToggle({ value }: { value: FloatSetting }) {
  const router = useRouter();

  function toggle() {
    const next: FloatSetting = value === "on" ? "off" : "on";
    document.cookie = `${FLOAT_COOKIE}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value === "on"}
      onClick={toggle}
      className={`relative w-9 h-5 rounded-full border transition-colors ${
        value === "on" ? "bg-accent/30 border-accent" : "bg-surface border-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform ${
          value === "on" ? "translate-x-[18px] bg-accent" : "translate-x-0 bg-muted"
        }`}
      />
    </button>
  );
}
