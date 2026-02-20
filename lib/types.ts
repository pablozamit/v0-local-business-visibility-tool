export interface BusinessInput {
  name: string
  location: string
  category: string
}

export interface MapPackResult {
  present: boolean
  position: number | null
  totalResults: number
  competitors: string[]
}

export interface AiOverviewResult {
  present: boolean
  mentioned: boolean
  mentionType: "direct" | "indirect" | "absent"
  position: number | null
}

export interface QueryResult {
  query: string
  queryType: string
  mapPack: MapPackResult
  aiOverview: AiOverviewResult
  organicPosition: number | null
}

export interface Recommendation {
  title: string
  description: string
  impact: "high" | "medium" | "low"
  category: string
}

export interface InternalInsight {
  type: "warning" | "opportunity" | "critical" | "success"
  message: string
  metric: string
}

export interface InternalReport {
  topCompetitors: { name: string; count: number }[]
  lostVisibilityQueries: string[]
  untappedAiQueries: string[]
  organicButNoLocal: string[]
  insights: InternalInsight[]
}

export interface AnalysisReport {
  business: BusinessInput
  timestamp: string
  queries: QueryResult[]
  scores: {
    mapPackScore: number
    aiOverviewScore: number
    beforeScore: number
    afterScore: number
    visibilityLoss: number
  }
  recommendations: Recommendation[]
  internalReport: InternalReport
}
