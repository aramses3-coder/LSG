"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getLeaderboardData } from "@/server/actions/results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeaderboardTable } from "@/components/game/leaderboard-table";
import { EvolutionLine } from "@/components/charts/evolution-line";
import { formatCurrency } from "@/lib/utils";
import type { GameKPIs } from "@/types";

type LeaderboardData = Awaited<ReturnType<typeof getLeaderboardData>>;

// Colors for chart lines
const PLAYER_COLORS = [
  "#059669", // emerald
  "#2563eb", // blue
  "#d97706", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#c026d3", // fuchsia
  "#65a30d", // lime
  "#ea580c", // orange
  "#4f46e5", // indigo
];

export default function LeaderboardPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [data, setData] = useState<LeaderboardData>(null);

  const loadData = useCallback(async () => {
    const result = await getLeaderboardData(gameId);
    setData(result);
  }, [gameId]);

  useEffect(() => {
    loadData();
    // Refresh when game is still in progress
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Chargement du classement...</p>
      </div>
    );
  }

  const isFinished = data.gameStatus === "FINISHED";
  const podium = data.players.slice(0, 3);

  // Build evolution data for score
  const scoreEvolutionData = data.completedRounds.map((roundNum) => {
    const row: Record<string, unknown> = { round: `R${roundNum}` };
    for (const player of data.players) {
      const roundState = player.roundHistory.find(
        (h) => h.roundNumber === roundNum
      );
      row[player.id] = roundState?.score ?? 0;
    }
    return row;
  });

  const scoreLines = data.players.map((player, index) => ({
    key: player.id,
    name: player.pharmacyName,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
  }));

  // Build evolution data for CA
  const caEvolutionData = data.completedRounds.map((roundNum) => {
    const row: Record<string, unknown> = { round: `R${roundNum}` };
    for (const player of data.players) {
      const roundState = player.roundHistory.find(
        (h) => h.roundNumber === roundNum
      );
      row[player.id] =
        (roundState?.kpis as unknown as GameKPIs)?.chiffreAffaires ?? 0;
    }
    return row;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {isFinished ? "Classement Final" : "Classement"}
        </h1>
        <p className="text-gray-500">
          {data.gameName} &middot; Round {data.currentRound} /{" "}
          {data.maxRounds}
        </p>
        {isFinished && (
          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-sm px-4 py-1">
            Partie terminee
          </Badge>
        )}
      </div>

      {/* Podium */}
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-4 pt-4 pb-2">
          {/* 2nd place */}
          {podium.length > 1 && (
            <PodiumCard
              player={podium[1]}
              position={2}
              height="h-32"
              bgColor="bg-gradient-to-t from-gray-200 to-gray-100"
              textColor="text-gray-700"
            />
          )}
          {/* 1st place */}
          <PodiumCard
            player={podium[0]}
            position={1}
            height="h-44"
            bgColor="bg-gradient-to-t from-amber-200 to-yellow-100"
            textColor="text-amber-800"
          />
          {/* 3rd place */}
          {podium.length > 2 && (
            <PodiumCard
              player={podium[2]}
              position={3}
              height="h-24"
              bgColor="bg-gradient-to-t from-orange-200 to-orange-100"
              textColor="text-orange-700"
            />
          )}
        </div>
      )}

      {/* Full leaderboard table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Classement complet</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardTable players={data.players} />
        </CardContent>
      </Card>

      {/* Evolution graphs */}
      {data.completedRounds.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Evolution du score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EvolutionLine
                data={scoreEvolutionData}
                lines={scoreLines}
                xKey="round"
                formatter={(v) => `${v.toFixed(1)}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Evolution du chiffre d&apos;affaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EvolutionLine
                data={caEvolutionData}
                lines={scoreLines}
                xKey="round"
                formatter={formatCurrency}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-round results links */}
      {data.completedRounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultats par round</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.completedRounds.map((roundNum) => (
                <Link
                  key={roundNum}
                  href={`/game/${gameId}/results/${roundNum}`}
                >
                  <Button variant="outline" size="sm">
                    Round {roundNum}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back link */}
      <div className="text-center pt-4">
        <Link href={`/game/${gameId}/dashboard`}>
          <Button variant="outline">Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  );
}

// ===== Podium Card =====

interface PodiumPlayer {
  pharmacyName: string;
  playerName: string;
  latestScore: number;
  isCurrentPlayer: boolean;
  latestKpis: Record<string, number>;
}

function PodiumCard({
  player,
  position,
  height,
  bgColor,
  textColor,
}: {
  player: PodiumPlayer;
  position: number;
  height: string;
  bgColor: string;
  textColor: string;
}) {
  const kpis = player.latestKpis as unknown as GameKPIs;
  const medals: Record<number, string> = {
    1: "\uD83E\uDD47",
    2: "\uD83E\uDD48",
    3: "\uD83E\uDD49",
  };

  return (
    <div className="flex flex-col items-center w-36 sm:w-44">
      {/* Player info above podium */}
      <div className="text-center mb-2">
        <span className="text-2xl">{medals[position]}</span>
        <p
          className={`font-bold text-sm truncate max-w-full ${
            player.isCurrentPlayer ? "text-emerald-700" : "text-gray-800"
          }`}
        >
          {player.pharmacyName}
        </p>
        <p className="text-xs text-gray-400">{player.playerName}</p>
      </div>
      {/* Podium block */}
      <div
        className={`w-full ${height} ${bgColor} rounded-t-xl flex flex-col items-center justify-center p-3 shadow-sm border border-b-0`}
      >
        <p className={`text-2xl font-bold ${textColor}`}>
          {player.latestScore.toFixed(1)}
        </p>
        <p className="text-xs text-gray-500 mt-1">points</p>
        {kpis?.chiffreAffaires && (
          <p className="text-xs text-gray-400 mt-1">
            CA {formatCurrency(kpis.chiffreAffaires)}
          </p>
        )}
      </div>
    </div>
  );
}
