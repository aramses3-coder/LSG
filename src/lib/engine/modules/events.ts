import type { GameEvent, GameEventType } from "@/types";

const EVENT_POOL: Array<{
  type: GameEventType;
  title: string;
  description: string;
  impact: Record<string, number>;
  probability: number;
}> = [
  {
    type: "epidemic",
    title: "Epidemie saisonniere",
    description:
      "Une epidemie de grippe touche la region. La demande en medicaments et vaccins augmente fortement.",
    impact: { prescriptionDemand: 1.15, otcDemand: 1.2, serviceDemand: 1.3 },
    probability: 0.3,
  },
  {
    type: "competitor_opens",
    title: "Nouveau concurrent",
    description:
      "Une nouvelle pharmacie ouvre dans votre zone de chalandise.",
    impact: { clientBase: 0.9, competitionIntensity: 1.1 },
    probability: 0.15,
  },
  {
    type: "competitor_closes",
    title: "Fermeture d'un concurrent",
    description:
      "Une pharmacie voisine ferme ses portes. Vous recuperez une partie de sa clientele.",
    impact: { clientBase: 1.15, competitionIntensity: 0.9 },
    probability: 0.1,
  },
  {
    type: "regulation_change",
    title: "Changement reglementaire",
    description:
      "De nouvelles missions sont autorisees pour les pharmaciens (tests, vaccinations, renouvellement d'ordonnances).",
    impact: { serviceDemand: 1.2, serviceRevenue: 1.15 },
    probability: 0.2,
  },
  {
    type: "supplier_issue",
    title: "Probleme d'approvisionnement",
    description:
      "Des tensions sur la chaine d'approvisionnement entrainent des retards et des ruptures de stock chez certains fournisseurs.",
    impact: { supplierReliability: 0.85, ruptureRate: 1.3 },
    probability: 0.2,
  },
  {
    type: "seasonal_peak",
    title: "Pic de saisonnalite",
    description:
      "La saison pollinique est particulierement forte cette annee, augmentant la demande en antihistaminiques et produits OTC.",
    impact: { otcDemand: 1.25, paraDemand: 1.1 },
    probability: 0.25,
  },
  {
    type: "price_increase",
    title: "Hausse des prix fournisseurs",
    description:
      "L'inflation impacte les prix d'achat chez les fournisseurs. Les couts d'approvisionnement augmentent.",
    impact: { purchaseCost: 1.05, inflation: 1.03 },
    probability: 0.25,
  },
  {
    type: "new_service_allowed",
    title: "Nouvelle mission de sante",
    description:
      "L'ARS autorise une nouvelle mission de sante publique. Les pharmacies equipees peuvent proposer de nouveaux services.",
    impact: { serviceDemand: 1.3, serviceRevenue: 1.2 },
    probability: 0.15,
  },
];

export function generateRoundEvents(roundNumber: number): GameEvent[] {
  const events: GameEvent[] = [];

  for (const event of EVENT_POOL) {
    // Increase probability slightly with round number
    const adjustedProbability = event.probability * (1 + roundNumber * 0.05);
    if (Math.random() < adjustedProbability) {
      events.push({
        type: event.type,
        title: event.title,
        description: event.description,
        impact: { ...event.impact },
      });
    }
  }

  // Limit to max 3 events per round
  return events.slice(0, 3);
}

export function applyEventModifiers(
  baseValue: number,
  events: GameEvent[],
  modifier: string
): number {
  let value = baseValue;
  for (const event of events) {
    if (event.impact[modifier]) {
      value *= event.impact[modifier];
    }
  }
  return value;
}
