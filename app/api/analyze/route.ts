import { NextResponse } from "next/server"
import { z } from "zod"

import type { BusinessInput } from "@/lib/types"
import { runSerpQuery } from "@/lib/serpapi"
import { calculateScores, generateRecommendations, QUERY_TEMPLATES } from "@/lib/report"

export const runtime = "nodejs"

const BusinessInputSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  category: z.string().min(2),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const business = BusinessInputSchema.parse(body) as BusinessInput

    const apiKey = process.env.SERPAPI_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing SERPAPI_KEY env var" },
        { status: 500 }
      )
    }

    // Concurrency-limited execution (avoids bursts and plays nicer with free tiers)
    const results = [] as Awaited<ReturnType<typeof runSerpQuery>>[]
    const templates = QUERY_TEMPLATES.map(t => ({
      queryType: t.type,
      queryText: t.template(business.category, business.location),
    }))

    const CONCURRENCY = 2
    for (let i = 0; i < templates.length; i += CONCURRENCY) {
      const slice = templates.slice(i, i + CONCURRENCY)
      const batch = await Promise.all(
        slice.map(({ queryType, queryText }) =>
          runSerpQuery({
            business,
            queryType,
            queryText,
            apiKey,
          })
        )
      )
      results.push(...batch)
    }

    const scores = calculateScores(results)
    const recommendations = generateRecommendations(scores, results)

    return NextResponse.json({
      business,
      timestamp: new Date().toISOString(),
      queries: results,
      scores,
      recommendations,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
