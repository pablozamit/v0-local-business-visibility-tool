import type { QueryResult, Recommendation, InternalReport, InternalInsight } from "./types"

export const QUERY_TEMPLATES = [
  { type: "directa", template: (cat: string, loc: string) => `${cat} ${loc}` },
  { type: "proximidad", template: (cat: string, loc: string) => `${cat} cerca de mí en ${loc}` },
  { type: "precios", template: (cat: string, loc: string) => `${cat} ${loc} precios` },
  { type: "opiniones", template: (cat: string, loc: string) => `${cat} ${loc} opiniones` },
  { type: "horario", template: (cat: string, loc: string) => `${cat} ${loc} horario` },
  { type: "mejor", template: (cat: string, loc: string) => `mejor ${cat} en ${loc}` },
]

export function calculateScores(queries: QueryResult[]) {
  // 1. Calculate BEFORE score (Map Pack + Organic)
  let totalBeforePoints = 0
  
  let mapPackPoints = 0
  let mapPackPossible = 0

  for (const q of queries) {
    let queryPoints = 0
    
    if (q.mapPack.present) {
      mapPackPossible += 100
      if (q.mapPack.position !== null) {
        const mpScore = q.mapPack.position === 1 ? 100 : q.mapPack.position === 2 ? 80 : 60
        queryPoints += mpScore
        mapPackPoints += mpScore
      }
    } else {
      mapPackPossible += 50 
    }

    let organicScore = 0
    if (q.organicPosition !== null && q.organicPosition > 0) {
      organicScore = Math.max(0, 100 - (q.organicPosition - 1) * 10)
    }

    if (queryPoints > 0 && organicScore > 0) {
      queryPoints = Math.max(queryPoints, organicScore) + 10
    } else {
      queryPoints = Math.max(queryPoints, organicScore)
    }

    totalBeforePoints += Math.min(100, queryPoints)
  }

  const beforeScore = Math.round(totalBeforePoints / queries.length)
  const mapPackScore = mapPackPossible > 0 ? Math.round((mapPackPoints / mapPackPossible) * 100) : 0

  // 2. Calculate AFTER score (Impact of AI Overviews)
  let totalAfterPoints = 0
  let aiPoints = 0
  let aiPossible = 0

  for (const q of queries) {
    let currentQueryPoints = Math.min(100, 
      Math.max(
        q.mapPack.position ? (100 - (q.mapPack.position - 1) * 20) : 0,
        q.organicPosition ? Math.max(0, 100 - (q.organicPosition - 1) * 10) : 0
      )
    )

    if (q.aiOverview.present) {
      aiPossible += 100
      if (q.aiOverview.mentioned) {
        const aScore = q.aiOverview.mentionType === "direct" ? 100 : 70
        aiPoints += aScore
        currentQueryPoints = Math.min(100, currentQueryPoints + 20) 
      } else {
        const penaltyMultiplier = q.mapPack.position !== null ? 0.6 : 0.4
        currentQueryPoints = currentQueryPoints * penaltyMultiplier
      }
    }

    totalAfterPoints += currentQueryPoints
  }

  const aiOverviewScore = aiPossible > 0 ? Math.round((aiPoints / aiPossible) * 100) : 0
  const afterScore = Math.round(totalAfterPoints / queries.length)
  
  const visibilityLoss = beforeScore > afterScore 
    ? Math.round(((beforeScore - afterScore) / beforeScore) * 100) 
    : 0

  return { mapPackScore, aiOverviewScore, beforeScore, afterScore, visibilityLoss }
}

