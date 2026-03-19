"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { FinanceDecisions, BalanceSheet } from "@/types";

interface FinancePanelProps {
  decisions: FinanceDecisions;
  balanceSheet: BalanceSheet;
  onChange: (decisions: FinanceDecisions) => void;
}

export function FinancePanel({
  decisions,
  balanceSheet,
  onChange,
}: FinancePanelProps) {
  const update = (partial: Partial<FinanceDecisions>) => {
    onChange({ ...decisions, ...partial });
  };

  const currentLoans = balanceSheet.liabilities.emprunts;
  const currentCash = balanceSheet.assets.tresorerie;

  return (
    <div className="space-y-6">
      {/* Situation actuelle */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-blue-600">Tresorerie actuelle</p>
              <p
                className={`text-lg font-bold ${
                  currentCash >= 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {formatCurrency(currentCash)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Emprunts en cours</p>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(currentLoans)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nouvel emprunt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvel emprunt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Montant</Label>
              <span className="text-sm font-mono">
                {formatCurrency(decisions.newLoanAmount ?? 0)}
              </span>
            </div>
            <Slider
              value={[decisions.newLoanAmount ?? 0]}
              onValueChange={([v]) => update({ newLoanAmount: v })}
              max={200000}
              step={5000}
            />
          </div>
          {(decisions.newLoanAmount ?? 0) > 0 && (
            <div>
              <div className="flex justify-between mb-2">
                <Label>Duree (mois)</Label>
                <span className="text-sm font-mono">
                  {decisions.newLoanDuration ?? 60} mois (
                  {Math.round((decisions.newLoanDuration ?? 60) / 12)} ans)
                </span>
              </div>
              <Slider
                value={[decisions.newLoanDuration ?? 60]}
                onValueChange={([v]) => update({ newLoanDuration: v })}
                min={12}
                max={120}
                step={12}
              />
              <p className="text-xs text-gray-400 mt-2">
                Taux d&apos;interet : 3,5% annuel &middot; Cout total :{" "}
                {formatCurrency(
                  Math.round(
                    (decisions.newLoanAmount ?? 0) *
                      0.035 *
                      ((decisions.newLoanDuration ?? 60) / 12)
                  )
                )}{" "}
                d&apos;interets
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remboursement anticipe */}
      {currentLoans > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Remboursement anticipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-2">
              <Label>Montant a rembourser</Label>
              <span className="text-sm font-mono">
                {formatCurrency(decisions.earlyRepayment ?? 0)}
              </span>
            </div>
            <Slider
              value={[decisions.earlyRepayment ?? 0]}
              onValueChange={([v]) => update({ earlyRepayment: v })}
              max={Math.min(currentLoans, currentCash > 0 ? currentCash : 0)}
              step={5000}
            />
            <p className="text-xs text-gray-400 mt-1">
              Reduit les charges financieres futures
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dividendes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribution de dividendes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2">
            <Label>Part du resultat a distribuer</Label>
            <span className="text-sm font-mono">
              {Math.round((decisions.dividendPayout ?? 0) * 100)}%
            </span>
          </div>
          <Slider
            value={[(decisions.dividendPayout ?? 0) * 100]}
            onValueChange={([v]) => update({ dividendPayout: v / 100 })}
            max={50}
            step={5}
          />
          <p className="text-xs text-gray-400 mt-1">
            Maximum 50%. Reduit la tresorerie mais recompense les investisseurs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
