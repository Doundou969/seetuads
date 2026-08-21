import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    include: {
      advertiser: true,
      partner: true,
    },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  return user;
}

export async function requireAdvertiser() {
  const user = await requireAuth();

  if (!user.advertiser) {
    throw new Error("Accès réservé aux annonceurs");
  }

  return {
    user,
    advertiser: user.advertiser,
  };
}

/**
 * Autorise les utilisateurs pouvant uploader des médias.
 *
 * ADMIN      → autorisé
 * OPERATOR   → autorisé
 * ADVERTISER → autorisé si le profil advertiser existe
 * PARTNER    → refusé
 */
export async function requireMediaUploader() {
  const user = await requireAuth();

  const isAdmin =
    user.role === "ADMIN" ||
    user.role === "OPERATOR";

  const isAdvertiser = !!user.advertiser;

  if (!isAdmin && !isAdvertiser) {
    throw new Error("Accès refusé pour l'upload");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();

  if (
    user.role !== "ADMIN" &&
    user.role !== "OPERATOR"
  ) {
    throw new Error(
      "Accès réservé aux administrateurs"
    );
  }

  return user;
}