export function generateInternalReport(queries: QueryResult[], businessName: string): InternalReport {
  const competitorCounts: Record<string, number> = {}
  const lostVisibilityQueries: string[] = []
  const untappedAiQueries: string[] = []
  const organicButNoLocal: string[] = []
  const insights: InternalInsight[] = []

  let hasMapPackPresence = false
  let organicRanks = 0

  for (const q of queries) {
    if (q.mapPack.present && q.mapPack.competitors) {
      for (const comp of q.mapPack.competitors) {
        competitorCounts[comp] = (competitorCounts[comp] || 0) + 1
      }
    }

    if (q.mapPack.position !== null) hasMapPackPresence = true
    if (q.organicPosition !== null && q.organicPosition <= 10) organicRanks++

    if (q.organicPosition !== null && q.organicPosition <= 10 && q.mapPack.present && q.mapPack.position === null) {
      organicButNoLocal.push(q.query)
    }

    if (q.aiOverview.present && !q.aiOverview.mentioned) {
      untappedAiQueries.push(q.query)
      
      if (q.mapPack.position !== null || (q.organicPosition !== null && q.organicPosition <= 5)) {
        lostVisibilityQueries.push(q.query)
      }
    }
  }

  const topCompetitors = Object.entries(competitorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  if (!hasMapPackPresence) {
    insights.push({
      type: "critical",
      metric: "Pérdida de Clics Calientes",
      message: "Tus competidores se están llevando a los pacientes que buscan urgencias o proximidad porque no figuras en el mapa principal."
    })
  }

  if (organicButNoLocal.length > 0) {
    insights.push({
      type: "opportunity",
      metric: "Tráfico Desperdiciado",
      message: `El cliente te encuentra en texto, pero se va a la competencia en el mapa para las búsquedas más importantes.`
    })
  }

  if (untappedAiQueries.length > 0) {
    insights.push({
      type: "warning",
      metric: "Fuga de Autoridad a la IA",
      message: `Google está recomendando a otros negocios usando IA en ${untappedAiQueries.length} intenciones de búsqueda clave.`
    })
  }

  if (topCompetitors.length > 0) {
    insights.push({
      type: "warning",
      metric: "Robo de Cuota Local",
      message: `"${topCompetitors[0].name}" es la barrera principal que impide que tu negocio capte el 100% del tráfico de tu zona.`
    })
  }

  return {
    topCompetitors,
    lostVisibilityQueries,
    untappedAiQueries,
    organicButNoLocal,
    insights
  }
}

export function generateRecommendations(
  scores: ReturnType<typeof calculateScores>,
  queries: QueryResult[],
  internalReport: InternalReport
): Recommendation[] {
  const recs: Recommendation[] = []

  // Vaguer hooks that require the agency to implement
  if (scores.mapPackScore < 50) {
    recs.push({
      title: "Desbloqueo del Top 3 en Google Maps",
      description: "Auditoría profunda y reestructuración de la ficha de negocio para forzar el algoritmo de Google a mostrarte por encima de tu competencia local directa.",
      impact: "high",
      category: "Adquisición Local",
    })
  }

  if (internalReport.untappedAiQueries.length > 0) {
    recs.push({
      title: "Adaptación Urgente a AI Overviews",
      description: "Implementación de arquitectura de datos avanzada en tu web para que la nueva Inteligencia Artificial de Google te cite como referente en lugar de a tus competidores.",
      impact: "high",
      category: "Visibilidad Futura",
    })
  }

  if (internalReport.organicButNoLocal.length > 0) {
    recs.push({
      title: "Sincronización de Entidades Orgánico-Local",
      description: "Alineación técnica entre tu autoridad web y tu presencia física para transferir todo el peso SEO hacia el mapa de Google.",
      impact: "high",
      category: "Optimización Técnica",
    })
  }

  const hasLowReviews = queries.some(q => q.queryType === "opiniones" && !q.mapPack.position)
  if (hasLowReviews || scores.mapPackScore < 80) {
    recs.push({
      title: "Activación de Señales de Confianza",
      description: "Despliegue de un sistema de captación y gestión de la reputación que envía señales positivas constantes a Google para consolidar tu posición dominante.",
      impact: "medium",
      category: "Conversión",
    })
  }

  recs.push({
    title: "Blindaje de Cuota de Mercado Local",
    description: "Creación de un ecosistema de presencia local digital (citaciones estructuradas) que blinda tu negocio frente a los intentos de la competencia por quitarte el puesto.",
    impact: "medium",
    category: "Defensa Estratégica",
  })

  return recs
}
