"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coffee,
  Dumbbell,
  Fuel,
  Mail,
  MapPin,
  MonitorPlay,
  Phone,
  PlayCircle,
  PlusCircle,
  ShieldCheck,
  ShoppingCart,
  Store,
  Target,
  Zap,
} from "lucide-react";

const categories = [
  { label: "Boutiques", icon: Store },
  { label: "Supérettes", icon: ShoppingCart },
  { label: "Restaurants & snacks", icon: Coffee },
  { label: "Stations-service", icon: Fuel },
  { label: "Pharmacies", icon: PlusCircle },
  { label: "Salles de sport & salons", icon: Dumbbell },
];

const steps = [
  {
    number: "01",
    title: "Choisissez vos zones",
    text: "Repérez les zones qui correspondent à votre audience.",
    icon: MapPin,
  },
  {
    number: "02",
    title: "Sélectionnez vos écrans",
    text: "Choisissez les emplacements adaptés à votre campagne.",
    icon: MonitorPlay,
  },
  {
    number: "03",
    title: "Ajoutez votre média",
    text: "Importez votre visuel et préparez les paramètres de diffusion.",
    icon: PlayCircle,
  },
  {
    number: "04",
    title: "Suivez votre campagne",
    text: "Retrouvez le suivi de votre campagne dans votre espace SeetuAds.",
    icon: BarChart3,
  },
];

const advertiserBenefits = [
  "Choisissez les zones et les emplacements adaptés à votre campagne.",
  "Diffusez votre contenu sur des écrans dans des commerces de proximité.",
  "Gérez votre campagne depuis votre espace SeetuAds.",
];

const partnerBenefits = [
  "Proposez votre commerce pour rejoindre le réseau SeetuAds.",
  "Accueillez un écran publicitaire dans votre établissement.",
  "Échangez avec l’équipe SeetuAds sur les modalités de partenariat.",
];

