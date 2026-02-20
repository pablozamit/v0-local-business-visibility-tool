export interface BusinessInput {
  name: string
  location: string
  category: string
}

export interface QueryResult {
  query: string
  queryType: string
  mapPack: {
    present: boolean
    position: number | null
    totalResults: number
    competitors: string[]
  }
  aiOverview: {
    present: boolean
    mentioned: boolean
    mentionType: "direct" | "indirect" | "absent"
    position: number | null
  }
  organicPosition: number | null
}

export interface VisibilityReport {
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
}

export interface Recommendation {
  title: string
  description: string
  impact: "high" | "medium" | "low"
  category: string
}
