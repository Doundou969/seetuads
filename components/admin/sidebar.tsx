"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, UserButton } from "@clerk/nextjs";
import {
LayoutDashboard,
MapPin,
Store,
Monitor,
Settings,
Film,
Users,
LogOut,
ListVideo,
BarChart3,
FileText,
ChevronRight,
Radio,
Megaphone,
Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
{
title: "Vue générale",
links: [
{
href: "/admin",
label: "Dashboard",
icon: LayoutDashboard,
},
{
href: "/admin/analytics",
label: "Analytics",
icon: BarChart3,
},
],
},
{
title: "Publicité",
links: [
{
href: "/admin/advertisers",
label: "Annonceurs",
icon: Users,
},
{
href: "/admin/campaigns",
label: "Campagnes",
icon: Megaphone,
},
{
href: "/admin/media",
label: "Médias",
icon: Film,
},
{
href: "/admin/playlists",
label: "Playlists",
icon: ListVideo,
},
],
},
{
title: "Réseau",
links: [
{
href: "/admin/screens",
label: "Écrans",
icon: Monitor,
},
{
href: "/admin/players",
label: "Players",
icon: Radio,
},
{
href: "/admin/locations",
label: "Emplacements",
icon: MapPin,
},
{
href: "/admin/zones",
label: "Zones",
icon: MapPin,
},
{
href: "/admin/partners",
label: "Partenaires",
icon: Store,
},
],
},
{
title: "Gestion",
links: [
{
href: "/admin/contracts",
label: "Contrats",
icon: FileText,
},
],
},
];

export function AdminSidebar() {
const pathname = usePathname();
const router = useRouter();
const { signOut } = useClerk();

async function handleSignOut() {
await signOut();
router.push("/");
}

return (
<aside className="sticky top-0 flex h-screen w-[272px] shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 text-white">
{/* Brand */}
<div className="flex h-[82px] shrink-0 items-center border-b border-white/[0.08] px-5">
<Link href="/admin" className="group flex items-center gap-3" >
<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25 transition-transform duration-200 group-hover:scale-105">
<Play className="h-5 w-5 fill-white text-white" />
</div>

      <div className="min-w-0">
        <div className="text-[17px] font-bold tracking-tight text-white">
          SeetuAds
        </div>

        <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Administration
        </div>
      </div>
    </Link>
  </div>

  {/* Navigation */}
  <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
    {sections.map((section) => (
      <div key={section.title} className="mb-7">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          {section.title}
        </div>

        <div className="space-y-1">
          {section.links.map((link) => {
            const Icon = link.icon;

            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                )}

                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-slate-300"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />

                <span className="flex-1 truncate">
                  {link.label}
                </span>

                {isActive && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-blue-200"
                    strokeWidth={2}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    ))}

    {/* System */}
    <div>
      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
        Système
      </div>

      <Link
        href="/admin/settings"
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          pathname === "/admin/settings" ||
            pathname.startsWith("/admin/settings/")
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
            : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100"
        )}
      >
        <Settings
          className={cn(
            "h-[18px] w-[18px]",
            pathname === "/admin/settings"
              ? "text-white"
              : "text-slate-500 group-hover:text-slate-300"
          )}
          strokeWidth={1.8}
        />

        <span className="flex-1">
          Paramètres
        </span>

        {pathname === "/admin/settings" && (
          <ChevronRight className="h-3.5 w-3.5 text-blue-200" />
        )}
      </Link>
    </div>
  </nav>

  {/* Account */}
  <div className="shrink-0 border-t border-white/[0.08] p-3">
    <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.035] p-3">
      <div className="shrink-0">
        <UserButton />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-white">
          Administrateur
        </p>

        <p className="mt-0.5 text-[11px] text-slate-500">
          Compte sécurisé
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={handleSignOut}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-all duration-200 hover:bg-red-500/[0.08] hover:text-red-400"
    >
      <LogOut
        className="h-[17px] w-[17px] transition-transform duration-200 group-hover:-translate-x-0.5"
        strokeWidth={1.8}
      />

      <span>Déconnexion</span>
    </button>
  </div>
</aside>


);
}