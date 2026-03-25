import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ===== Configuration initiale réaliste =====
function getDefaultConfig() {
  return {
    pharmacy: {
      type: "centre-ville",
      surface: 120,
      zonePopulation: 15000,
    },
    balanceSheet: {
      assets: {
        stock: 180000,
        tresorerie: 50000,
        immobilisations: 200000,
        creancesClients: 30000,
        autresActifs: 5000,
      },
      liabilities: {
        capitalPropre: 250000,
        reserves: 20000,
        resultatExercice: 0,
        emprunts: 150000,
        dettesFournisseurs: 30000,
        autresPassifs: 5000,
      },
    },
    employees: [
      {
        id: "emp-1",
        role: "titulaire",
        name: "Dr. Martin",
        salary: 7000,
        competence: 80,
        experience: 15,
        training: 0,
      },
      {
        id: "emp-2",
        role: "adjoint",
        name: "Sophie Durand",
        salary: 4500,
        competence: 70,
        experience: 8,
        training: 0,
      },
      {
        id: "emp-3",
        role: "preparateur",
        name: "Pierre Leroy",
        salary: 2200,
        competence: 60,
        experience: 5,
        training: 0,
      },
      {
        id: "emp-4",
        role: "preparateur",
        name: "Marie Petit",
        salary: 2200,
        competence: 55,
        experience: 3,
        training: 0,
      },
      {
        id: "emp-5",
        role: "rayonniste",
        name: "Lucas Bernard",
        salary: 1800,
        competence: 50,
        experience: 2,
        training: 0,
      },
    ],
    revenue: {
      previousYearCA: 1800000,
      prescriptionShare: 0.7,
      otcShare: 0.15,
      paraShare: 0.1,
      servicesShare: 0.05,
    },
    inventory: {
      prescriptions: { value: 100000, rotation: 12, ruptureRate: 0.02 },
      otc: { value: 40000, rotation: 8, ruptureRate: 0.03 },
      parapharmacie: { value: 30000, rotation: 6, ruptureRate: 0.05 },
      materielMedical: { value: 10000, rotation: 4, ruptureRate: 0.04 },
    },
    economicContext: {
      inflationRate: 0.02,
      unemploymentRate: 0.07,
      growthRate: 0.01,
    },
    competition: {
      nbCompetitors: 3,
      competitionIntensity: 50,
    },
  };
}

// ===== Données simulées par round pour chaque joueur =====
// Chaque profil de joueur a des résultats progressifs légèrement différents

interface RoundStateData {
  balanceSheet: object;
  incomeStatement: object;
  cashFlow: object;
  employees: object[];
  inventory: object;
  kpis: object;
  score: number;
}

