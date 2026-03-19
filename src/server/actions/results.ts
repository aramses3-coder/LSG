"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Get all round results for a given game and round number.
 * Returns all players' states for that round + previous round for comparison.
 */
export async function getRoundResults(gameId: string, roundNumber: number) {
  const session = await auth();
  if (!session?.user) return null;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: {
          user: { select: { name: true } },
          states: {
            where: {
              roundNumber: { in: [roundNumber, roundNumber - 1] },
            },
            orderBy: { roundNumber: "desc" },
          },
        },
      },
      rounds: {
        where: { number: roundNumber },
        take: 1,
      },
    },
  });

  if (!game) return null;

  // Find the current user's gamePlayer
  const currentPlayer = game.players.find(
    (p) => p.userId === session.user.id
  );

  // Build player results sorted by score desc
  const playerResults = game.players
    .map((player) => {
      const currentState = player.states.find(
        (s) => s.roundNumber === roundNumber
      );
      const previousState = player.states.find(
        (s) => s.roundNumber === roundNumber - 1
      );

      return {
        id: player.id,
        userId: player.userId,
        pharmacyName: player.pharmacyName,
        playerName: player.user.name,
        isCurrentPlayer: player.userId === session.user.id,
        currentState: currentState
          ? {
              balanceSheet: currentState.balanceSheet,
              incomeStatement: currentState.incomeStatement,
              cashFlow: currentState.cashFlow,
              employees: currentState.employees,
              inventory: currentState.inventory,
              kpis: currentState.kpis,
              score: currentState.score,
            }
          : null,
        previousState: previousState
          ? {
              kpis: previousState.kpis,
              score: previousState.score,
            }
          : null,
      };
    })
    .filter((p) => p.currentState !== null)
    .sort((a, b) => (b.currentState?.score ?? 0) - (a.currentState?.score ?? 0));

  // Compute averages for radar chart
  const allKpis = playerResults
    .map((p) => p.currentState?.kpis)
    .filter(Boolean) as Array<Record<string, number>>;

  const avgKpis: Record<string, number> = {};
  if (allKpis.length > 0) {
    const keys = Object.keys(allKpis[0]);
    for (const key of keys) {
      avgKpis[key] =
        allKpis.reduce((sum, k) => sum + (k[key] ?? 0), 0) / allKpis.length;
    }
  }

  return {
    gameName: game.name,
    roundNumber,
    maxRounds: game.maxRounds,
    currentRound: game.currentRound,
    gameStatus: game.status,
    events: game.rounds[0]?.events ?? [],
    currentPlayerId: currentPlayer?.id ?? null,
    playerResults,
    averageKpis: avgKpis,
  };
}

/**
 * Get full leaderboard data across all completed rounds.
 */
export async function getLeaderboardData(gameId: string) {
  const session = await auth();
  if (!session?.user) return null;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: {
          user: { select: { name: true } },
          states: {
            orderBy: { roundNumber: "asc" },
          },
        },
      },
      rounds: {
        where: { status: "COMPLETED" },
        orderBy: { number: "asc" },
      },
    },
  });

  if (!game) return null;

  // Build evolution data per player across rounds
  const players = game.players.map((player) => {
    const roundStates = player.states
      .filter((s) => s.roundNumber > 0)
      .sort((a, b) => a.roundNumber - b.roundNumber);

    const latestState = roundStates[roundStates.length - 1];

    return {
      id: player.id,
      userId: player.userId,
      pharmacyName: player.pharmacyName,
      playerName: player.user.name,
      isCurrentPlayer: player.userId === session.user.id,
      latestScore: latestState?.score ?? 0,
      latestKpis: (latestState?.kpis ?? {}) as Record<string, number>,
      roundHistory: roundStates.map((s) => ({
        roundNumber: s.roundNumber,
        score: s.score,
        kpis: s.kpis as Record<string, number>,
      })),
    };
  });

  // Sort by latest score (descending)
  players.sort((a, b) => b.latestScore - a.latestScore);

  // Assign ranks (handle ties)
  let currentRank = 1;
  const rankedPlayers = players.map((player, index) => {
    if (index > 0 && player.latestScore < players[index - 1].latestScore) {
      currentRank = index + 1;
    }
    return { ...player, rank: currentRank };
  });

  return {
    gameName: game.name,
    maxRounds: game.maxRounds,
    currentRound: game.currentRound,
    gameStatus: game.status,
    completedRounds: game.rounds.map((r) => r.number),
    players: rankedPlayers,
  };
}
