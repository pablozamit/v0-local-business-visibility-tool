"use server"

import { runSerpQuery } from "./serpapi"
import { calculateScores, generateRecommendations, generateInternalReport, QUERY_TEMPLATES } from "./report"
import type { BusinessInput, AnalysisReport } from "./types"

export async function generateReport(business: BusinessInput): Promise<AnalysisReport> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) {
    throw new Error("SERPAPI_KEY is not defined")
  }

  // Ejecutamos las 6 busquedas en paralelo
  const queries = await Promise.all(
    QUERY_TEMPLATES.map(async (template) => {
      const queryText = template.template(business.category, business.location)
      return runSerpQuery({
        business,
        queryType: template.type,
        queryText,
        apiKey,
      })
    })
  )

  const scores = calculateScores(queries)
  const internalReport = generateInternalReport(queries, business.name)
  const recommendations = generateRecommendations(scores, queries, internalReport)

  return {
    business,
    timestamp: new Date().toISOString(),
    queries,
    scores,
    internalReport,
    recommendations,
  }
}
