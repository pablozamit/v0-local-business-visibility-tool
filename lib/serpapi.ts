import type { BusinessInput, QueryResult } from "./types"

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }
  return matrix[b.length][a.length]
}

function isMatch(businessName: string, textToCheck: string): boolean {
  if (!textToCheck) return false
  
  const nBusiness = normalize(businessName)
  const nText = normalize(textToCheck)

  if (nText.includes(nBusiness) || nBusiness.includes(nText)) return true

  const businessTokens = nBusiness.split(" ").filter(t => t.length > 2)
  const textTokens = nText.split(" ").filter(t => t.length > 2)

  if (businessTokens.length > 0 && textTokens.length > 0) {
    let matches = 0
    for (const bt of businessTokens) {
      if (textTokens.some(tt => tt === bt || levenshteinDistance(bt, tt) <= 1)) {
        matches++
      }
    }
    if (matches / businessTokens.length >= 0.5) return true
  }

  return false
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
  // SerpAPI sometimes puts local_results inside a places array or directly at root
  const local = Array.isArray(payload?.local_results) 
    ? payload.local_results 
    : (Array.isArray(payload?.local_results?.places) ? payload.local_results.places : [])

  const competitors = local
    .slice(0, 3)
    .map((r: any) => r?.title)
    .filter((t: any) => typeof t === "string")

  const hit = local.find((r: any) => {
    const title = typeof r?.title === "string" ? r.title : ""
    return isMatch(businessName, title)
  })

  const position = hit?.position || (hit && local.indexOf(hit) + 1)
  const numericPosition = typeof position === "number" ? position : null

  return {
    present: local.length > 0,
    position: numericPosition !== null && numericPosition >= 1 && numericPosition <= 3 ? numericPosition : null,
    totalResults: local.length > 0 ? Math.min(3, local.length) : 0,
    competitors: competitors.filter(c => !isMatch(businessName, c)).slice(0, 3),
  }
}

function parseOrganicPosition(payload: any, businessName: string) {
  const organic = Array.isArray(payload?.organic_results) ? payload.organic_results : []

  const hit = organic.find((r: any) => {
    const title = typeof r?.title === "string" ? r.title : ""
    const snippet = typeof r?.snippet === "string" ? r.snippet : ""
    return isMatch(businessName, title) || isMatch(businessName, snippet)
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

  const mentioned = isMatch(businessName, aiText)

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
    device: "desktop",
    num: "10",
    // We must pass the exact standardized Google UULE string or a very specific location.
    // SerpAPI has trouble with just 'Madrid, Spain' for some accounts. 
    // Passing just the generic location usually works better if it's a major city.
    location: business.location,
  })

  const url = `https://serpapi.com/search.json?${params.toString()}`

  const res = await fetch(url, {
    // Avoid caching completely during debug
    cache: 'no-store'
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
