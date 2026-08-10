import { cookies } from "next/headers";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import { LOCALE_COOKIE, getDict, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
  const dict = getDict(locale).sidebar;

  return (
    <div>
      <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ {dict.settings}</p>
      <h1 className="text-2xl font-semibold mb-8">{dict.settingsTitle}</h1>

      <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3 bg-surface max-w-sm">
        <span className="text-sm">{dict.language}</span>
        <LocaleSwitcher locale={locale} />
      </div>
    </div>
  );
}
