"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { simulateRound } from "@/lib/engine";
import type { Prisma } from "@prisma/client";
import type { PlayerDecisions } from "@/types";

export async function startRound(gameId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return { error: "Non autorisé" };
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { players: true, initialConfig: true },
  });

  if (!game) return { error: "Partie introuvable" };

  const nextRoundNumber = game.currentRound + 1;
  if (nextRoundNumber > game.maxRounds) {
    return { error: "Nombre maximum de rounds atteint" };
  }

  // Create the round
  const round = await prisma.round.create({
    data: {
      gameId,
      number: nextRoundNumber,
      status: "ACTIVE",
    },
  });

  // If first round, create initial states for all players
  if (nextRoundNumber === 1) {
    const config = game.initialConfig.data as Record<string, unknown>;
    for (const player of game.players) {
      await prisma.pharmacyState.create({
        data: {
          gamePlayerId: player.id,
          roundNumber: 0,
          balanceSheet: (config as { balanceSheet: object }).balanceSheet,
          incomeStatement: {
            chiffreAffaires: 0,
            coutAchats: 0,
            margeBrute: 0,
            chargesPersonnel: 0,
            chargesExterieures: 0,
            impotsTaxes: 0,
            dotationsAmortissements: 0,
            chargesFinancieres: 0,
            resultatExploitation: 0,
            resultatNet: 0,
          },
          cashFlow: {
            tresorerieDebut: (config as { balanceSheet: { assets: { tresorerie: number } } }).balanceSheet.assets.tresorerie,
            encaissementsVentes: 0,
            decaissementsAchats: 0,
            decaissementsSalaires: 0,
            decaissementsCharges: 0,
            investissements: 0,
            remboursementsEmprunts: 0,
            nouveauxEmprunts: 0,
            tresoretieFin: (config as { balanceSheet: { assets: { tresorerie: number } } }).balanceSheet.assets.tresorerie,
          },
          employees: (config as { employees: object[] }).employees,
          inventory: (config as { inventory: object }).inventory,
          kpis: {
            chiffreAffaires: (config as { revenue: { previousYearCA: number } }).revenue.previousYearCA,
            margeBrute: 0,
            tauxMarge: 0,
            ebe: 0,
            resultatNet: 0,
            tresorerie: (config as { balanceSheet: { assets: { tresorerie: number } } }).balanceSheet.assets.tresorerie,
            rotationStocks: 8,
            panierMoyen: 35,
            satisfactionClient: 70,
            partDeMarche: 0.25,
            productivite: 0,
            nbClients: 0,
          },
          score: 0,
        },
      });
    }
  }

  // Create empty decisions for all players
  for (const player of game.players) {
    await prisma.decision.create({
      data: {
        gamePlayerId: player.id,
        roundId: round.id,
        hr: {},
        purchasing: {},
        pricing: {},
        marketing: {},
        investments: {},
        finance: {},
      },
    });
  }

  // Update game status
  await prisma.game.update({
    where: { id: gameId },
    data: {
      status: "ROUND_ACTIVE",
      currentRound: nextRoundNumber,
    },
  });

  return { success: true, roundId: round.id, roundNumber: nextRoundNumber };
}

export async function computeRound(gameId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return { error: "Non autorisé" };
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      rounds: { where: { number: { gt: 0 } }, orderBy: { number: "desc" }, take: 1 },
      players: {
        include: {
          states: { orderBy: { roundNumber: "desc" }, take: 1 },
          decisions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
      initialConfig: true,
    },
  });

  if (!game) return { error: "Partie introuvable" };

  const currentRound = game.rounds[0];
  if (!currentRound) return { error: "Aucun round actif" };

  // Update round status to computing
  await prisma.round.update({
    where: { id: currentRound.id },
    data: { status: "COMPUTING" },
  });

  await prisma.game.update({
    where: { id: gameId },
    data: { status: "COMPUTING" },
  });

  const config = game.initialConfig.data as Record<string, unknown>;

  // Process each player
  for (const player of game.players) {
    const previousState = player.states[0];
    const decision = player.decisions[0];

    if (!previousState) continue;

    const playerDecisions: PlayerDecisions = {
      hr: (decision?.hr ?? {}) as unknown as PlayerDecisions["hr"],
      purchasing: (decision?.purchasing ?? {}) as unknown as PlayerDecisions["purchasing"],
      pricing: (decision?.pricing ?? {}) as unknown as PlayerDecisions["pricing"],
      marketing: (decision?.marketing ?? {}) as unknown as PlayerDecisions["marketing"],
      investments: (decision?.investments ?? {}) as unknown as PlayerDecisions["investments"],
      finance: (decision?.finance ?? {}) as unknown as PlayerDecisions["finance"],
    };

    const newState = simulateRound(
      {
        balanceSheet: previousState.balanceSheet,
        incomeStatement: previousState.incomeStatement,
        cashFlow: previousState.cashFlow,
        employees: previousState.employees,
        inventory: previousState.inventory,
        kpis: previousState.kpis,
      } as unknown as Parameters<typeof simulateRound>[0],
      playerDecisions,
      (currentRound.events ?? []) as unknown as Parameters<typeof simulateRound>[2],
      config as unknown as Parameters<typeof simulateRound>[3]
    );

    await prisma.pharmacyState.create({
      data: {
        gamePlayerId: player.id,
        roundId: currentRound.id,
        roundNumber: game.currentRound,
        balanceSheet: newState.balanceSheet as unknown as Prisma.InputJsonValue,
        incomeStatement: newState.incomeStatement as unknown as Prisma.InputJsonValue,
        cashFlow: newState.cashFlow as unknown as Prisma.InputJsonValue,
        employees: newState.employees as unknown as Prisma.InputJsonValue,
        inventory: newState.inventory as unknown as Prisma.InputJsonValue,
        kpis: newState.kpis as unknown as Prisma.InputJsonValue,
        score: newState.score,
      },
    });
  }

  // Update round and game status
  await prisma.round.update({
    where: { id: currentRound.id },
    data: { status: "COMPLETED" },
  });

  const isLastRound = game.currentRound >= game.maxRounds;
  await prisma.game.update({
    where: { id: gameId },
    data: {
      status: isLastRound ? "FINISHED" : "ROUND_DONE",
    },
  });

  return { success: true };
}

export async function startGame(gameId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return { error: "Non autorisé" };
  }

  await prisma.game.update({
    where: { id: gameId },
    data: { status: "IN_PROGRESS" },
  });

  return startRound(gameId);
}
