"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { MapPin, Brain, TrendingDown, ArrowRight, AlertTriangle, Lightbulb, Target } from "lucide-react"
import type { AnalysisReport } from "@/lib/types"

export function ResultsDashboard({ report }: { report: AnalysisReport }) {
  const { scores, queries, recommendations, internalReport } = report

  return (
    <div className="space-y-8">
      {/* 1. VISTA CLIENTE: El dolor comercial */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Impacto de la Inteligencia Artificial</CardTitle>
            <CardDescription className="text-slate-300">
              Cómo los nuevos resultados de Google AI (AI Overviews) están afectando a tus clientes potenciales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-1">Visibilidad Antes</div>
                <div className="text-5xl font-bold">{scores.beforeScore}/100</div>
              </div>
              <div className="hidden md:flex flex-col items-center">
                <ArrowRight className="h-8 w-8 text-slate-500 mb-2" />
                <Badge variant={scores.visibilityLoss > 0 ? "destructive" : "secondary"}>
                  {scores.visibilityLoss > 0 ? `-${scores.visibilityLoss}% Perdido` : "Sin cambios"}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-1">Visibilidad Ahora</div>
                <div
                  className={`text-5xl font-bold ${scores.visibilityLoss > 20 ? "text-red-400" : scores.visibilityLoss > 0 ? "text-yellow-400" : "text-green-400"}`}
                >
                  {scores.afterScore}/100
                </div>
              </div>
            </div>
            {scores.visibilityLoss > 0 && (
              <p className="mt-6 text-sm text-slate-300 text-center bg-white/10 p-3 rounded-lg">
                La IA de Google está respondiendo a las dudas de tus clientes directamente en la página de resultados, empujando tu web hacia abajo y reduciendo el tráfico a tu negocio.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas Clave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Map Pack (Top 3)</span>
                </div>
                <span className="font-bold">{scores.mapPackScore}/100</span>
              </div>
              <Progress value={scores.mapPackScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Presencia en el mapa local</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">AI Overviews</span>
                </div>
                <span className="font-bold">{scores.aiOverviewScore}/100</span>
              </div>
              <Progress value={scores.aiOverviewScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Menciones como fuente en IA</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. VISTA INTERNA / DIAGNÓSTICO */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="bg-blue-50/50 pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Diagnóstico Interno (Oportunidades)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {internalReport.insights.map((insight, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                {insight.type === "critical" && <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                {insight.type === "warning" && <TrendingDown className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />}
                {insight.type === "opportunity" && <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />}
                {insight.type === "success" && <Target className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
                
                <div>
                  <div className="text-sm font-semibold">{insight.metric}</div>
                  <div className="text-sm text-muted-foreground">{insight.message}</div>
                </div>
              </div>
            ))}
            
            {internalReport.topCompetitors.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-semibold mb-2">Rivales robando cuota de mercado:</div>
                <div className="flex flex-wrap gap-2">
                  {internalReport.topCompetitors.map(c => (
                    <Badge key={c.name} variant="outline" className="bg-slate-50">
                      {c.name} ({c.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan de Acción Recomendado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex flex-col gap-1 border-b last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{rec.title}</span>
                  <Badge
                    variant={
                      rec.impact === "high" ? "destructive" : rec.impact === "medium" ? "default" : "secondary"
                    }
                  >
                    {rec.impact === "high" ? "Prioridad Alta" : "Prioridad Media"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                <div className="text-xs font-medium text-slate-500 mt-1">Área: {rec.category}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 3. DESGLOSE TÉCNICO (Query por Query) */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Búsqueda</CardTitle>
          <CardDescription>Análisis granular de la visibilidad para cada intención de búsqueda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Búsqueda (Query)</th>
                  <th className="pb-3 font-medium text-muted-foreground">Map Pack</th>
                  <th className="pb-3 font-medium text-muted-foreground">Orgánico</th>
                  <th className="pb-3 font-medium text-muted-foreground">AI Overview</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((q, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 font-medium">{q.query}</td>
                    <td className="py-3">
                      {q.mapPack.position ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Top {q.mapPack.position}</Badge>
                      ) : q.mapPack.present ? (
                        <Badge variant="outline" className="text-yellow-600">No aparece</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">No mostrado</span>
                      )}
                    </td>
                    <td className="py-3">
                      {q.organicPosition ? (
                        <span className="font-medium">#{q.organicPosition}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3">
                      {q.aiOverview.present ? (
                        q.aiOverview.mentioned ? (
                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Mencionado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-500 border-red-200">Excluido</Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">Sin IA</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
