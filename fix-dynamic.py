#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ajoute export const dynamic = 'force-dynamic' aux pages admin"""

import os

BASE = os.getcwd()

files = [
    "app/admin/page.tsx",
    "app/admin/zones/page.tsx",
    "app/admin/zones/new/page.tsx",
    "app/admin/zones/[id]/edit/page.tsx",
    "app/admin/partners/page.tsx",
    "app/admin/partners/new/page.tsx",
    "app/admin/locations/page.tsx",
    "app/admin/locations/new/page.tsx",
    "app/admin/screens/page.tsx",
    "app/admin/screens/new/page.tsx",
    "app/admin/players/page.tsx",
    "app/admin/players/new/page.tsx",
]

print("=" * 60)
print("  AJOUT DYNAMIC = FORCE-DYNAMIC AUX PAGES ADMIN")
print("=" * 60)

for rel in files:
    path = os.path.join(BASE, rel)
    if not os.path.exists(path):
        print(f"  SKIP {rel} (introuvable)")
        continue

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if "export const dynamic" in content:
        print(f"  SKIP {rel} (deja present)")
        continue

    lines = content.split("\n")
    idx = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            idx = i + 1

    lines.insert(idx, "")
    lines.insert(idx + 1, "export const dynamic = 'force-dynamic';")

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"  OK {rel}")

print()
print("=" * 60)
print("  TERMINE")
print("=" * 60)
print()
print("Prochaines etapes :")
print("  1. npm run prisma:seed")
print("  2. rmdir /s /q .next")
print("  3. npm run build")
print("  4. vercel --prod")
