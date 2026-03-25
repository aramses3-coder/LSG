"use client";

import { formatCurrency } from "@/lib/utils";
import type { GameKPIs } from "@/types";

interface LeaderboardPlayer {
  id: string;
  rank: number;
  pharmacyName: string;
  playerName: string;
  isCurrentPlayer: boolean;
  latestScore: number;
  latestKpis: Record<string, number>;
}

interface LeaderboardTableProps {
  players: LeaderboardPlayer[];
}

const MEDAL_EMOJI: Record<number, string> = {
  1: "\uD83E\uDD47",
  2: "\uD83E\uDD48",
  3: "\uD83E\uDD49",
};

export function LeaderboardTable({ players }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b">
            <th className="pb-3 pr-4">Rang</th>
            <th className="pb-3 pr-4">Pharmacie</th>
            <th className="pb-3 pr-4 text-right">CA</th>
            <th className="pb-3 pr-4 text-right">Resultat net</th>
            <th className="pb-3 pr-4 text-right">Tresorerie</th>
            <th className="pb-3 pr-4 text-right">Satisfaction</th>
            <th className="pb-3 pr-4 text-right">Part marche</th>
            <th className="pb-3 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const kpis = player.latestKpis as unknown as GameKPIs;
            const isPodium = player.rank <= 3;

            return (
              <tr
                key={player.id}
                className={`border-b last:border-b-0 transition-colors ${
                  player.isCurrentPlayer
                    ? "bg-emerald-50 hover:bg-emerald-100"
                    : "hover:bg-gray-50"
                }`}
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {isPodium ? (
                      <span className="text-lg">
                        {MEDAL_EMOJI[player.rank]}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                        {player.rank}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {player.pharmacyName}
                      {player.isCurrentPlayer && (
                        <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                          Vous
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{player.playerName}</p>
                  </div>
                </td>
                <td className="py-3 pr-4 text-right font-mono text-xs">
                  {formatCurrency(kpis?.chiffreAffaires ?? 0)}
                </td>
                <td
                  className={`py-3 pr-4 text-right font-mono text-xs ${
                    (kpis?.resultatNet ?? 0) >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(kpis?.resultatNet ?? 0)}
                </td>
                <td
                  className={`py-3 pr-4 text-right font-mono text-xs ${
                    (kpis?.tresorerie ?? 0) >= 0
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(kpis?.tresorerie ?? 0)}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-xs">
                  {Math.round(kpis?.satisfactionClient ?? 0)}/100
                </td>
                <td className="py-3 pr-4 text-right font-mono text-xs">
                  {((kpis?.partDeMarche ?? 0) * 100).toFixed(1)}%
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded-lg text-sm font-bold ${
                      isPodium
                        ? "bg-purple-100 text-purple-700"
                        : "text-gray-700"
                    }`}
                  >
                    {player.latestScore.toFixed(1)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
