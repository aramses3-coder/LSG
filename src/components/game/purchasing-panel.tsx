"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PurchasingDecisions, ProductCategory } from "@/types";
import { DEFAULT_SUPPLIERS } from "@/lib/engine/constants";

interface PurchasingPanelProps {
  decisions: PurchasingDecisions;
  onChange: (decisions: PurchasingDecisions) => void;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  prescriptions: "Medicaments rembourses",
  otc: "OTC / Automedication",
  parapharmacie: "Parapharmacie",
  materielMedical: "Materiel medical",
};

const FREQUENCY_OPTIONS = [
  { value: "quotidien", label: "Quotidien", desc: "Moins de stock, mais plus de livraisons" },
  { value: "bihebdomadaire", label: "2x/semaine", desc: "Bon equilibre stock/livraisons" },
  { value: "hebdomadaire", label: "Hebdomadaire", desc: "Stock plus important, moins de livraisons" },
] as const;

export function PurchasingPanel({ decisions, onChange }: PurchasingPanelProps) {
  const update = (partial: Partial<PurchasingDecisions>) => {
    onChange({ ...decisions, ...partial });
  };

  const safetyStockDays = decisions.safetyStockDays ?? {
    prescriptions: 15,
    otc: 15,
    parapharmacie: 15,
    materielMedical: 15,
  };

  return (
    <div className="space-y-6">
      {/* Fournisseurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fournisseurs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Selectionnez vos fournisseurs et la part de volume confiee a chacun.
          </p>
          <div className="space-y-3">
            {DEFAULT_SUPPLIERS.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-white"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{supplier.name}</p>
                    <Badge variant="secondary">{supplier.type}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Remise: {(supplier.discountRate * 100).toFixed(1)}% &middot;
                    Livraison: {supplier.deliveryDays}j &middot; Fiabilite:{" "}
                    {supplier.reliability}%
                  </p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  {supplier.minOrderAmount > 0
                    ? `Min. ${supplier.minOrderAmount}\u20ac`
                    : "Pas de minimum"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock de securite par categorie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock de securite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-gray-500">
            Nombre de jours de stock de securite par categorie. Plus de stock = moins de ruptures mais plus de capital immobilise.
          </p>
          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
            <div key={cat}>
              <div className="flex justify-between mb-2">
                <Label className="text-sm">{CATEGORY_LABELS[cat]}</Label>
                <span className="text-sm font-mono">
                  {safetyStockDays[cat]} jours
                </span>
              </div>
              <Slider
                value={[safetyStockDays[cat]]}
                onValueChange={([v]) =>
                  update({
                    safetyStockDays: { ...safetyStockDays, [cat]: v },
                  })
                }
                min={5}
                max={45}
                step={1}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Frequence de commande */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequence de commande</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {FREQUENCY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  (decisions.orderFrequency ?? "bihebdomadaire") === opt.value
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="orderFrequency"
                  value={opt.value}
                  checked={
                    (decisions.orderFrequency ?? "bihebdomadaire") === opt.value
                  }
                  onChange={() => update({ orderFrequency: opt.value })}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-gray-500 text-center mt-1">
                  {opt.desc}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Effort de negociation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Effort de negociation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2">
            <Label>Intensite</Label>
            <span className="text-sm font-mono">
              {decisions.negotiationEffort ?? 50}/100
            </span>
          </div>
          <Slider
            value={[decisions.negotiationEffort ?? 50]}
            onValueChange={([v]) => update({ negotiationEffort: v })}
            max={100}
            step={5}
          />
          <p className="text-xs text-gray-400 mt-1">
            Plus d&apos;effort = meilleures remises mais mobilise du temps de l&apos;equipe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
