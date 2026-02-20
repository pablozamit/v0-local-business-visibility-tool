"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import type { Recommendation } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RecommendationsListProps {
  recommendations: Recommendation[]
}

const IMPACT_CONFIG = {
  high: {
    label: "Alto",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    dotClass: "bg-destructive",
  },
  medium: {
    label: "Medio",
    className: "bg-warning/15 text-warning border-warning/30",
    dotClass: "bg-warning",
  },
  low: {
    label: "Bajo",
    className: "bg-muted text-muted-foreground border-border/50",
    dotClass: "bg-muted-foreground",
  },
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <div className="flex flex-col gap-3">
      {recommendations.map((rec, i) => {
        const impact = IMPACT_CONFIG[rec.impact]
        return (
          <div
            key={i}
            className="group flex items-start gap-4 rounded-xl border border-border/40 bg-secondary/30 p-4 hover:bg-secondary/50 hover:border-border/70 transition-colors"
          >
            <div className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", impact.dotClass)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="text-sm font-semibold text-foreground">{rec.title}</h4>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", impact.className)}>
                  {impact.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground shrink-0">
                  {rec.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground/50 transition-colors mt-1 shrink-0" />
          </div>
        )
      })}
    </div>
  )
}
