"use client";

import { useTransition } from "react";
import { updateContractStatus } from "@/lib/actions";

type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED";

const STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  TERMINATED: "Résilié",
};

export default function ContractStatusSelect({
  contractId,
  status,
}: {
  contractId: string;
  status: ContractStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`contract-status-${contractId}`}
        className="sr-only"
      >
        Statut du contrat
      </label>

      <select
        id={`contract-status-${contractId}`}
        value={status}
        disabled={isPending}
        onChange={(event) => {
          const nextStatus = event.target.value as ContractStatus;

          startTransition(async () => {
            await updateContractStatus(contractId, nextStatus);
          });
        }}
        className="rounded-full border bg-background px-3 py-1 text-sm"
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {isPending && (
        <span className="text-xs text-muted-foreground">
          Enregistrement...
        </span>
      )}
    </div>
  );
}
