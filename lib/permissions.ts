import {
  auth,
  currentUser,
} from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";

const TEMP_ADVERTISER_COOKIE =
  "seetuads_advertiser_access";

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

async function getAdvertiserFromTemporaryToken() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(TEMP_ADVERTISER_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const accessToken =
    await prisma.advertiserAccessToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        advertiser: true,
      },
    });

  if (!accessToken) {
    return null;
  }

  if (accessToken.revokedAt) {
    return null;
  }

  if (accessToken.expiresAt <= new Date()) {
    return null;
  }

  await prisma.advertiserAccessToken.update({
    where: {
      id: accessToken.id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });

  return accessToken.advertiser;
}

export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    include: {
      advertiser: true,
      partner: true,
    },
  });

  if (user) {
    return user;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (item) =>
        item.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;

  user = await prisma.user.create({
    data: {
      clerkUserId,
      role: "ADVERTISER",
      email: primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    },
    include: {
      advertiser: true,
      partner: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  return user;
}

export async function requireAdvertiser() {
  const user = await getCurrentUser();

  if (user?.advertiser) {
    return {
      user,
      advertiser: user.advertiser,
      temporary: false,
    };
  }

  const temporaryAdvertiser =
    await getAdvertiserFromTemporaryToken();

  if (temporaryAdvertiser) {
    return {
      user: null,
      advertiser: temporaryAdvertiser,
      temporary: true,
    };
  }

  if (user) {
    const advertiser = await prisma.advertiser.create({
      data: {
        userId: user.id,
        companyName:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email || "Nouvel annonceur",
        contactName:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : null,
        email:
          user.email ||
          "annonceur@seetuads.local",
        status: "PENDING",
      },
    });

    return {
      user,
      advertiser,
      temporary: false,
    };
  }

  throw new Error("Non authentifié");
}

export async function requireMediaUploader() {
  const user = await getCurrentUser();

  if (
    user &&
    (
      user.role === "ADMIN" ||
      user.role === "OPERATOR" ||
      !!user.advertiser
    )
  ) {
    return user;
  }

  const temporaryAdvertiser =
    await getAdvertiserFromTemporaryToken();

  if (temporaryAdvertiser) {
    return null;
  }

  throw new Error(
    "Accès refusé pour l'upload"
  );
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

export {
  TEMP_ADVERTISER_COOKIE,
  hashToken,
};
