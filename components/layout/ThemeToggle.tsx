"use client";

import { THEME_COOKIE, type Theme } from "@/lib/theme";
import { SunIcon, MoonIcon } from "@/components/icons";

// ponytail: circular-reveal transition uses the native View Transition API
// (no JS animation loop) — falls back to an instant swap on browsers without it.
// Theme is applied by mutating the DOM directly (no router.refresh(), no React
// state): any React re-render triggered from inside the transition callback
// races the browser's before/after snapshot and throws InvalidStateError on
// every toggle after the first. The icon swap is pure CSS (see globals.css),
// and the cookie persists the choice for the next full page load.
// Module-scope (not state): a second click before the previous 0.7s reveal
// finishes is invalid per the View Transition API spec, so it's just ignored.
let transitionInFlight = false;

export default function ThemeToggle({ theme: initialTheme }: { theme: Theme }) {
  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    if (transitionInFlight) return;
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next: Theme = current === "dark" ? "light" : "dark";
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000`;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    document.documentElement.style.setProperty("--reveal-x", `${x}px`);
    document.documentElement.style.setProperty("--reveal-y", `${y}px`);
    document.documentElement.style.setProperty("--reveal-radius", `${radius}px`);

    const apply = () => {
      document.documentElement.dataset.theme = next;
    };
    if (!document.startViewTransition) {
      apply();
      return;
    }
    transitionInFlight = true;
    // ViewTransition exposes 3 independent promises (updateCallbackDone, ready,
    // finished). Any of them can reject (e.g. transition skipped) even though
    // `apply` already ran and the theme already switched. Each is a separate
    // promise for unhandled-rejection purposes, so all 3 need their own catch
    // or the browser logs an uncaught InvalidStateError with no stack trace.
    const transition = document.startViewTransition(apply);
    transition.updateCallbackDone.catch(() => {});
    transition.ready.catch(() => {});
    transition.finished.catch(() => {}).finally(() => {
      transitionInFlight = false;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={initialTheme === "dark" ? "라이트 모드" : "다크 모드"}
      className="flex items-center justify-center w-7 h-7 rounded text-muted hover:text-accent hover:bg-surface transition-colors"
    >
      <SunIcon className="theme-icon-sun w-4 h-4" />
      <MoonIcon className="theme-icon-moon w-4 h-4" />
    </button>
  );
}