function generatePlayerRoundStates(
  playerProfile: "aggressive" | "conservative" | "balanced" | "specialist",
  config: ReturnType<typeof getDefaultConfig>
): RoundStateData[] {
  const baseCA = config.revenue.previousYearCA;
  const states: RoundStateData[] = [];

  // Multipliers per profile
  const profiles = {
    aggressive: {
      caGrowth: [1.05, 1.12, 1.18],
      marginRate: [0.28, 0.27, 0.29],
      satisfaction: [65, 68, 72],
      marketing: [15000, 20000, 25000],
      staffChange: [0, 1, 0], // hire in round 2
      loanChange: [0, 50000, 0],
    },
    conservative: {
      caGrowth: [0.98, 1.01, 1.03],
      marginRate: [0.32, 0.33, 0.34],
      satisfaction: [72, 74, 76],
      marketing: [3000, 5000, 5000],
      staffChange: [0, 0, 0],
      loanChange: [0, 0, -20000],
    },
    balanced: {
      caGrowth: [1.02, 1.06, 1.10],
      marginRate: [0.30, 0.31, 0.31],
      satisfaction: [70, 73, 75],
      marketing: [8000, 10000, 12000],
      staffChange: [0, 1, 0],
      loanChange: [0, 30000, 0],
    },
    specialist: {
      caGrowth: [1.00, 1.08, 1.15],
      marginRate: [0.29, 0.30, 0.32],
      satisfaction: [68, 75, 82],
      marketing: [5000, 12000, 18000],
      staffChange: [0, 0, 1],
      loanChange: [0, 20000, 0],
    },
  };

  const p = profiles[playerProfile];
  let currentCash = config.balanceSheet.assets.tresorerie;
  let currentLoans = config.balanceSheet.liabilities.emprunts;
  let currentImmo = config.balanceSheet.assets.immobilisations;
  let nbEmployees = config.employees.length;
  const employees = [...config.employees];

  for (let round = 0; round < 3; round++) {
    const ca = Math.round(baseCA * p.caGrowth[round]);
    const margeBrute = Math.round(ca * p.marginRate[round]);
    const coutAchats = ca - margeBrute;

    const salaryBase = employees.reduce((s, e) => s + (e as { salary: number }).salary, 0);
    const chargesPersonnel = Math.round(salaryBase * 12 * 1.45); // avec charges sociales
    const chargesExterieures = Math.round(ca * 0.06 + p.marketing[round]);
    const amortissements = Math.round(currentImmo * 0.1);
    const chargesFinancieres = Math.round(currentLoans * 0.035);
    const impotsTaxes = Math.round(ca * 0.01);

    const resultatExploitation =
      margeBrute - chargesPersonnel - chargesExterieures - amortissements - impotsTaxes;
    const resultatAvantIS = resultatExploitation - chargesFinancieres;
    const is = resultatAvantIS > 0 ? Math.round(resultatAvantIS * 0.25) : 0;
    const resultatNet = resultatAvantIS - is;

    // Update cash
    currentCash += resultatNet;
    if (p.loanChange[round] > 0) {
      currentCash += p.loanChange[round];
      currentLoans += p.loanChange[round];
    } else if (p.loanChange[round] < 0) {
      currentCash += p.loanChange[round]; // negative = repayment
      currentLoans += p.loanChange[round];
    }

    // Hire if needed
    if (p.staffChange[round] > 0) {
      employees.push({
        id: `emp-new-${round}`,
        role: "preparateur",
        name: `Recrue R${round + 1}`,
        salary: 2300,
        competence: 55,
        experience: 1,
        training: 0,
      });
      nbEmployees++;
    }

    const stockValue = Math.round(
      config.balanceSheet.assets.stock * (1 + round * 0.03)
    );

    const incomeStatement = {
      chiffreAffaires: ca,
      coutAchats,
      margeBrute,
      chargesPersonnel,
      chargesExterieures,
      impotsTaxes: impotsTaxes + is,
      dotationsAmortissements: amortissements,
      chargesFinancieres,
      resultatExploitation,
      resultatNet,
    };

    const balanceSheet = {
      assets: {
        stock: stockValue,
        tresorerie: Math.round(currentCash),
        immobilisations: Math.round(currentImmo - amortissements),
        creancesClients: Math.round(ca * 0.02),
        autresActifs: 5000,
      },
      liabilities: {
        capitalPropre: config.balanceSheet.liabilities.capitalPropre,
        reserves:
          config.balanceSheet.liabilities.reserves +
          (round > 0 ? Math.round(resultatNet * 0.5) : 0),
        resultatExercice: resultatNet,
        emprunts: Math.round(currentLoans),
        dettesFournisseurs: Math.round(coutAchats * 0.05),
        autresPassifs: 5000,
      },
    };

    currentImmo = balanceSheet.assets.immobilisations;

    const cashFlow = {
      tresorerieDebut:
        round === 0
          ? config.balanceSheet.assets.tresorerie
          : states[round - 1]
          ? (
              (states[round - 1].balanceSheet as { assets: { tresorerie: number } })
                .assets.tresorerie
            )
          : currentCash - resultatNet,
      encaissementsVentes: Math.round(ca * 0.98),
      decaissementsAchats: Math.round(coutAchats * 0.95),
      decaissementsSalaires: chargesPersonnel,
      decaissementsCharges: chargesExterieures + impotsTaxes,
      investissements: round === 1 ? 15000 : 0,
      remboursementsEmprunts: Math.round(currentLoans * 0.08),
      nouveauxEmprunts: Math.max(0, p.loanChange[round]),
      tresoretieFin: Math.round(currentCash),
    };

    const partDeMarche = Math.min(
      0.5,
      0.25 + round * 0.02 + (playerProfile === "aggressive" ? 0.03 : 0)
    );

    const kpis = {
      chiffreAffaires: ca,
      margeBrute,
      tauxMarge: p.marginRate[round],
      ebe: Math.round(margeBrute - chargesPersonnel - chargesExterieures),
      resultatNet,
      tresorerie: Math.round(currentCash),
      rotationStocks: Math.round((ca / stockValue) * 10) / 10,
      panierMoyen: Math.round((ca / (ca / 35)) * 100) / 100,
      satisfactionClient: p.satisfaction[round],
      partDeMarche,
      productivite: Math.round(ca / nbEmployees),
      nbClients: Math.round(ca / 35),
    };

    // Score calculation (mirroring scoring.ts weights)
    const normalizeValue = (value: number, min: number, max: number) => {
      if (max === min) return 50;
      return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    };

    const scores = {
      resultatNet: normalizeValue(kpis.resultatNet, -50000, 200000),
      tresorerie: normalizeValue(kpis.tresorerie, -100000, 300000),
      satisfactionClient: kpis.satisfactionClient,
      partDeMarche: normalizeValue(kpis.partDeMarche, 0, 0.5),
      productivite: normalizeValue(kpis.productivite, 200000, 500000),
      tauxMarge: normalizeValue(kpis.tauxMarge, 0.15, 0.35),
      rotationStocks: normalizeValue(kpis.rotationStocks, 2, 15),
    };

    const weights = {
      resultatNet: 0.25,
      tresorerie: 0.15,
      satisfactionClient: 0.2,
      partDeMarche: 0.15,
      productivite: 0.1,
      tauxMarge: 0.1,
      rotationStocks: 0.05,
    };

    let totalScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      totalScore += (scores[key as keyof typeof scores] ?? 0) * weight;
    }
    const score = Math.round(Math.max(0, Math.min(100, totalScore)) * 10) / 10;

    const inventory = {
      prescriptions: {
        value: Math.round(stockValue * 0.55),
        rotation: Math.round((ca * 0.7) / (stockValue * 0.55) * 10) / 10,
        ruptureRate: 0.02 - round * 0.003,
      },
      otc: {
        value: Math.round(stockValue * 0.22),
        rotation: Math.round((ca * 0.15) / (stockValue * 0.22) * 10) / 10,
        ruptureRate: 0.03 - round * 0.005,
      },
      parapharmacie: {
        value: Math.round(stockValue * 0.17),
        rotation: Math.round((ca * 0.1) / (stockValue * 0.17) * 10) / 10,
        ruptureRate: 0.04 - round * 0.005,
      },
      materielMedical: {
        value: Math.round(stockValue * 0.06),
        rotation: Math.round((ca * 0.05) / (stockValue * 0.06) * 10) / 10,
        ruptureRate: 0.04,
      },
    };

    states.push({
      balanceSheet,
      incomeStatement,
      cashFlow,
      employees: employees.map((e) => ({ ...e })),
      inventory,
      kpis,
      score,
    });
  }

  return states;
}

