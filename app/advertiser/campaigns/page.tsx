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
  finalPrice: string | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCampaigns(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
      AWAITING_PAYMENT: "bg-purple-100 text-purple-700",
      SCHEDULED: "bg-blue-100 text-blue-700",
      ACTIVE: "bg-green-100 text-green-700",
      PAUSED: "bg-orange-100 text-orange-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Supprimer cette campagne ?")) return;
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert("Impossible de supprimer");
    }
  };

  if (loading) return <div className="text-center py-20">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes campagnes</h1>
        <Link
          href="/advertiser/campaigns/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nouvelle campagne
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          Aucune campagne. Créez votre première campagne pour commencer.
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Nom</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Période</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Prix</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
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
                    {c.estimatedPrice
                      ? `${Number(c.estimatedPrice).toLocaleString()} FCFA`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.status === "DRAFT" && (
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}