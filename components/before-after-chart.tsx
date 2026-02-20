"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts"

interface BeforeAfterChartProps {
  beforeScore: number
  afterScore: number
  visibilityLoss: number
}

export function BeforeAfterChart({ beforeScore, afterScore, visibilityLoss }: BeforeAfterChartProps) {
  const data = [
    { name: "Antes (solo Map Pack)", score: beforeScore },
    { name: "Despues (con AI Overview)", score: afterScore },
  ]

  const colors = ["oklch(0.65 0.19 260)", "oklch(0.6 0.22 30)"]

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.27 0.015 265 / 0.5)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "oklch(0.6 0.01 265)", fontSize: 12 }}
            axisLine={{ stroke: "oklch(0.27 0.015 265)" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
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
            formatter={(value: number) => [`${value}/100`, "Score"]}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={40}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
            <LabelList
              dataKey="score"
              position="right"
              style={{ fill: "oklch(0.95 0 0)", fontSize: "14px", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <span className="text-sm text-foreground">Perdida de visibilidad estimada:</span>
        <span className="text-lg font-bold font-mono text-destructive">-{visibilityLoss}%</span>
      </div>
    </div>
  )
}
