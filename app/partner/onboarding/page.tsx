import { completePartnerOnboarding } from "@/lib/actions";
import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function PartnerOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role === "PARTNER" && user.partner) {
    redirect("/partner");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <form
        action={completePartnerOnboarding}
        className="w-full max-w-lg space-y-4 rounded-xl border bg-white p-6"
      >
        <h1 className="text-2xl font-bold">
          Informations du commerce
        </h1>

        <label className="block">
          <span className="mb-1 block">Nom du commerce *</span>
          <input
            name="businessName"
            required
            className="w-full rounded border p-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block">Nom du responsable</span>
          <input
            name="ownerName"
            defaultValue={user.firstName ?? ""}
            className="w-full rounded border p-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block">Téléphone *</span>
          <input
            name="phone"
            type="tel"
            required
            defaultValue={user.phone ?? ""}
            className="w-full rounded border p-2"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded bg-black px-4 py-2 text-white"
        >
          Créer mon espace commerçant
        </button>
      </form>
    </main>
  );
}