"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { InvestmentDecisions } from "@/types";
import { AVAILABLE_EQUIPMENT } from "@/lib/engine/constants";

interface InvestmentPanelProps {
  decisions: InvestmentDecisions;
  onChange: (decisions: InvestmentDecisions) => void;
}

const EQUIPMENT_LABELS: Record<string, string> = {
  automate: "Automate de dispensation",
  robot_dispensation: "Robot de dispensation",
  ecran_conseil: "Ecran de conseil interactif",
  borne_accueil: "Borne d'accueil",
};

export function InvestmentPanel({ decisions, onChange }: InvestmentPanelProps) {
  const update = (partial: Partial<InvestmentDecisions>) => {
    onChange({ ...decisions, ...partial });
  };

  const digital = decisions.digital ?? {
    website: false,
    clickAndCollect: false,
    appMobile: false,
  };

  const selectedEquipment = decisions.equipment ?? [];

  const toggleEquipment = (type: string) => {
    const existing = selectedEquipment.find((e) => e.type === type);
    if (existing) {
      update({
        equipment: selectedEquipment.filter((e) => e.type !== type),
      });
    } else {
      const info = AVAILABLE_EQUIPMENT[type];
      if (info) {
        update({
          equipment: [...selectedEquipment, { type, cost: info.cost }],
        });
      }
    }
  };

  const totalInvestment =
    selectedEquipment.reduce((sum, e) => sum + e.cost, 0) +
    (decisions.renovationBudget ?? 0) +
    (digital.website ? 5000 : 0) +
    (digital.clickAndCollect ? 8000 : 0) +
    (digital.appMobile ? 15000 : 0);

  return (
    <div className="space-y-6">
      {/* Resume investissements */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-emerald-800 font-medium">
              Total investissements ce round
            </p>
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(totalInvestment)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Equipements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(AVAILABLE_EQUIPMENT).map(([type, info]) => {
              const isSelected = selectedEquipment.some((e) => e.type === type);
              return (
                <div
                  key={type}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {EQUIPMENT_LABELS[type] ?? type}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">
                        {formatCurrency(info.cost)}
                      </Badge>
                      <Badge variant="default">
                        +{Math.round(info.productivityGain * 100)}% productivite
                      </Badge>
                      <span className="text-xs text-gray-400">
                        Amorti sur {info.depreciationYears} ans
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={isSelected ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => toggleEquipment(type)}
                  >
                    {isSelected ? "Retirer" : "Acheter"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Renovation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Renovation de l&apos;officine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2">
            <Label>Budget renovation</Label>
            <span className="text-sm font-mono">
              {formatCurrency(decisions.renovationBudget ?? 0)}
            </span>
          </div>
          <Slider
            value={[decisions.renovationBudget ?? 0]}
            onValueChange={([v]) => update({ renovationBudget: v })}
            max={100000}
            step={5000}
          />
          <p className="text-xs text-gray-400 mt-1">
            Ameliore l&apos;attractivite et la satisfaction client. Amorti sur 10 ans.
          </p>
        </CardContent>
      </Card>

      {/* Digitalisation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Digitalisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { key: "website" as const, label: "Site web vitrine", cost: 5000 },
              { key: "clickAndCollect" as const, label: "Click & Collect", cost: 8000 },
              { key: "appMobile" as const, label: "Application mobile", cost: 15000 },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.cost)}
                  </p>
                </div>
                <Switch
                  checked={digital[item.key]}
                  onCheckedChange={(checked) =>
                    update({ digital: { ...digital, [item.key]: checked } })
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
