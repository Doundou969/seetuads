"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  MapPin,
  Store,
  Monitor,
  Play,
  Settings,
  Film,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/campaigns", label: "Campagnes", icon: Play },
  { href: "/admin/media", label: "Medias", icon: Film },
  { href: "/admin/advertisers", label: "Annonceurs", icon: Users },
  { href: "/admin/zones", label: "Zones", icon: MapPin },
  { href: "/admin/partners", label: "Partenaires", icon: Store },
  { href: "/admin/locations", label: "Emplacements", icon: MapPin },
  { href: "/admin/screens", label: "Ecrans", icon: Monitor },
  { href: "/admin/players", label: "Players", icon: Play },
  { href: "/admin/settings", label: "Parametres", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link
          href="/admin"
          className="text-xl font-bold text-primary-700"
        >
          SeetuAds Admin
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          const isActive =
            pathname === link.href ||
            pathname?.startsWith(link.href + "/");

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

      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />

          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Mon compte
            </p>
            <p className="text-xs text-gray-500">
              Administrateur
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
