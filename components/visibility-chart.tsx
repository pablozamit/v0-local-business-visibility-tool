"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { QueryResult } from "@/lib/types"

interface VisibilityChartProps {
  queries: QueryResult[]
}

const QUERY_SHORT: Record<string, string> = {
  directa: "Directa",
  proximidad: "Cerca",
  precios: "Precios",
  opiniones: "Opiniones",
  horario: "Horario",
  mejor: "Mejor",
}

export function VisibilityChart({ queries }: VisibilityChartProps) {
  const data = queries.map((q) => {
    const mapScore = q.mapPack.present
      ? q.mapPack.position
        ? q.mapPack.position === 1
          ? 100
          : q.mapPack.position === 2
            ? 75
            : 50
        : 10
      : 0
    const aiScore = q.aiOverview.present
      ? q.aiOverview.mentioned
        ? q.aiOverview.mentionType === "direct"
          ? 100
          : 60
        : 5
      : 0

    return {
      name: QUERY_SHORT[q.queryType] || q.queryType,
      "Map Pack": mapScore,
      "AI Overview": aiScore,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} barGap={4} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.27 0.015 265 / 0.5)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "oklch(0.6 0.01 265)", fontSize: 12 }}
          axisLine={{ stroke: "oklch(0.27 0.015 265)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "oklch(0.6 0.01 265)", fontSize: 12 }}
          axisLine={{ stroke: "oklch(0.27 0.015 265)" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.17 0.008 265)",
            border: "1px solid oklch(0.27 0.015 265)",
            borderRadius: "8px",
            color: "oklch(0.95 0 0)",
            fontSize: "13px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "oklch(0.6 0.01 265)" }}
        />
        <Bar dataKey="Map Pack" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((_, index) => (
            <Cell key={`mp-${index}`} fill="oklch(0.65 0.19 260)" />
          ))}
        </Bar>
        <Bar dataKey="AI Overview" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((_, index) => (
            <Cell key={`ai-${index}`} fill="oklch(0.7 0.17 165)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
