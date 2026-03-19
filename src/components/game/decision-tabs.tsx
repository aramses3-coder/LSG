"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HRPanel } from "./hr-panel";
import { PurchasingPanel } from "./purchasing-panel";
import { PricingPanel } from "./pricing-panel";
import { MarketingPanel } from "./marketing-panel";
import { InvestmentPanel } from "./investment-panel";
import { FinancePanel } from "./finance-panel";
import type { PlayerDecisions, Employee, BalanceSheet } from "@/types";

interface DecisionTabsProps {
  decisions: PlayerDecisions;
  employees: Employee[];
  balanceSheet: BalanceSheet;
  onChange: (decisions: PlayerDecisions) => void;
}

export function DecisionTabs({
  decisions,
  employees,
  balanceSheet,
  onChange,
}: DecisionTabsProps) {
  return (
    <Tabs defaultValue="hr" className="w-full">
      <TabsList className="w-full grid grid-cols-6 h-auto">
        <TabsTrigger value="hr" className="text-xs sm:text-sm py-2">
          RH
        </TabsTrigger>
        <TabsTrigger value="purchasing" className="text-xs sm:text-sm py-2">
          Achats
        </TabsTrigger>
        <TabsTrigger value="pricing" className="text-xs sm:text-sm py-2">
          Prix
        </TabsTrigger>
        <TabsTrigger value="marketing" className="text-xs sm:text-sm py-2">
          Marketing
        </TabsTrigger>
        <TabsTrigger value="investments" className="text-xs sm:text-sm py-2">
          Investir
        </TabsTrigger>
        <TabsTrigger value="finance" className="text-xs sm:text-sm py-2">
          Finance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="hr">
        <HRPanel
          employees={employees}
          decisions={decisions.hr}
          onChange={(hr) => onChange({ ...decisions, hr })}
        />
      </TabsContent>

      <TabsContent value="purchasing">
        <PurchasingPanel
          decisions={decisions.purchasing}
          onChange={(purchasing) => onChange({ ...decisions, purchasing })}
        />
      </TabsContent>

      <TabsContent value="pricing">
        <PricingPanel
          decisions={decisions.pricing}
          onChange={(pricing) => onChange({ ...decisions, pricing })}
        />
      </TabsContent>

      <TabsContent value="marketing">
        <MarketingPanel
          decisions={decisions.marketing}
          onChange={(marketing) => onChange({ ...decisions, marketing })}
        />
      </TabsContent>

      <TabsContent value="investments">
        <InvestmentPanel
          decisions={decisions.investments}
          onChange={(investments) => onChange({ ...decisions, investments })}
        />
      </TabsContent>

      <TabsContent value="finance">
        <FinancePanel
          decisions={decisions.finance}
          balanceSheet={balanceSheet}
          onChange={(finance) => onChange({ ...decisions, finance })}
        />
      </TabsContent>
    </Tabs>
  );
}
