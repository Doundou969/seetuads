import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Zap, Check, Monitor } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampagnesPage() {
  const [screensCount, pricingRules] = await Promise.all([
    prisma.screen.count(),
    prisma.pricingRule.findMany({
      include: { zone: true },
      where: { active: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-primary-700 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-primary-200" />
          <h1 className="text-4xl font-bold mb-4">Lancez votre Campagne</h1>
          <p className="text-primary-100 text-lg">
            {screensCount} ecrans disponibles pour votre publicite
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-12 px-6">
        {/* ETAPES */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { step: "1", title: "Creez", desc: "Definissez vos objectifs et votre budget" },
            { step: "2", title: "Selectionnez", desc: "Choisissez les ecrans et les zones" },
            { step: "3", title: "Diffusez", desc: "Votre campagne est en ligne !" },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                {s.step}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-600 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* TARIFS */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Nos Tarifs</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {pricingRules.map((pr) => (
            <div key={pr.id} className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pr.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{pr.zone?.name || "Toutes zones"}</p>
              
              <div className="text-3xl font-bold text-primary-700 mb-4">
                {Number(pr.basePrice).toLocaleString("fr-FR")} <span className="text-lg text-gray-500">XOF/jour</span>
              </div>

              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Spot de 15 secondes
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Diffusion en boucle
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Rapports de diffusion
                </li>
              </ul>

              <Link
                href="/sign-up"
                className="block text-center bg-primary-600 text-white font-medium py-3 rounded-lg hover:bg-primary-700 transition"
              >
                Choisir cette offre
              </Link>
            </div>
          ))}

          {pricingRules.length === 0 && (
            <div className="col-span-2 text-center bg-white rounded-xl shadow-sm border p-12">
              <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tarifs personnalises sur demande.</p>
              <Link href="/sign-up" className="text-primary-600 font-medium hover:underline mt-2 inline-block">
                Contactez-nous
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}