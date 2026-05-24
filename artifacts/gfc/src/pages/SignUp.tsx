import { SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} />
    </div>
  );
}
