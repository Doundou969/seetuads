import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

export type InventoryReservationInput = {
  campaignId: string;
  screenIds: string[];
  startDate: Date;
  endDate: Date;
  reservedSeconds: number;
  temporary?: boolean;
  expiresAt?: Date | null;
};

export type AvailabilityResult = {
  screenId: string;
  inventoryLoopSeconds: number;
  reservedSeconds: number;
  availableSeconds: number;
  sov: number;
  available: boolean;
};


function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function assertValidDateRange(startDate: Date, endDate: Date) {
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error("Dates d'inventaire invalides.");
  }

  if (startDate > endDate) {
    throw new Error(
      "La date de dÃ©but doit Ãªtre antÃ©rieure ou Ã©gale Ã  la date de fin."
    );
  }
}

function assertValidReservedSeconds(
  reservedSeconds: number
) {
  if (
    !Number.isInteger(reservedSeconds) ||
    reservedSeconds <= 0
  ) {
    throw new Error(
      "Le nombre de secondes rÃ©servÃ©es doit Ãªtre un entier positif."
    );
  }
}

async function getBlockingReservations(
  db: DbClient,
  screenId: string,
  startDate: Date,
  endDate: Date
) {
  const now = new Date();

  return db.inventoryReservation.findMany({
    where: {
      screenId,
      startDate: {
        lt: endDate,
      },
      endDate: {
        gt: startDate,
      },
      OR: [
        {
          status: "CONFIRMED",
        },
        {
          status: "TEMPORARY",
          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: now,
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      campaignId: true,
      screenId: true,
      startDate: true,
      endDate: true,
      reservedSeconds: true,
      status: true,
      expiresAt: true,
    },
  });
}

/**
 * Calcule la capacitÃ© disponible sur un Ã©cran pendant toute
 * la pÃ©riode demandÃ©e.
 *
 * Une rÃ©servation bloque reservedSeconds par boucle pour
 * chaque jour oÃ¹ elle chevauche la pÃ©riode.
 */
export async function getAvailableCapacity(
  screenId: string,
  startDate: Date,
  endDate: Date,
  db: DbClient = prisma
): Promise<{
  screenId: string;
  inventoryLoopSeconds: number;
  reservedSeconds: number;
  availableSeconds: number;
  minAvailableSeconds: number;
}> {
  assertValidDateRange(startDate, endDate);

  const start = startOfUtcDay(startDate);
  const end = startOfUtcDay(endDate);

  const screen = await db.screen.findUnique({
    where: { id: screenId },
    select: {
      id: true,
      status: true,
      inventoryLoopSeconds: true,
    },
  });

  if (!screen) {
    throw new Error(`Ã‰cran introuvable : ${screenId}.`);
  }

  if (screen.status === "DECOMMISSIONED") {
    throw new Error(
      `L'Ã©cran ${screenId} est dÃ©saffectÃ© et ne peut pas recevoir de nouvelle rÃ©servation.`
    );
  }

  const reservations = await getBlockingReservations(
    db,
    screenId,
    start,
    end
  );

  /*
   * On utilise une diffÃ©rence par jour afin de gÃ©rer correctement
   * les rÃ©servations qui ne couvrent pas exactement la mÃªme pÃ©riode.
   */
  const changes = new Map<string, number>();

  const addChange = (date: Date, value: number) => {
    const key = dateKey(date);
    changes.set(key, (changes.get(key) ?? 0) + value);
  };

  for (const reservation of reservations) {
    const reservationStart = startOfUtcDay(
      reservation.startDate
    );
    const reservationEnd = startOfUtcDay(
      reservation.endDate
    );

    const effectiveStart =
      reservationStart > start ? reservationStart : start;

    const effectiveEnd =
      reservationEnd < end ? reservationEnd : end;

    if (effectiveStart >= effectiveEnd) {
      continue;
    }

    addChange(
      effectiveStart,
      reservation.reservedSeconds
    );

    addChange(
      effectiveEnd,
      -reservation.reservedSeconds
    );
  }

  let currentReserved = 0;
  let minAvailableSeconds =
    screen.inventoryLoopSeconds;

  const cursor = new Date(start);

  while (cursor < end) {
    const key = dateKey(cursor);

    currentReserved += changes.get(key) ?? 0;

    const available =
      screen.inventoryLoopSeconds - currentReserved;

    minAvailableSeconds = Math.min(
      minAvailableSeconds,
      available
    );

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    screenId: screen.id,
    inventoryLoopSeconds:
      screen.inventoryLoopSeconds,
    reservedSeconds:
      screen.inventoryLoopSeconds -
      minAvailableSeconds,
    availableSeconds: Math.max(
      0,
      minAvailableSeconds
    ),
    minAvailableSeconds,
  };
}

/**
 * VÃ©rifie la disponibilitÃ© de plusieurs Ã©crans.
 *
 * L'opÃ©ration ne rÃ©serve rien.
 */
export async function checkAvailability(
  input: Omit<
    InventoryReservationInput,
    "campaignId" | "temporary" | "expiresAt"
  >,
  db: DbClient = prisma
): Promise<{
  available: boolean;
  results: AvailabilityResult[];
}> {
  const screenIds = [
    ...new Set(input.screenIds),
  ].sort();

  assertValidDateRange(
    input.startDate,
    input.endDate
  );

  assertValidReservedSeconds(
    input.reservedSeconds
  );

  if (screenIds.length === 0) {
    throw new Error(
      "Au moins un Ã©cran est requis pour vÃ©rifier la disponibilitÃ©."
    );
  }

  const results: AvailabilityResult[] = [];

  for (const screenId of screenIds) {
    const capacity = await getAvailableCapacity(
      screenId,
      input.startDate,
      input.endDate,
      db
    );

    results.push({
      screenId,
      inventoryLoopSeconds:
        capacity.inventoryLoopSeconds,
      reservedSeconds:
        capacity.reservedSeconds,
      availableSeconds:
        capacity.minAvailableSeconds,
      sov:
        capacity.inventoryLoopSeconds > 0
          ? input.reservedSeconds /
            capacity.inventoryLoopSeconds
          : 0,
      available:
        input.reservedSeconds <=
        capacity.minAvailableSeconds,
    });
  }

  return {
    available: results.every(
      (result) => result.available
    ),
    results,
  };
}

/**
 * RÃ©serve l'inventaire.
 *
 * Cette fonction doit Ãªtre appelÃ©e dans une transaction pour
 * garantir le caractÃ¨re atomique d'une rÃ©servation multi-Ã©crans.
 */
export async function reserve(
  input: InventoryReservationInput,
  db: DbClient = prisma
) {
  const screenIds = [
    ...new Set(input.screenIds),
  ].sort();

  assertValidDateRange(
    input.startDate,
    input.endDate
  );

  assertValidReservedSeconds(
    input.reservedSeconds
  );

  if (!input.campaignId) {
    throw new Error(
      "Une campagne est requise pour crÃ©er une rÃ©servation."
    );
  }

  if (screenIds.length === 0) {
    throw new Error(
      "Au moins un Ã©cran est requis pour rÃ©server l'inventaire."
    );
  }

  /*
   * Verrouillage dÃ©terministe.
   *
   * Tous les appels doivent verrouiller les Ã©crans dans le mÃªme
   * ordre afin de rÃ©duire les risques de deadlock.
   */
  for (const screenId of screenIds) {
    await db.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${screenId}, 0)
      )
    `;
  }

  const availabilityResults: AvailabilityResult[] = [];

  for (const screenId of screenIds) {
    const capacity = await getAvailableCapacity(
      screenId,
      input.startDate,
      input.endDate,
      db
    );

    const available =
      input.reservedSeconds <=
      capacity.minAvailableSeconds;

    availabilityResults.push({
      screenId,
      inventoryLoopSeconds:
        capacity.inventoryLoopSeconds,
      reservedSeconds:
        capacity.reservedSeconds,
      availableSeconds:
        capacity.minAvailableSeconds,
      sov:
        capacity.inventoryLoopSeconds > 0
          ? input.reservedSeconds /
            capacity.inventoryLoopSeconds
          : 0,
      available,
    });
  }

  const unavailable =
    availabilityResults.filter(
      (result) => !result.available
    );

  if (unavailable.length > 0) {
    const details = unavailable
      .map(
        (result) =>
          `${result.screenId}: ${result.availableSeconds}s disponibles, ${input.reservedSeconds}s demandÃ©es`
      )
      .join("; ");

    throw new Error(
      `Inventaire insuffisant. ${details}`
    );
  }

  /*
   * All-or-nothing :
   * aucune rÃ©servation n'est crÃ©Ã©e avant que tous les Ã©crans
   * aient passÃ© le contrÃ´le de capacitÃ©.
   */
  const reservations =
    await Promise.all(
      screenIds.map((screenId) =>
        db.inventoryReservation.create({
          data: {
            campaignId: input.campaignId,
            screenId,
            startDate: startOfUtcDay(
              input.startDate
            ),
            endDate: endOfUtcDay(
              input.endDate
            ),
            reservedSeconds:
              input.reservedSeconds,
            status: input.temporary
              ? "TEMPORARY"
              : "CONFIRMED",
            expiresAt:
              input.temporary
                ? input.expiresAt ?? null
                : null,
          },
        })
      )
    );

  return reservations;
}

/**
 * Confirme des rÃ©servations temporaires.
 *
 * La confirmation est idempotente : une rÃ©servation dÃ©jÃ  CONFIRMED
 * reste CONFIRMED.
 */
export async function confirm(
  reservationIds: string[],
  db: DbClient = prisma
) {
  const ids = [
    ...new Set(reservationIds),
  ];

  if (ids.length === 0) {
    throw new Error(
      "Aucune rÃ©servation Ã  confirmer."
    );
  }

  const now = new Date();

  const reservations =
    await db.inventoryReservation.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
      },
    });

  if (reservations.length !== ids.length) {
    throw new Error(
      "Une ou plusieurs rÃ©servations sont introuvables."
    );
  }

  const expiredTemporary =
    reservations.find(
      (reservation) =>
        reservation.status === "TEMPORARY" &&
        reservation.expiresAt !== null &&
        reservation.expiresAt <= now
    );

  if (expiredTemporary) {
    throw new Error(
      "Une rÃ©servation temporaire a expirÃ© et ne peut plus Ãªtre confirmÃ©e."
    );
  }

  await db.inventoryReservation.updateMany({
    where: {
      id: {
        in: ids,
      },
      status: "TEMPORARY",
    },
    data: {
      status: "CONFIRMED",
      expiresAt: null,
    },
  });

  return db.inventoryReservation.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
}

/**
 * Expire les rÃ©servations temporaires arrivÃ©es Ã  Ã©chÃ©ance.
 */
export async function expire(
  db: DbClient = prisma
) {
  const now = new Date();

  return db.inventoryReservation.updateMany({
    where: {
      status: "TEMPORARY",
      expiresAt: {
        not: null,
        lte: now,
      },
    },
    data: {
      status: "EXPIRED",
    },
  });
}

/**
 * Annule une rÃ©servation.
 *
 * Une rÃ©servation historique CONFIRMED n'est pas transformÃ©e
 * automatiquement en EXPIRED : son statut devient CANCELLED
 * uniquement sur dÃ©cision explicite du workflow.
 */
export async function cancel(
  reservationIds: string[],
  db: DbClient = prisma
) {
  const ids = [
    ...new Set(reservationIds),
  ];

  if (ids.length === 0) {
    throw new Error(
      "Aucune rÃ©servation Ã  annuler."
    );
  }

  return db.inventoryReservation.updateMany({
    where: {
      id: {
        in: ids,
      },
      status: {
        in: ["TEMPORARY", "CONFIRMED"],
      },
    },
    data: {
      status: "CANCELLED",
      expiresAt: null,
    },
  });
}

/**
 * Calcule le Share Of Voice d'une rÃ©servation.
 *
 * Exemple :
 * 45 secondes rÃ©servÃ©es / 120 secondes de boucle = 37,5 %.
 */
export function calculateSOV(
  reservedSeconds: number,
  inventoryLoopSeconds: number
): number {
  if (
    inventoryLoopSeconds <= 0 ||
    reservedSeconds < 0
  ) {
    throw new Error(
      "ParamÃ¨tres SOV invalides."
    );
  }

  return reservedSeconds /
    inventoryLoopSeconds;
}

/**
 * Calcule les Slot-Days Ã  partir de secondes rÃ©servÃ©es
 * par boucle.
 *
 * 15 secondes = 1 slot de rÃ©fÃ©rence.
 */
export function calculateSlotDays(
  reservedSeconds: number,
  screenCount: number,
  numberOfDays: number
): number {
  if (
    reservedSeconds < 0 ||
    !Number.isInteger(screenCount) ||
    screenCount < 0 ||
    !Number.isInteger(numberOfDays) ||
    numberOfDays < 0
  ) {
    throw new Error(
      "ParamÃ¨tres Slot-Days invalides."
    );
  }

  return (
    reservedSeconds / 15
  ) * screenCount * numberOfDays;
}


