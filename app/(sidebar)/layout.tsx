import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SettingsIcon, UsersIcon, UserIcon } from "@/components/icons";
import { LOCALE_COOKIE, getDict, type Locale } from "@/lib/i18n";

export default async function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
  const dict = getDict(locale).sidebar;

  const items = [
    { href: "/settings", label: dict.settings, icon: SettingsIcon },
    { href: "/friends", label: dict.friends, icon: UsersIcon },
    { href: "/settings/account", label: dict.account, icon: UserIcon },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 flex gap-10">
      <nav className="w-40 shrink-0 flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 font-mono text-xs text-muted hover:text-accent px-2.5 py-2 rounded hover:bg-surface transition-colors"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
