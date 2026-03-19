"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getGameWithPlayers } from "@/server/actions/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PharmacySummary } from "@/components/game/pharmacy-summary";
import type { Employee, BalanceSheet, GameKPIs } from "@/types";

type GameData = Awaited<ReturnType<typeof getGameWithPlayers>>;

export default function PlayerDashboard() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<GameData>(null);

  const loadGame = useCallback(async () => {
    const data = await getGameWithPlayers(gameId);
    setGame(data);

    // Auto-redirect to current round if active
    if (data && data.status === "ROUND_ACTIVE") {
      router.push(`/game/${gameId}/round/${data.currentRound}`);
    }
  }, [gameId, router]);

  useEffect(() => {
    loadGame();
    const interval = setInterval(loadGame, 5000);
    return () => clearInterval(interval);
  }, [loadGame]);

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  // Find current player's latest state
  const player = game.players[0]; // We'll need session context to find the right player
  const latestState = player?.states?.[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{game.name}</h1>
          <p className="text-gray-500">
            Round {game.currentRound} / {game.maxRounds}
          </p>
        </div>
        <Badge
          variant={game.status === "FINISHED" ? "destructive" : "default"}
        >
          {game.status === "ROUND_DONE" && "En attente du prochain round"}
          {game.status === "FINISHED" && "Partie terminee"}
          {game.status === "COMPUTING" && "Calcul en cours..."}
        </Badge>
      </div>

      {latestState && (
        <PharmacySummary
          kpis={latestState.kpis as GameKPIs}
          balanceSheet={latestState.balanceSheet as BalanceSheet}
          employees={latestState.employees as Employee[]}
          roundNumber={latestState.roundNumber}
        />
      )}

      {/* Historique des rounds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des rounds</CardTitle>
        </CardHeader>
        <CardContent>
          {game.rounds.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              Aucun round joue pour l&apos;instant
            </p>
          ) : (
            <div className="space-y-2">
              {game.rounds
                .filter((r) => r.status === "COMPLETED")
                .map((round) => (
                  <Link
                    key={round.id}
                    href={`/game/${gameId}/results/${round.number}`}
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <span className="text-sm font-medium">
                        Round {round.number} - Annee {round.number}
                      </span>
                      <Button variant="ghost" size="sm">
                        Voir les resultats
                      </Button>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard link */}
      {game.currentRound > 0 && (
        <div className="text-center">
          <Link href={`/game/${gameId}/leaderboard`}>
            <Button variant="outline">Voir le classement general</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
