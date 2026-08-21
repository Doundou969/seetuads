import { createLocation } from "@/lib/actions";
import { FormInput, FormSelect } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewLocationPage() {
  const partners = await prisma.partner.findMany({ orderBy: { businessName: "asc" } });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nouvel emplacement</h1>
      <p className="text-gray-600 mb-6">Ajouter un point de vente</p>

      <form action={createLocation} className="space-y-4 bg-white p-6 rounded-xl border">
        <FormSelect
          label="Partenaire *"
          name="partnerId"
          required
          options={[
            { value: "", label: "Choisir un partenaire..." },
            ...partners.map((p) => ({ value: p.id, label: p.businessName })),
          ]}
        />
        <FormInput label="Nom du lieu *" name="name" required />
        <FormInput label="Adresse *" name="address" required />
        <FormInput label="Ville" name="city" defaultValue="Dakar" />
        <FormInput label="Quartier" name="district" />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Latitude" name="latitude" type="number" step="any" />
          <FormInput label="Longitude" name="longitude" type="number" step="any" />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit">Creer</Button>
          <Link href="/admin/locations">
            <Button variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
