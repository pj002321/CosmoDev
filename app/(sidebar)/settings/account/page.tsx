import { UserProfile } from "@clerk/nextjs";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, getDict, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
  const dict = getDict(locale).sidebar;

  return (
    <div>
      <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ {dict.settings}</p>
      <h1 className="text-2xl font-semibold mb-8">{dict.account}</h1>
      <UserProfile routing="hash" />
    </div>
  );
}
