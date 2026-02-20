import type { QueryResult, Recommendation } from "./types"

export const QUERY_TEMPLATES = [
  { type: "directa", template: (cat: string, loc: string) => `${cat} ${loc}` },
  { type: "proximidad", template: (cat: string, loc: string) => `${cat} cerca de mí en ${loc}` },
  { type: "precios", template: (cat: string, loc: string) => `${cat} ${loc} precios` },
  { type: "opiniones", template: (cat: string, loc: string) => `${cat} ${loc} opiniones` },
  { type: "horario", template: (cat: string, loc: string) => `${cat} ${loc} horario` },
  { type: "mejor", template: (cat: string, loc: string) => `mejor ${cat} en ${loc}` },
]

export function calculateScores(queries: QueryResult[]) {
  let mapPackTotal = 0
  let mapPackCount = 0
  let aiTotal = 0
  let aiCount = 0

  for (const q of queries) {
    if (q.mapPack.present) {
      mapPackCount++
      if (q.mapPack.position !== null) {
        mapPackTotal += q.mapPack.position === 1 ? 100 : q.mapPack.position === 2 ? 75 : 50
      }
    }
    if (q.aiOverview.present) {
      aiCount++
      if (q.aiOverview.mentioned) {
        aiTotal += q.aiOverview.mentionType === "direct" ? 100 : 60
      }
    }
  }

  const mapPackScore = mapPackCount > 0 ? Math.round(mapPackTotal / mapPackCount) : 0
  const aiOverviewScore = aiCount > 0 ? Math.round(aiTotal / aiCount) : 0

  const beforeScore = Math.min(
    100,
    Math.round(
      mapPackScore * 0.6 +
        (queries.reduce((acc, q) => acc + (q.organicPosition ? Math.max(0, 100 - q.organicPosition * 5) : 0), 0) /
          queries.length) *
          0.4
    )
  )

  const aiPenalty =
    queries.filter(q => q.aiOverview.present && !q.aiOverview.mentioned).length / Math.max(1, queries.length)
  const afterScore = Math.max(0, Math.round(beforeScore * (1 - aiPenalty * 0.55)))
  const visibilityLoss = beforeScore > 0 ? Math.round(((beforeScore - afterScore) / beforeScore) * 100) : 0

  return { mapPackScore, aiOverviewScore, beforeScore, afterScore, visibilityLoss }
}

export function generateRecommendations(
  scores: ReturnType<typeof calculateScores>,
  queries: QueryResult[]
): Recommendation[] {
  const recs: Recommendation[] = []

  if (scores.aiOverviewScore < 40) {
    recs.push({
      title: "Optimizar contenido para AI Overviews",
      description:
        "Crea contenido estructurado con preguntas y respuestas claras. Google AI prioriza fuentes que proporcionan respuestas directas y bien organizadas.",
      impact: "high",
      category: "Contenido",
    })
  }

  if (scores.mapPackScore < 50) {
    recs.push({
      title: "Mejorar perfil de Google Business",
      description:
        "Completa al 100% tu perfil de Google Business Profile: fotos actualizadas, horarios exactos, descripcion detallada y categorias correctas.",
      impact: "high",
      category: "Google Business",
    })
  }

  recs.push({
    title: "Implementar Schema Markup LocalBusiness",
    description:
      "Agrega datos estructurados Schema.org de tipo LocalBusiness en tu sitio web. Esto ayuda a Google a entender y mostrar tu negocio en resultados enriquecidos.",
    impact: "high",
    category: "SEO Tecnico",
  })

  const hasLowReviews = queries.some(q => q.queryType === "opiniones" && !q.mapPack.position)
  if (hasLowReviews) {
    recs.push({
      title: "Estrategia de resenas y reputacion",
      description:
        "Implementa un sistema para solicitar resenas a clientes satisfechos. Responde a todas las resenas, positivas y negativas, de forma profesional.",
      impact: "high",
      category: "Reputacion",
    })
  }

  recs.push({
    title: "Crear contenido E-E-A-T",
    description:
      "Desarrolla contenido que demuestre Experiencia, Conocimiento, Autoridad y Confianza. Los AI Overviews priorizan fuentes con alto E-E-A-T.",
    impact: "medium",
    category: "Contenido",
  })

  recs.push({
    title: "Optimizar para busquedas conversacionales",
    description:
      "Adapta tu contenido a preguntas naturales que los usuarios hacen. Las AI Overviews se activan mas con consultas de tipo conversacional.",
    impact: "medium",
    category: "Contenido",
  })

  if (scores.visibilityLoss > 30) {
    recs.push({
      title: "Diversificar canales de adquisicion",
      description:
        "No dependas solo de Google Search. Desarrolla presencia en redes sociales, directorios locales, y plataformas especificas de tu industria.",
      impact: "medium",
      category: "Estrategia",
    })
  }

  recs.push({
    title: "Monitorear cambios en SERPs",
    description:
      "Establece un sistema de monitoreo semanal para detectar cambios en como aparece tu negocio en los resultados de busqueda y AI Overviews.",
    impact: "low",
    category: "Monitoreo",
  })

  recs.push({
    title: "Crear FAQPage estructurada",
    description:
      "Agrega una seccion de preguntas frecuentes con Schema FAQPage. Este formato es altamente compatible con AI Overviews y featured snippets.",
    impact: "medium",
    category: "SEO Tecnico",
  })

  return recs
}
