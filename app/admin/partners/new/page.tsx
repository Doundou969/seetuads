import { createPartner } from "@/lib/actions";
import { FormInput } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function NewPartnerPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nouveau partenaire</h1>
      <p className="text-gray-600 mb-6">Ajouter un commercant partenaire</p>

      <form action={createPartner} className="space-y-4 bg-white p-6 rounded-xl border">
        <FormInput label="Nom de l entreprise *" name="businessName" required />
        <FormInput label="Nom du proprietaire" name="ownerName" />
        <FormInput label="Telephone *" name="phone" type="tel" required />
        <FormInput label="Email" name="email" type="email" />
        <FormInput label="Type d activite" name="businessType" />
        <FormInput label="Adresse" name="address" />
        <FormInput label="Ville" name="city" defaultValue="Dakar" />
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit">Creer</Button>
          <Link href="/admin/partners">
            <Button variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
