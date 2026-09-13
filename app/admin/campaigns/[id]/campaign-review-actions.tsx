"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CampaignReviewActions({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  const handleReview = async (action: "approve" | "reject") => {
    setError("");

    if (action === "reject") {
      const confirmed = window.confirm(
        "Confirmer le refus de cette campagne ? Cette action est irreversible."
      );

      if (!confirmed) {
        return;
      }
    }

    setLoading(action);

    try {
      const res = await fetch(
        `/api/admin/campaigns/${campaignId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la validation.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la validation."
      );
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button
          onClick={() => handleReview("approve")}
          disabled={loading !== null}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {loading === "approve" ? "Validation..." : "Valider"}
        </Button>

        <Button
          onClick={() => handleReview("reject")}
          disabled={loading !== null}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          {loading === "reject" ? "Refus..." : "Refuser"}
        </Button>
      </div>

      {error && (
        <p className="max-w-xs text-right text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
