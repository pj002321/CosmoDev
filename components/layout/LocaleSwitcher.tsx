"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export default function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  function setLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 font-mono text-[11px] border border-border rounded px-1.5 py-1">
      <button
        onClick={() => setLocale("ko")}
        className={locale === "ko" ? "text-accent" : "text-muted hover:text-foreground"}
      >
        KOR
      </button>
      <span className="text-border">/</span>
      <button
        onClick={() => setLocale("en")}
        className={locale === "en" ? "text-accent" : "text-muted hover:text-foreground"}
      >
        EN
      </button>
    </div>
  );
}
