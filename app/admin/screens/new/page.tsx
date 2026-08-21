import { createScreen } from "@/lib/actions";
import { FormInput, FormSelect } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewScreenPage() {
  const [locations, zones] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nouvel ecran</h1>
      <p className="text-gray-600 mb-6">Ajouter un ecran au reseau</p>

      <form action={createScreen} className="space-y-4 bg-white p-6 rounded-xl border">
        <FormInput label="Code ecran *" name="screenCode" placeholder="SDA-DKR-001" required />
        <FormInput label="Nom" name="name" />
        <FormSelect
          label="Emplacement *"
          name="locationId"
          required
          options={[
            { value: "", label: "Choisir un emplacement..." },
            ...locations.map((l) => ({ value: l.id, label: l.name })),
          ]}
        />
        <FormSelect
          label="Zone"
          name="zoneId"
          options={[
            { value: "", label: "Aucune" },
            ...zones.map((z) => ({ value: z.id, label: z.name })),
          ]}
        />
        <FormInput label="Resolution" name="resolution" defaultValue="1920x1080" />
        <FormSelect
          label="Orientation"
          name="orientation"
          options={[
            { value: "landscape", label: "Paysage" },
            { value: "portrait", label: "Portrait" },
          ]}
        />
        <FormInput label="Remuneration mensuelle (FCFA)" name="monthlyPartnerFee" type="number" defaultValue="20000" />
        <FormInput label="Duree boucle (sec)" name="inventoryLoopSeconds" type="number" defaultValue="120" />
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit">Creer</Button>
          <Link href="/admin/screens">
            <Button variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
