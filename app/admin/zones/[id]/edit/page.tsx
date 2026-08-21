import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateZone } from "@/lib/actions";
import { FormInput, FormTextarea } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function EditZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const zone = await prisma.zone.findUnique({ where: { id } });
  if (!zone) return notFound();

  const updateAction = updateZone.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Modifier la zone</h1>
      <p className="text-gray-600 mb-6">{zone.name}</p>

      <form action={updateAction} className="space-y-4 bg-white p-6 rounded-xl border">
        <FormInput label="Nom *" name="name" defaultValue={zone.name} required />
        <FormInput label="Ville *" name="city" defaultValue={zone.city} required />
        <FormInput label="Quartier" name="district" defaultValue={zone.district || ""} />
        <FormTextarea label="Description" name="description" defaultValue={zone.description || ""} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Latitude" name="latitude" type="number" step="any" defaultValue={zone.latitude?.toString() || ""} />
          <FormInput label="Longitude" name="longitude" type="number" step="any" defaultValue={zone.longitude?.toString() || ""} />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit">Enregistrer</Button>
          <Link href="/admin/zones">
            <Button variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
