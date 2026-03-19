"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { PricingDecisions, ProductCategory } from "@/types";

interface PricingPanelProps {
  decisions: PricingDecisions;
  onChange: (decisions: PricingDecisions) => void;
}

const PROMO_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "otc", label: "OTC" },
  { value: "parapharmacie", label: "Parapharmacie" },
  { value: "materielMedical", label: "Materiel medical" },
];

export function PricingPanel({ decisions, onChange }: PricingPanelProps) {
  const [promoCategory, setPromoCategory] = useState<ProductCategory>("otc");
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoBudget, setPromoBudget] = useState(2000);

  const update = (partial: Partial<PricingDecisions>) => {
    onChange({ ...decisions, ...partial });
  };

  const addPromo = () => {
    update({
      promotions: [
        ...(decisions.promotions ?? []),
        {
          category: promoCategory,
          discountPercent: promoDiscount / 100,
          budgetAllocated: promoBudget,
        },
      ],
    });
  };

  const removePromo = (index: number) => {
    const promotions = [...(decisions.promotions ?? [])];
    promotions.splice(index, 1);
    update({ promotions });
  };

  return (
    <div className="space-y-6">
      {/* Info marges reglementees */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Medicaments rembourses :</strong> les marges sont reglementees
            (marge degressive lissee + honoraire de dispensation). Vous ne pouvez
            pas les modifier.
          </p>
        </CardContent>
      </Card>

      {/* Marges libres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marges sur produits a prix libre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Marge OTC / Automedication</Label>
              <span className="text-sm font-mono">
                {formatPercent(decisions.otcMargin ?? 0.3)}
              </span>
            </div>
            <Slider
              value={[(decisions.otcMargin ?? 0.3) * 100]}
              onValueChange={([v]) => update({ otcMargin: v / 100 })}
              min={15}
              max={50}
              step={1}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>15% (agressif)</span>
              <span>50% (premium)</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Label>Marge Parapharmacie</Label>
              <span className="text-sm font-mono">
                {formatPercent(decisions.paraMargin ?? 0.35)}
              </span>
            </div>
            <Slider
              value={[(decisions.paraMargin ?? 0.35) * 100]}
              onValueChange={([v]) => update({ paraMargin: v / 100 })}
              min={15}
              max={60}
              step={1}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>15% (discount)</span>
              <span>60% (haut de gamme)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promotions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Promotions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Les promotions augmentent le volume de ventes mais reduisent la marge unitaire.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Categorie</Label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={promoCategory}
                onChange={(e) =>
                  setPromoCategory(e.target.value as ProductCategory)
                }
              >
                {PROMO_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <Label>Remise %</Label>
              <Input
                type="number"
                value={promoDiscount}
                onChange={(e) => setPromoDiscount(Number(e.target.value))}
                min={5}
                max={50}
              />
            </div>
            <div className="w-32">
              <Label>Budget</Label>
              <Input
                type="number"
                value={promoBudget}
                onChange={(e) => setPromoBudget(Number(e.target.value))}
                min={500}
                step={500}
              />
            </div>
            <Button onClick={addPromo}>Ajouter</Button>
          </div>

          {(decisions.promotions ?? []).length > 0 && (
            <div className="space-y-2">
              {(decisions.promotions ?? []).map((promo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200"
                >
                  <span className="text-sm">
                    {PROMO_CATEGORIES.find((c) => c.value === promo.category)?.label} :{" "}
                    -{Math.round(promo.discountPercent * 100)}% &middot; Budget:{" "}
                    {formatCurrency(promo.budgetAllocated)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePromo(i)}
                  >
                    Retirer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
