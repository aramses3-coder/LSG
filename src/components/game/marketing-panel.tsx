"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MarketingDecisions } from "@/types";

interface MarketingPanelProps {
  decisions: MarketingDecisions;
  onChange: (decisions: MarketingDecisions) => void;
}

const SERVICE_LIST = [
  { key: "livraison", label: "Livraison a domicile", cost: 500, desc: "+5% clients" },
  { key: "teleconsultation", label: "Teleconsultation", cost: 300, desc: "+3% clients" },
  { key: "vaccination", label: "Vaccination", cost: 200, desc: "+4% clients" },
  { key: "trod", label: "Tests rapides (TROD)", cost: 150, desc: "+2% clients" },
  { key: "pilulier", label: "Preparation de piluliers", cost: 100, desc: "+3% clients" },
] as const;

export function MarketingPanel({ decisions, onChange }: MarketingPanelProps) {
  const update = (partial: Partial<MarketingDecisions>) => {
    onChange({ ...decisions, ...partial });
  };

  const allocation = decisions.allocation ?? {
    vitrine: 25,
    digital: 25,
    presseLocale: 25,
    evenements: 25,
  };

  const loyaltyProgram = decisions.loyaltyProgram ?? {
    active: false,
    cashbackPercent: 0.01,
  };

  const services = decisions.services ?? {
    livraison: false,
    teleconsultation: false,
    vaccination: false,
    trod: false,
    pilulier: false,
  };

  const totalAllocation =
    allocation.vitrine + allocation.digital + allocation.presseLocale + allocation.evenements;

  return (
    <div className="space-y-6">
      {/* Budget global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget marketing annuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2">
            <Label>Budget total</Label>
            <span className="text-sm font-mono font-semibold">
              {formatCurrency(decisions.totalBudget ?? 5000)}
            </span>
          </div>
          <Slider
            value={[decisions.totalBudget ?? 5000]}
            onValueChange={([v]) => update({ totalBudget: v })}
            max={50000}
            step={1000}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 (pas de marketing)</span>
            <span>50 000 (maximum)</span>
          </div>
        </CardContent>
      </Card>

      {/* Repartition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repartition du budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-xs text-gray-400">
            Total : {totalAllocation}% {totalAllocation !== 100 && "(ajustez pour atteindre 100%)"}
          </p>
          {[
            { key: "vitrine" as const, label: "Vitrine & merchandising" },
            { key: "digital" as const, label: "Digital (reseaux sociaux, SEO)" },
            { key: "presseLocale" as const, label: "Presse locale & flyers" },
            { key: "evenements" as const, label: "Evenements & journees sante" },
          ].map((channel) => (
            <div key={channel.key}>
              <div className="flex justify-between mb-2">
                <Label className="text-sm">{channel.label}</Label>
                <span className="text-sm font-mono">{allocation[channel.key]}%</span>
              </div>
              <Slider
                value={[allocation[channel.key]]}
                onValueChange={([v]) =>
                  update({ allocation: { ...allocation, [channel.key]: v } })
                }
                max={100}
                step={5}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Programme fidelite */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Programme de fidelite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Activer le programme</p>
              <p className="text-xs text-gray-500">+10% d&apos;efficacite marketing</p>
            </div>
            <Switch
              checked={loyaltyProgram.active}
              onCheckedChange={(checked) =>
                update({
                  loyaltyProgram: { ...loyaltyProgram, active: checked },
                })
              }
            />
          </div>
          {loyaltyProgram.active && (
            <div>
              <div className="flex justify-between mb-2">
                <Label>Cashback client</Label>
                <span className="text-sm font-mono">
                  {Math.round(loyaltyProgram.cashbackPercent * 100)}%
                </span>
              </div>
              <Slider
                value={[loyaltyProgram.cashbackPercent * 100]}
                onValueChange={([v]) =>
                  update({
                    loyaltyProgram: {
                      ...loyaltyProgram,
                      cashbackPercent: v / 100,
                    },
                  })
                }
                min={1}
                max={5}
                step={0.5}
              />
              <p className="text-xs text-gray-400 mt-1">
                Cout : {Math.round(loyaltyProgram.cashbackPercent * 100)}% du CA redistribue
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services additionnels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Services additionnels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SERVICE_LIST.map((svc) => (
              <div
                key={svc.key}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="text-sm font-medium">{svc.label}</p>
                  <p className="text-xs text-gray-500">
                    {svc.desc} &middot; Cout : {formatCurrency(svc.cost)}/mois
                  </p>
                </div>
                <Switch
                  checked={services[svc.key as keyof typeof services] ?? false}
                  onCheckedChange={(checked) =>
                    update({
                      services: { ...services, [svc.key]: checked },
                    })
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
