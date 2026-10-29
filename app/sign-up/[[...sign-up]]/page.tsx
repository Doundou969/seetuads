import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

type PageProps = {
  searchParams: Promise<{
    profile?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const { profile } = await searchParams;

  const redirectUrl =
    profile === "partner" ? "/partner/onboarding" : "/dashboard";

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
          forceRedirectUrl={redirectUrl}
          signInFallbackRedirectUrl="/dashboard"
        />
      </Suspense>
    </main>
  );
}
