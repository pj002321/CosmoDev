"use client";

import { use } from "react";
import { SignIn } from "@clerk/nextjs";
import SsoCallback from "@/components/auth/SsoCallback";

export default function SignInPage({
  params,
}: {
  params: Promise<{ "sign-in"?: string[] }>;
}) {
  const resolved = use(params);
  const isSsoCallback = resolved["sign-in"]?.[0] === "sso-callback";

  return (
    <div className="mx-auto max-w-sm px-6 py-24 flex flex-col items-center">
      <p className="font-mono text-xs text-muted mb-2 self-start">▸ LOGIN</p>
      {isSsoCallback ? <SsoCallback /> : <SignIn />}
    </div>
  );
}
