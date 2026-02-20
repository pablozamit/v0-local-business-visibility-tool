"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScoreCard } from "./score-card"
import { QueryResultsTable } from "./query-results-table"
import { VisibilityChart } from "./visibility-chart"
import { BeforeAfterChart } from "./before-after-chart"
import { RecommendationsList } from "./recommendations-list"
import {
  BarChart3,
  TableProperties,
  Lightbulb,
  TrendingDown,
  MapPin,
  Sparkles,
  Clock,
} from "lucide-react"
import type { VisibilityReport } from "@/lib/types"

interface ReportViewProps {
  report: VisibilityReport
}

export function ReportView({ report }: ReportViewProps) {
  const { scores, queries, recommendations, business, timestamp } = report

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground text-balance">
            {business.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {business.location}
            </Badge>
            <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground capitalize">
              {business.category}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(timestamp).toLocaleString("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          label="Map Pack"
          score={scores.mapPackScore}
          subtitle="Visibilidad en mapa"
          colorClass="text-primary"
        />
        <ScoreCard
          label="AI Overview"
          score={scores.aiOverviewScore}
          subtitle="Mencion en IA"
        />
        <ScoreCard
          label="Antes"
          score={scores.beforeScore}
          subtitle="Score pre-AIO"
        />
        <ScoreCard
          label="Despues"
          score={scores.afterScore}
          subtitle="Score post-AIO"
        />
      </div>

      {/* Loss Banner */}
      {scores.visibilityLoss > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-destructive/8 border border-destructive/20">
          <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Perdida de visibilidad estimada: <span className="text-destructive font-mono">{scores.visibilityLoss}%</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tu negocio podria estar perdiendo trafico organico debido a los AI Overviews de Google.
            </p>
          </div>
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="bg-secondary/60 border border-border/40">
          <TabsTrigger value="chart" className="data-[state=active]:bg-card data-[state=active]:text-foreground gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Graficos</span>
          </TabsTrigger>
          <TabsTrigger value="table" className="data-[state=active]:bg-card data-[state=active]:text-foreground gap-1.5">
            <TableProperties className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Detalle</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-card data-[state=active]:text-foreground gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Recomendaciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-4 flex flex-col gap-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Visibilidad por tipo de consulta
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Comparacion de presencia en Map Pack vs AI Overview para cada tipo de busqueda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VisibilityChart queries={queries} />
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Antes vs Despues de AI Overviews
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Impacto estimado en la visibilidad global del negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BeforeAfterChart
                beforeScore={scores.beforeScore}
                afterScore={scores.afterScore}
                visibilityLoss={scores.visibilityLoss}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <TableProperties className="h-4 w-4 text-primary" />
                Resultados por consulta
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Analisis detallado de {queries.length} consultas de busqueda simuladas
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <QueryResultsTable queries={queries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Recomendaciones
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {recommendations.length} acciones priorizadas para mejorar tu visibilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecommendationsList recommendations={recommendations} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
