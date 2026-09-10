"use client";

import { useTransition } from "react";
import { deleteContract } from "@/lib/actions";

export default function ContractDeleteButton({
  contractId,
}: {
  contractId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      await deleteContract(contractId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md border border-destructive px-3 py-1 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Suppression..." : "Supprimer"}
    </button>
  );
}