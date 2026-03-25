// ===== Types partagés pour LSG =====

// Rôles des employés en pharmacie
export type EmployeeRole =
  | "titulaire"
  | "adjoint"
  | "preparateur"
  | "rayonniste"
  | "apprenti";

export interface Employee {
  id: string;
  role: EmployeeRole;
  name: string;
  salary: number; // Salaire mensuel brut
  competence: number; // 0-100
  experience: number; // Années
  training: number; // Heures de formation cumulées
}

// Catégories de produits
export type ProductCategory =
  | "prescriptions"
  | "otc"
  | "parapharmacie"
  | "materielMedical";

// Fournisseurs
export type SupplierType = "grossiste" | "laboratoire" | "centrale";

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  discountRate: number; // Taux de remise
  deliveryDays: number;
  minOrderAmount: number;
  reliability: number; // 0-100
}

// État du bilan
export interface BalanceSheet {
  assets: {
    stock: number;
    tresorerie: number;
    immobilisations: number;
    creancesClients: number;
    autresActifs: number;
  };
  liabilities: {
    capitalPropre: number;
    reserves: number;
    resultatExercice: number;
    emprunts: number;
    dettesFournisseurs: number;
    autresPassifs: number;
  };
}

// Compte de résultat
export interface IncomeStatement {
  chiffreAffaires: number;
  coutAchats: number;
  margeBrute: number;
  chargesPersonnel: number;
  chargesExterieures: number;
  impotsTaxes: number;
  dotationsAmortissements: number;
  chargesFinancieres: number;
  resultatExploitation: number;
  resultatNet: number;
}

// Trésorerie
export interface CashFlowStatement {
  tresorerieDebut: number;
  encaissementsVentes: number;
  decaissementsAchats: number;
  decaissementsSalaires: number;
  decaissementsCharges: number;
  investissements: number;
  remboursementsEmprunts: number;
  nouveauxEmprunts: number;
  tresoretieFin: number;
}

// Stock par catégorie
export interface InventoryState {
  prescriptions: { value: number; rotation: number; ruptureRate: number };
  otc: { value: number; rotation: number; ruptureRate: number };
  parapharmacie: { value: number; rotation: number; ruptureRate: number };
  materielMedical: { value: number; rotation: number; ruptureRate: number };
}

// KPI
export interface GameKPIs {
  chiffreAffaires: number;
  margeBrute: number;
  tauxMarge: number;
  ebe: number; // Excédent brut d'exploitation
  resultatNet: number;
  tresorerie: number;
  rotationStocks: number;
  panierMoyen: number;
  satisfactionClient: number; // 0-100
  partDeMarche: number; // 0-1
  productivite: number; // CA / employé
  nbClients: number;
}

// ===== Décisions du joueur =====

export interface HRDecisions {
  hires: Array<{
    role: EmployeeRole;
    salary: number;
  }>;
  fires: string[]; // IDs des employés à licencier
  trainingBudget: number; // Budget formation annuel
  salaryIncrease: number; // % d'augmentation globale
  bonusPolicy: number; // % de prime sur objectifs
}

export interface PurchasingDecisions {
  suppliers: Array<{
    supplierId: string;
    category: ProductCategory;
    volumeShare: number; // % du volume confié à ce fournisseur
  }>;
  safetyStockDays: Record<ProductCategory, number>;
  orderFrequency: "quotidien" | "bihebdomadaire" | "hebdomadaire";
  negotiationEffort: number; // 0-100, impact sur remises mais coûte du temps
}

export interface PricingDecisions {
  otcMargin: number; // Marge souhaitée sur OTC (0-1)
  paraMargin: number; // Marge sur parapharmacie (0-1)
  promotions: Array<{
    category: ProductCategory;
    discountPercent: number;
    budgetAllocated: number;
  }>;
}

export interface MarketingDecisions {
  totalBudget: number;
  allocation: {
    vitrine: number; // % du budget
    digital: number;
    presseLocale: number;
    evenements: number;
  };
  loyaltyProgram: {
    active: boolean;
    cashbackPercent: number;
  };
  services: {
    livraison: boolean;
    teleconsultation: boolean;
    vaccination: boolean;
    trod: boolean; // Tests rapides
    pilulier: boolean; // Préparation de piluliers
  };
}

export interface InvestmentDecisions {
  equipment: Array<{
    type: string;
    cost: number;
  }>;
  renovationBudget: number;
  digital: {
    website: boolean;
    clickAndCollect: boolean;
    appMobile: boolean;
  };
}

export interface FinanceDecisions {
  newLoanAmount: number;
  newLoanDuration: number; // Mois
  earlyRepayment: number;
  dividendPayout: number; // % du résultat à distribuer
}

export interface PlayerDecisions {
  hr: HRDecisions;
  purchasing: PurchasingDecisions;
  pricing: PricingDecisions;
  marketing: MarketingDecisions;
  investments: InvestmentDecisions;
  finance: FinanceDecisions;
}

// ===== Événements aléatoires =====

export type GameEventType =
  | "epidemic" // Pic de demande
  | "competitor_opens" // Nouveau concurrent
  | "competitor_closes" // Concurrent ferme
  | "regulation_change" // Changement réglementaire
  | "supplier_issue" // Problème fournisseur
  | "seasonal_peak" // Pic saisonnier
  | "price_increase" // Hausse prix fournisseurs
  | "new_service_allowed"; // Nouvelle mission autorisée

export interface GameEvent {
  type: GameEventType;
  title: string;
  description: string;
  impact: Record<string, number>; // Modificateurs à appliquer
}

// ===== Configuration de la partie =====

export interface GameConfig {
  pharmacy: {
    type: "centre-ville" | "quartier" | "rural" | "centre-commercial";
    surface: number;
    zonePopulation: number;
  };
  economicContext: {
    inflationRate: number;
    unemploymentRate: number;
    growthRate: number;
  };
  competition: {
    nbCompetitors: number;
    competitionIntensity: number; // 0-100
  };
}
