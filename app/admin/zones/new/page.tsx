import { createZone } from "@/lib/actions";
import { FormInput, FormTextarea } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function NewZonePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nouvelle zone</h1>
      <p className="text-gray-600 mb-6">Creer une nouvelle zone geographique</p>

      <form action={createZone} className="space-y-4 bg-white p-6 rounded-xl border">
        <FormInput label="Nom *" name="name" required />
        <FormInput label="Ville *" name="city" defaultValue="Dakar" required />
        <FormInput label="Quartier" name="district" />
        <FormTextarea label="Description" name="description" rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Latitude" name="latitude" type="number" step="any" />
          <FormInput label="Longitude" name="longitude" type="number" step="any" />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit">Creer</Button>
          <Link href="/admin/zones">
            <Button variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
