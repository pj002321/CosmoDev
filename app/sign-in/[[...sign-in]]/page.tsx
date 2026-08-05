import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-24 flex flex-col items-center">
      <p className="font-mono text-xs text-muted mb-2 self-start">▸ LOGIN</p>
      <SignIn />
    </div>
  );
}