export function LandingContent() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] text-[#0F1B2E]">
      <section className="relative overflow-hidden bg-[#0F1B2E] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(245,130,31,0.2),transparent_32%),radial-gradient(circle_at_90%_15%,rgba(245,130,31,0.1),transparent_32%)]"
        />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">
            Seetu<span className="text-[#F5821F]">Ads</span>
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
            <Link href="#contact" className="transition hover:text-white">
              Contact
            </Link>
          </nav>

          <Link
            href="/sign-in"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 sm:px-5"
          >
            Se connecter
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 md:pb-28 md:pt-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5821F]/30 bg-[#F5821F]/10 px-4 py-2 text-sm font-semibold text-[#FFAA5C]">
              <Zap className="h-4 w-4" />
              Affichage digital à Dakar
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Faites-vous voir là où{" "}
              <span className="text-[#F5821F]">Dakar vit.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
              SeetuAds rapproche les marques des commerces de proximité grâce
              à la publicité sur écran.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5821F] px-6 py-3.5 font-bold text-[#0F1B2E] transition hover:bg-[#FF9A45]"
              >
                Lancer une campagne
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Proposer mon commerce
                <Store className="h-5 w-5 text-[#F5821F]" />
              </Link>
            </div>

            <div className="mt-7 flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#F5821F]" />
              Une plateforme pour les annonceurs et les commerçants.
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -inset-3 rounded-[2rem] bg-[#F5821F]/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-2xl">
              <div className="relative overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/images/seetuads-dooh.png"
                  alt="Écran publicitaire SeetuAds dans un commerce de proximité"
                  width={900}
                  height={650}
                  priority
                  className="h-[340px] w-full object-cover sm:h-[460px]"
                />

                <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-[#0F1B2E]/85 p-4 backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        Votre marque, au cœur des lieux de vie
                      </p>
                      <p className="mt-1 text-lg font-bold sm:text-xl">
                        Dakar en mouvement
                      </p>
                    </div>
                    <MonitorPlay className="h-8 w-8 shrink-0 text-[#F5821F]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6">
          <span className="text-sm font-bold uppercase tracking-[0.15em] text-[#DB6E10]">
            SeetuAds
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
          <p className="text-sm text-slate-600">
            Des marques, des commerces de proximité et des écrans digitaux.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#DB6E10]">
              Comment ça marche ?
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Votre campagne, étape par étape.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Choisissez vos emplacements, préparez votre contenu et gérez
              votre campagne depuis SeetuAds.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F1B2E] text-white">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-4xl font-black text-slate-100">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.text}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0F1B2E] px-5 py-16 text-white sm:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F5821F]">
                Les lieux du quotidien
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Une publicité plus proche de votre public.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Les commerces de proximité sont des lieux de passage et de vie.
                SeetuAds permet aux marques de présenter leurs contenus sur des
                écrans dans cet environnement.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center"
                >
                  <Icon className="h-6 w-6 text-[#F5821F]" strokeWidth={1.75} />
                  <span className="text-xs font-medium leading-5 text-slate-200">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-[#0F1B2E] p-8 text-white sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5821F]/15">
              <Target className="h-6 w-6 text-[#F5821F]" />
            </div>

            <h2 className="mt-7 text-3xl font-extrabold">
              Vous êtes annonceur ?
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              Faites connaître votre marque dans les commerces de proximité
              avec une campagne préparée depuis votre espace SeetuAds.
            </p>

            <ul className="mt-6 space-y-3">
              {advertiserBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F5821F]" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#F5821F] px-5 py-3 font-bold text-[#0F1B2E] transition hover:bg-[#FF9A45]"
            >
              Lancer une campagne
              <ArrowRight className="h-5 w-5" />
            </Link>
          </article>

          <article className="rounded-[2rem] bg-[#F5821F] p-8 text-[#0F1B2E] sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/40">
              <Store className="h-6 w-6" />
            </div>

            <h2 className="mt-7 text-3xl font-extrabold">
              Vous êtes commerçant ?
            </h2>
            <p className="mt-4 leading-7 text-[#0F1B2E]/80">
              Vous souhaitez proposer votre établissement comme lieu
              d’installation d’un écran SeetuAds ? Présentez votre profil pour
              démarrer l’échange.
            </p>

            <ul className="mt-6 space-y-3">
              {partnerBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#0F1B2E] transition hover:bg-slate-100"
            >
              <span className="text-[#0F1B2E]">
                Proposer mon commerce
              </span>
              <ArrowRight className="h-5 w-5 text-[#0F1B2E]" />
            </Link>
          </article>
        </div>
      </section>

      <section
        id="contact"
        className="border-t border-slate-200 bg-white px-5 py-16 sm:px-8 md:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#DB6E10]">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Parlons de votre projet.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-600">
              Vous souhaitez lancer une campagne ou proposer votre commerce ?
              Contactez l’équipe SeetuAds.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href="tel:+221788241442"
              className="rounded-2xl border border-slate-200 bg-[#F8F6F1] p-5 transition hover:border-[#F5821F]/50"
            >
              <Phone className="h-5 w-5 text-[#DB6E10]" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Téléphone
              </p>
              <p className="mt-1 font-bold">+221 78 824 14 42</p>
            </a>

            <a
              href="tel:+221777020818"
              className="rounded-2xl border border-slate-200 bg-[#F8F6F1] p-5 transition hover:border-[#F5821F]/50"
            >
              <Phone className="h-5 w-5 text-[#DB6E10]" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Téléphone
              </p>
              <p className="mt-1 font-bold">+221 77 702 08 18</p>
            </a>

            <a
              href="mailto:seetuads@gmail.com"
              className="rounded-2xl border border-slate-200 bg-[#F8F6F1] p-5 transition hover:border-[#F5821F]/50"
            >
              <Mail className="h-5 w-5 text-[#DB6E10]" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email
              </p>
              <p className="mt-1 break-all font-bold">seetuads@gmail.com</p>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#0F1B2E] px-5 py-7 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} SeetuAds · Dakar, Sénégal
          </p>
          <Link href="#contact" className="transition hover:text-white">
            Nous contacter
          </Link>
        </div>
      </footer>
    </main>
  );
}
