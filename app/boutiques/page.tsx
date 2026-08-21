import { prisma } from "@/lib/prisma";
import { MapPin, Phone, Store } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BoutiquesPage() {
  const partners = await prisma.partner.findMany({
    where: { status: "ACTIVE" },
    include: { locations: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-primary-700 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-primary-200" />
          <h1 className="text-4xl font-bold mb-4">Nos Boutiques Partenaires</h1>
          <p className="text-primary-100 text-lg">
            {partners.length} commerces de proximite vous accueillent
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="grid md:grid-cols-2 gap-6">
          {partners.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{p.businessName}</h3>
              <p className="text-gray-500 text-sm mb-4">{p.businessType || "Commerce"}</p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  {p.address}, {p.city}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-500" />
                  {p.phone}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  {p.locations.length} emplacement{p.locations.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>

        {partners.length === 0 && (
          <p className="text-center text-gray-500 py-12">Aucune boutique partenaire pour le moment.</p>
        )}
      </div>
    </main>
  );
}