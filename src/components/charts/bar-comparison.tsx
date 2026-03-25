"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BarComparisonProps {
  data: Array<{
    name: string;
    value: number;
    isCurrentPlayer?: boolean;
  }>;
  label: string;
  formatter?: (value: number) => string;
}

export function BarComparison({ data, label, formatter }: BarComparisonProps) {
  const formatValue = formatter ?? ((v: number) => v.toLocaleString("fr-FR"));

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={formatValue} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={75}
          />
          <Tooltip
            formatter={(value) => [formatValue(Number(value)), label]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isCurrentPlayer ? "#059669" : "#d1d5db"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
