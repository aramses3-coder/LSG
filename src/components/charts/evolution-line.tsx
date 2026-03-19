"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface EvolutionLineProps {
  data: Array<Record<string, unknown>>;
  lines: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  xKey: string;
  formatter?: (value: number) => string;
}

export function EvolutionLine({
  data,
  lines,
  xKey,
  formatter,
}: EvolutionLineProps) {
  const formatValue = formatter ?? ((v: number) => v.toLocaleString("fr-FR"));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => formatValue(Number(value))} />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
