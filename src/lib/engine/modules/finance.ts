import type { FinanceDecisions, BalanceSheet, CashFlowStatement } from "@/types";
import { LOAN_INTEREST_RATE } from "../constants";

export interface FinanceResult {
  balanceSheet: BalanceSheet;
  cashFlow: CashFlowStatement;
}

export function processFinance(
  previousBalance: BalanceSheet,
  decisions: FinanceDecisions,
  totalRevenue: number,
  totalCOGS: number,
  totalSalaryCost: number,
  totalOtherCosts: number,
  investmentCost: number,
  resultatNet: number,
  newStockValue: number
): FinanceResult {
  const prevCash = previousBalance.assets.tresorerie;

  // Loan management
  const newLoan = decisions.newLoanAmount ?? 0;
  const loanDuration = decisions.newLoanDuration ?? 60; // months
  const earlyRepayment = Math.min(
    decisions.earlyRepayment ?? 0,
    previousBalance.liabilities.emprunts
  );

  // Annual loan repayment (existing)
  const existingLoanRepayment = previousBalance.liabilities.emprunts * 0.1; // ~10% per year

  // Cash flow
  const encaissementsVentes = totalRevenue * 0.95; // 5% credit clients
  const decaissementsAchats = totalCOGS * 0.9; // 10% credit fournisseurs
  const decaissementsSalaires = totalSalaryCost;
  const decaissementsCharges = totalOtherCosts;

  const cashFromOperations =
    encaissementsVentes -
    decaissementsAchats -
    decaissementsSalaires -
    decaissementsCharges;

  const cashFromInvestments = -investmentCost;
  const cashFromFinancing =
    newLoan - existingLoanRepayment - earlyRepayment;

  // Dividend payout
  const dividendPayout =
    resultatNet > 0
      ? resultatNet * Math.min(decisions.dividendPayout ?? 0, 0.5)
      : 0;

  const cashChange =
    cashFromOperations + cashFromInvestments + cashFromFinancing - dividendPayout;

  const newCash = prevCash + cashChange;

  // Update balance sheet
  const newEmprunts =
    previousBalance.liabilities.emprunts -
    existingLoanRepayment -
    earlyRepayment +
    newLoan;

  const balanceSheet: BalanceSheet = {
    assets: {
      stock: newStockValue,
      tresorerie: Math.round(newCash),
      immobilisations: Math.round(
        previousBalance.assets.immobilisations + investmentCost * 0.8
      ), // 80% capitalizable
      creancesClients: Math.round(totalRevenue * 0.05),
      autresActifs: previousBalance.assets.autresActifs,
    },
    liabilities: {
      capitalPropre: previousBalance.liabilities.capitalPropre,
      reserves:
        previousBalance.liabilities.reserves +
        Math.round(resultatNet * (1 - (decisions.dividendPayout ?? 0))),
      resultatExercice: Math.round(resultatNet),
      emprunts: Math.round(Math.max(0, newEmprunts)),
      dettesFournisseurs: Math.round(totalCOGS * 0.1),
      autresPassifs: previousBalance.liabilities.autresPassifs,
    },
  };

  const cashFlow: CashFlowStatement = {
    tresorerieDebut: Math.round(prevCash),
    encaissementsVentes: Math.round(encaissementsVentes),
    decaissementsAchats: Math.round(decaissementsAchats),
    decaissementsSalaires: Math.round(decaissementsSalaires),
    decaissementsCharges: Math.round(decaissementsCharges),
    investissements: Math.round(investmentCost),
    remboursementsEmprunts: Math.round(existingLoanRepayment + earlyRepayment),
    nouveauxEmprunts: Math.round(newLoan),
    tresoretieFin: Math.round(newCash),
  };

  return { balanceSheet, cashFlow };
}
