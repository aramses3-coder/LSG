"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateGameCode } from "@/lib/utils";
import { redirect } from "next/navigation";
import { z } from "zod/v4";

const createGameSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  maxRounds: z.coerce.number().min(1).max(10),
});

export async function createGame(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return { error: "Non autorisé" };
  }

  const parsed = createGameSchema.safeParse({
    name: formData.get("name"),
    maxRounds: formData.get("maxRounds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Generate unique code
  let code: string;
  let exists = true;
  do {
    code = generateGameCode();
    const found = await prisma.game.findUnique({ where: { code } });
    exists = !!found;
  } while (exists);

  // Create or get default initial config
  let initialConfig = await prisma.initialConfig.findFirst({
    where: { name: "Pharmacie Standard" },
  });

  if (!initialConfig) {
    initialConfig = await prisma.initialConfig.create({
      data: {
        name: "Pharmacie Standard",
        data: getDefaultConfig(),
      },
    });
  }

  const game = await prisma.game.create({
    data: {
      name: parsed.data.name,
      code,
      maxRounds: parsed.data.maxRounds,
      trainerId: session.user.id,
      initialConfigId: initialConfig.id,
    },
  });

  redirect(`/games/${game.id}/control`);
}

export async function joinGame(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Non autorisé" };
  }

  const code = (formData.get("code") as string)?.toUpperCase().trim();
  if (!code || code.length !== 6) {
    return { error: "Code invalide. Le code contient 6 caractères." };
  }

  const game = await prisma.game.findUnique({
    where: { code },
    include: { players: true },
  });

  if (!game) {
    return { error: "Aucune partie trouvée avec ce code" };
  }

  if (game.status !== "LOBBY") {
    return { error: "Cette partie a déjà commencé" };
  }

  // Check if already joined
  const existingPlayer = game.players.find(
    (p) => p.userId === session.user.id
  );
  if (existingPlayer) {
    redirect(`/game/${game.id}/lobby`);
  }

  await prisma.gamePlayer.create({
    data: {
      userId: session.user.id,
      gameId: game.id,
    },
  });

  redirect(`/game/${game.id}/lobby`);
}

export async function updatePharmacyName(gamePlayerId: string, name: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Non autorisé" };
  }

  await prisma.gamePlayer.update({
    where: { id: gamePlayerId },
    data: { pharmacyName: name },
  });

  return { success: true };
}

export async function getTrainerGames() {
  const session = await auth();
  if (!session?.user) return [];

  return prisma.game.findMany({
    where: { trainerId: session.user.id },
    include: {
      players: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { players: true, rounds: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGameWithPlayers(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      trainer: { select: { name: true } },
      players: {
        include: {
          user: { select: { name: true, email: true } },
          decisions: { select: { roundId: true, submitted: true } },
          states: { orderBy: { roundNumber: "desc" }, take: 1 },
        },
      },
      rounds: { orderBy: { number: "asc" } },
      initialConfig: true,
    },
  });
}

export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

function getDefaultConfig() {
  return {
    pharmacy: {
      type: "centre-ville",
      surface: 120,
      zonePopulation: 15000,
    },
    balanceSheet: {
      assets: {
        stock: 180000,
        tresorerie: 50000,
        immobilisations: 200000,
        creancesClients: 30000,
        autresActifs: 5000,
      },
      liabilities: {
        capitalPropre: 250000,
        reserves: 20000,
        resultatExercice: 0,
        emprunts: 150000,
        dettesFournisseurs: 30000,
        autresPassifs: 5000,
      },
    },
    employees: [
      {
        id: "emp-1",
        role: "titulaire",
        name: "Titulaire",
        salary: 7000,
        competence: 80,
        experience: 15,
        training: 0,
      },
      {
        id: "emp-2",
        role: "adjoint",
        name: "Adjoint(e)",
        salary: 4500,
        competence: 70,
        experience: 8,
        training: 0,
      },
      {
        id: "emp-3",
        role: "preparateur",
        name: "Préparateur 1",
        salary: 2200,
        competence: 60,
        experience: 5,
        training: 0,
      },
      {
        id: "emp-4",
        role: "preparateur",
        name: "Préparateur 2",
        salary: 2200,
        competence: 55,
        experience: 3,
        training: 0,
      },
      {
        id: "emp-5",
        role: "rayonniste",
        name: "Rayonniste",
        salary: 1800,
        competence: 50,
        experience: 2,
        training: 0,
      },
    ],
    revenue: {
      previousYearCA: 1800000,
      prescriptionShare: 0.7,
      otcShare: 0.15,
      paraShare: 0.1,
      servicesShare: 0.05,
    },
    inventory: {
      prescriptions: { value: 100000, rotation: 12, ruptureRate: 0.02 },
      otc: { value: 40000, rotation: 8, ruptureRate: 0.03 },
      parapharmacie: { value: 30000, rotation: 6, ruptureRate: 0.05 },
      materielMedical: { value: 10000, rotation: 4, ruptureRate: 0.04 },
    },
    economicContext: {
      inflationRate: 0.02,
      unemploymentRate: 0.07,
      growthRate: 0.01,
    },
    competition: {
      nbCompetitors: 3,
      competitionIntensity: 50,
    },
  };
}
