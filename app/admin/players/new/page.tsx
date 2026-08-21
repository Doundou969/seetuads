import { createPlayer } from "@/lib/actions";
import { FormInput, FormSelect } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewPlayerPage() {
  const screens = await prisma.screen.findMany({
    where: { player: null },
    orderBy: { screenCode: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nouveau player</h1>
      <p className="text-gray-600 mb-6">Enregistrer un appareil de lecture</p>

      <form action={createPlayer} className="space-y-4 bg-white p-6 rounded-xl border">
        <FormInput label="Device ID *" name="deviceId" required />
        <FormInput label="Numero de serie" name="serialNumber" />
        <FormInput label="Version app" name="appVersion" defaultValue="1.0.0" />
        <FormSelect
          label="Ecran associe"
          name="screenId"
          options={[
            { value: "", label: "Aucun (non assigne)" },
            ...screens.map((s) => ({ value: s.id, label: `${s.screenCode} — ${s.name || s.locationId}` })),
          ]}
        />
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit">Creer</Button>
          <Link href="/admin/players">
            <Button variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
