import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
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
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#a3e635",
              colorPrimaryForeground: "#0a0a0b",
              colorBackground: "#131316",
              colorForeground: "#e4e4e7",
              colorMutedForeground: "#8b8b93",
              colorInput: "#0a0a0b",
              colorInputForeground: "#e4e4e7",
              colorBorder: "#26262b",
              borderRadius: "0.5rem",
            },
          }}
        >
          <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
            <div className="mx-auto max-w-3xl px-6 py-5 flex items-center justify-between">
              <Link href="/" className="font-mono text-sm tracking-wide">
                <span className="text-accent glow-text">▸</span> DEVShot
              </Link>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-muted">개인 개발 일지</span>
                <Show when="signed-in">
                  <Link
                    href="/write"
                    className="font-mono text-xs text-muted hover:text-accent"
                  >
                    글쓰기
                  </Link>
                  <Link
                    href="/my-posts"
                    className="font-mono text-xs text-muted hover:text-accent"
                  >
                    내 글
                  </Link>
                  <UserButton />
                </Show>
                <Show when="signed-out">
                  <Link
                    href="/sign-in"
                    className="font-mono text-xs text-muted hover:text-accent"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/sign-up"
                    className="font-mono text-xs text-muted hover:text-accent"
                  >
                    회원가입
                  </Link>
                </Show>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border">
            <div className="mx-auto max-w-3xl px-6 py-6 font-mono text-xs text-muted">
              built with next.js · deployed on vercel
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
