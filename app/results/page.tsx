import { generateReport } from "@/lib/actions"
import { ResultsDashboard } from "@/components/results-dashboard"
import { AlertCircle } from "lucide-react"

export default async function Page({
  searchParams,
}: {
  searchParams: { name?: string; location?: string; category?: string }
}) {
  if (!searchParams.name || !searchParams.location || !searchParams.category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">Faltan datos</h2>
        <p className="text-muted-foreground max-w-md">
          Por favor, vuelve a la página principal y completa todos los campos del formulario para generar un informe.
        </p>
      </div>
    )
  }

  const business = {
    name: searchParams.name,
    location: searchParams.location,
    category: searchParams.category,
  }

  const report = await generateReport(business)

  return (
    <div className="container py-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Auditoría de Visibilidad: {business.name}</h1>
        <p className="text-muted-foreground">
          Análisis en {business.location} para el sector "{business.category}" • Generado el{" "}
          {new Date(report.timestamp).toLocaleDateString("es-ES")}
        </p>
      </div>

      <ResultsDashboard report={report} />
    </div>
  )
}
