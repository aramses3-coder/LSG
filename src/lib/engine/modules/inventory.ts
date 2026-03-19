import type { PurchasingDecisions } from "@/types";
import type { InventoryState } from "@/types";
import { DEFAULT_SUPPLIERS } from "../constants";

export interface InventoryResult {
  inventory: InventoryState;
  purchaseCost: number;
  ruptureImpact: number; // 0-1, impact on satisfaction
}

export function processInventory(
  currentInventory: InventoryState,
  purchasing: PurchasingDecisions,
  revenueByCategory: { prescriptions: number; otc: number; parapharmacie: number; materielMedical: number }
): InventoryResult {
  const categories = ["prescriptions", "otc", "parapharmacie", "materielMedical"] as const;

  let totalPurchaseCost = 0;
  let ruptureImpactTotal = 0;

  const newInventory: InventoryState = {
    prescriptions: { value: 0, rotation: 0, ruptureRate: 0 },
    otc: { value: 0, rotation: 0, ruptureRate: 0 },
    parapharmacie: { value: 0, rotation: 0, ruptureRate: 0 },
    materielMedical: { value: 0, rotation: 0, ruptureRate: 0 },
  };

  for (const cat of categories) {
    const prev = currentInventory[cat];
    const revenue = revenueByCategory[cat];

    // Calculate COGS for this category
    const cogs = revenue * 0.75; // Average cost ratio

    // Safety stock days
    const safetyDays = purchasing.safetyStockDays?.[cat] ?? 15;

    // Order frequency impact
    const frequencyMultiplier =
      purchasing.orderFrequency === "quotidien"
        ? 0.95
        : purchasing.orderFrequency === "bihebdomadaire"
        ? 1.0
        : 1.05;

    // Supplier discount
    const supplierDiscount = calculateSupplierDiscount(purchasing, cat);

    // Purchase cost = COGS minus discounts
    const purchaseCost = cogs * (1 - supplierDiscount) * frequencyMultiplier;
    totalPurchaseCost += purchaseCost;

    // Target stock level
    const dailyCost = cogs / 365;
    const targetStock = dailyCost * safetyDays;

    // New stock value (previous + purchases - sold)
    const newStockValue = Math.max(0, prev.value + purchaseCost - cogs);

    // Rotation = COGS / average stock
    const avgStock = (prev.value + newStockValue) / 2;
    const rotation = avgStock > 0 ? cogs / avgStock : 0;

    // Rupture rate (stock-outs)
    const stockCoverage = newStockValue / (dailyCost || 1);
    let ruptureRate: number;
    if (stockCoverage > safetyDays * 1.5) {
      ruptureRate = 0.01; // Very low
    } else if (stockCoverage > safetyDays) {
      ruptureRate = 0.03;
    } else if (stockCoverage > safetyDays * 0.5) {
      ruptureRate = 0.08;
    } else {
      ruptureRate = 0.15; // High stock-out risk
    }

    // Reliability impact
    const supplierReliability = getSupplierReliability(purchasing, cat);
    ruptureRate *= (100 - supplierReliability) / 100 + 0.5;
    ruptureRate = Math.min(0.3, ruptureRate);

    newInventory[cat] = {
      value: Math.round(newStockValue),
      rotation: Math.round(rotation * 10) / 10,
      ruptureRate: Math.round(ruptureRate * 1000) / 1000,
    };

    ruptureImpactTotal += ruptureRate;
  }

  return {
    inventory: newInventory,
    purchaseCost: Math.round(totalPurchaseCost),
    ruptureImpact: ruptureImpactTotal / categories.length,
  };
}

function calculateSupplierDiscount(
  purchasing: PurchasingDecisions,
  category: string
): number {
  if (!purchasing.suppliers?.length) return 0.025; // Default discount

  const categorySuppliers = purchasing.suppliers.filter(
    (s) => s.category === category
  );

  if (categorySuppliers.length === 0) return 0.025;

  let weightedDiscount = 0;
  for (const cs of categorySuppliers) {
    const supplier = DEFAULT_SUPPLIERS.find((s) => s.id === cs.supplierId);
    if (supplier) {
      weightedDiscount += supplier.discountRate * (cs.volumeShare ?? 0.5);
    }
  }

  // Negotiation effort bonus
  const negotiationBonus = (purchasing.negotiationEffort ?? 50) / 100 * 0.02;

  return Math.min(0.12, weightedDiscount + negotiationBonus);
}

function getSupplierReliability(
  purchasing: PurchasingDecisions,
  category: string
): number {
  if (!purchasing.suppliers?.length) return 90;

  const categorySuppliers = purchasing.suppliers.filter(
    (s) => s.category === category
  );

  if (categorySuppliers.length === 0) return 90;

  let weightedReliability = 0;
  let totalWeight = 0;
  for (const cs of categorySuppliers) {
    const supplier = DEFAULT_SUPPLIERS.find((s) => s.id === cs.supplierId);
    if (supplier) {
      const weight = cs.volumeShare ?? 0.5;
      weightedReliability += supplier.reliability * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weightedReliability / totalWeight : 90;
}
