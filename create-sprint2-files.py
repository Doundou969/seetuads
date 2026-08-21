#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Creation complete Sprint 2 — Admin SeetuAds"""

import os

BASE = os.getcwd()

def write(rel_path, content):
    full = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as out:
        out.write(content)
    print(f"  OK {rel_path}")

print("=" * 60)
print("  CREATION SPRINT 2 — ADMIN RESEAU")
print("=" * 60)

write("lib/actions.ts", r""""use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ============================================================================
// ZONES
// ============================================================================

export async function createZone(formData: FormData) {
  const name = formData.get("name") as string;
  const city = formData.get("city") as string;
  const district = formData.get("district") as string;
  const description = formData.get("description") as string;
  const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
  const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

  await prisma.zone.create({
    data: { name, city, district: district || null, description: description || null, latitude, longitude },
  });

  revalidatePath("/admin/zones");
  redirect("/admin/zones");
}

export async function updateZone(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const city = formData.get("city") as string;
  const district = formData.get("district") as string;
  const description = formData.get("description") as string;
  const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
  const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

  await prisma.zone.update({
    where: { id },
    data: { name, city, district: district || null, description: description || null, latitude, longitude },
  });

  revalidatePath("/admin/zones");
  redirect("/admin/zones");
}

export async function deleteZone(id: string) {
  await prisma.zone.delete({ where: { id } });
  revalidatePath("/admin/zones");
}

// ============================================================================
// PARTNERS
// ============================================================================

export async function createPartner(formData: FormData) {
  const businessName = formData.get("businessName") as string;
  const ownerName = formData.get("ownerName") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const businessType = formData.get("businessType") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;

  await prisma.partner.create({
    data: {
      businessName,
      ownerName: ownerName || null,
      phone,
      email: email || null,
      businessType: businessType || null,
      address: address || null,
      city: city || "Dakar",
      userId: "temp-user-id",
    },
  });

  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}

export async function deletePartner(id: string) {
  await prisma.partner.delete({ where: { id } });
  revalidatePath("/admin/partners");
}

// ============================================================================
// LOCATIONS
// ============================================================================

export async function createLocation(formData: FormData) {
  const partnerId = formData.get("partnerId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const district = formData.get("district") as string;
  const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
  const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

  await prisma.location.create({
    data: {
      partnerId,
      name,
      address,
      city: city || "Dakar",
      district: district || null,
      latitude,
      longitude,
    },
  });

  revalidatePath("/admin/locations");
  redirect("/admin/locations");
}

export async function deleteLocation(id: string) {
  await prisma.location.delete({ where: { id } });
  revalidatePath("/admin/locations");
}

// ============================================================================
// SCREENS
// ============================================================================

export async function createScreen(formData: FormData) {
  const locationId = formData.get("locationId") as string;
  const zoneId = formData.get("zoneId") as string;
  const screenCode = formData.get("screenCode") as string;
  const name = formData.get("name") as string;
  const resolution = formData.get("resolution") as string;
  const orientation = formData.get("orientation") as string;
  const monthlyPartnerFee = parseFloat(formData.get("monthlyPartnerFee") as string) || 20000;
  const inventoryLoopSeconds = parseInt(formData.get("inventoryLoopSeconds") as string) || 120;

  await prisma.screen.create({
    data: {
      locationId,
      zoneId: zoneId || null,
      screenCode,
      name: name || null,
      resolution: resolution || "1920x1080",
      orientation: orientation || "landscape",
      monthlyPartnerFee,
      inventoryLoopSeconds,
    },
  });

  revalidatePath("/admin/screens");
  redirect("/admin/screens");
}

export async function deleteScreen(id: string) {
  await prisma.screen.delete({ where: { id } });
  revalidatePath("/admin/screens");
}

// ============================================================================
// PLAYERS
// ============================================================================

export async function createPlayer(formData: FormData) {
  const screenId = formData.get("screenId") as string;
  const deviceId = formData.get("deviceId") as string;
  const serialNumber = formData.get("serialNumber") as string;
  const appVersion = formData.get("appVersion") as string;

  await prisma.player.create({
    data: {
      screenId: screenId || null,
      deviceId,
      serialNumber: serialNumber || null,
      appVersion: appVersion || "1.0.0",
    },
  });

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function deletePlayer(id: string) {
  await prisma.player.delete({ where: { id } });
  revalidatePath("/admin/players");
}
""")
write("components/admin/sidebar.tsx", r""""use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Store,
  Monitor,
  Play,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/zones", label: "Zones", icon: MapPin },
  { href: "/admin/partners", label: "Partenaires", icon: Store },
  { href: "/admin/locations", label: "Emplacements", icon: MapPin },
  { href: "/admin/screens", label: "Ecrans", icon: Monitor },
  { href: "/admin/players", label: "Players", icon: Play },
  { href: "/admin/settings", label: "Parametres", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="text-xl font-bold text-primary-700">
          SeetuAds Admin
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
""")
write("components/admin/data-table.tsx", r""""use client";

import { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  actions?: (row: Record<string, unknown>) => ReactNode;
}

export function DataTable({ columns, rows, actions }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4">
                {col.label}
              </th>
            ))}
            {actions && <th className="px-6 py-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-500"
              >
                Aucune donnee
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-gray-900">
                  {col.render
                    ? col.render(row[col.key], row)
                    : (row[col.key] as ReactNode) || "—"}
                </td>
              ))}
              {actions && <td className="px-6 py-4 text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
""")
write("components/admin/form-input.tsx", r"""import { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormInput({ label, ...props }: FormInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
      />
    </div>
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, options, ...props }: FormSelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        {...props}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function FormTextarea({ label, ...props }: FormTextareaProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        {...props}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
      />
    </div>
  );
}
""")
write("app/admin/layout.tsx", r"""import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
""")
write("app/admin/page.tsx", r"""import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Store, MapPin, Play } from "lucide-react";

export default async function AdminDashboardPage() {
  const [screensCount, partnersCount, zonesCount, playersCount] = await Promise.all([
    prisma.screen.count(),
    prisma.partner.count(),
    prisma.zone.count(),
    prisma.player.count(),
  ]);

  const stats = [
    { label: "Ecrans", value: screensCount, icon: Monitor },
    { label: "Partenaires", value: partnersCount, icon: Store },
    { label: "Zones", value: zonesCount, icon: MapPin },
    { label: "Players", value: playersCount, icon: Play },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
      <p className="text-gray-600 mb-8">Vue d ensemble du reseau SeetuAds</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
""")
write("app/admin/zones/page.tsx", r"""import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/admin/data-table";
import { deleteZone } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default async function ZonesPage() {
  const zones = await prisma.zone.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zones</h1>
          <p className="text-gray-600">Gerer les zones geographiques</p>
        </div>
        <Link href="/admin/zones/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle zone
          </Button>
        </Link>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Nom" },
          { key: "city", label: "Ville" },
          { key: "district", label: "Quartier" },
          { key: "status", label: "Statut" },
        ]}
        rows={zones.map((z) => ({
          id: z.id,
          name: z.name,
          city: z.city,
          district: z.district,
          status: z.status,
        }))}
        actions={(row) => (
          <div className="flex items-center gap-2 justify-end">
            <Link href={`/admin/zones/${row.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
            <form action={deleteZone.bind(null, row.id as string)}>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </Button>
            </form>
          </div>
        )}
      />
    </div>
  );
}
""")
write("app/admin/zones/new/page.tsx", r"""import { createZone } from "@/lib/actions";
import { FormInput, FormTextarea } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
""")
write(r"app/admin/zones/[id]/edit/page.tsx", r"""import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateZone } from "@/lib/actions";
import { FormInput, FormTextarea } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
""")
write("app/admin/partners/page.tsx", r"""import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/admin/data-table";
import { deletePartner } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: { locations: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partenaires</h1>
          <p className="text-gray-600">Gerer les commercants partenaires</p>
        </div>
        <Link href="/admin/partners/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau partenaire
          </Button>
        </Link>
      </div>

      <DataTable
        columns={[
          { key: "businessName", label: "Entreprise" },
          { key: "ownerName", label: "Proprietaire" },
          { key: "phone", label: "Telephone" },
          { key: "city", label: "Ville" },
          { key: "locationsCount", label: "Emplacements" },
          { key: "status", label: "Statut" },
        ]}
        rows={partners.map((p) => ({
          id: p.id,
          businessName: p.businessName,
          ownerName: p.ownerName,
          phone: p.phone,
          city: p.city,
          locationsCount: p.locations.length,
          status: p.status,
        }))}
        actions={(row) => (
          <form action={deletePartner.bind(null, row.id as string)}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        )}
      />
    </div>
  );
}
""")
write("app/admin/partners/new/page.tsx", r"""import { createPartner } from "@/lib/actions";
import { FormInput } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
""")
write("app/admin/locations/page.tsx", r"""import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/admin/data-table";
import { deleteLocation } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: { createdAt: "desc" },
    include: { partner: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emplacements</h1>
          <p className="text-gray-600">Gerer les boutiques et points de vente</p>
        </div>
        <Link href="/admin/locations/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel emplacement
          </Button>
        </Link>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Nom" },
          { key: "partner", label: "Partenaire", render: (v) => (v as { businessName: string })?.businessName },
          { key: "address", label: "Adresse" },
          { key: "district", label: "Quartier" },
          { key: "city", label: "Ville" },
          { key: "status", label: "Statut" },
        ]}
        rows={locations.map((l) => ({
          id: l.id,
          name: l.name,
          partner: l.partner,
          address: l.address,
          district: l.district,
          city: l.city,
          status: l.status,
        }))}
        actions={(row) => (
          <form action={deleteLocation.bind(null, row.id as string)}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        )}
      />
    </div>
  );
}
""")
write("app/admin/locations/new/page.tsx", r"""import { createLocation } from "@/lib/actions";
import { FormInput, FormSelect } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
""")
write("app/admin/screens/page.tsx", r"""import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/admin/data-table";
import { deleteScreen } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default async function ScreensPage() {
  const screens = await prisma.screen.findMany({
    orderBy: { createdAt: "desc" },
    include: { location: true, zone: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ecrans</h1>
          <p className="text-gray-600">Gerer les ecrans publicitaires</p>
        </div>
        <Link href="/admin/screens/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel ecran
          </Button>
        </Link>
      </div>

      <DataTable
        columns={[
          { key: "screenCode", label: "Code" },
          { key: "name", label: "Nom" },
          { key: "location", label: "Emplacement", render: (v) => (v as { name: string })?.name },
          { key: "zone", label: "Zone", render: (v) => (v as { name: string })?.name || "—" },
          { key: "resolution", label: "Resolution" },
          { key: "status", label: "Statut" },
        ]}
        rows={screens.map((s) => ({
          id: s.id,
          screenCode: s.screenCode,
          name: s.name,
          location: s.location,
          zone: s.zone,
          resolution: s.resolution,
          status: s.status,
        }))}
        actions={(row) => (
          <form action={deleteScreen.bind(null, row.id as string)}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        )}
      />
    </div>
  );
}
""")
write("app/admin/screens/new/page.tsx", r"""import { createScreen } from "@/lib/actions";
import { FormInput, FormSelect } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
""")
write("app/admin/players/page.tsx", r"""import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/admin/data-table";
import { deletePlayer } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
    include: { screen: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-600">Gerer les appareils de lecture</p>
        </div>
        <Link href="/admin/players/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau player
          </Button>
        </Link>
      </div>

      <DataTable
        columns={[
          { key: "deviceId", label: "Device ID" },
          { key: "screen", label: "Ecran", render: (v) => (v as { screenCode: string })?.screenCode || "—" },
          { key: "appVersion", label: "Version" },
          { key: "status", label: "Statut" },
          { key: "lastHeartbeat", label: "Dernier contact", render: (v) => v ? new Date(v as string).toLocaleString("fr-FR") : "Jamais" },
        ]}
        rows={players.map((p) => ({
          id: p.id,
          deviceId: p.deviceId,
          screen: p.screen,
          appVersion: p.appVersion,
          status: p.status,
          lastHeartbeat: p.lastHeartbeat,
        }))}
        actions={(row) => (
          <form action={deletePlayer.bind(null, row.id as string)}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        )}
      />
    </div>
  );
}
""")
write("app/admin/players/new/page.tsx", r"""import { createPlayer } from "@/lib/actions";
import { FormInput, FormSelect } from "@/components/admin/form-input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
""")
write("components/ui/button.tsx", r"""import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-primary-600 text-white hover:bg-primary-700 px-4 py-2",
          variant === "outline" && "border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 text-gray-700",
          variant === "ghost" && "hover:bg-gray-100 px-2 py-1 text-gray-700",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-11 px-8",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
""")
write("components/ui/card.tsx", r"""import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-white shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
""")
print()
print("=" * 60)
print("  SPRINT 2 TERMINE — FICHIERS CREES")
print("=" * 60)
print()
print("Pages admin creees :")
print("  /admin                 — Dashboard")
print("  /admin/zones           — Liste + CRUD zones")
print("  /admin/partners        — Liste + CRUD partenaires")
print("  /admin/locations       — Liste + CRUD emplacements")
print("  /admin/screens         — Liste + CRUD ecrans")
print("  /admin/players         — Liste + CRUD players")
print()
print("Composants UI creees :")
print("  components/ui/button.tsx")
print("  components/ui/card.tsx")
print()
print("Prochaines etapes :")
print("  1. python create-sprint2-files.py")
print("  2. npm run dev")
print("  3. Aller sur http://localhost:3000/admin")
print("  4. Creer quelques zones, partenaires, ecrans...")
print("  5. Deployer sur Vercel quand c est pret")
