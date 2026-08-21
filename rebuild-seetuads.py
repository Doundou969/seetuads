#!/usr/bin/env python3
# -*- coding: utf-8 -*-
'''
Reconstruction complete de SeetuAds
Sauvegarde l'ancien projet, supprime tout, recree proprement.
A executer depuis le dossier racine du projet
'''

import os
import shutil
from datetime import datetime

PROJECT_ROOT = os.getcwd()
BACKUP_DIR = os.path.join(PROJECT_ROOT, f"app-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
APP_DIR = os.path.join(PROJECT_ROOT, "app")

def backup_old_app():
    if os.path.exists(APP_DIR):
        print(f"[1/4] Sauvegarde de l'ancien app/ vers {os.path.basename(BACKUP_DIR)}...")
        shutil.copytree(APP_DIR, BACKUP_DIR)
        print(f"      OK Sauvegarde dans : {BACKUP_DIR}")
    else:
        print("[1/4] Aucun app/ existant trouve, pas de sauvegarde necessaire.")

def clean_app():
    print("[2/4] Nettoyage de l'ancien app/...")
    if os.path.exists(APP_DIR):
        shutil.rmtree(APP_DIR)
    os.makedirs(APP_DIR, exist_ok=True)
    print("      OK Dossier app/ recree vierge.")

def write_file(rel_path, lines):
    full_path = os.path.join(PROJECT_ROOT, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as out:
        out.write("\n".join(lines))
    print(f"      OK {rel_path}")

files = {}

files["package.json"] = [
    '{',
    '  "name": "seetuads",',
    '  "version": "1.0.0",',
    '  "private": true,',
    '  "scripts": {',
    '    "dev": "next dev",',
    '    "build": "next build",',
    '    "start": "next start",',
    '    "lint": "next lint"',
    '  },',
    '  "dependencies": {',
    '    "next": "^15.0.0",',
    '    "react": "^19.0.0",',
    '    "react-dom": "^19.0.0",',
    '    "lucide-react": "^0.460.0",',
    '    "framer-motion": "^11.0.0",',
    '    "tailwind-merge": "^2.5.0",',
    '    "clsx": "^2.1.0"',
    '  },',
    '  "devDependencies": {',
    '    "typescript": "^5.6.0",',
    '    "@types/node": "^22.0.0",',
    '    "@types/react": "^19.0.0",',
    '    "@types/react-dom": "^19.0.0",',
    '    "tailwindcss": "^3.4.0",',
    '    "postcss": "^8.4.0",',
    '    "autoprefixer": "^10.4.0",',
    '    "@tailwindcss/forms": "^0.5.0"',
    '  }',
    '}'
]

files["tsconfig.json"] = [
    '{',
    '  "compilerOptions": {',
    '    "lib": ["dom", "dom.iterable", "esnext"],',
    '    "allowJs": true,',
    '    "skipLibCheck": true,',
    '    "strict": true,',
    '    "noEmit": true,',
    '    "esModuleInterop": true,',
    '    "module": "esnext",',
    '    "moduleResolution": "bundler",',
    '    "resolveJsonModule": true,',
    '    "isolatedModules": true,',
    '    "jsx": "preserve",',
    '    "incremental": true,',
    '    "plugins": [{ "name": "next" }],',
    '    "paths": {',
    '      "@/*": ["./*"]',
    '    }',
    '  },',
    '  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],',
    '  "exclude": ["node_modules"]',
    '}'
]

files["tailwind.config.ts"] = [
    'import type { Config } from "tailwindcss";',
    '',
    'const config: Config = {',
    '  content: [',
    '    "./app/**/*.{js,ts,jsx,tsx,mdx}",',
    '    "./components/**/*.{js,ts,jsx,tsx,mdx}",',
    '  ],',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    '        primary: {',
    '          50: "#eff6ff",',
    '          100: "#dbeafe",',
    '          500: "#3b82f6",',
    '          600: "#2563eb",',
    '          700: "#1d4ed8",',
    '          900: "#1e3a8a",',
    '        },',
    '      },',
    '    },',
    '  },',
    '  plugins: [],',
    '};',
    'export default config;'
]

files["postcss.config.js"] = [
    'module.exports = {',
    '  plugins: {',
    '    tailwindcss: {},',
    '    autoprefixer: {},',
    '  },',
    '};'
]

files["next.config.js"] = [
    '/** @type {import("next").NextConfig} */',
    'const nextConfig = {',
    '  reactStrictMode: true,',
    '};',
    'module.exports = nextConfig;'
]

files["app/globals.css"] = [
    '@tailwind base;',
    '@tailwind components;',
    '@tailwind utilities;',
    '',
    '@layer base {',
    '  body {',
    '    @apply bg-gray-50 text-gray-900 antialiased;',
    '  }',
    '}',
    '',
    '@layer utilities {',
    '  .text-balance {',
    '    text-wrap: balance;',
    '  }',
    '}'
]

files["app/layout.tsx"] = [
    'import type { Metadata } from "next";',
    'import { Inter } from "next/font/google";',
    'import "./globals.css";',
    '',
    'const inter = Inter({ subsets: ["latin"] });',
    '',
    'export const metadata: Metadata = {',
    '  title: "SeetuAds - Votre plateforme publicitaire",',
    '  description: "Gerez vos campagnes, boutiques et statistiques en un seul endroit.",',
    '};',
    '',
    'export default function RootLayout({',
    '  children,',
    '}: Readonly<{',
    '  children: React.ReactNode;',
    '}>) {',
    '  return (',
    '    <html lang="fr">',
    '      <body className={inter.className}>{children}</body>',
    '    </html>',
    '  );',
    '}'
]

files["app/not-found.tsx"] = [
    'import Link from "next/link";',
    '',
    'export default function NotFound() {',
    '  return (',
    '    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">',
    '      <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>',
    '      <p className="text-xl text-gray-600 mb-8">Page introuvable</p>',
    '      <Link',
    '        href="/"',
    '        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"',
    '      >',
    "        Retour a l'accueil",
    '      </Link>',
    '    </div>',
    '  );',
    '}'
]

files["app/page.tsx"] = [
    '"use client";',
    '',
    'import { motion } from "framer-motion";',
    'import { BarChart3, MapPin, Store, Zap } from "lucide-react";',
    '',
    'export default function Home() {',
    '  const features = [',
    '    { icon: Store, label: "Boutiques", desc: "Gerez vos points de vente" },',
    '    { icon: Zap, label: "Campagnes", desc: "Lancez des campagnes ciblees" },',
    '    { icon: MapPin, label: "Carte", desc: "Visualisez sur la carte" },',
    '    { icon: BarChart3, label: "Stats", desc: "Analysez vos performances" },',
    '  ];',
    '',
    '  return (',
    '    <main className="min-h-screen">',
    '      <section className="relative bg-gradient-to-br from-primary-900 to-primary-700 text-white py-24 px-6">',
    '        <div className="max-w-5xl mx-auto text-center">',
    '          <motion.h1',
    '            initial={{ opacity: 0, y: 20 }}',
    '            animate={{ opacity: 1, y: 0 }}',
    '            transition={{ duration: 0.6 }}',
    '            className="text-5xl md:text-6xl font-bold mb-6"',
    '          >',
    '            SeetuAds',
    '          </motion.h1>',
    '          <motion.p',
    '            initial={{ opacity: 0, y: 20 }}',
    '            animate={{ opacity: 1, y: 0 }}',
    '            transition={{ duration: 0.6, delay: 0.2 }}',
    '            className="text-xl md:text-2xl text-primary-100 mb-10"',
    '          >',
    '            Votre plateforme publicitaire tout-en-un',
    '          </motion.p>',
    '          <motion.div',
    '            initial={{ opacity: 0, scale: 0.9 }}',
    '            animate={{ opacity: 1, scale: 1 }}',
    '            transition={{ duration: 0.5, delay: 0.4 }}',
    '          >',
    '            <a',
    '              href="#features"',
    '              className="inline-block bg-white text-primary-700 font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-primary-50 transition"',
    '            >',
    '              Decouvrir',
    '            </a>',
    '          </motion.div>',
    '        </div>',
    '      </section>',
    '',
    '      <section id="features" className="py-20 px-6 bg-white">',
    '        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">',
    '          {features.map((f, i) => (',
    '            <motion.div',
    '              key={f.label}',
    '              initial={{ opacity: 0, y: 30 }}',
    '              whileInView={{ opacity: 1, y: 0 }}',
    '              viewport={{ once: true }}',
    '              transition={{ duration: 0.5, delay: i * 0.1 }}',
    '              className="p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition bg-gray-50"',
    '            >',
    '              <f.icon className="w-10 h-10 text-primary-600 mb-4" />',
    '              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.label}</h3>',
    '              <p className="text-gray-600 text-sm">{f.desc}</p>',
    '            </motion.div>',
    '          ))}',
    '        </div>',
    '      </section>',
    '',
    '      <footer className="py-8 text-center text-gray-500 text-sm border-t">',
    '        &copy; {new Date().getFullYear()} SeetuAds. Tous droits reserves.',
    '      </footer>',
    '    </main>',
    '  );',
    '}'
]

files["lib/utils.ts"] = [
    'import { clsx, type ClassValue } from "clsx";',
    'import { twMerge } from "tailwind-merge";',
    '',
    'export function cn(...inputs: ClassValue[]) {',
    '  return twMerge(clsx(inputs));',
    '}'
]

files[".env.local"] = [
    '# === SeetuAds Configuration ===',
    '# Remplacez par vos vraies cles :',
    '',
    '# Base de donnees / Auth',
    'DATABASE_URL=',
    'NEXTAUTH_SECRET=',
    'NEXTAUTH_URL=http://localhost:3000',
    '',
    '# APIs externes',
    '# WAVE_API_KEY=',
    '# ORANGE_MONEY_API_KEY=',
    '',
    '# Google Maps (si carte)',
    '# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY='
]

def main():
    print("=" * 60)
    print("  RECONSTRUCTION SEETUADS")
    print("=" * 60)
    print()
    backup_old_app()
    clean_app()
    print("[3/4] Creation des fichiers...")
    for rel_path, lines in files.items():
        write_file(rel_path, lines)
    print()
    print("[4/4] OK Reconstruction terminee !")
    print()
    print("Prochaines etapes :")
    print("  1. npm install")
    print("  2. Remplir .env.local avec vos cles")
    print("  3. npm run dev")
    print()
    print(f"Ancien projet sauvegarde dans : {BACKUP_DIR}")

if __name__ == "__main__":
    main()
