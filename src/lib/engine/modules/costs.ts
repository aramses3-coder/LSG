import type { MarketingDecisions, InvestmentDecisions } from "@/types";
import {
  FIXED_COSTS,
  IMPOT_SOCIETES_RATE,
  CFE_RATE,
  LOAN_INTEREST_RATE,
  OVERDRAFT_INTEREST_RATE,
  SERVICE_IMPACT,
} from "../constants";

export interface CostResult {
  chargesExterieures: number;
  marketingCost: number;
  serviceCost: number;
  amortissements: number;
  chargesFinancieres: number;
  impotsTaxes: number;
  renovationCost: number;
  totalCosts: number;
}

export function calculateCosts(
  surface: number,
  totalRevenue: number,
  marketing: MarketingDecisions,
  investments: InvestmentDecisions,
  existingLoans: number,
  tresorerie: number
): CostResult {
  // Fixed external charges
  const loyer = FIXED_COSTS.loyer_m2 * surface * 12;
  const otherFixed =
    (FIXED_COSTS.assurances +
      FIXED_COSTS.comptabilite +
      FIXED_COSTS.abonnements +
      FIXED_COSTS.entretien +
      FIXED_COSTS.divers) *
    12;
  const chargesExterieures = loyer + otherFixed;

  // Marketing cost
  const marketingCost = marketing.totalBudget ?? 0;

  // Loyalty program cost
  const loyaltyCost =
    marketing.loyaltyProgram?.active
      ? totalRevenue * (marketing.loyaltyProgram.cashbackPercent ?? 0.01)
      : 0;

  // Services cost
  let serviceCost = 0;
  const services = marketing.services ?? {};
  for (const [service, active] of Object.entries(services)) {
    if (active && SERVICE_IMPACT[service]) {
      serviceCost += SERVICE_IMPACT[service].costPerMonth * 12;
    }
  }

  // Equipment depreciation
  let newEquipmentCost = 0;
  let amortissements = 0;
  if (investments.equipment?.length) {
    for (const eq of investments.equipment) {
      newEquipmentCost += eq.cost;
      amortissements += eq.cost / 7; // 7 years depreciation
    }
  }

  // Renovation
  const renovationCost = investments.renovationBudget ?? 0;
  amortissements += renovationCost / 10; // 10 years depreciation

  // Digital investments
  if (investments.digital?.website) newEquipmentCost += 5000;
  if (investments.digital?.clickAndCollect) newEquipmentCost += 8000;
  if (investments.digital?.appMobile) newEquipmentCost += 15000;
  amortissements += newEquipmentCost * 0.2; // 5 years

  // Financial charges
  const loanInterest = existingLoans * LOAN_INTEREST_RATE;
  const overdraftInterest =
    tresorerie < 0 ? Math.abs(tresorerie) * OVERDRAFT_INTEREST_RATE : 0;
  const chargesFinancieres = loanInterest + overdraftInterest;

  // Taxes
  const cfe = totalRevenue * CFE_RATE;

  return {
    chargesExterieures: Math.round(chargesExterieures),
    marketingCost: Math.round(marketingCost + loyaltyCost),
    serviceCost: Math.round(serviceCost),
    amortissements: Math.round(amortissements),
    chargesFinancieres: Math.round(chargesFinancieres),
    impotsTaxes: Math.round(cfe),
    renovationCost: Math.round(renovationCost),
    totalCosts: Math.round(
      chargesExterieures +
        marketingCost +
        loyaltyCost +
        serviceCost +
        amortissements +
        chargesFinancieres +
        cfe
    ),
  };
}

export function calculateIS(resultatAvantIS: number): number {
  if (resultatAvantIS <= 0) return 0;
  return Math.round(resultatAvantIS * IMPOT_SOCIETES_RATE);
}
