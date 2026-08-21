"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MapPin,
  MonitorPlay,
  PlayCircle,
  ShieldCheck,
  Store,
  TrendingUp,
  UsersRound,
  Zap,
} from "lucide-react";

type Stats = {
  zones: number;
  partners: number;
  screens: number;
  campaigns: number;
};

export function LandingContent({ stats }: { stats: Stats }) {
  const networkStats = [
    { value: stats.zones, label: "zones couvertes", icon: MapPin },
    { value: stats.partners, label: "commerces partenaires", icon: Store },
    { value: stats.screens, label: "écrans actifs", icon: MonitorPlay },
    { value: stats.campaigns, label: "campagnes créées", icon: PlayCircle },
  ];

  const advertiserBenefits = [
    "Choisissez les zones les plus pertinentes pour votre cible.",
    "Diffusez vos visuels sur un réseau d’écrans en commerce.",
    "Suivez l’activité de vos campagnes depuis un seul tableau de bord.",
  ];

  const partnerBenefits = [
    "Valorisez l’emplacement de votre commerce.",
    "Accueillez un écran sans gestion technique complexe.",
    "Créez une nouvelle source de revenus pour votre boutique.",
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50">
      <section className="relative isolate overflow-hidden bg-slate-950 px-6 pb-24 pt-6 text-white md:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="absolute right-[-120px] top-[250px] h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute left-[-120px] top-[320px] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>

        <header className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Seetu<span className="text-emerald-400">Ads</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <Link href="/carte" className="transition hover:text-white">
              Le réseau
            </Link>
            <Link href="/campagnes" className="transition hover:text-white">
              Campagnes
            </Link>
            <Link href="/boutiques" className="transition hover:text-white">
              Partenaires
            </Link>
          </nav>

          <Link
            href="/sign-in"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            Se connecter
          </Link>
        </header>

        <div className="mx-auto grid max-w-6xl items-center gap-14 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <Zap className="h-4 w-4" />
              Publicité digitale locale au Sénégal
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
              Faites exister votre marque là où vos clients passent.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              SeetuAds connecte les annonceurs à un réseau d’écrans installés dans
              les commerces de proximité, pour des campagnes locales simples à
              lancer et faciles à suivre.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Lancer une campagne
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/carte"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Voir le réseau
                <MapPin className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Une plateforme pensée pour les annonceurs et les commerçants.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
              <div className="rounded-2xl bg-slate-900 p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm text-slate-400">Campagne en cours</p>
                    <p className="mt-1 font-semibold">Nouveau produit Dakar</p>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Active
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Zones sélectionnées</p>
                    <p className="mt-2 text-2xl font-bold">4</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Écrans ciblés</p>
                    <p className="mt-2 text-2xl font-bold">
                      {Math.max(stats.screens, 1)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-100">Diffusion locale</p>
                      <p className="mt-1 text-xl font-bold">Votre marque, au bon endroit</p>
                    </div>
                    <MonitorPlay className="h-10 w-10 text-white/80" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-7 -left-5 rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-400/15 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pilotage simple</p>
                  <p className="text-sm font-semibold">Un seul tableau de bord</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-6">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-4">
          {networkStats.map((item) => (
            <div
              key={item.label}
              className="border-b border-r border-slate-100 p-5 last:border-r-0 md:border-b-0 md:p-6"
            >
              <item.icon className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-2xl font-bold text-slate-950">{item.value}</p>
              <p className="mt-1 text-sm text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Une diffusion plus proche
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Une campagne locale ne devrait pas être compliquée.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Créez votre campagne, choisissez votre zone, ajoutez vos visuels et
            laissez SeetuAds organiser la diffusion sur le réseau.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Choisissez vos zones",
              text: "Identifiez les quartiers et commerces les plus pertinents pour votre audience.",
              icon: MapPin,
            },
            {
              number: "02",
              title: "Créez votre campagne",
              text: "Ajoutez votre média, votre période de diffusion et vos préférences.",
              icon: PlayCircle,
            },
            {
              number: "03",
              title: "Suivez votre présence",
              text: "Retrouvez votre activité et vos campagnes depuis votre espace SeetuAds.",
              icon: BarChart3,
            },
          ].map((step) => (
            <div key={step.number} className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-600">{step.number}</span>
                <step.icon className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mt-8 text-xl font-bold text-slate-950">{step.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-950 p-8 text-white md:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <TrendingUp className="h-6 w-6 text-blue-300" />
            </div>
            <h2 className="mt-8 text-3xl font-bold">Vous êtes annonceur ?</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Donnez à votre marque une présence visible dans les lieux du quotidien.
            </p>
            <ul className="mt-7 space-y-3">
              {advertiserBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  {benefit}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Créer une campagne
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="rounded-3xl bg-emerald-500 p-8 text-slate-950 md:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40">
              <Store className="h-6 w-6" />
            </div>
            <h2 className="mt-8 text-3xl font-bold">Vous êtes commerçant ?</h2>
            <p className="mt-4 leading-7 text-emerald-950/80">
              Rejoignez le réseau SeetuAds et donnez plus de valeur à votre emplacement.
            </p>
            <ul className="mt-7 space-y-3">
              {partnerBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Devenir partenaire
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 px-8 py-14 text-center text-white shadow-xl md:px-16">
          <UsersRound className="mx-auto h-8 w-8 text-blue-200" />
          <h2 className="mt-5 text-3xl font-bold md:text-4xl">
            Prêt à faire voir votre marque ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Lancez votre première campagne ou découvrez les opportunités de partenariat.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Commencer avec SeetuAds
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} SeetuAds · Dakar, Sénégal
      </footer>
    </main>
  );
}