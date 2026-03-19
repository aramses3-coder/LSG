"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGameWithPlayers } from "@/server/actions/game";
import { startGame, startRound, computeRound } from "@/server/actions/round";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type GameData = Awaited<ReturnType<typeof getGameWithPlayers>>;

export default function GameControlPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<GameData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    const data = await getGameWithPlayers(gameId);
    setGame(data);
  }, [gameId]);

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

  const submittedCount = game.players.filter((p) =>
    p.decisions.some((d) => d.submitted)
  ).length;

  async function handleStartGame() {
    setLoading(true);
    setError(null);
    const result = await startGame(gameId);
    if (result?.error) setError(result.error);
    await loadGame();
    setLoading(false);
  }

  async function handleStartRound() {
    setLoading(true);
    setError(null);
    const result = await startRound(gameId);
    if (result?.error) setError(result.error);
    await loadGame();
    setLoading(false);
  }

  async function handleComputeRound() {
    setLoading(true);
    setError(null);
    const result = await computeRound(gameId);
    if (result?.error) setError(result.error);
    await loadGame();
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{game.name}</h1>
          <p className="text-gray-500">
            Code d&apos;acces :{" "}
            <span className="font-mono font-bold text-lg text-emerald-700">
              {game.code}
            </span>
          </p>
        </div>
        <div className="text-right">
          <Badge
            variant={
              game.status === "FINISHED" ? "destructive" : "default"
            }
            className="text-sm"
          >
            {game.status === "LOBBY" && "En attente"}
            {game.status === "IN_PROGRESS" && "En cours"}
            {game.status === "ROUND_ACTIVE" && `Round ${game.currentRound} - En cours`}
            {game.status === "COMPUTING" && "Calcul en cours..."}
            {game.status === "ROUND_DONE" && `Round ${game.currentRound} - Termine`}
            {game.status === "FINISHED" && "Partie terminee"}
          </Badge>
          <p className="text-sm text-gray-500 mt-1">
            Round {game.currentRound} / {game.maxRounds}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {game.status === "LOBBY" && (
            <Button
              onClick={handleStartGame}
              disabled={loading || game.players.length < 1}
            >
              {loading ? "Demarrage..." : "Demarrer la partie"}
            </Button>
          )}
          {game.status === "ROUND_DONE" && (
            <Button onClick={handleStartRound} disabled={loading}>
              {loading ? "Lancement..." : "Lancer le round suivant"}
            </Button>
          )}
          {game.status === "ROUND_ACTIVE" && (
            <Button onClick={handleComputeRound} disabled={loading}>
              {loading
                ? "Calcul..."
                : `Calculer les resultats (${submittedCount}/${game.players.length} soumis)`}
            </Button>
          )}
          {(game.status === "ROUND_DONE" || game.status === "FINISHED") &&
            game.currentRound > 0 && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/game/${gameId}/leaderboard`)
                }
              >
                Voir le classement
              </Button>
            )}
        </CardContent>
      </Card>

      {/* Joueurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Joueurs ({game.players.length})
          </CardTitle>
          <CardDescription>
            {game.status === "LOBBY"
              ? "Les joueurs rejoignent avec le code d'acces"
              : "Statut des joueurs pour le round en cours"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {game.players.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Aucun joueur n&apos;a encore rejoint. Communiquez le code :{" "}
              <span className="font-mono font-bold">{game.code}</span>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Joueur</th>
                    <th className="pb-2 pr-4">Pharmacie</th>
                    {game.status === "ROUND_ACTIVE" && (
                      <th className="pb-2 pr-4">Decision</th>
                    )}
                    {game.currentRound > 0 &&
                      game.status !== "ROUND_ACTIVE" && (
                        <>
                          <th className="pb-2 pr-4 text-right">Score</th>
                        </>
                      )}
                  </tr>
                </thead>
                <tbody>
                  {game.players
                    .sort((a, b) => {
                      const scoreA = a.states[0]?.score ?? 0;
                      const scoreB = b.states[0]?.score ?? 0;
                      return scoreB - scoreA;
                    })
                    .map((player, i) => (
                      <tr key={player.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs w-5">
                              {i + 1}.
                            </span>
                            {player.user.name}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">
                          {player.pharmacyName}
                        </td>
                        {game.status === "ROUND_ACTIVE" && (
                          <td className="py-3 pr-4">
                            {player.decisions.some((d) => d.submitted) ? (
                              <Badge>Soumis</Badge>
                            ) : (
                              <Badge variant="warning">En attente</Badge>
                            )}
                          </td>
                        )}
                        {game.currentRound > 0 &&
                          game.status !== "ROUND_ACTIVE" && (
                            <td className="py-3 pr-4 text-right font-mono">
                              {(player.states[0]?.score ?? 0).toFixed(0)} pts
                            </td>
                          )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
