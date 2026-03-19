import type { Employee, HRDecisions } from "@/types";
import { CHARGES_SOCIALES_RATE, SALARY_RANGES } from "../constants";

export interface HRResult {
  employees: Employee[];
  totalSalaryCost: number; // Cout annuel total (brut + charges)
  competenceAverage: number;
  satisfactionImpact: number; // Impact sur satisfaction client
}

export function processHR(
  currentEmployees: Employee[],
  decisions: HRDecisions
): HRResult {
  let employees = [...currentEmployees.map((e) => ({ ...e }))];

  // Process fires
  if (decisions.fires?.length) {
    employees = employees.filter(
      (e) => !decisions.fires.includes(e.id) && e.role !== "titulaire"
    );
  }

  // Process hires
  if (decisions.hires?.length) {
    for (const hire of decisions.hires) {
      const range = SALARY_RANGES[hire.role];
      if (!range) continue;

      const salary = Math.max(range.min, Math.min(range.max, hire.salary));
      employees.push({
        id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: hire.role,
        name: `Nouveau ${hire.role}`,
        salary,
        competence: 40 + Math.random() * 20, // 40-60 pour un nouveau
        experience: 0,
        training: 0,
      });
    }
  }

  // Apply salary increases
  if (decisions.salaryIncrease > 0) {
    const increase = Math.min(decisions.salaryIncrease, 0.1); // Max 10%
    for (const emp of employees) {
      if (emp.role !== "titulaire") {
        emp.salary = Math.round(emp.salary * (1 + increase));
      }
    }
  }

  // Apply training
  if (decisions.trainingBudget > 0) {
    const trainingPerEmployee =
      decisions.trainingBudget / employees.length;
    for (const emp of employees) {
      const competenceGain = Math.min(
        10,
        (trainingPerEmployee / 2000) * 5
      ); // 2000 EUR = ~5 points
      emp.competence = Math.min(100, emp.competence + competenceGain);
      emp.training += trainingPerEmployee;
    }
  }

  // Age all employees by 1 year
  for (const emp of employees) {
    emp.experience += 1;
    // Natural competence gain with experience (diminishing)
    emp.competence = Math.min(
      100,
      emp.competence + Math.max(0, 2 - emp.experience * 0.05)
    );
  }

  // Calculate costs
  const annualBrut = employees.reduce((sum, e) => sum + e.salary * 12, 0);
  const chargesSociales = annualBrut * CHARGES_SOCIALES_RATE;
  const trainingCost = decisions.trainingBudget ?? 0;
  const bonusCost =
    annualBrut * Math.min(decisions.bonusPolicy ?? 0, 0.15); // Max 15%
  const totalSalaryCost = annualBrut + chargesSociales + trainingCost + bonusCost;

  const competenceAverage =
    employees.length > 0
      ? employees.reduce((sum, e) => sum + e.competence, 0) /
        employees.length
      : 0;

  // Satisfaction impact: well-staffed + competent = happy clients
  const staffRatio = employees.length / 5; // 5 = baseline
  const satisfactionImpact =
    (competenceAverage / 100) * 0.5 +
    Math.min(staffRatio, 1.5) * 0.3 +
    ((decisions.bonusPolicy ?? 0) / 0.15) * 0.2;

  return {
    employees,
    totalSalaryCost,
    competenceAverage,
    satisfactionImpact: Math.min(1, satisfactionImpact),
  };
}
