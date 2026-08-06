import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, SignOutButton, UserButton } from "@clerk/nextjs";
import { GraphIcon, LogoutIcon, ListIcon, PencilIcon } from "@/components/icons";
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
        <div className="starfield" aria-hidden="true">
          <span className="flare-star" style={{ left: "12%", top: "18%", animationDelay: "0s" }} />
          <span className="flare-star" style={{ left: "82%", top: "12%", animationDelay: "0.9s" }} />
          <span className="flare-star" style={{ left: "30%", top: "55%", animationDelay: "1.8s" }} />
          <span className="flare-star" style={{ left: "68%", top: "70%", animationDelay: "2.7s" }} />
          <span className="flare-star" style={{ left: "48%", top: "32%", animationDelay: "3.6s" }} />
          <span className="flare-star" style={{ left: "90%", top: "60%", animationDelay: "4.5s" }} />
          <span className="flare-star" style={{ left: "6%", top: "45%", animationDelay: "5.4s" }} />
          <span className="flare-star" style={{ left: "58%", top: "85%", animationDelay: "6.3s" }} />
          <span className="flare-star" style={{ left: "22%", top: "8%", animationDelay: "7.2s" }} />
          <span className="flare-star" style={{ left: "75%", top: "40%", animationDelay: "8.1s" }} />
          <span className="shooting-star" style={{ left: "70%", top: "10%", animationDuration: "9s", animationDelay: "1s", "--len": "140px" } as React.CSSProperties} />
          <span className="shooting-star" style={{ left: "40%", top: "5%", animationDuration: "13s", animationDelay: "5s", "--len": "70px" } as React.CSSProperties} />
          <span className="shooting-star burst" style={{ left: "90%", top: "22%", animationDuration: "16s", animationDelay: "9s", "--len": "100px" } as React.CSSProperties} />
        </div>
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
            <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 font-mono text-sm tracking-wide">
                <span className="flex gap-1">
                  <span className="term-dot" />
                  <span className="term-dot" />
                  <span className="term-dot accent" />
                </span>
                DEVShot
              </Link>
              <div className="flex items-center gap-1.5">
                <Show when="signed-in">
                  <Link
                    href="/write"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    글쓰기
                  </Link>
                  <Link
                    href="/my-posts"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                    내 글
                  </Link>
                  <Link
                    href="/graph"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    <GraphIcon className="w-3.5 h-3.5" />
                    그래프
                  </Link>
                  <SignOutButton redirectUrl="/">
                    <button className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors cursor-pointer">
                      <LogoutIcon className="w-3.5 h-3.5" />
                      로그아웃
                    </button>
                  </SignOutButton>
                  <span className="ml-1 border-l border-border pl-3">
                    <UserButton />
                  </span>
                </Show>
                <Show when="signed-out">
                  <span className="font-mono text-xs text-muted mr-2">개인 개발 일지</span>
                  <Link
                    href="/sign-in"
                    className="font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/sign-up"
                    className="btn-accent font-mono text-xs rounded px-3 py-1.5"
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
