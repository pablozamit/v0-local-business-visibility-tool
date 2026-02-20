"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CheckCircle2, XCircle, Minus, Info } from "lucide-react"
import type { QueryResult } from "@/lib/types"

interface QueryResultsTableProps {
  queries: QueryResult[]
}

function StatusIcon({ present, label }: { present: boolean; label: string }) {
  return present ? (
    <span className="flex items-center gap-1.5 text-success">
      <CheckCircle2 className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <XCircle className="h-4 w-4" />
      <span className="text-xs">No</span>
    </span>
  )
}

function PositionBadge({ position }: { position: number | null }) {
  if (position === null) return <Minus className="h-4 w-4 text-muted-foreground" />
  const variant = position <= 3 ? "default" : position <= 10 ? "secondary" : "outline"
  return (
    <Badge variant={variant} className="font-mono text-xs">
      #{position}
    </Badge>
  )
}

function MentionTypeBadge({ type }: { type: "direct" | "indirect" | "absent" }) {
  const config = {
    direct: { label: "Directa", className: "bg-success/15 text-success border-success/30" },
    indirect: { label: "Indirecta", className: "bg-warning/15 text-warning border-warning/30" },
    absent: { label: "Ausente", className: "bg-destructive/15 text-destructive border-destructive/30" },
  }
  const c = config[type]
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  )
}

const QUERY_TYPE_LABELS: Record<string, string> = {
  directa: "Directa",
  proximidad: "Proximidad",
  precios: "Precios",
  opiniones: "Opiniones",
  horario: "Horario",
  mejor: "Mejor",
}

export function QueryResultsTable({ queries }: QueryResultsTableProps) {
  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Consulta</TableHead>
              <TableHead className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Tipo</TableHead>
              <TableHead className="text-foreground/70 text-xs font-semibold uppercase tracking-wider text-center">Map Pack</TableHead>
              <TableHead className="text-foreground/70 text-xs font-semibold uppercase tracking-wider text-center">Posicion MP</TableHead>
              <TableHead className="text-foreground/70 text-xs font-semibold uppercase tracking-wider text-center">AI Overview</TableHead>
              <TableHead className="text-foreground/70 text-xs font-semibold uppercase tracking-wider text-center">Mencion AI</TableHead>
              <TableHead className="text-foreground/70 text-xs font-semibold uppercase tracking-wider text-center">Organico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((q, i) => (
              <TableRow key={i} className="border-border/30 hover:bg-secondary/30">
                <TableCell className="max-w-[200px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1.5 text-sm text-foreground truncate cursor-help">
                        {q.query}
                        <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-card border-border text-card-foreground max-w-xs">
                      <p className="text-xs">Busqueda: &quot;{q.query}&quot;</p>
                      {q.mapPack.competitors.length > 0 && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          Competidores: {q.mapPack.competitors.join(", ")}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                    {QUERY_TYPE_LABELS[q.queryType] || q.queryType}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <StatusIcon present={q.mapPack.present} label="Si" />
                </TableCell>
                <TableCell className="text-center">
                  <PositionBadge position={q.mapPack.position} />
                </TableCell>
                <TableCell className="text-center">
                  <StatusIcon present={q.aiOverview.present} label="Si" />
                </TableCell>
                <TableCell className="text-center">
                  <MentionTypeBadge type={q.aiOverview.mentionType} />
                </TableCell>
                <TableCell className="text-center">
                  <PositionBadge position={q.organicPosition} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
