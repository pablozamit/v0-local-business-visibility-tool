"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BusinessForm } from "@/components/business-form"
import { ReportView } from "@/components/report-view"
import { Eye, Search, BarChart3, Lightbulb, Sparkles } from "lucide-react"
import type { BusinessInput, VisibilityReport } from "@/lib/types"

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border/30">
      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [report, setReport] = useState<VisibilityReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (data: BusinessInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed (${res.status})`)
      }

      const result = (await res.json()) as VisibilityReport
      setReport(result)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error desconocido"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">VisibilidadAIO</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Comparador de Visibilidad Local</p>
            </div>
          </div>
          {report && (
            <button
              onClick={() => setReport(null)}
              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Nuevo analisis
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {!report ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Form Section */}
            <div className="w-full lg:w-[420px] lg:sticky lg:top-24 shrink-0">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Analizar negocio
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Introduce los datos de tu negocio para comparar su visibilidad antes y despues de AI Overviews.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {error}
                    </div>
                  )}
                  <BusinessForm onSubmit={handleSubmit} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground text-balance">
                  Descubre como AI Overviews afecta a tu negocio local
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
                  Google esta cambiando la forma en que los usuarios encuentran negocios locales.
                  Los AI Overviews pueden desplazar a los resultados tradicionales del Map Pack,
                  reduciendo significativamente la visibilidad de tu negocio.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <FeatureCard
                  icon={<Search className="h-4 w-4" />}
                  title="6 tipos de consulta"
                  description="Analizamos busquedas directas, de proximidad, precios, opiniones, horarios y calidad."
                />
                <FeatureCard
                  icon={<BarChart3 className="h-4 w-4" />}
                  title="Analisis comparativo"
                  description="Compara tu visibilidad en Map Pack vs AI Overview con datos reales."
                />
                <FeatureCard
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Score de visibilidad"
                  description="Obtén una puntuacion de 0-100 antes y despues de AI Overviews."
                />
                <FeatureCard
                  icon={<Lightbulb className="h-4 w-4" />}
                  title="Recomendaciones"
                  description="Acciones priorizadas para mejorar tu posicionamiento en el nuevo ecosistema."
                />
              </div>

              <div className="rounded-xl border border-border/30 bg-secondary/20 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Nota sobre los datos
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Este diagnostico consulta resultados reales de Google via API (configurable por ubicacion y dispositivo).
                  Como las SERPs son dinamicas, los resultados pueden variar levemente entre ejecuciones.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ReportView report={report} />
        )}
      </div>
    </main>
  )
}
