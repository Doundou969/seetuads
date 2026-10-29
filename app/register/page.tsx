import Link from "next/link";
import { ArrowRight, Store, TrendingUp } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Rejoindre SeetuAds
          </h1>
          <p className="text-gray-600">
            Choisissez votre profil pour commencer
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/sign-up?profile=advertiser"
            className="group rounded-2xl border-2 border-transparent bg-white p-8 shadow-sm transition hover:border-primary-500 hover:shadow-md"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 transition group-hover:bg-primary-200">
              <TrendingUp className="h-7 w-7 text-primary-700" />
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Je suis annonceur
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Je veux diffuser mes publicités sur les écrans du réseau SeetuAds.
            </p>

            <div className="flex items-center text-sm font-medium text-primary-600">
              Créer un compte annonceur
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/sign-up?profile=partner"
            className="group rounded-2xl border-2 border-transparent bg-white p-8 shadow-sm transition hover:border-green-500 hover:shadow-md"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 transition group-hover:bg-green-200">
              <Store className="h-7 w-7 text-green-700" />
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Je suis commerçant
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Je souhaite proposer mon commerce pour accueillir un écran SeetuAds.
            </p>

            <div className="flex items-center text-sm font-medium text-green-600">
              Devenir partenaire
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary-600 hover:underline"
          >
            Connectez-vous
          </Link>
        </p>
      </div>
    </main>
  );
}
