"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Employee, EmployeeRole, HRDecisions } from "@/types";

interface HRPanelProps {
  employees: Employee[];
  decisions: HRDecisions;
  onChange: (decisions: HRDecisions) => void;
}

const ROLE_LABELS: Record<EmployeeRole, string> = {
  titulaire: "Titulaire",
  adjoint: "Adjoint(e)",
  preparateur: "Preparateur/trice",
  rayonniste: "Rayonniste",
  apprenti: "Apprenti(e)",
};

const HIRE_ROLES: { role: EmployeeRole; minSalary: number; maxSalary: number }[] = [
  { role: "adjoint", minSalary: 3500, maxSalary: 6000 },
  { role: "preparateur", minSalary: 1900, maxSalary: 3000 },
  { role: "rayonniste", minSalary: 1700, maxSalary: 2200 },
  { role: "apprenti", minSalary: 900, maxSalary: 1400 },
];

export function HRPanel({ employees, decisions, onChange }: HRPanelProps) {
  const [hireRole, setHireRole] = useState<EmployeeRole>("preparateur");
  const [hireSalary, setHireSalary] = useState(2200);

  const update = (partial: Partial<HRDecisions>) => {
    onChange({ ...decisions, ...partial });
  };

  const addHire = () => {
    update({
      hires: [...(decisions.hires ?? []), { role: hireRole, salary: hireSalary }],
    });
  };

  const removeHire = (index: number) => {
    const hires = [...(decisions.hires ?? [])];
    hires.splice(index, 1);
    update({ hires });
  };

  const toggleFire = (empId: string) => {
    const fires = decisions.fires ?? [];
    if (fires.includes(empId)) {
      update({ fires: fires.filter((id) => id !== empId) });
    } else {
      update({ fires: [...fires, empId] });
    }
  };

  const totalMonthlySalary = employees
    .filter((e) => !(decisions.fires ?? []).includes(e.id))
    .reduce((sum, e) => sum + e.salary, 0);

  const newHiresMonthlyCost = (decisions.hires ?? []).reduce(
    (sum, h) => sum + h.salary,
    0
  );

  return (
    <div className="space-y-6">
      {/* Personnel actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personnel actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees.map((emp) => {
              const isFired = (decisions.fires ?? []).includes(emp.id);
              return (
                <div
                  key={emp.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isFired
                      ? "bg-red-50 border-red-200 opacity-60"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={isFired ? "destructive" : "secondary"}>
                      {ROLE_LABELS[emp.role]}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{emp.name}</p>
                      <p className="text-xs text-gray-500">
                        Competence: {Math.round(emp.competence)}/100 &middot;{" "}
                        {emp.experience} ans exp.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono">
                      {formatCurrency(emp.salary)}/mois
                    </span>
                    {emp.role !== "titulaire" && (
                      <Button
                        variant={isFired ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => toggleFire(emp.id)}
                      >
                        {isFired ? "Annuler" : "Licencier"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t text-sm text-gray-500">
            Masse salariale mensuelle :{" "}
            <span className="font-semibold text-gray-800">
              {formatCurrency(totalMonthlySalary + newHiresMonthlyCost)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Embauches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embaucher</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Poste</Label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={hireRole}
                onChange={(e) => setHireRole(e.target.value as EmployeeRole)}
              >
                {HIRE_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {ROLE_LABELS[r.role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label>Salaire brut mensuel</Label>
              <Input
                type="number"
                value={hireSalary}
                onChange={(e) => setHireSalary(Number(e.target.value))}
                min={HIRE_ROLES.find((r) => r.role === hireRole)?.minSalary}
                max={HIRE_ROLES.find((r) => r.role === hireRole)?.maxSalary}
              />
            </div>
            <Button onClick={addHire}>Ajouter</Button>
          </div>

          {(decisions.hires ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Nouvelles embauches prevues :
              </p>
              {(decisions.hires ?? []).map((hire, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-200"
                >
                  <span className="text-sm">
                    {ROLE_LABELS[hire.role]} - {formatCurrency(hire.salary)}/mois
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHire(i)}
                  >
                    Retirer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Politique salariale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Politique salariale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Augmentation generale</Label>
              <span className="text-sm font-mono">
                {Math.round((decisions.salaryIncrease ?? 0) * 100)}%
              </span>
            </div>
            <Slider
              value={[(decisions.salaryIncrease ?? 0) * 100]}
              onValueChange={([v]) => update({ salaryIncrease: v / 100 })}
              max={10}
              step={0.5}
            />
            <p className="text-xs text-gray-400 mt-1">0% a 10%</p>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Label>Prime sur objectifs</Label>
              <span className="text-sm font-mono">
                {Math.round((decisions.bonusPolicy ?? 0) * 100)}%
              </span>
            </div>
            <Slider
              value={[(decisions.bonusPolicy ?? 0) * 100]}
              onValueChange={([v]) => update({ bonusPolicy: v / 100 })}
              max={15}
              step={0.5}
            />
            <p className="text-xs text-gray-400 mt-1">0% a 15% du salaire</p>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Label>Budget formation annuel</Label>
              <span className="text-sm font-mono">
                {formatCurrency(decisions.trainingBudget ?? 0)}
              </span>
            </div>
            <Slider
              value={[decisions.trainingBudget ?? 0]}
              onValueChange={([v]) => update({ trainingBudget: v })}
              max={20000}
              step={500}
            />
            <p className="text-xs text-gray-400 mt-1">
              Ameliore la competence du personnel
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
