"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getGameWithPlayers, getCurrentUserId } from "@/server/actions/game";
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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserId().then(setUserId);
  }, []);

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Find current player by session userId
  const player = userId
    ? game.players.find((p) => p.userId === userId)
    : game.players[0];
  const latestState = player?.states?.[0];

  // Find player rank
  const sortedPlayers = [...game.players].sort(
    (a, b) => (b.states[0]?.score ?? 0) - (a.states[0]?.score ?? 0)
  );
  const playerRank = player
    ? sortedPlayers.findIndex((p) => p.id === player.id) + 1
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{game.name}</h1>
          <p className="text-gray-500">
            {player?.pharmacyName && (
              <span className="text-emerald-600 font-medium">
                {player.pharmacyName} &middot;{" "}
              </span>
            )}
            Round {game.currentRound} / {game.maxRounds}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {playerRank > 0 && game.currentRound > 0 && (
            <Badge variant="outline" className="text-sm">
              #{playerRank} / {game.players.length}
            </Badge>
          )}
          <Badge
            variant={game.status === "FINISHED" ? "destructive" : "default"}
          >
            {game.status === "ROUND_DONE" && "En attente du prochain round"}
            {game.status === "FINISHED" && "Partie terminee"}
            {game.status === "COMPUTING" && "Calcul en cours..."}
            {game.status === "LOBBY" && "En attente"}
            {game.status === "IN_PROGRESS" && "En cours"}
            {game.status === "ROUND_ACTIVE" && "Round en cours"}
          </Badge>
        </div>
      </div>

      {/* Pharmacy Summary */}
      {latestState && (
        <PharmacySummary
          kpis={latestState.kpis as unknown as GameKPIs}
          balanceSheet={latestState.balanceSheet as unknown as BalanceSheet}
          employees={latestState.employees as unknown as Employee[]}
          roundNumber={latestState.roundNumber}
        />
      )}

      {/* Historique des rounds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des rounds</CardTitle>
        </CardHeader>
        <CardContent>
          {game.rounds.length === 0 ||
          game.rounds.filter((r) => r.status === "COMPLETED").length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              Aucun round termine pour l&apos;instant
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
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold">
                          {round.number}
                        </div>
                        <span className="text-sm font-medium">
                          Annee {round.number}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Voir les resultats &rarr;
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
            <Button variant="outline" className="gap-2">
              &#x1f3c6; Voir le classement general
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
