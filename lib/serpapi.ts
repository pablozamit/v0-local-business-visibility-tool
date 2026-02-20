import type { BusinessInput, QueryResult } from "./types"

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

function extractAiText(payload: any): string {
  const ai = payload?.ai_overview ?? payload?.aiOverview ?? null
  if (!ai) return ""

  const parts: string[] = []

  for (const key of ["text", "summary", "snippet", "description", "content"]) {
    if (typeof ai?.[key] === "string") parts.push(ai[key])
  }

  if (Array.isArray(ai?.items)) {
    for (const item of ai.items) {
      if (typeof item === "string") parts.push(item)
      if (typeof item?.text === "string") parts.push(item.text)
      if (typeof item?.snippet === "string") parts.push(item.snippet)
    }
  }

  return parts.filter(Boolean).join("\n")
}

function parseMapPack(payload: any, businessName: string) {
  const local = Array.isArray(payload?.local_results) ? payload.local_results : []

  const competitors = local
    .slice(0, 3)
    .map((r: any) => r?.title)
    .filter((t: any) => typeof t === "string")

  const nBusiness = normalize(businessName)
  const hit = local.find((r: any) => {
    const title = typeof r?.title === "string" ? r.title : ""
    return normalize(title).includes(nBusiness)
  })

  const position = hit?.position
  const numericPosition = typeof position === "number" ? position : null

  return {
    present: local.length > 0,
    position: numericPosition !== null && numericPosition >= 1 && numericPosition <= 3 ? numericPosition : null,
    totalResults: local.length > 0 ? Math.min(3, local.length) : 0,
    competitors: competitors.filter(c => !normalize(c).includes(nBusiness)).slice(0, 3),
  }
}

function parseOrganicPosition(payload: any, businessName: string) {
  const organic = Array.isArray(payload?.organic_results) ? payload.organic_results : []
  const nBusiness = normalize(businessName)

  const hit = organic.find((r: any) => {
    const title = typeof r?.title === "string" ? r.title : ""
    const snippet = typeof r?.snippet === "string" ? r.snippet : ""
    return normalize(title).includes(nBusiness) || normalize(snippet).includes(nBusiness)
  })

  const position = hit?.position
  return typeof position === "number" ? position : null
}

function parseAiOverview(payload: any, businessName: string) {
  const aiText = extractAiText(payload)
  const present = Boolean(payload?.ai_overview || payload?.aiOverview)

  if (!present) {
    return { present: false, mentioned: false, mentionType: "absent" as const, position: null }
  }

  const mentioned = normalize(aiText).includes(normalize(businessName))

  return {
    present: true,
    mentioned,
    mentionType: mentioned ? ("direct" as const) : ("absent" as const),
    position: mentioned ? 1 : null,
  }
}

export async function runSerpQuery({
  business,
  queryType,
  queryText,
  apiKey,
}: {
  business: BusinessInput
  queryType: string
  queryText: string
  apiKey: string
}): Promise<QueryResult> {
  const params = new URLSearchParams({
    engine: "google",
    q: queryText,
    api_key: apiKey,
    google_domain: "google.es",
    gl: "es",
    hl: "es",
    device: "mobile",
    num: "10",
    // SerpAPI location expects a specific format; we pass through the user input + Spain as a best-effort.
    location: business.location.toLowerCase().includes("spain") ? business.location : `${business.location}, Spain`,
  })

  const url = `https://serpapi.com/search.json?${params.toString()}`

  const res = await fetch(url, {
    // Best-effort caching to avoid burning free-tier credits on repeated tests
    next: { revalidate: 60 * 60 },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `SerpAPI request failed (${res.status})`)
  }

  const payload = await res.json()

  return {
    query: queryText,
    queryType,
    mapPack: parseMapPack(payload, business.name),
    aiOverview: parseAiOverview(payload, business.name),
    organicPosition: parseOrganicPosition(payload, business.name),
  }
}
