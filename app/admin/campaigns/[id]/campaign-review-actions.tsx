"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CampaignReviewActions({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const submitReview = async (
    action: "approve" | "reject",
    reason?: string
  ) => {
    setError("");
    setLoading(action);

    try {
      const res = await fetch(
        `/api/admin/campaigns/${campaignId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, reason }),
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

  const handleApprove = () => {
    submitReview("approve");
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const handleConfirmReject = () => {
    submitReview("reject", rejectionReason);
    setShowRejectForm(false);
  };

  if (showRejectForm) {
    return (
      <div className="flex w-full max-w-xs flex-col gap-2">
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Motif du refus (optionnel)"
          rows={3}
          className="w-full rounded-md border border-gray-300 p-2 text-sm"
        />

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleCancelReject}
            disabled={loading !== null}
            variant="outline"
          >
            Annuler
          </Button>

          <Button
            onClick={handleConfirmReject}
            disabled={loading !== null}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading === "reject" ? "Refus..." : "Confirmer le refus"}
          </Button>
        </div>

        {error && (
          <p className="text-right text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={loading !== null}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {loading === "approve" ? "Validation..." : "Valider"}
        </Button>

        <Button
          onClick={handleRejectClick}
          disabled={loading !== null}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          Refuser
        </Button>
      </div>

      {error && (
        <p className="max-w-xs text-right text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
