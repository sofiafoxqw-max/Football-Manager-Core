import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} />
    </div>
  );
}
