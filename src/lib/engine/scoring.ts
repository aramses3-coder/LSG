import type { GameKPIs } from "@/types";

// Poids des differents criteres pour le score global
const WEIGHTS = {
  resultatNet: 0.25, // Rentabilite
  tresorerie: 0.15, // Sante financiere
  satisfactionClient: 0.20, // Qualite de service
  partDeMarche: 0.15, // Croissance
  productivite: 0.10, // Efficacite
  tauxMarge: 0.10, // Gestion des marges
  rotationStocks: 0.05, // Gestion des stocks
};

export function calculateScore(kpis: GameKPIs): number {
  // Normalize each KPI to a 0-100 scale
  const scores = {
    resultatNet: normalizeValue(kpis.resultatNet, -50000, 200000),
    tresorerie: normalizeValue(kpis.tresorerie, -100000, 300000),
    satisfactionClient: kpis.satisfactionClient, // Already 0-100
    partDeMarche: normalizeValue(kpis.partDeMarche, 0, 0.5) ,
    productivite: normalizeValue(kpis.productivite, 200000, 500000),
    tauxMarge: normalizeValue(kpis.tauxMarge, 0.15, 0.35),
    rotationStocks: normalizeValue(kpis.rotationStocks, 2, 15),
  };

  // Weighted sum
  let totalScore = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    totalScore += (scores[key as keyof typeof scores] ?? 0) * weight;
  }

  return Math.round(Math.max(0, Math.min(100, totalScore)) * 10) / 10;
}

function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}
