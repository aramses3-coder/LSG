"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRoundResults } from "@/server/actions/results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/game/kpi-card";
import { RadarChart } from "@/components/charts/radar-chart";
import { BarComparison } from "@/components/charts/bar-comparison";
import { EvolutionLine } from "@/components/charts/evolution-line";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type {
  BalanceSheet,
  IncomeStatement,
  GameKPIs,
  Employee,
} from "@/types";

type RoundResults = Awaited<ReturnType<typeof getRoundResults>>;

function getTrend(
  current: number,
  previous: number | undefined
): "up" | "down" | "neutral" {
  if (previous === undefined) return "neutral";
  if (current > previous * 1.01) return "up";
  if (current < previous * 0.99) return "down";
  return "neutral";
}

export default function RoundResultsPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);
  const [results, setResults] = useState<RoundResults>(null);

  const loadResults = useCallback(async () => {
    const data = await getRoundResults(gameId, roundNumber);
    setResults(data);
  }, [gameId, roundNumber]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Chargement des resultats...</p>
      </div>
    );
  }

  const currentPlayerResult = results.playerResults.find(
    (p) => p.isCurrentPlayer
  );
  const currentKpis = currentPlayerResult?.currentState?.kpis as
    | GameKPIs
    | undefined;
  const previousKpis = currentPlayerResult?.previousState?.kpis as
    | GameKPIs
    | undefined;
  const currentBalance = currentPlayerResult?.currentState
    ?.balanceSheet as BalanceSheet | undefined;
  const currentIncome = currentPlayerResult?.currentState
    ?.incomeStatement as IncomeStatement | undefined;
  const currentEmployees = (currentPlayerResult?.currentState?.employees ??
    []) as unknown as Employee[];
  const currentScore = currentPlayerResult?.currentState?.score ?? 0;
  const previousScore = currentPlayerResult?.previousState?.score;

  // Rank of current player
  const currentRank =
    results.playerResults.findIndex((p) => p.isCurrentPlayer) + 1;

  // Radar data for current player vs average
  const radarData = currentKpis
    ? [
        {
          subject: "CA",
          player: normalize(currentKpis.chiffreAffaires, 0, 3000000),
          average: normalize(
            results.averageKpis.chiffreAffaires ?? 0,
            0,
            3000000
          ),
        },
        {
          subject: "Marge",
          player: normalize(currentKpis.tauxMarge, 0, 0.4),
          average: normalize(results.averageKpis.tauxMarge ?? 0, 0, 0.4),
        },
        {
          subject: "Resultat",
          player: normalize(currentKpis.resultatNet, -50000, 200000),
          average: normalize(
            results.averageKpis.resultatNet ?? 0,
            -50000,
            200000
          ),
        },
        {
          subject: "Tresorerie",
          player: normalize(currentKpis.tresorerie, -100000, 300000),
          average: normalize(
            results.averageKpis.tresorerie ?? 0,
            -100000,
            300000
          ),
        },
        {
          subject: "Satisfaction",
          player: currentKpis.satisfactionClient,
          average: results.averageKpis.satisfactionClient ?? 0,
        },
        {
          subject: "Productivite",
          player: normalize(currentKpis.productivite, 200000, 500000),
          average: normalize(
            results.averageKpis.productivite ?? 0,
            200000,
            500000
          ),
        },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Resultats — Round {roundNumber}
          </h1>
          <p className="text-gray-500">
            {results.gameName} &middot; Annee {roundNumber} /{" "}
            {results.maxRounds}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={currentRank <= 3 ? "default" : "secondary"}
            className="text-sm px-3 py-1"
          >
            #{currentRank} / {results.playerResults.length} joueurs
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Score : {currentScore.toFixed(1)} / 100
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      {currentKpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            label="Chiffre d'affaires"
            value={formatCurrency(currentKpis.chiffreAffaires)}
            trend={getTrend(
              currentKpis.chiffreAffaires,
              previousKpis?.chiffreAffaires
            )}
          />
          <KPICard
            label="Marge brute"
            value={formatCurrency(currentKpis.margeBrute)}
            subtitle={formatPercent(currentKpis.tauxMarge)}
            trend={getTrend(currentKpis.margeBrute, previousKpis?.margeBrute)}
          />
          <KPICard
            label="Resultat net"
            value={formatCurrency(currentKpis.resultatNet)}
            trend={getTrend(
              currentKpis.resultatNet,
              previousKpis?.resultatNet
            )}
            color={
              currentKpis.resultatNet >= 0
                ? "text-emerald-600"
                : "text-red-600"
            }
          />
          <KPICard
            label="Tresorerie"
            value={formatCurrency(currentKpis.tresorerie)}
            trend={getTrend(currentKpis.tresorerie, previousKpis?.tresorerie)}
            color={
              currentKpis.tresorerie >= 0 ? "text-blue-600" : "text-red-600"
            }
          />
          <KPICard
            label="Satisfaction client"
            value={`${Math.round(currentKpis.satisfactionClient)}/100`}
            trend={getTrend(
              currentKpis.satisfactionClient,
              previousKpis?.satisfactionClient
            )}
            color={
              currentKpis.satisfactionClient >= 70
                ? "text-emerald-600"
                : currentKpis.satisfactionClient >= 50
                ? "text-yellow-600"
                : "text-red-600"
            }
          />
          <KPICard
            label="Score global"
            value={`${currentScore.toFixed(1)}`}
            trend={getTrend(currentScore, previousScore)}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Bilan & Compte de résultat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bilan */}
        {currentBalance && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bilan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-emerald-700 mb-2 text-xs uppercase tracking-wide">
                    Actif
                  </h4>
                  <div className="space-y-1.5">
                    <BalanceLine
                      label="Immobilisations"
                      value={currentBalance.assets.immobilisations}
                    />
                    <BalanceLine
                      label="Stock"
                      value={currentBalance.assets.stock}
                    />
                    <BalanceLine
                      label="Creances clients"
                      value={currentBalance.assets.creancesClients}
                    />
                    <BalanceLine
                      label="Tresorerie"
                      value={currentBalance.assets.tresorerie}
                      highlight
                    />
                    <BalanceLine
                      label="Autres actifs"
                      value={currentBalance.assets.autresActifs}
                    />
                    <div className="border-t pt-1 mt-2">
                      <BalanceLine
                        label="Total Actif"
                        value={
                          currentBalance.assets.immobilisations +
                          currentBalance.assets.stock +
                          currentBalance.assets.creancesClients +
                          currentBalance.assets.tresorerie +
                          currentBalance.assets.autresActifs
                        }
                        bold
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2 text-xs uppercase tracking-wide">
                    Passif
                  </h4>
                  <div className="space-y-1.5">
                    <BalanceLine
                      label="Capital propre"
                      value={currentBalance.liabilities.capitalPropre}
                    />
                    <BalanceLine
                      label="Reserves"
                      value={currentBalance.liabilities.reserves}
                    />
                    <BalanceLine
                      label="Resultat"
                      value={currentBalance.liabilities.resultatExercice}
                      highlight
                    />
                    <BalanceLine
                      label="Emprunts"
                      value={currentBalance.liabilities.emprunts}
                    />
                    <BalanceLine
                      label="Dettes fournisseurs"
                      value={currentBalance.liabilities.dettesFournisseurs}
                    />
                    <div className="border-t pt-1 mt-2">
                      <BalanceLine
                        label="Total Passif"
                        value={
                          currentBalance.liabilities.capitalPropre +
                          currentBalance.liabilities.reserves +
                          currentBalance.liabilities.resultatExercice +
                          currentBalance.liabilities.emprunts +
                          currentBalance.liabilities.dettesFournisseurs +
                          currentBalance.liabilities.autresPassifs
                        }
                        bold
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compte de résultat */}
        {currentIncome && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compte de resultat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                <BalanceLine
                  label="Chiffre d'affaires"
                  value={currentIncome.chiffreAffaires}
                  bold
                />
                <BalanceLine
                  label="Cout des achats"
                  value={-currentIncome.coutAchats}
                  negative
                />
                <div className="border-t pt-1 mt-2">
                  <BalanceLine
                    label="Marge brute"
                    value={currentIncome.margeBrute}
                    bold
                    highlight
                  />
                </div>
                <BalanceLine
                  label="Charges de personnel"
                  value={-currentIncome.chargesPersonnel}
                  negative
                />
                <BalanceLine
                  label="Charges exterieures"
                  value={-currentIncome.chargesExterieures}
                  negative
                />
                <BalanceLine
                  label="Impots et taxes"
                  value={-currentIncome.impotsTaxes}
                  negative
                />
                <BalanceLine
                  label="Amortissements"
                  value={-currentIncome.dotationsAmortissements}
                  negative
                />
                <div className="border-t pt-1 mt-2">
                  <BalanceLine
                    label="Resultat d'exploitation"
                    value={currentIncome.resultatExploitation}
                    bold
                  />
                </div>
                <BalanceLine
                  label="Charges financieres"
                  value={-currentIncome.chargesFinancieres}
                  negative
                />
                <div className="border-t pt-1 mt-2 border-gray-300">
                  <BalanceLine
                    label="Resultat net"
                    value={currentIncome.resultatNet}
                    bold
                    highlight
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Radar Chart - Profil vs Moyenne */}
      {radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Profil de performance vs moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart
              data={radarData}
              playerName={
                currentPlayerResult?.pharmacyName ?? "Ma Pharmacie"
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Comparaison avec les autres joueurs */}
      {results.playerResults.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Comparaison avec les autres pharmacies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BarComparison
                data={results.playerResults.map((p) => ({
                  name: p.pharmacyName,
                  value: (p.currentState?.kpis as unknown as GameKPIs)?.chiffreAffaires ?? 0,
                  isCurrentPlayer: p.isCurrentPlayer,
                }))}
                label="Chiffre d'affaires"
                formatter={formatCurrency}
              />
              <BarComparison
                data={results.playerResults.map((p) => ({
                  name: p.pharmacyName,
                  value: (p.currentState?.kpis as unknown as GameKPIs)?.resultatNet ?? 0,
                  isCurrentPlayer: p.isCurrentPlayer,
                }))}
                label="Resultat net"
                formatter={formatCurrency}
              />
              <BarComparison
                data={results.playerResults.map((p) => ({
                  name: p.pharmacyName,
                  value:
                    Math.round(
                      ((p.currentState?.kpis as unknown as GameKPIs)
                        ?.satisfactionClient ?? 0) * 10
                    ) / 10,
                  isCurrentPlayer: p.isCurrentPlayer,
                }))}
                label="Satisfaction client"
                formatter={(v) => `${v}/100`}
              />
              <BarComparison
                data={results.playerResults.map((p) => ({
                  name: p.pharmacyName,
                  value:
                    Math.round((p.currentState?.score ?? 0) * 10) / 10,
                  isCurrentPlayer: p.isCurrentPlayer,
                }))}
                label="Score global"
                formatter={(v) => `${v}/100`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classement du round */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Classement du round</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Pharmacie</th>
                  <th className="pb-2 pr-4 text-right">CA</th>
                  <th className="pb-2 pr-4 text-right">Resultat</th>
                  <th className="pb-2 pr-4 text-right">Tresorerie</th>
                  <th className="pb-2 pr-4 text-right">Satisfaction</th>
                  <th className="pb-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {results.playerResults.map((player, index) => {
                  const kpis = player.currentState?.kpis as
                    | GameKPIs
                    | undefined;
                  return (
                    <tr
                      key={player.id}
                      className={`border-t ${
                        player.isCurrentPlayer
                          ? "bg-emerald-50 font-medium"
                          : ""
                      }`}
                    >
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                              ? "bg-gray-100 text-gray-600"
                              : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <div>
                          <span className="font-medium">
                            {player.pharmacyName}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {player.playerName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-xs">
                        {formatCurrency(kpis?.chiffreAffaires ?? 0)}
                      </td>
                      <td
                        className={`py-2 pr-4 text-right font-mono text-xs ${
                          (kpis?.resultatNet ?? 0) >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(kpis?.resultatNet ?? 0)}
                      </td>
                      <td
                        className={`py-2 pr-4 text-right font-mono text-xs ${
                          (kpis?.tresorerie ?? 0) >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(kpis?.tresorerie ?? 0)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-xs">
                        {Math.round(kpis?.satisfactionClient ?? 0)}/100
                      </td>
                      <td className="py-2 text-right">
                        <span className="font-bold text-purple-600">
                          {(player.currentState?.score ?? 0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Personnel */}
      {currentEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {currentEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-gray-50 rounded-lg p-3 text-center"
                >
                  <p className="text-xs text-gray-500 capitalize">
                    {emp.role}
                  </p>
                  <p className="font-medium text-sm mt-0.5">{emp.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatCurrency(emp.salary)}/mois &middot; Comp.{" "}
                    {emp.competence}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div className="flex gap-3">
          {roundNumber > 1 && (
            <Link href={`/game/${gameId}/results/${roundNumber - 1}`}>
              <Button variant="outline" size="sm">
                &larr; Round {roundNumber - 1}
              </Button>
            </Link>
          )}
          {roundNumber < results.currentRound && (
            <Link href={`/game/${gameId}/results/${roundNumber + 1}`}>
              <Button variant="outline" size="sm">
                Round {roundNumber + 1} &rarr;
              </Button>
            </Link>
          )}
        </div>
        <div className="flex gap-3">
          <Link href={`/game/${gameId}/dashboard`}>
            <Button variant="outline" size="sm">
              Tableau de bord
            </Button>
          </Link>
          <Link href={`/game/${gameId}/leaderboard`}>
            <Button size="sm">Classement general</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ===== Helper Components =====

function BalanceLine({
  label,
  value,
  bold,
  highlight,
  negative,
}: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
  negative?: boolean;
}) {
  const color = negative
    ? "text-red-500"
    : highlight
    ? value >= 0
      ? "text-emerald-600"
      : "text-red-600"
    : "text-gray-700";

  return (
    <div className="flex justify-between items-center">
      <span className={`${bold ? "font-semibold" : "text-gray-600"}`}>
        {label}
      </span>
      <span className={`font-mono text-xs ${bold ? "font-bold" : ""} ${color}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

// Normalize a value to 0-100 scale for radar chart
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const n = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, Math.round(n)));
}
