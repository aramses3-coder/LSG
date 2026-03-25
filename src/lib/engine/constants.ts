// Constantes economiques pour la simulation pharmacie francaise

// Marges reglementees sur medicaments rembourses
export const PRESCRIPTION_MARGIN_RULES = {
  // Marge degressive lissee (MDL)
  coefficients: [
    { maxPrice: 1.91, margin: 0.263, flatFee: 0.48 },
    { maxPrice: 22.9, margin: 0.263, flatFee: 0.48 },
    { maxPrice: 150, margin: 0.2156, flatFee: 0.48 },
    { maxPrice: 1500, margin: 0.0651, flatFee: 0.48 },
    { maxPrice: Infinity, margin: 0, flatFee: 0.48 },
  ],
  honoraireDispensation: 1.02, // par boite
};

// Charges sociales employeur
export const CHARGES_SOCIALES_RATE = 0.45;

// Taux d'imposition
export const IMPOT_SOCIETES_RATE = 0.25;
export const CFE_RATE = 0.005; // Sur le CA

// Couts fixes mensuels moyens
export const FIXED_COSTS = {
  loyer_m2: 25, // EUR/m2/mois
  assurances: 500, // /mois
  comptabilite: 400,
  abonnements: 300, // logiciel, telecom
  entretien: 200,
  divers: 300,
};

// Salaires de reference (brut mensuel)
export const SALARY_RANGES: Record<string, { min: number; max: number }> = {
  titulaire: { min: 5500, max: 10000 },
  adjoint: { min: 3500, max: 6000 },
  preparateur: { min: 1900, max: 3000 },
  rayonniste: { min: 1700, max: 2200 },
  apprenti: { min: 900, max: 1400 },
};

// Impact du marketing
export const MARKETING_IMPACT = {
  maxClientIncrease: 0.15, // +15% clients max avec marketing optimal
  budgetOptimal: 30000, // Budget annuel pour impact maximum
  diminishingReturnsThreshold: 0.6, // Au-dela de 60% du budget optimal, rendements decroissants
};

// Impact des services
export const SERVICE_IMPACT: Record<string, { clientIncrease: number; revenuePerClient: number; costPerMonth: number }> = {
  livraison: { clientIncrease: 0.05, revenuePerClient: 2, costPerMonth: 500 },
  teleconsultation: { clientIncrease: 0.03, revenuePerClient: 5, costPerMonth: 300 },
  vaccination: { clientIncrease: 0.04, revenuePerClient: 7.5, costPerMonth: 200 },
  trod: { clientIncrease: 0.02, revenuePerClient: 4, costPerMonth: 150 },
  pilulier: { clientIncrease: 0.03, revenuePerClient: 3, costPerMonth: 100 },
};

// Equipements disponibles
export const AVAILABLE_EQUIPMENT: Record<string, { cost: number; productivityGain: number; depreciationYears: number }> = {
  automate: { cost: 80000, productivityGain: 0.1, depreciationYears: 7 },
  robot_dispensation: { cost: 120000, productivityGain: 0.15, depreciationYears: 7 },
  ecran_conseil: { cost: 5000, productivityGain: 0.02, depreciationYears: 5 },
  borne_accueil: { cost: 3000, productivityGain: 0.03, depreciationYears: 5 },
};

// Taux emprunt bancaire
export const LOAN_INTEREST_RATE = 0.035; // 3.5%
export const OVERDRAFT_INTEREST_RATE = 0.12; // 12% decouvert

// Fournisseurs types
export const DEFAULT_SUPPLIERS = [
  {
    id: "sup-1",
    name: "OCP",
    type: "grossiste" as const,
    discountRate: 0.025,
    deliveryDays: 1,
    minOrderAmount: 0,
    reliability: 95,
  },
  {
    id: "sup-2",
    name: "Alliance Healthcare",
    type: "grossiste" as const,
    discountRate: 0.03,
    deliveryDays: 1,
    minOrderAmount: 200,
    reliability: 90,
  },
  {
    id: "sup-3",
    name: "Laboratoire Direct",
    type: "laboratoire" as const,
    discountRate: 0.08,
    deliveryDays: 5,
    minOrderAmount: 1000,
    reliability: 85,
  },
  {
    id: "sup-4",
    name: "Centrale d'achat",
    type: "centrale" as const,
    discountRate: 0.06,
    deliveryDays: 3,
    minOrderAmount: 500,
    reliability: 88,
  },
];
