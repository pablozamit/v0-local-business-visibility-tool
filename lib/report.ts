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
  // We evaluate each query individually to reward ANY presence, rather than punishing absences strictly.
  let totalBeforePoints = 0
  
  // Calculate Map Pack performance separately to show in UI
  let mapPackPoints = 0
  let mapPackPossible = 0

  for (const q of queries) {
    let queryPoints = 0
    
    // Map Pack is king for local (max 100 points per query)
    if (q.mapPack.present) {
      mapPackPossible += 100
      if (q.mapPack.position !== null) {
        // 1st = 100, 2nd = 80, 3rd = 60
        const mpScore = q.mapPack.position === 1 ? 100 : q.mapPack.position === 2 ? 80 : 60
        queryPoints += mpScore
        mapPackPoints += mpScore
      }
    } else {
      // If map pack doesn't trigger for this query, don't penalize as heavily
      mapPackPossible += 50 
    }

    // Organic fallback (max 100 points)
    let organicScore = 0
    if (q.organicPosition !== null && q.organicPosition > 0) {
      // Top 10 organic gets points. #1 = 100, #10 = 10.
      organicScore = Math.max(0, 100 - (q.organicPosition - 1) * 10)
    }

    // A query's total before score takes the BEST of Map Pack or Organic, 
    // plus a small bonus if both are present.
    if (queryPoints > 0 && organicScore > 0) {
      queryPoints = Math.max(queryPoints, organicScore) + 10 // Synergy bonus
    } else {
      queryPoints = Math.max(queryPoints, organicScore)
    }

    totalBeforePoints += Math.min(100, queryPoints)
  }

  // Average the points across all queries for the final "Before" score
  const beforeScore = Math.round(totalBeforePoints / queries.length)
  const mapPackScore = mapPackPossible > 0 ? Math.round((mapPackPoints / mapPackPossible) * 100) : 0

  // 2. Calculate AFTER score (Impact of AI Overviews)
  // AI Overviews push everything down. If an AIO is present and you are NOT in it, you lose visibility.
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
        // You are in the AIO! This is a huge win. You keep your points and get a bonus.
        const aScore = q.aiOverview.mentionType === "direct" ? 100 : 70
        aiPoints += aScore
        currentQueryPoints = Math.min(100, currentQueryPoints + 20) 
      } else {
        // AIO is present, but you are NOT in it.
        // It pushes down organic and map pack results. Huge penalty to actual visibility.
        // If you relied on organic, you lose ~60% of clicks. If Map Pack, ~40%.
        const penaltyMultiplier = q.mapPack.position !== null ? 0.6 : 0.4
        currentQueryPoints = currentQueryPoints * penaltyMultiplier
      }
    }

    totalAfterPoints += currentQueryPoints
  }

  const aiOverviewScore = aiPossible > 0 ? Math.round((aiPoints / aiPossible) * 100) : 0
  const afterScore = Math.round(totalAfterPoints / queries.length)
  
  // Real calculation of loss based on the shift
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
    // 1. Competitor tracking
    if (q.mapPack.present && q.mapPack.competitors) {
      for (const comp of q.mapPack.competitors) {
        competitorCounts[comp] = (competitorCounts[comp] || 0) + 1
      }
    }

    // 2. Track specific query failures
    if (q.mapPack.position !== null) hasMapPackPresence = true
    if (q.organicPosition !== null && q.organicPosition <= 10) organicRanks++

    // High organic, but missing from local map pack (Local SEO gap)
    if (q.organicPosition !== null && q.organicPosition <= 10 && q.mapPack.present && q.mapPack.position === null) {
      organicButNoLocal.push(q.query)
    }

    // AI Overview triggered, but client not mentioned (AI SEO gap)
    if (q.aiOverview.present && !q.aiOverview.mentioned) {
      untappedAiQueries.push(q.query)
      
      // If they used to rank page 1 or Map Pack but missed AI, it's a direct loss
      if (q.mapPack.position !== null || (q.organicPosition !== null && q.organicPosition <= 5)) {
        lostVisibilityQueries.push(q.query)
      }
    }
  }

  // Compile Top Competitors
  const topCompetitors = Object.entries(competitorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  // Generate Insights
  if (!hasMapPackPresence) {
    insights.push({
      type: "critical",
      metric: "Google Business Profile",
      message: "Cero presencia en el Local Pack (Top 3). Necesita optimización URGENTE de GBP y citaciones."
    })
  }

  if (organicButNoLocal.length > 0) {
    insights.push({
      type: "opportunity",
      metric: "Local SEO vs Organic",
      message: `Buen SEO orgánico pero falla en local para: ${organicButNoLocal.slice(0, 2).join(", ")}. Fácil de arreglar vinculando la web al perfil de Google.`
    })
  }

  if (untappedAiQueries.length > 0) {
    insights.push({
      type: "warning",
      metric: "AI Overviews",
      message: `Google está usando IA para ${untappedAiQueries.length} búsquedas donde el cliente no aparece. Los competidores están robando estos clics.`
    })
  }

  if (topCompetitors.length > 0) {
    insights.push({
      type: "warning",
      metric: "Competidores",
      message: `"${topCompetitors[0].name}" domina el mapa (aparece en ${topCompetitors[0].count} búsquedas). Hay que auditar sus reseñas y categorías.`
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

  // 1. GBP is always the highest ROI for local businesses if they are missing
  if (scores.mapPackScore < 50) {
    recs.push({
      title: "Optimización radical del Google Business Profile",
      description: "Tu perfil no está entrando en el Top 3. Necesitamos optimizar categorías primarias/secundarias, subir fotos geoetiquetadas y asegurar consistencia NAP (Name, Address, Phone).",
      impact: "high",
      category: "Local SEO",
    })
  }

  // 2. AI Overviews
  if (internalReport.untappedAiQueries.length > 0) {
    recs.push({
      title: "Estrategia de Contenido para AI Overviews",
      description: "Google está mostrando respuestas generadas por IA para tus búsquedas clave, pero cita a otros. Necesitamos estructurar tu web con formato Q&A (Pregunta-Respuesta) directo.",
      impact: "high",
      category: "AI SEO",
    })
  }

  // 3. Bridging Organic and Local
  if (internalReport.organicButNoLocal.length > 0) {
    recs.push({
      title: "Sincronización Web-Mapa (Schema Markup)",
      description: "Tu web posiciona bien, pero Google no la asocia fuertemente con tu local físico. Implementaremos código Schema LocalBusiness para forzar esa conexión.",
      impact: "high",
      category: "Technical SEO",
    })
  }

  // 4. Reputation
  const hasLowReviews = queries.some(q => q.queryType === "opiniones" && !q.mapPack.position)
  if (hasLowReviews || scores.mapPackScore < 80) {
    recs.push({
      title: "Sistema Automatizado de Reseñas",
      description: "La cantidad y frescura de las reseñas es el factor #1 para entrar al mapa. Instalaremos un embudo para captar reseñas de 5 estrellas de clientes recurrentes.",
      impact: "medium",
      category: "Reputación",
    })
  }

  // 5. General Authority
  recs.push({
    title: "Creación de Señales de Autoridad Local",
    description: "Para superar a los competidores atrincherados en el mapa, necesitamos menciones de tu negocio en prensa local, directorios específicos del sector y blogs de la ciudad.",
    impact: "medium",
    category: "Off-page SEO",
  })

  return recs
}
