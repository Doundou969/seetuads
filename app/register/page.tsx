import Link from "next/link";
import { TrendingUp, Store, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rejoindre SeetuAds</h1>
          <p className="text-gray-600">Choisissez votre profil pour commencer</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/sign-up"
            className="bg-white rounded-2xl border-2 border-transparent hover:border-primary-500 shadow-sm hover:shadow-md p-8 transition group"
          >
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition">
              <TrendingUp className="w-7 h-7 text-primary-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Je suis Annonceur</h2>
            <p className="text-gray-600 text-sm mb-6">
              Je veux diffuser mes publicites sur les ecrans du reseau SeetuAds.
            </p>
            <div className="flex items-center text-primary-600 font-medium text-sm">
              Creer un compte annonceur
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/sign-up"
            className="bg-white rounded-2xl border-2 border-transparent hover:border-green-500 shadow-sm hover:shadow-md p-8 transition group"
          >
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition">
              <Store className="w-7 h-7 text-green-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Je suis Commercant</h2>
            <p className="text-gray-600 text-sm mb-6">
              Je veux accueillir un ecran dans ma boutique et gagner un revenu.
            </p>
            <div className="flex items-center text-green-600 font-medium text-sm">
              Devenir partenaire
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Vous avez deja un compte ?{" "}
          <Link href="/sign-in" className="text-primary-600 hover:underline font-medium">
            Connectez-vous
          </Link>
        </p>
      </div>
    </main>
  );
}