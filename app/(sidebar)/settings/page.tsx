import { cookies } from "next/headers";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import GitImportButton from "@/components/settings/GitImportButton";
import NotionImportButton from "@/components/settings/NotionImportButton";
import FloatToggle from "@/components/settings/FloatToggle";
import { LOCALE_COOKIE, getDict, type Locale } from "@/lib/i18n";
import { FLOAT_COOKIE, defaultFloat, type FloatSetting } from "@/lib/floatSetting";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
  const dict = getDict(locale).sidebar;
  const floatSetting: FloatSetting =
    cookieStore.get(FLOAT_COOKIE)?.value === "off" ? "off" : defaultFloat;

  return (
    <div>
      <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ {dict.settings}</p>
      <h1 className="text-2xl font-semibold mb-8">{dict.settingsTitle}</h1>

      <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3 bg-surface max-w-sm mb-4">
        <span className="text-sm">{dict.language}</span>
        <LocaleSwitcher locale={locale} />
      </div>

      <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3 bg-surface max-w-sm mb-4">
        <span className="text-sm">카드 플로팅 효과</span>
        <FloatToggle value={floatSetting} />
      </div>

      <div className="mb-4">
        <GitImportButton />
      </div>
      <NotionImportButton />
    </div>
  );
}
