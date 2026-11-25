import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Suspense
        fallback={
          <p className="text-sm text-gray-600">
            Chargement de l’inscription…
          </p>
        }
      >
        <SignUp
          forceRedirectUrl="/dashboard"
          signInFallbackRedirectUrl="/dashboard"
        />
      </Suspense>
    </main>
  );
}