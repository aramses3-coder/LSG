"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function saveDecisions(
  decisionId: string,
  category: "hr" | "purchasing" | "pricing" | "marketing" | "investments" | "finance",
  data: Record<string, unknown>
) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Non autorisé" };
  }

  await prisma.decision.update({
    where: { id: decisionId },
    data: { [category]: data },
  });

  return { success: true };
}

export async function submitDecisions(decisionId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Non autorisé" };
  }

  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { gamePlayer: true },
  });

  if (!decision) return { error: "Décision introuvable" };
  if (decision.gamePlayer.userId !== session.user.id) {
    return { error: "Non autorisé" };
  }

  await prisma.decision.update({
    where: { id: decisionId },
    data: {
      submitted: true,
      submittedAt: new Date(),
    },
  });

  return { success: true };
}

export async function getPlayerDecision(gamePlayerId: string, roundId: string) {
  return prisma.decision.findUnique({
    where: {
      gamePlayerId_roundId: {
        gamePlayerId,
        roundId,
      },
    },
  });
}

export async function getPlayerState(gamePlayerId: string, roundNumber: number) {
  return prisma.pharmacyState.findUnique({
    where: {
      gamePlayerId_roundNumber: {
        gamePlayerId,
        roundNumber,
      },
    },
  });
}

export async function getPlayerStates(gamePlayerId: string) {
  return prisma.pharmacyState.findMany({
    where: { gamePlayerId },
    orderBy: { roundNumber: "asc" },
  });
}

export async function getRoundResults(gameId: string, roundNumber: number) {
  const round = await prisma.round.findUnique({
    where: {
      gameId_number: { gameId, number: roundNumber },
    },
    include: {
      states: {
        include: {
          gamePlayer: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { score: "desc" },
      },
    },
  });

  return round;
}
