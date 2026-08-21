import os
import re

print("=== FIX PRISMA SINGLETON ===\n")

files = [
    r"app\api\campagnes\route.ts",
    r"app\api\campagnes\[id]\ecrans\route.ts",
    r"app\api\campagnes\[id]\medias\route.ts",
    r"app\api\campagnes\[id]\route.ts",
    r"app\api\ecrans\[id]\playlist\route.ts",
    r"app\api\medias\route.ts",
    r"app\api\medias\[id]\route.ts",
    r"app\api\paiements\route.ts",
    r"app\api\paiements\verify\route.ts",
    r"app\api\upload\route.ts",
]

pattern = re.compile(
    r"import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@prisma/client['"];?\s*\n\s*const prisma = new PrismaClient\(\);?",
    re.MULTILINE
)

replacement = "import { prisma } from '@/lib/prisma';"

fixed = 0
skipped = 0

for f in files:
    if not os.path.exists(f):
        print(f"[SKIP] {f} - introuvable")
        skipped += 1
        continue

    with open(f, "r", encoding="utf-8") as file:
        content = file.read()

    new_content, count = pattern.subn(replacement, content)

    if count > 0:
        with open(f, "w", encoding="utf-8") as file:
            file.write(new_content)
        print(f"[FIXED] {f} ({count} remplacement)")
        fixed += 1
    else:
        # Fallback simple
        old_simple = "import { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();"
        new_simple = "import { prisma } from '@/lib/prisma';"
        if old_simple in content:
            content = content.replace(old_simple, new_simple)
            with open(f, "w", encoding="utf-8") as file:
                file.write(content)
            print(f"[FIXED] {f} (fallback)")
            fixed += 1
        else:
            print(f"[OK] {f} - déjà correct ou format différent")

print(f"\n=== RÉSULTAT : {fixed} fichiers corrigés, {skipped} introuvables ===")
print("\nVérifie avec : findstr /s /c:"new PrismaClient" app\*.ts lib\*.ts")
