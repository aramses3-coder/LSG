import type {
  BalanceSheet,
  IncomeStatement,
  CashFlowStatement,
  InventoryState,
  GameKPIs,
  Employee,
  PlayerDecisions,
  GameEvent,
  GameConfig,
} from "@/types";

export interface PharmacyStateData {
  balanceSheet: BalanceSheet;
  incomeStatement: IncomeStatement;
  cashFlow: CashFlowStatement;
  employees: Employee[];
  inventory: InventoryState;
  kpis: GameKPIs;
}

export interface SimulationResult extends PharmacyStateData {
  score: number;
}

export interface SimulationContext {
  previousState: PharmacyStateData;
  decisions: PlayerDecisions;
  events: GameEvent[];
  config: GameConfig;
}

// Coefficients pour le scoring
export interface ScoringWeights {
  resultatNet: number;
  tresorerie: number;
  satisfactionClient: number;
  partDeMarche: number;
  productivite: number;
  rotationStocks: number;
}
