"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  estimatedPrice: string | null;
  _count?: { campaignScreens: number; campaignMedia: number };
}

export default function AdvertiserDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCampaigns(data.slice(0, 5));
          setStats({
            total: data.length,
            active: data.filter((c: Campaign) => c.status === "ACTIVE").length,
            draft: data.filter((c: Campaign) => c.status === "DRAFT").length,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
      ACTIVE: "bg-green-100 text-green-700",
      PAUSED: "bg-orange-100 text-orange-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) return <div className="text-center py-20">Chargement...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Campagnes totales</p>
          <p className="text-3xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Campagnes actives</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Brouillons</p>
          <p className="text-3xl font-bold mt-2 text-gray-600">{stats.draft}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dernières campagnes</h2>
          <Link href="/advertiser/campaigns" className="text-sm text-blue-600 hover:underline">
            Voir tout →
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Aucune campagne pour le moment.
            <div className="mt-4">
              <Link
                href="/advertiser/campaigns/new"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Créer ma première campagne
              </Link>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Nom</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Période</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Prix estimé</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(c.startDate).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(c.endDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4">
                    {c.estimatedPrice ? `${Number(c.estimatedPrice).toLocaleString()} FCFA` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}