"use client";

import { motion } from "framer-motion";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Mail,
  MapPin,
  MonitorPlay,
  Phone,
  PlayCircle,
  ShieldCheck,
  Store,
  Target,
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
  const steps = [
    {
      number: "01",
      title: "Choisissez vos zones",
      text: "Sélectionnez les quartiers et zones qui correspondent à votre audience.",
      icon: MapPin,
    },
    {
      number: "02",
      title: "Sélectionnez vos écrans",
      text: "Choisissez les emplacements les plus pertinents pour votre campagne.",
      icon: MonitorPlay,
    },
    {
      number: "03",
      title: "Ajoutez votre média",
      text: "Importez votre visuel et définissez les paramètres de diffusion.",
      icon: PlayCircle,
    },
    {
      number: "04",
      title: "Suivez votre campagne",
      text: "Pilotez votre présence depuis votre espace SeetuAds.",
      icon: BarChart3,
    },
  ];

  const advertiserBenefits = [
    "Ciblez les zones les plus pertinentes pour votre audience.",
    "Diffusez vos contenus sur des écrans installés dans les commerces.",
    "Suivez vos campagnes depuis un espace simple et centralisé.",
  ];

  const partnerBenefits = [
    "Valorisez l'espace disponible dans votre commerce.",
    "Accueillez un écran publicitaire sans gestion technique complexe.",
    "Développez une nouvelle source de revenus pour votre établissement.",
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-[#07111F]">
      <section className="relative overflow-hidden bg-[#07111F] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.22),transparent_40%)]" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Seetu<span className="text-[#00D68F]">Ads</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <Link href="/carte" className="transition hover:text-white">
              Le réseau
            </Link>
            <Link href="/campagnes" className="transition hover:text-white">
              Campagnes
            </Link>
            <Link href="/boutiques" className="transition hover:text-white">
              Partenaires
            </Link>
            <Link href="#contact" className="transition hover:text-white">
              Contact
            </Link>
          </nav>

          <Link
            href="/sign-in"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"
          >
            Se connecter
          </Link>
        </header>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1fr_0.95fr] lg:pb-32 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-[#00D68F]/10 px-4 py-2 text-sm font-medium text-[#00D68F]">
              <Zap className="h-4 w-4" />
              Publicité digitale locale au Sénégal
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              Donnez plus de visibilité à votre marque, là où vos clients
              passent.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              SeetuAds connecte les annonceurs à un réseau d'écrans
              publicitaires installés dans les commerces de proximité au
              Sénégal.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D68F] px-6 py-3.5 font-semibold text-[#07111F] transition hover:bg-emerald-300"
              >
                Lancer une campagne
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/carte"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold transition hover:bg-white/10"
              >
                Découvrir le réseau
                <MapPin className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="h-5 w-5 text-[#00D68F]" />
              Une plateforme pensée pour les annonceurs et les commerçants.
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="relative overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/images/seetuads-dooh.png"
                  alt="Écran publicitaire SeetuAds dans une boutique de quartier au Sénégal"
                  width={900}
                  height={650}
                  priority
                  className="h-[420px] w-full object-cover md:h-[520px]"
                />

                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-[#07111F]/80 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Diffusion locale
                      </p>
                      <p className="mt-1 font-semibold">
                        Votre marque au bon endroit
                      </p>
                    </div>
                    <MonitorPlay className="h-7 w-7 text-[#00D68F]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-xl md:-left-8">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#00D68F]/15 p-2">
                  <TrendingUp className="h-5 w-5 text-[#00D68F]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pilotage simple</p>
                  <p className="text-sm font-semibold">
                    Une seule plateforme
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-6">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-4">
          {[
            { value: stats.zones, label: "Reseau en expansion a Dakar", icon: MapPin },
            {
              value: stats.partners,
              label: "Nouveaux partenaires chaque mois",
              icon: Store,
            },
            {
              value: stats.screens,
              label: "écrans actifs",
              icon: MonitorPlay,
            },
            {
              value: stats.campaigns,
              label: "campagnes créées",
              icon: PlayCircle,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="border-b border-r border-slate-100 p-6 last:border-r-0 md:border-b-0"
            >
              <item.icon className="h-5 w-5 text-[#2388FF]" />
              
              <p className="mt-1 text-sm text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-6 py-24 md:py-32">
        <div className="absolute left-1/2 top-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2388FF]/20 bg-[#2388FF]/10 px-4 py-2 text-sm font-semibold text-[#2388FF]">
              <Zap className="h-4 w-4" />
              Comment ça marche ?
            </div>

            <h2 className="mt-6 text-4xl font-bold tracking-tight text-[#07111F] md:text-5xl">
              Lancez votre campagne en quelques étapes.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              De la sélection des emplacements jusqu'au suivi de votre
              campagne, SeetuAds simplifie chaque étape de votre diffusion.
            </p>
          </div>

          <div className="relative mt-16">
            <div className="absolute left-[12%] right-[12%] top-16 hidden h-px bg-gradient-to-r from-blue-200 via-emerald-300 to-blue-200 lg:block" />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.12,
                  }}
                  className="group relative"
                >
                  <div className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#2388FF]/20 hover:shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <step.icon className="h-6 w-6" />
                      </div>

                      <span className="text-5xl font-black tracking-tighter text-slate-100 transition-colors duration-300 group-hover:text-white/80">
                        {step.number}
                      </span>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-[#07111F]">
                        {step.title}
                      </h3>

                      <p className="mt-3 leading-7 text-slate-600">
                        {step.text}
                      </p>
                    </div>

                    <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#2388FF]">
                      <span>
                        {index === 3
                          ? "Campagne prête"
                          : "Étape suivante"}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mt-14 max-w-4xl rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-8"
          >
            <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00D68F]/15">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              </div>

              <div className="flex-1">
                <p className="font-bold text-[#07111F]">
                  Une expérience pensée pour être simple
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Sélectionnez vos emplacements, préparez votre contenu et
                  pilotez votre présence publicitaire depuis SeetuAds.
                </p>
              </div>

              <Link
                href="/register"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#07111F] px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                Commencer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="bg-slate-100 px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-[#07111F] p-8 text-white md:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2388FF]/15">
              <Target className="h-6 w-6 text-[#2388FF]" />
            </div>

            <h2 className="mt-8 text-3xl font-bold">
              Vous êtes annonceur ?
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              Faites connaître votre marque dans les lieux du quotidien et
              rapprochez votre publicité de vos clients.
            </p>

            <ul className="mt-7 space-y-4">
              {advertiserBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#00D68F]" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#07111F] transition hover:bg-slate-200"
            >
              Créer une campagne
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="rounded-[2rem] bg-[#00D68F] p-8 text-[#07111F] md:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40">
              <Store className="h-6 w-6" />
            </div>

            <h2 className="mt-8 text-3xl font-bold">
              Vous êtes commerçant ?
            </h2>

            <p className="mt-4 leading-7 text-emerald-950/80">
              Rejoignez le réseau SeetuAds et transformez votre emplacement en
              opportunité de revenus.
            </p>

            <ul className="mt-7 space-y-4">
              {partnerBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#07111F] px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Devenir partenaire
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="bg-white px-6 py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
              Contact
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Parlons de votre projet.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Vous souhaitez lancer une campagne, devenir partenaire ou
              obtenir plus d'informations sur SeetuAds ? Notre équipe est à
              votre écoute.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <a
              href="tel:+221788241442"
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00D68F]/15">
                <Phone className="h-5 w-5 text-emerald-700" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Téléphone
              </p>
              <p className="mt-2 font-bold text-[#07111F]">
                +221 78 824 14 42
              </p>
            </a>

            <a
              href="tel:+221777020818"
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00D68F]/15">
                <Phone className="h-5 w-5 text-emerald-700" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Téléphone
              </p>
              <p className="mt-2 font-bold text-[#07111F]">
                +221 77 702 08 18
              </p>
            </a>

            <a
              href="mailto:seetuads@gmail.com"
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                <Mail className="h-5 w-5 text-[#2388FF]" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email
              </p>
              <p className="mt-2 break-all font-bold text-[#07111F]">
                seetuads@gmail.com
              </p>
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-gradient-to-br from-[#07111F] to-[#0B1F3A] px-8 py-14 text-center text-white shadow-xl md:px-16">
          <UsersRound className="mx-auto h-8 w-8 text-[#2388FF]" />

          <h2 className="mt-5 text-3xl font-bold md:text-4xl">
            Prêt à faire voir votre marque ?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            Lancez votre première campagne ou découvrez les opportunités de
            partenariat avec SeetuAds.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-[#2388FF] transition hover:bg-[#2388FF]/10"
            >
              Commencer avec SeetuAds
              <ArrowRight className="h-5 w-5" />
            </Link>

            <a
              href="tel:+221788241442"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-semibold transition hover:bg-white/10"
            >
              <Phone className="h-5 w-5" />
              Nous appeler
            </a>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white md:py-32">
        <div className="absolute inset-0 -z-0">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Pourquoi SeetuAds ?
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Votre marque. Votre zone. Votre moment.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              Une solution DOOH locale pensée pour rapprocher les marques
              de leurs clients, directement dans les lieux du quotidien.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Ciblage de précision",
                text: "Touchez les quartiers et zones où votre clientèle est réellement présente.",
              },
              {
                icon: MonitorPlay,
                title: "Impact en point de vente",
                text: "Diffusez vos messages sur des écrans visibles directement dans les commerces de proximité.",
              },
              {
                icon: BarChart3,
                title: "Pilotage intelligent",
                text: "Créez, planifiez et suivez vos campagnes depuis un seul espace SeetuAds.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-emerald-400/30 hover:bg-white/[0.09]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-400/20">
                  <item.icon className="h-7 w-7" />
                </div>

                <h3 className="mt-7 text-xl font-bold">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-300">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-3 shadow-2xl"
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="/images/seetuads-dooh.png"
                alt="Écran publicitaire SeetuAds dans une boutique de quartier au Sénégal"
                className="h-[300px] w-full object-cover transition duration-700 hover:scale-105 md:h-[430px]"
              />

              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-md md:inset-x-6 md:bottom-6">
                <p className="text-sm font-medium text-emerald-400">
                  Publicité digitale locale
                </p>
                <p className="mt-1 text-xl font-bold md:text-2xl">
                  Une présence visible au cœur des commerces sénégalais.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="relative overflow-hidden bg-slate-100 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Notre réseau
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Un réseau local pensé pour votre visibilité.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                SeetuAds rapproche les annonceurs des consommateurs grâce à
                des écrans installés dans des commerces de proximité.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  Dakar
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  Commerces de proximité
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  Écrans digitaux
                </span>
              </div>

              <Link
                href="/carte"
                className="mt-9 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-semibold text-white transition hover:bg-slate-800"
              >
                Découvrir le réseau
                <MapPin className="h-5 w-5" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                {
                  value: stats.zones,
                  label: "Presence multi-zones",
                  icon: MapPin,
                },
                {
                  value: stats.partners,
                  label: "Reseau en croissance",
                  icon: Store,
                },
                {
                  value: stats.screens,
                  label: "Écrans actifs",
                  icon: MonitorPlay,
                },
                {
                  value: stats.campaigns,
                  label: "Campagnes créées",
                  icon: PlayCircle,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <item.icon className="h-6 w-6" />
                  </div>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-2xl"
          >
            <div className="grid items-center gap-0 lg:grid-cols-[1fr_0.8fr]">
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                    Impact local
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-white md:text-3xl">
                  Votre publicité au plus près de vos clients.
                </h3>

                <p className="mt-4 max-w-xl leading-7 text-slate-300">
                  Sélectionnez vos zones, choisissez vos emplacements et
                  diffusez votre message dans les lieux où votre audience
                  vit, travaille et consomme.
                </p>

                <div className="mt-7 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-lg font-bold text-white">Local</p>
                    <p className="mt-1 text-xs text-slate-400">Ciblage</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-lg font-bold text-white">Digital</p>
                    <p className="mt-1 text-xs text-slate-400">Diffusion</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-lg font-bold text-white">Simple</p>
                    <p className="mt-1 text-xs text-slate-400">Pilotage</p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
                <img
                  src="/images/seetuads-dooh.png"
                  alt="Réseau d'écran publicitaire SeetuAds dans un commerce de proximité au Sénégal"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/30 to-transparent lg:bg-gradient-to-r" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-slate-500 md:flex-row">
          <p>
            © {new Date().getFullYear()} SeetuAds · Dakar, Sénégal
          </p>

          <a
            href="mailto:seetuads@gmail.com"
            className="transition hover:text-[#07111F]"
          >
            seetuads@gmail.com
          </a>
        </div>
      </footer>
    </main>
  );
}








