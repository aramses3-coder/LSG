"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { GameKPIs, BalanceSheet, Employee } from "@/types";

interface PharmacySummaryProps {
  kpis: GameKPIs;
  balanceSheet: BalanceSheet;
  employees: Employee[];
  roundNumber: number;
}

export function PharmacySummary({
  kpis,
  balanceSheet,
  employees,
  roundNumber,
}: PharmacySummaryProps) {
  const metrics = [
    {
      label: "Chiffre d'affaires",
      value: formatCurrency(kpis.chiffreAffaires),
      color: "text-gray-900",
    },
    {
      label: "Marge brute",
      value: formatCurrency(kpis.margeBrute),
      sub: formatPercent(kpis.tauxMarge),
      color: kpis.margeBrute > 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      label: "Resultat net",
      value: formatCurrency(kpis.resultatNet),
      color: kpis.resultatNet >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      label: "Tresorerie",
      value: formatCurrency(kpis.tresorerie),
      color: kpis.tresorerie >= 0 ? "text-blue-600" : "text-red-600",
    },
    {
      label: "Satisfaction",
      value: `${kpis.satisfactionClient}/100`,
      color:
        kpis.satisfactionClient >= 70
          ? "text-emerald-600"
          : kpis.satisfactionClient >= 50
          ? "text-yellow-600"
          : "text-red-600",
    },
    {
      label: "Employes",
      value: `${employees.length}`,
      color: "text-gray-700",
    },
  ];

  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-emerald-800">
            Etat de ma pharmacie
          </h3>
          <span className="text-sm text-emerald-600">
            Annee {roundNumber > 0 ? roundNumber : "initiale"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{m.label}</p>
              <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
              {m.sub && (
                <p className="text-xs text-gray-400">{m.sub}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
