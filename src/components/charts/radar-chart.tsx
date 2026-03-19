"use client";

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RadarChartProps {
  data: Array<{
    subject: string;
    player: number;
    average: number;
  }>;
  playerName: string;
}

export function RadarChart({ data, playerName }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsRadar data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar
          name={playerName}
          dataKey="player"
          stroke="#059669"
          fill="#059669"
          fillOpacity={0.3}
        />
        <Radar
          name="Moyenne"
          dataKey="average"
          stroke="#9ca3af"
          fill="#9ca3af"
          fillOpacity={0.1}
        />
        <Legend />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
