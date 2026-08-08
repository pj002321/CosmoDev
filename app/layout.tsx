import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, SignOutButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { GraphIcon, LogoutIcon, ListIcon, PencilIcon, CompassIcon, SettingsIcon } from "@/components/icons";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import UserMenu from "@/components/UserMenu";
import { LOCALE_COOKIE, getDict, type Locale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// @clerk/themes ships its own major version of @clerk/shared, so its
// exported Theme type doesn't structurally match @clerk/nextjs' Appearance
// type even though it works fine at runtime — widen to bypass that.
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#a3e635",
    colorPrimaryForeground: "#0a0a0b",
    colorNeutral: "#e4e4e7",
    colorBackground: "#131316",
    colorForeground: "#e4e4e7",
    colorMutedForeground: "#8b8b93",
    colorInput: "#0a0a0b",
    colorInputForeground: "#e4e4e7",
    colorBorder: "#26262b",
    borderRadius: "0.5rem",
  },
  elements: {
    // Custom UserButton.Link items (Settings, Friends) don't reliably
    // inherit colorForeground from the dark theme, so force it explicitly.
    userButtonPopoverActionButtonText: { color: "#e4e4e7" },
    userButtonPopoverActionButtonIcon: { color: "#e4e4e7" },
  },
} as NonNullable<React.ComponentProps<typeof ClerkProvider>["appearance"]>;

export const metadata: Metadata = {
  title: "DEVShot",
  description: "개인 개발 일지",
};

const FLARE_STAR_COUNT = 20;
const SHOOTING_STAR_COUNT = 3;
const PARTICLE_OFFSETS: [number, number][] = [
  [-42, -26],
  [36, -32],
  [48, 18],
  [-32, 38],
  [12, 48],
  [-50, -8],
  [4, -46],
  [40, 4],
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Regenerated per request (layout is dynamic via cookies()), so every page
// load gets a fresh random sky instead of the same fixed star layout.
function randomSky() {
  const flareStars = Array.from({ length: FLARE_STAR_COUNT }, () => ({
    left: rand(2, 98),
    top: rand(2, 96),
    delay: rand(0, 15),
    accentGlow: Math.random() < 0.35,
  }));

  const shootingStars = Array.from({ length: SHOOTING_STAR_COUNT }, () => ({
    left: rand(15, 92),
    top: rand(3, 40),
    duration: rand(10, 26),
    delay: rand(0, 10),
    len: rand(60, 160),
  }));

  return { flareStars, shootingStars, burstStar: shootingStars[shootingStars.length - 1] };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
  const dict = getDict(locale);
  const { flareStars, shootingStars, burstStar } = randomSky();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="starfield" aria-hidden="true">
          {flareStars.map((s, i) => (
            <span
              key={i}
              className="flare-star"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                animationDelay: `${s.delay.toFixed(2)}s`,
                ...(s.accentGlow
                  ? { "--flare-glow": "color-mix(in srgb, var(--accent) 80%, transparent)" }
                  : {}),
              } as React.CSSProperties}
            />
          ))}
          {shootingStars.map((s, i) => (
            <span
              key={i}
              className={`shooting-star${s === burstStar ? " burst" : ""}`}
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                animationDuration: `${s.duration.toFixed(2)}s`,
                animationDelay: `${s.delay.toFixed(2)}s`,
                "--len": `${s.len.toFixed(0)}px`,
              } as React.CSSProperties}
            />
          ))}
          {PARTICLE_OFFSETS.map(([px, py], i) => (
            <span
              key={i}
              className="particle"
              style={{
                left: `calc(${burstStar.left}% - 140px)`,
                top: `calc(${burstStar.top}% + 100px)`,
                animationDuration: `${burstStar.duration.toFixed(2)}s`,
                animationDelay: `${burstStar.delay.toFixed(2)}s`,
                "--px": `${px}px`,
                "--py": `${py}px`,
                "--psize": `${3 + (i % 3) * 1.5}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <ClerkProvider appearance={clerkAppearance}>
          <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
            <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 font-mono text-sm tracking-wide">
                <span className="flex gap-1">
                  <span className="term-dot" />
                  <span className="term-dot" />
                  <span className="term-dot accent" />
                </span>
                <span className="inline-flex">
                  {"DEVShot".split("").map((ch, i) => (
                    <span
                      key={i}
                      className="logo-letter"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              </Link>
              <div className="flex items-center gap-1.5">
                <Show when="signed-in">
                  <Link
                    href="/write"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    {dict.nav.write}
                  </Link>
                  <Link
                    href="/my-posts"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                    {dict.nav.myPosts}
                  </Link>
                  <Link
                    href="/explore"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    <CompassIcon className="w-3.5 h-3.5" />
                    {dict.nav.explore}
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    {dict.nav.settings}
                  </Link>
                  <Link
                    href="/graph"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    <GraphIcon className="w-3.5 h-3.5" />
                    {dict.nav.graph}
                  </Link>
                  <SignOutButton redirectUrl="/">
                    <button className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors cursor-pointer">
                      <LogoutIcon className="w-3.5 h-3.5" />
                      {dict.nav.logout}
                    </button>
                  </SignOutButton>
                  <span className="ml-1 border-l border-border pl-3">
                    <UserMenu settingsLabel={dict.nav.settings} friendsLabel={dict.nav.friends} />
                  </span>
                </Show>
                <Show when="signed-out">
                  <span className="font-mono text-xs text-muted mr-2">{dict.nav.tagline}</span>
                  <Link
                    href="/sign-in"
                    className="font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    {dict.nav.login}
                  </Link>
                  <Link
                    href="/sign-up"
                    className="btn-accent font-mono text-xs rounded px-3 py-1.5"
                  >
                    {dict.nav.signup}
                  </Link>
                </Show>
                <span className="ml-1.5 border-l border-border pl-3">
                  <LocaleSwitcher locale={locale} />
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border">
            <div className="mx-auto max-w-3xl px-6 py-8 font-mono text-xs text-muted flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span>{dict.footer}</span>
              <nav className="flex flex-wrap gap-4">
                <Link href="/" className="hover:text-accent transition-colors">
                  {dict.nav.home}
                </Link>
                <Link href="/explore" className="hover:text-accent transition-colors">
                  {dict.nav.explore}
                </Link>
                <Link href="/settings" className="hover:text-accent transition-colors">
                  {dict.nav.settings}
                </Link>
                <Link href="/graph" className="hover:text-accent transition-colors">
                  {dict.nav.graph}
                </Link>
                <a
                  href="mailto:t55300354@gmail.com"
                  className="hover:text-accent transition-colors"
                >
                  {dict.contact}
                </a>
              </nav>
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
