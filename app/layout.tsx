import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEVShot",
  description: "개인 개발 일지",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto max-w-3xl px-6 py-5 flex items-center justify-between">
            <Link href="/" className="font-mono text-sm tracking-wide">
              <span className="text-accent">▸</span> DEVShot
            </Link>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-muted">개인 개발 일지</span>
              <Link
                href="/admin"
                className="font-mono text-xs text-muted hover:text-accent"
              >
                admin
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-6 font-mono text-xs text-muted">
            built with next.js · deployed on vercel
          </div>
        </footer>
      </body>
    </html>
  );
}
