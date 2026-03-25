import type { PricingDecisions, MarketingDecisions } from "@/types";
import type { PharmacyStateData } from "../types";
import { MARKETING_IMPACT, SERVICE_IMPACT } from "../constants";

export interface RevenueResult {
  prescriptionRevenue: number;
  otcRevenue: number;
  paraRevenue: number;
  servicesRevenue: number;
  totalRevenue: number;
  totalCOGS: number;
  nbClients: number;
  panierMoyen: number;
}

export function calculateRevenue(
  previousState: PharmacyStateData,
  pricing: PricingDecisions,
  marketing: MarketingDecisions,
  hrSatisfactionImpact: number,
  hrCompetence: number,
  config: { zonePopulation: number; nbCompetitors: number; competitionIntensity: number }
): RevenueResult {
  const prevCA = previousState.kpis.chiffreAffaires || 1800000;

  // Base client count from zone + competitors
  const marketSize = config.zonePopulation * 0.8; // 80% go to pharmacies
  const baseShare = 1 / (config.nbCompetitors + 1);
  let baseClients = marketSize * baseShare;

  // Marketing impact on client acquisition
  const marketingBudget = marketing.totalBudget ?? 0;
  const marketingEfficiency = calculateMarketingEfficiency(marketing);
  const marketingMultiplier =
    1 +
    MARKETING_IMPACT.maxClientIncrease *
      Math.min(1, (marketingBudget / MARKETING_IMPACT.budgetOptimal) * marketingEfficiency);

  // Services impact
  let serviceClientBonus = 0;
  let serviceRevenue = 0;
  const services = marketing.services ?? {};
  for (const [service, active] of Object.entries(services)) {
    if (active && SERVICE_IMPACT[service]) {
      serviceClientBonus += SERVICE_IMPACT[service].clientIncrease;
      serviceRevenue += SERVICE_IMPACT[service].revenuePerClient * baseClients * 12;
    }
  }

  // Satisfaction impact on client retention
  const satisfactionMultiplier = 0.8 + hrSatisfactionImpact * 0.4; // 0.8 to 1.2

  // Total clients
  const nbClients = Math.round(
    baseClients * marketingMultiplier * (1 + serviceClientBonus) * satisfactionMultiplier
  );

  // Prescriptions (regulated, volume-driven)
  const prescriptionBase = prevCA * 0.7;
  const prescriptionGrowth = 1 + (Math.random() * 0.04 - 0.01); // -1% to +3%
  const prescriptionRevenue = Math.round(
    prescriptionBase * prescriptionGrowth * (nbClients / (baseClients || 1))
  );

  // OTC (margin-sensitive)
  const otcBase = prevCA * 0.15;
  const otcMargin = pricing.otcMargin ?? 0.3;
  // Higher margin = less volume but more per unit
  const otcPriceElasticity = 1 - (otcMargin - 0.3) * 2; // 30% margin = neutral
  const otcRevenue = Math.round(
    otcBase * otcPriceElasticity * (nbClients / (baseClients || 1))
  );

  // Parapharma (marketing + margin sensitive)
  const paraBase = prevCA * 0.1;
  const paraMargin = pricing.paraMargin ?? 0.35;
  const paraPriceElasticity = 1 - (paraMargin - 0.35) * 1.5;
  const paraMarketingBonus = 1 + marketingBudget * marketingEfficiency / 100000;
  const paraRevenue = Math.round(
    paraBase * paraPriceElasticity * paraMarketingBonus * (nbClients / (baseClients || 1))
  );

  // Promotions impact (boosts volume but reduces margin)
  let promoBonus = 0;
  if (pricing.promotions?.length) {
    for (const promo of pricing.promotions) {
      promoBonus += (promo.budgetAllocated ?? 0) * 1.5; // 1.5x return on promo spend
    }
  }

  const totalRevenue =
    prescriptionRevenue + otcRevenue + paraRevenue + serviceRevenue + promoBonus;

  // COGS calculation
  const prescriptionCOGS = prescriptionRevenue * 0.78; // Regulated margin ~22%
  const otcCOGS = otcRevenue * (1 - Math.min(0.5, otcMargin));
  const paraCOGS = paraRevenue * (1 - Math.min(0.6, paraMargin));
  const serviceCOGS = serviceRevenue * 0.3;

  const totalCOGS = Math.round(prescriptionCOGS + otcCOGS + paraCOGS + serviceCOGS);

  const panierMoyen = nbClients > 0 ? totalRevenue / nbClients : 0;

  return {
    prescriptionRevenue: Math.round(prescriptionRevenue),
    otcRevenue: Math.round(otcRevenue),
    paraRevenue: Math.round(paraRevenue),
    servicesRevenue: Math.round(serviceRevenue),
    totalRevenue: Math.round(totalRevenue),
    totalCOGS,
    nbClients,
    panierMoyen: Math.round(panierMoyen * 100) / 100,
  };
}

function calculateMarketingEfficiency(marketing: MarketingDecisions): number {
  const allocation = marketing.allocation ?? {
    vitrine: 0.25,
    digital: 0.25,
    presseLocale: 0.25,
    evenements: 0.25,
  };

  // Diversified marketing is more efficient
  const values = Object.values(allocation).filter((v) => v > 0);
  const diversityBonus = values.length >= 3 ? 1.1 : values.length >= 2 ? 1.0 : 0.8;

  // Digital has higher ROI
  const digitalBonus = 1 + (allocation.digital ?? 0) * 0.3;

  // Loyalty program bonus
  const loyaltyBonus = marketing.loyaltyProgram?.active ? 1.1 : 1.0;

  return diversityBonus * digitalBonus * loyaltyBonus;
}