// ===== Main seed =====

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data
  await prisma.pharmacyState.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.round.deleteMany();
  await prisma.gamePlayer.deleteMany();
  await prisma.game.deleteMany();
  await prisma.initialConfig.deleteMany();
  await prisma.user.deleteMany();

  console.log("  ✓ Cleaned existing data");

  // ===== 1. Create users =====
  const passwordHash = await hash("password123", 12);

  const trainer = await prisma.user.create({
    data: {
      name: "Dr. Formateur",
      email: "formateur@lsg.fr",
      passwordHash,
      role: "TRAINER",
    },
  });

  const players = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alice Moreau",
        email: "alice@lsg.fr",
        passwordHash,
        role: "PLAYER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Bob Dupont",
        email: "bob@lsg.fr",
        passwordHash,
        role: "PLAYER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Claire Fontaine",
        email: "claire@lsg.fr",
        passwordHash,
        role: "PLAYER",
      },
    }),
    prisma.user.create({
      data: {
        name: "David Mercier",
        email: "david@lsg.fr",
        passwordHash,
        role: "PLAYER",
      },
    }),
  ]);

  console.log(
    `  ✓ Created 1 trainer + ${players.length} players (password: password123)`
  );

  // ===== 2. Create initial config =====
  const config = getDefaultConfig();
  const initialConfig = await prisma.initialConfig.create({
    data: {
      name: "Pharmacie Standard",
      data: config,
    },
  });

  console.log("  ✓ Created initial config: Pharmacie Standard");

  // ===== 3. Create a completed game (3 rounds done) =====
  const completedGame = await prisma.game.create({
    data: {
      name: "Session Formation Mars 2026",
      code: "LSG001",
      status: "FINISHED",
      currentRound: 3,
      maxRounds: 5,
      trainerId: trainer.id,
      initialConfigId: initialConfig.id,
    },
  });

  // Add players to the game
  const playerProfiles: Array<{
    user: (typeof players)[0];
    pharmacyName: string;
    profile: "aggressive" | "conservative" | "balanced" | "specialist";
  }> = [
    { user: players[0], pharmacyName: "Pharmacie du Centre", profile: "balanced" },
    { user: players[1], pharmacyName: "Pharmacie Soleil", profile: "aggressive" },
    { user: players[2], pharmacyName: "Pharmacie Harmonie", profile: "conservative" },
    { user: players[3], pharmacyName: "Pharmacie Innovation", profile: "specialist" },
  ];

  const gamePlayers = await Promise.all(
    playerProfiles.map((pp) =>
      prisma.gamePlayer.create({
        data: {
          userId: pp.user.id,
          gameId: completedGame.id,
          pharmacyName: pp.pharmacyName,
        },
      })
    )
  );

  console.log(`  ✓ Created completed game with ${gamePlayers.length} players`);

  // Create 3 completed rounds
  const rounds = await Promise.all(
    [1, 2, 3].map((num) =>
      prisma.round.create({
        data: {
          gameId: completedGame.id,
          number: num,
          status: "COMPLETED",
          events:
            num === 2
              ? [
                  {
                    type: "epidemic",
                    title: "Epidemie de grippe",
                    description:
                      "Une epidemie de grippe augmente la demande de medicaments.",
                    impact: { prescriptionDemand: 0.15 },
                  },
                ]
              : num === 3
              ? [
                  {
                    type: "competitor_opens",
                    title: "Nouveau concurrent",
                    description:
                      "Une nouvelle pharmacie ouvre dans la zone de chalandise.",
                    impact: { prescriptionDemand: -0.05 },
                  },
                ]
              : [],
        },
      })
    )
  );

  console.log("  ✓ Created 3 completed rounds with events");

  // Create initial states (round 0) and round states for each player
  for (let pi = 0; pi < gamePlayers.length; pi++) {
    const gp = gamePlayers[pi];
    const pp = playerProfiles[pi];
    const roundStates = generatePlayerRoundStates(pp.profile, config);

    // Round 0 = initial state
    await prisma.pharmacyState.create({
      data: {
        gamePlayerId: gp.id,
        roundNumber: 0,
        balanceSheet: config.balanceSheet,
        incomeStatement: {
          chiffreAffaires: 0,
          coutAchats: 0,
          margeBrute: 0,
          chargesPersonnel: 0,
          chargesExterieures: 0,
          impotsTaxes: 0,
          dotationsAmortissements: 0,
          chargesFinancieres: 0,
          resultatExploitation: 0,
          resultatNet: 0,
        },
        cashFlow: {
          tresorerieDebut: config.balanceSheet.assets.tresorerie,
          encaissementsVentes: 0,
          decaissementsAchats: 0,
          decaissementsSalaires: 0,
          decaissementsCharges: 0,
          investissements: 0,
          remboursementsEmprunts: 0,
          nouveauxEmprunts: 0,
          tresoretieFin: config.balanceSheet.assets.tresorerie,
        },
        employees: config.employees,
        inventory: config.inventory,
        kpis: {
          chiffreAffaires: config.revenue.previousYearCA,
          margeBrute: 0,
          tauxMarge: 0,
          ebe: 0,
          resultatNet: 0,
          tresorerie: config.balanceSheet.assets.tresorerie,
          rotationStocks: 8,
          panierMoyen: 35,
          satisfactionClient: 70,
          partDeMarche: 0.25,
          productivite: 0,
          nbClients: 0,
        },
        score: 0,
      },
    });

    // Rounds 1-3
    for (let r = 0; r < roundStates.length; r++) {
      const state = roundStates[r];

      await prisma.pharmacyState.create({
        data: {
          gamePlayerId: gp.id,
          roundId: rounds[r].id,
          roundNumber: r + 1,
          balanceSheet: state.balanceSheet,
          incomeStatement: state.incomeStatement,
          cashFlow: state.cashFlow,
          employees: state.employees,
          inventory: state.inventory,
          kpis: state.kpis,
          score: state.score,
        },
      });

      // Create submitted decisions for each round
      await prisma.decision.create({
        data: {
          gamePlayerId: gp.id,
          roundId: rounds[r].id,
          submitted: true,
          submittedAt: new Date(
            Date.now() - (3 - r) * 24 * 60 * 60 * 1000
          ),
          hr: {
            hires:
              pp.profile === "aggressive" && r === 1
                ? [{ role: "preparateur", salary: 2300 }]
                : pp.profile === "specialist" && r === 2
                ? [{ role: "preparateur", salary: 2300 }]
                : pp.profile === "balanced" && r === 1
                ? [{ role: "preparateur", salary: 2300 }]
                : [],
            fires: [],
            trainingBudget:
              pp.profile === "specialist" ? 8000 + r * 3000 : 3000 + r * 1000,
            salaryIncrease: pp.profile === "aggressive" ? 5 : 2,
            bonusPolicy: pp.profile === "aggressive" ? 10 : 5,
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
            negotiationEffort:
              pp.profile === "conservative" ? 80 : 50 + r * 5,
          },
          pricing: {
            otcMargin: pp.profile === "aggressive" ? 0.25 : 0.3,
            paraMargin: pp.profile === "aggressive" ? 0.3 : 0.35,
            promotions:
              pp.profile === "aggressive"
                ? [
                    {
                      category: "otc",
                      discountPercent: 15,
                      budgetAllocated: 5000,
                    },
                  ]
                : [],
          },
          marketing: {
            totalBudget:
              pp.profile === "aggressive"
                ? 15000 + r * 5000
                : pp.profile === "specialist"
                ? 5000 + r * 6500
                : pp.profile === "conservative"
                ? 3000 + r * 1000
                : 8000 + r * 2000,
            allocation: {
              vitrine: 0.2,
              digital: 0.4,
              presseLocale: 0.2,
              evenements: 0.2,
            },
            loyaltyProgram: {
              active: pp.profile !== "conservative" || r > 0,
              cashbackPercent:
                pp.profile === "aggressive" ? 3 : 2,
            },
            services: {
              livraison: pp.profile === "specialist" || r >= 1,
              teleconsultation: pp.profile === "specialist",
              vaccination: true,
              trod: pp.profile === "specialist" || r >= 2,
              pilulier: pp.profile === "specialist",
            },
          },
          investments: {
            equipment:
              r === 1 && pp.profile !== "conservative"
                ? [{ type: "automate", cost: 15000 }]
                : [],
            renovationBudget: r === 0 && pp.profile === "aggressive" ? 20000 : 0,
            digital: {
              website: pp.profile !== "conservative" || r >= 2,
              clickAndCollect: pp.profile === "specialist" || pp.profile === "aggressive",
              appMobile: false,
            },
          },
          finance: {
            newLoanAmount:
              pp.profile === "aggressive" && r === 1
                ? 50000
                : pp.profile === "balanced" && r === 1
                ? 30000
                : pp.profile === "specialist" && r === 1
                ? 20000
                : 0,
            newLoanDuration: 60,
            earlyRepayment:
              pp.profile === "conservative" && r === 2 ? 20000 : 0,
            dividendPayout: pp.profile === "conservative" ? 0.1 : 0,
          },
        },
      });
    }
  }

  console.log("  ✓ Created pharmacy states & decisions for rounds 0-3");

  // ===== 4. Create a lobby game (waiting for players) =====
  const lobbyGame = await prisma.game.create({
    data: {
      name: "Nouvelle Session Avril 2026",
      code: "LSG002",
      status: "LOBBY",
      currentRound: 0,
      maxRounds: 5,
      trainerId: trainer.id,
      initialConfigId: initialConfig.id,
    },
  });

  // Add 2 players to lobby
  await prisma.gamePlayer.create({
    data: {
      userId: players[0].id,
      gameId: lobbyGame.id,
      pharmacyName: "Pharmacie Alpha",
    },
  });
  await prisma.gamePlayer.create({
    data: {
      userId: players[1].id,
      gameId: lobbyGame.id,
      pharmacyName: "Pharmacie Beta",
    },
  });

  console.log("  ✓ Created lobby game (LSG002) with 2 players");

  // ===== 5. Create an in-progress game =====
  const activeGame = await prisma.game.create({
    data: {
      name: "Session Test en cours",
      code: "LSG003",
      status: "ROUND_ACTIVE",
      currentRound: 1,
      maxRounds: 3,
      trainerId: trainer.id,
      initialConfigId: initialConfig.id,
    },
  });

  const activeRound = await prisma.round.create({
    data: {
      gameId: activeGame.id,
      number: 1,
      status: "ACTIVE",
    },
  });

  // 3 players in active game
  for (let i = 0; i < 3; i++) {
    const gp = await prisma.gamePlayer.create({
      data: {
        userId: players[i].id,
        gameId: activeGame.id,
        pharmacyName: ["Pharma Active 1", "Pharma Active 2", "Pharma Active 3"][i],
      },
    });

    // Initial state
    await prisma.pharmacyState.create({
      data: {
        gamePlayerId: gp.id,
        roundNumber: 0,
        balanceSheet: config.balanceSheet,
        incomeStatement: {
          chiffreAffaires: 0,
          coutAchats: 0,
          margeBrute: 0,
          chargesPersonnel: 0,
          chargesExterieures: 0,
          impotsTaxes: 0,
          dotationsAmortissements: 0,
          chargesFinancieres: 0,
          resultatExploitation: 0,
          resultatNet: 0,
        },
        cashFlow: {
          tresorerieDebut: config.balanceSheet.assets.tresorerie,
          encaissementsVentes: 0,
          decaissementsAchats: 0,
          decaissementsSalaires: 0,
          decaissementsCharges: 0,
          investissements: 0,
          remboursementsEmprunts: 0,
          nouveauxEmprunts: 0,
          tresoretieFin: config.balanceSheet.assets.tresorerie,
        },
        employees: config.employees,
        inventory: config.inventory,
        kpis: {
          chiffreAffaires: config.revenue.previousYearCA,
          margeBrute: 0,
          tauxMarge: 0,
          ebe: 0,
          resultatNet: 0,
          tresorerie: config.balanceSheet.assets.tresorerie,
          rotationStocks: 8,
          panierMoyen: 35,
          satisfactionClient: 70,
          partDeMarche: 0.25,
          productivite: 0,
          nbClients: 0,
        },
        score: 0,
      },
    });

    // Empty decision (only first player has submitted)
    await prisma.decision.create({
      data: {
        gamePlayerId: gp.id,
        roundId: activeRound.id,
        submitted: i === 0,
        submittedAt: i === 0 ? new Date() : null,
        hr: i === 0
          ? { hires: [], fires: [], trainingBudget: 5000, salaryIncrease: 3, bonusPolicy: 5 }
          : {},
        purchasing: i === 0
          ? {
              suppliers: [],
              safetyStockDays: { prescriptions: 15, otc: 15, parapharmacie: 15, materielMedical: 15 },
              orderFrequency: "bihebdomadaire",
              negotiationEffort: 60,
            }
          : {},
        pricing: i === 0 ? { otcMargin: 0.3, paraMargin: 0.35, promotions: [] } : {},
        marketing: i === 0
          ? {
              totalBudget: 10000,
              allocation: { vitrine: 0.2, digital: 0.4, presseLocale: 0.2, evenements: 0.2 },
              loyaltyProgram: { active: true, cashbackPercent: 2 },
              services: {
                livraison: false,
                teleconsultation: false,
                vaccination: true,
                trod: false,
                pilulier: false,
              },
            }
          : {},
        investments: i === 0
          ? { equipment: [], renovationBudget: 0, digital: { website: true, clickAndCollect: false, appMobile: false } }
          : {},
        finance: i === 0
          ? { newLoanAmount: 0, newLoanDuration: 60, earlyRepayment: 0, dividendPayout: 0 }
          : {},
      },
    });
  }

  console.log("  ✓ Created active game (LSG003) - round 1, 1/3 submitted");

  // ===== Summary =====
  console.log("\n🎉 Seed completed!\n");
  console.log("  Comptes disponibles (mot de passe: password123) :");
  console.log("  ┌────────────────────────┬──────────────────────┬───────────┐");
  console.log("  │ Nom                    │ Email                │ Role      │");
  console.log("  ├────────────────────────┼──────────────────────┼───────────┤");
  console.log("  │ Dr. Formateur          │ formateur@lsg.fr     │ TRAINER   │");
  console.log("  │ Alice Moreau           │ alice@lsg.fr         │ PLAYER    │");
  console.log("  │ Bob Dupont             │ bob@lsg.fr           │ PLAYER    │");
  console.log("  │ Claire Fontaine        │ claire@lsg.fr        │ PLAYER    │");
  console.log("  │ David Mercier          │ david@lsg.fr         │ PLAYER    │");
  console.log("  └────────────────────────┴──────────────────────┴───────────┘");
  console.log("");
  console.log("  Parties :");
  console.log("  ┌────────────────────────────────┬────────┬────────────────┐");
  console.log("  │ Nom                            │ Code   │ Statut         │");
  console.log("  ├────────────────────────────────┼────────┼────────────────┤");
  console.log("  │ Session Formation Mars 2026    │ LSG001 │ FINISHED (3/5) │");
  console.log("  │ Nouvelle Session Avril 2026    │ LSG002 │ LOBBY          │");
  console.log("  │ Session Test en cours          │ LSG003 │ ROUND_ACTIVE   │");
  console.log("  └────────────────────────────────┴────────┴────────────────┘");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
