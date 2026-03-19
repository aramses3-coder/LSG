"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGameWithPlayers } from "@/server/actions/game";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type GameData = Awaited<ReturnType<typeof getGameWithPlayers>>;

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<GameData>(null);

  const loadGame = useCallback(async () => {
    const data = await getGameWithPlayers(gameId);
    setGame(data);

    // Auto-redirect when game starts
    if (data && data.status === "ROUND_ACTIVE" && data.currentRound > 0) {
      router.push(`/game/${gameId}/round/${data.currentRound}`);
    }
  }, [gameId, router]);

  useEffect(() => {
    loadGame();
    const interval = setInterval(loadGame, 3000);
    return () => clearInterval(interval);
  }, [loadGame]);

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{game.name}</CardTitle>
          <CardDescription>
            En attente du lancement par le formateur ({game.trainer?.name})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-700 text-sm">
                En attente du demarrage...
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 mb-3">
              Joueurs connectes ({game.players.length})
            </h3>
            {game.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md"
              >
                <span className="text-sm">{player.user.name}</span>
                <Badge variant="secondary">{player.pharmacyName}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
