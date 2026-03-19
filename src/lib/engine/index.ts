import type {
  PlayerDecisions,
  GameEvent,
  BalanceSheet,
  IncomeStatement,
  Employee,
  InventoryState,
  GameKPIs,
  CashFlowStatement,
} from "@/types";
import type { SimulationResult } from "./types";
import { processHR } from "./modules/hr";
import { calculateRevenue } from "./modules/revenue";
import { processInventory } from "./modules/inventory";
import { calculateCosts, calculateIS } from "./modules/costs";
import { processFinance } from "./modules/finance";
import { calculateKPIs } from "./modules/kpi";
import { applyEventModifiers } from "./modules/events";
import { calculateScore } from "./scoring";

interface PreviousState {
  balanceSheet: unknown;
  incomeStatement: unknown;
  cashFlow: unknown;
  employees: unknown;
  inventory: unknown;
  kpis: unknown;
}

interface GameConfig {
  pharmacy?: { type?: string; surface?: number; zonePopulation?: number };
  competition?: { nbCompetitors?: number; competitionIntensity?: number };
  [key: string]: unknown;
}

export function simulateRound(
  previousState: PreviousState,
  decisions: PlayerDecisions,
  events: GameEvent[],
  config: GameConfig
): SimulationResult {
  const prevBalance = previousState.balanceSheet as BalanceSheet;
  const prevEmployees = (previousState.employees as Employee[]) ?? [];
  const prevInventory = previousState.inventory as InventoryState;
  const prevKPIs = previousState.kpis as GameKPIs;

  const surface = config.pharmacy?.surface ?? 120;
  const zonePopulation = config.pharmacy?.zonePopulation ?? 15000;
  const nbCompetitors = config.competition?.nbCompetitors ?? 3;
  const competitionIntensity = config.competition?.competitionIntensity ?? 50;

  // Default decisions if empty
  const hr = decisions.hr ?? {
    hires: [],
    fires: [],
    trainingBudget: 0,
    salaryIncrease: 0,
    bonusPolicy: 0,
  };
  const purchasing = decisions.purchasing ?? {
    suppliers: [],
    safetyStockDays: {
      prescriptions: 15,
      otc: 15,
      parapharmacie: 15,
      materielMedical: 15,
    },
    orderFrequency: "bihebdomadaire" as const,
    negotiationEffort: 50,
  };
  const pricing = decisions.pricing ?? {
    otcMargin: 0.3,
    paraMargin: 0.35,
    promotions: [],
  };
  const marketing = decisions.marketing ?? {
    totalBudget: 5000,
    allocation: { vitrine: 0.25, digital: 0.25, presseLocale: 0.25, evenements: 0.25 },
    loyaltyProgram: { active: false, cashbackPercent: 0 },
    services: {
      livraison: false,
      teleconsultation: false,
      vaccination: false,
      trod: false,
      pilulier: false,
    },
  };
  const investments = decisions.investments ?? {
    equipment: [],
    renovationBudget: 0,
    digital: { website: false, clickAndCollect: false, appMobile: false },
  };
  const finance = decisions.finance ?? {
    newLoanAmount: 0,
    newLoanDuration: 60,
    earlyRepayment: 0,
    dividendPayout: 0,
  };

  // 1. Process HR
  const hrResult = processHR(prevEmployees, hr);

  // 2. Calculate Revenue
  const revenueResult = calculateRevenue(
    { ...previousState, kpis: prevKPIs } as Parameters<typeof calculateRevenue>[0],
    pricing,
    marketing,
    hrResult.satisfactionImpact,
    hrResult.competenceAverage,
    { zonePopulation, nbCompetitors, competitionIntensity }
  );

  // Apply event modifiers to revenue
  let adjustedRevenue = revenueResult.totalRevenue;
  adjustedRevenue = applyEventModifiers(adjustedRevenue, events, "prescriptionDemand");

  // 3. Process Inventory
  const inventoryResult = processInventory(prevInventory, purchasing, {
    prescriptions: revenueResult.prescriptionRevenue,
    otc: revenueResult.otcRevenue,
    parapharmacie: revenueResult.paraRevenue,
    materielMedical: adjustedRevenue * 0.02,
  });

  // Apply event modifier to purchase costs
  let adjustedPurchaseCost = inventoryResult.purchaseCost;
  adjustedPurchaseCost = applyEventModifiers(adjustedPurchaseCost, events, "purchaseCost");

  // 4. Calculate Costs
  const costResult = calculateCosts(
    surface,
    adjustedRevenue,
    marketing,
    investments,
    prevBalance.liabilities.emprunts,
    prevBalance.assets.tresorerie
  );

  // 5. Build Income Statement
  const margeBrute = adjustedRevenue - adjustedPurchaseCost;
  const resultatExploitation =
    margeBrute -
    hrResult.totalSalaryCost -
    costResult.chargesExterieures -
    costResult.marketingCost -
    costResult.serviceCost -
    costResult.amortissements -
    costResult.impotsTaxes;

  const resultatAvantIS = resultatExploitation - costResult.chargesFinancieres;
  const is = calculateIS(resultatAvantIS);
  const resultatNet = resultatAvantIS - is;

  const incomeStatement: IncomeStatement = {
    chiffreAffaires: Math.round(adjustedRevenue),
    coutAchats: Math.round(adjustedPurchaseCost),
    margeBrute: Math.round(margeBrute),
    chargesPersonnel: Math.round(hrResult.totalSalaryCost),
    chargesExterieures: Math.round(
      costResult.chargesExterieures + costResult.marketingCost + costResult.serviceCost
    ),
    impotsTaxes: Math.round(costResult.impotsTaxes + is),
    dotationsAmortissements: Math.round(costResult.amortissements),
    chargesFinancieres: Math.round(costResult.chargesFinancieres),
    resultatExploitation: Math.round(resultatExploitation),
    resultatNet: Math.round(resultatNet),
  };

  // 6. Calculate investment total
  const investmentTotal =
    (investments.equipment?.reduce((sum, eq) => sum + eq.cost, 0) ?? 0) +
    (investments.renovationBudget ?? 0) +
    (investments.digital?.website ? 5000 : 0) +
    (investments.digital?.clickAndCollect ? 8000 : 0) +
    (investments.digital?.appMobile ? 15000 : 0);

  // 7. Process Finance
  const totalStockValue =
    inventoryResult.inventory.prescriptions.value +
    inventoryResult.inventory.otc.value +
    inventoryResult.inventory.parapharmacie.value +
    inventoryResult.inventory.materielMedical.value;

  const financeResult = processFinance(
    prevBalance,
    finance,
    adjustedRevenue,
    adjustedPurchaseCost,
    hrResult.totalSalaryCost,
    costResult.totalCosts - costResult.chargesFinancieres,
    investmentTotal,
    resultatNet,
    totalStockValue
  );

  // 8. Calculate KPIs
  const kpis = calculateKPIs(
    incomeStatement,
    hrResult.employees,
    inventoryResult.inventory,
    revenueResult.nbClients,
    revenueResult.panierMoyen,
    financeResult.balanceSheet.assets.tresorerie,
    hrResult.satisfactionImpact,
    inventoryResult.ruptureImpact,
    zonePopulation,
    nbCompetitors
  );

  // 9. Calculate Score
  const score = calculateScore(kpis);

  return {
    balanceSheet: financeResult.balanceSheet,
    incomeStatement,
    cashFlow: financeResult.cashFlow,
    employees: hrResult.employees,
    inventory: inventoryResult.inventory,
    kpis,
    score,
  };
}
