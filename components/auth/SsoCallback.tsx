"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";

// ponytail: Clerk's prebuilt <SignIn/> is supposed to auto-transfer a new
// Google user into a sign-up, but in practice it can hang. This does the
// transfer explicitly and always resolves (success or a retry prompt) so
// nobody gets stuck on a spinner forever.
export default function SsoCallback() {
  const router = useRouter();
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!signInLoaded || !signUpLoaded || ran.current) return;
    ran.current = true;

    const timeout = setTimeout(() => setError("로그인 처리가 지연되고 있습니다. 다시 시도해주세요."), 10000);

    (async () => {
      try {
        if (signIn?.status === "complete") {
          await setActiveSignIn({ session: signIn.createdSessionId });
          router.replace("/");
          return;
        }
        if (signIn?.firstFactorVerification.status === "transferable") {
          const res = await signUp!.create({ transfer: true });
          if (res.status === "complete") {
            await setActiveSignUp({ session: res.createdSessionId });
            router.replace("/");
            return;
          }
        }
        setError("로그인을 완료하지 못했습니다. 다시 시도해주세요.");
      } catch {
        setError("로그인을 완료하지 못했습니다. 다시 시도해주세요.");
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => clearTimeout(timeout);
  }, [signInLoaded, signUpLoaded, signIn, signUp, setActiveSignIn, setActiveSignUp, router]);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted mb-3">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/sign-in")}
          className="btn-accent font-mono text-xs rounded px-3 py-2"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return <p className="font-mono text-xs text-muted animate-fade-in">로그인 처리 중…</p>;
}
