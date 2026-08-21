import { prisma } from "@/lib/prisma";
import { MapPin, Monitor } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CartePage() {
  const screens = await prisma.screen.findMany({
    where: { status: "ONLINE" },
    include: { location: true, zone: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-primary-700 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-primary-200" />
          <h1 className="text-4xl font-bold mb-4">Notre Reseau</h1>
          <p className="text-primary-100 text-lg">
            {screens.length} ecrans actifs dans tout Dakar
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{s.name || s.screenCode}</h3>
                  <p className="text-xs text-gray-500">{s.screenCode}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  {s.location?.name || "Emplacement inconnu"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center text-xs">📍</span>
                  {s.zone?.name || "Sans zone"}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                <span className="text-gray-500">{s.resolution}</span>
                <span className="text-green-600 font-medium">En ligne</span>
              </div>
            </div>
          ))}
        </div>

        {screens.length === 0 && (
          <p className="text-center text-gray-500 py-12">Aucun ecran actif pour le moment.</p>
        )}
      </div>
    </main>
  );
}