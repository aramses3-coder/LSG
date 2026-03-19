import type { GameKPIs, Employee, IncomeStatement } from "@/types";
import type { InventoryState } from "@/types";

export function calculateKPIs(
  income: IncomeStatement,
  employees: Employee[],
  inventory: InventoryState,
  nbClients: number,
  panierMoyen: number,
  tresorerie: number,
  satisfactionBase: number,
  ruptureImpact: number,
  zonePopulation: number,
  nbCompetitors: number
): GameKPIs {
  const ca = income.chiffreAffaires;

  // Marge brute
  const margeBrute = income.margeBrute;
  const tauxMarge = ca > 0 ? margeBrute / ca : 0;

  // EBE
  const ebe =
    margeBrute - income.chargesPersonnel - income.chargesExterieures;

  // Rotation des stocks
  const totalStockValue =
    inventory.prescriptions.value +
    inventory.otc.value +
    inventory.parapharmacie.value +
    inventory.materielMedical.value;
  const rotationStocks =
    totalStockValue > 0 ? income.coutAchats / totalStockValue : 0;

  // Satisfaction client (0-100)
  const baseSatisfaction = satisfactionBase * 100;
  const rupturePenalty = ruptureImpact * 30; // Max -30 points
  const satisfactionClient = Math.max(
    0,
    Math.min(100, baseSatisfaction - rupturePenalty)
  );

  // Part de marche
  const marketSize = zonePopulation * 0.8;
  const partDeMarche = marketSize > 0 ? nbClients / marketSize : 0;

  // Productivite
  const productivite = employees.length > 0 ? ca / employees.length : 0;

  return {
    chiffreAffaires: Math.round(ca),
    margeBrute: Math.round(margeBrute),
    tauxMarge: Math.round(tauxMarge * 1000) / 1000,
    ebe: Math.round(ebe),
    resultatNet: Math.round(income.resultatNet),
    tresorerie: Math.round(tresorerie),
    rotationStocks: Math.round(rotationStocks * 10) / 10,
    panierMoyen: Math.round(panierMoyen * 100) / 100,
    satisfactionClient: Math.round(satisfactionClient * 10) / 10,
    partDeMarche: Math.round(partDeMarche * 1000) / 1000,
    productivite: Math.round(productivite),
    nbClients: Math.round(nbClients),
  };
}
