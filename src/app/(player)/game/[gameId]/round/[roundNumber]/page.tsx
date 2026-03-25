"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PharmacySummary } from "@/components/game/pharmacy-summary";
import { DecisionTabs } from "@/components/game/decision-tabs";
import { getGameWithPlayers, getCurrentUserId } from "@/server/actions/game";
import {
  saveDecisions,
  submitDecisions,
  getPlayerDecision,
  getPlayerState,
} from "@/server/actions/decisions";
import type {
  PlayerDecisions,
  Employee,
  BalanceSheet,
  GameKPIs,
  HRDecisions,
  PurchasingDecisions,
  PricingDecisions,
  MarketingDecisions,
  InvestmentDecisions,
  FinanceDecisions,
} from "@/types";

const DEFAULT_DECISIONS: PlayerDecisions = {
  hr: {
    hires: [],
    fires: [],
    trainingBudget: 0,
    salaryIncrease: 0,
    bonusPolicy: 0,
  },
  purchasing: {
    suppliers: [],
    safetyStockDays: {
      prescriptions: 15,
      otc: 15,
      parapharmacie: 15,
      materielMedical: 15,
    },
    orderFrequency: "bihebdomadaire",
    negotiationEffort: 50,
  },
  pricing: {
    otcMargin: 0.3,
    paraMargin: 0.35,
    promotions: [],
  },
  marketing: {
    totalBudget: 5000,
    allocation: { vitrine: 25, digital: 25, presseLocale: 25, evenements: 25 },
    loyaltyProgram: { active: false, cashbackPercent: 0.01 },
    services: {
      livraison: false,
      teleconsultation: false,
      vaccination: false,
      trod: false,
      pilulier: false,
    },
  },
  investments: {
    equipment: [],
    renovationBudget: 0,
    digital: { website: false, clickAndCollect: false, appMobile: false },
  },
  finance: {
    newLoanAmount: 0,
    newLoanDuration: 60,
    earlyRepayment: 0,
    dividendPayout: 0,
  },
};

export default function RoundPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const roundNumber = parseInt(params.roundNumber as string);

  const [decisions, setDecisions] = useState<PlayerDecisions>(DEFAULT_DECISIONS);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet>({
    assets: { stock: 0, tresorerie: 0, immobilisations: 0, creancesClients: 0, autresActifs: 0 },
    liabilities: { capitalPropre: 0, reserves: 0, resultatExercice: 0, emprunts: 0, dettesFournisseurs: 0, autresPassifs: 0 },
  });
  const [kpis, setKpis] = useState<GameKPIs>({
    chiffreAffaires: 0, margeBrute: 0, tauxMarge: 0, ebe: 0,
    resultatNet: 0, tresorerie: 0, rotationStocks: 0, panierMoyen: 0,
    satisfactionClient: 0, partDeMarche: 0, productivite: 0, nbClients: 0,
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameName, setGameName] = useState("");

  const loadData = useCallback(async () => {
    const game = await getGameWithPlayers(gameId);
    if (!game) return;

    setGameName(game.name);

    // Check if game moved to results
    if (game.status === "ROUND_DONE" || game.status === "FINISHED") {
      router.push(`/game/${gameId}/results/${roundNumber}`);
      return;
    }

    // Find current player by session
    const currentUserId = await getCurrentUserId();
    const player = currentUserId
      ? game.players.find((p) => p.userId === currentUserId)
      : game.players[0];
    if (!player) return;

    // Load previous state
    const prevState = await getPlayerState(player.id, roundNumber - 1);
    if (prevState) {
      setEmployees(prevState.employees as unknown as Employee[]);
      setBalanceSheet(prevState.balanceSheet as unknown as BalanceSheet);
      setKpis(prevState.kpis as unknown as GameKPIs);
    }

    // Load current round
    const currentRound = game.rounds.find((r) => r.number === roundNumber);
    if (currentRound) {
      const decision = await getPlayerDecision(player.id, currentRound.id);
      if (decision) {
        setDecisionId(decision.id);
        setSubmitted(decision.submitted);
        if (decision.submitted) return;

        setDecisions({
          hr: (decision.hr as unknown as HRDecisions) ?? DEFAULT_DECISIONS.hr,
          purchasing: (decision.purchasing as unknown as PurchasingDecisions) ?? DEFAULT_DECISIONS.purchasing,
          pricing: (decision.pricing as unknown as PricingDecisions) ?? DEFAULT_DECISIONS.pricing,
          marketing: (decision.marketing as unknown as MarketingDecisions) ?? DEFAULT_DECISIONS.marketing,
          investments: (decision.investments as unknown as InvestmentDecisions) ?? DEFAULT_DECISIONS.investments,
          finance: (decision.finance as unknown as FinanceDecisions) ?? DEFAULT_DECISIONS.finance,
        });
      }
    }

    setLoading(false);
  }, [gameId, roundNumber, router]);

  useEffect(() => {
    loadData();
    // Poll for game status changes
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Auto-save decisions
  const handleDecisionsChange = async (newDecisions: PlayerDecisions) => {
    setDecisions(newDecisions);

    if (!decisionId || submitted) return;
    setSaving(true);

    // Save each category
    await Promise.all([
      saveDecisions(decisionId, "hr", newDecisions.hr as unknown as Record<string, unknown>),
      saveDecisions(decisionId, "purchasing", newDecisions.purchasing as unknown as Record<string, unknown>),
      saveDecisions(decisionId, "pricing", newDecisions.pricing as unknown as Record<string, unknown>),
      saveDecisions(decisionId, "marketing", newDecisions.marketing as unknown as Record<string, unknown>),
      saveDecisions(decisionId, "investments", newDecisions.investments as unknown as Record<string, unknown>),
      saveDecisions(decisionId, "finance", newDecisions.finance as unknown as Record<string, unknown>),
    ]);

    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!decisionId) return;
    const confirmed = window.confirm(
      "Etes-vous sur de vouloir soumettre vos decisions ? Vous ne pourrez plus les modifier."
    );
    if (!confirmed) return;

    await submitDecisions(decisionId);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement du round...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{gameName}</h1>
          <p className="text-gray-500">
            Round {roundNumber} &mdash; Annee d&apos;exercice {roundNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              Sauvegarde...
            </span>
          )}
          {!saving && !submitted && decisionId && (
            <span className="text-xs text-emerald-500 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              Sauvegarde auto
            </span>
          )}
          {submitted ? (
            <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>&#x2713;</span>
              Soumises &mdash; En attente des resultats
            </div>
          ) : (
            <Button onClick={handleSubmit} disabled={!decisionId} size="lg">
              Soumettre mes decisions
            </Button>
          )}
        </div>
      </div>

      {/* Resume pharmacie */}
      <PharmacySummary
        kpis={kpis}
        balanceSheet={balanceSheet}
        employees={employees}
        roundNumber={roundNumber - 1}
      />

      {/* Decisions */}
      {submitted ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 text-lg mb-2">
            Vos decisions ont ete soumises
          </p>
          <p className="text-gray-400 text-sm">
            Le formateur va calculer les resultats. Cette page se mettra a jour automatiquement.
          </p>
        </div>
      ) : (
        <DecisionTabs
          decisions={decisions}
          employees={employees}
          balanceSheet={balanceSheet}
          onChange={handleDecisionsChange}
        />
      )}
    </div>
  );
}
