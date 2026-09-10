"use client";

import { useClerk } from "@clerk/nextjs";

export default function PartnerSignOut() {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
    >
      Se déconnecter
    </button>
  );
}