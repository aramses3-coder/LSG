"use client";

import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

export function KPICard({ label, value, subtitle, trend, color }: KPICardProps) {
  const trendIcon = trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "";
  const trendColor =
    trend === "up"
      ? "text-emerald-500"
      : trend === "down"
      ? "text-red-500"
      : "text-gray-400";

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className={`text-lg font-bold ${color ?? "text-gray-900"}`}>
            {value}
          </p>
          {trendIcon && (
            <span className={`text-sm ${trendColor}`}>{trendIcon}</span>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
