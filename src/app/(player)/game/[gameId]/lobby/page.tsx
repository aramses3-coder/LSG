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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Connexion a la partie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{game.name}</CardTitle>
          <CardDescription>
            Formateur : {game.trainer?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-700 text-sm font-medium">
                En attente du demarrage...
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              Joueurs connectes
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {game.players.length}
              </span>
            </h3>
            <div className="space-y-2">
              {game.players.map((player, i) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{player.user.name}</span>
                  </div>
                  <Badge variant="secondary">{player.pharmacyName}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-gray-400">
        La page se met a jour automatiquement. Patientez pendant que le formateur lance la partie.
      </p>
    </div>
  );
}
