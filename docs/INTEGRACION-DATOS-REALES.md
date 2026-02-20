# VisibilidadAIO - Guia de Integracion con Datos Reales

## Estado Actual

La aplicacion usa un **motor de simulacion** (`lib/simulation.ts`) que genera datos falsos con un generador pseudoaleatorio. Para obtener datos reales al 100%, necesitas reemplazar ese motor por llamadas a APIs reales de SERP y analisis con IA.

---

## Arquitectura Objetivo

```
Usuario introduce datos
        |
        v
  API Route (/api/analyze)
        |
        +---> API de SERP (SerpAPI / DataForSEO / ValueSERP)
        |         |
        |         v
        |     Resultados SERP reales (Map Pack, organicos, AI Overview)
        |
        +---> API de Gemini (analisis de AI Overview)
        |         |
        |         v
        |     Extraccion de menciones del negocio en el texto de AI Overview
        |
        v
  Calculo de scores reales
        |
        v
  Generacion de recomendaciones basadas en datos reales
        |
        v
  Reporte final al usuario
```

---

## Paso 1: Elegir un Proveedor de SERP API

Necesitas una API que devuelva resultados de Google Search estructurados, incluyendo Map Pack y AI Overviews.

### Opcion A: SerpAPI (Recomendada)

- **Web**: https://serpapi.com
- **Precio**: Desde $50/mes (100 busquedas). Plan gratuito con 100 busquedas/mes.
- **Ventaja**: Devuelve `ai_overview` y `local_results` (Map Pack) como JSON estructurado.
- **Documentacion**: https://serpapi.com/search-api

```bash
npm install serpapi
```

### Opcion B: DataForSEO

- **Web**: https://dataforseo.com
- **Precio**: Pay-per-task (~$0.0020 por busqueda SERP).
- **Ventaja**: Muy barato a escala, soporte completo de AI Overviews.
- **Documentacion**: https://docs.dataforseo.com/v3/serp/google/organic/live/

### Opcion C: ValueSERP

- **Web**: https://www.valueserp.com
- **Precio**: Desde $50/mes (5000 busquedas).
- **Ventaja**: Buena relacion calidad-precio.
- **Documentacion**: https://www.valueserp.com/docs

---

## Paso 2: Configurar Variables de Entorno

Crea o agrega las siguientes variables en tu proyecto de Vercel (seccion Vars del sidebar):

```env
# Elige UNA de estas segun tu proveedor:
SERPAPI_API_KEY=tu_clave_de_serpapi
# o
DATAFORSEO_LOGIN=tu_login
DATAFORSEO_PASSWORD=tu_password
# o
VALUESERP_API_KEY=tu_clave_de_valueserp

# Para analisis de AI Overview con Gemini (opcional pero recomendado):
GEMINI_API_KEY=tu_clave_de_gemini
```

---

## Paso 3: Crear la API Route

Crea el archivo `app/api/analyze/route.ts`. Este endpoint reemplaza la llamada local a `generateReport()`.

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server"
import type { BusinessInput, VisibilityReport, QueryResult, Recommendation } from "@/lib/types"

const SERPAPI_KEY = process.env.SERPAPI_API_KEY

// Plantillas de consultas (las mismas 6 del simulador)
const QUERY_TEMPLATES = [
  { type: "directa", template: (cat: string, loc: string) => `${cat} ${loc}` },
  { type: "proximidad", template: (cat: string, loc: string) => `${cat} cerca de mí en ${loc}` },
  { type: "precios", template: (cat: string, loc: string) => `${cat} ${loc} precios` },
  { type: "opiniones", template: (cat: string, loc: string) => `${cat} ${loc} opiniones` },
  { type: "horario", template: (cat: string, loc: string) => `${cat} ${loc} horario` },
  { type: "mejor", template: (cat: string, loc: string) => `mejor ${cat} en ${loc}` },
]

async function searchGoogle(query: string): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({
    api_key: SERPAPI_KEY!,
    engine: "google",
    q: query,
    location: "Spain",   // Ajustar segun el mercado
    google_domain: "google.es",
    gl: "es",
    hl: "es",
  })

  const response = await fetch(`https://serpapi.com/search?${params}`)
  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.statusText}`)
  }
  return response.json()
}

function parseMapPack(
  serpData: Record<string, unknown>,
  businessName: string
): QueryResult["mapPack"] {
  const localResults = serpData.local_results as
    | { places?: Array<{ title: string }> }
    | undefined

  if (!localResults?.places?.length) {
    return { present: false, position: null, totalResults: 0, competitors: [] }
  }

  const places = localResults.places
  const normalizedBusiness = businessName.toLowerCase()

  let position: number | null = null
  const competitors: string[] = []

  places.forEach((place, index) => {
    const title = place.title?.toLowerCase() || ""
    if (title.includes(normalizedBusiness) || normalizedBusiness.includes(title)) {
      position = index + 1
    } else {
      competitors.push(place.title)
    }
  })

  return {
    present: true,
    position,
    totalResults: places.length,
    competitors: competitors.slice(0, 3),
  }
}

function parseAiOverview(
  serpData: Record<string, unknown>,
  businessName: string
): QueryResult["aiOverview"] {
  const aiOverview = serpData.ai_overview as
    | { text?: string; sources?: Array<{ title: string; link: string }> }
    | undefined

  if (!aiOverview) {
    return { present: false, mentioned: false, mentionType: "absent", position: null }
  }

  const text = (aiOverview.text || "").toLowerCase()
  const normalizedBusiness = businessName.toLowerCase()
  const mentioned = text.includes(normalizedBusiness)

  let mentionType: "direct" | "indirect" | "absent" = "absent"
  let position: number | null = null

  if (mentioned) {
    // Buscar posicion en el texto (primera oracion donde aparece)
    const sentences = text.split(/[.!?]/).filter(Boolean)
    const mentionIndex = sentences.findIndex(s => s.includes(normalizedBusiness))
    position = mentionIndex !== -1 ? mentionIndex + 1 : 1
    mentionType = "direct"
  } else if (aiOverview.sources?.some(s => s.title.toLowerCase().includes(normalizedBusiness))) {
    mentionType = "indirect"
    mentioned // es false pero se cita como fuente
  }

  return {
    present: true,
    mentioned: mentioned || mentionType === "indirect",
    mentionType,
    position,
  }
}

function parseOrganicPosition(
  serpData: Record<string, unknown>,
  businessName: string
): number | null {
  const organicResults = serpData.organic_results as
    | Array<{ position: number; title: string; link: string }>
    | undefined

  if (!organicResults) return null

  const normalizedBusiness = businessName.toLowerCase()
  const match = organicResults.find(
    (r) =>
      r.title?.toLowerCase().includes(normalizedBusiness) ||
      r.link?.toLowerCase().includes(normalizedBusiness.replace(/\s+/g, ""))
  )

  return match?.position ?? null
}

export async function POST(request: NextRequest) {
  try {
    const body: BusinessInput = await request.json()

    if (!body.name || !body.location || !body.category) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: name, location, category" },
        { status: 400 }
      )
    }

    if (!SERPAPI_KEY) {
      return NextResponse.json(
        { error: "SERPAPI_API_KEY no configurada" },
        { status: 500 }
      )
    }

    // Ejecutar todas las busquedas
    const queries: QueryResult[] = []

    for (const { type, template } of QUERY_TEMPLATES) {
      const queryText = template(body.category, body.location)
      const serpData = await searchGoogle(queryText)

      queries.push({
        query: queryText,
        queryType: type,
        mapPack: parseMapPack(serpData, body.name),
        aiOverview: parseAiOverview(serpData, body.name),
        organicPosition: parseOrganicPosition(serpData, body.name),
      })

      // Rate limiting: esperar 1s entre peticiones
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Calcular scores (misma logica que simulation.ts)
    const scores = calculateScores(queries)
    const recommendations = generateRecommendations(scores, queries)

    const report: VisibilityReport = {
      business: body,
      timestamp: new Date().toISOString(),
      queries,
      scores,
      recommendations,
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error en analisis:", error)
    return NextResponse.json(
      { error: "Error al realizar el analisis. Intenta de nuevo." },
      { status: 500 }
    )
  }
}

// ---------- CALCULOS (copiar de lib/simulation.ts) ----------

function calculateScores(queries: QueryResult[]) {
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

  const beforeScore = Math.min(100, Math.round(
    mapPackScore * 0.6 +
    queries.reduce((acc, q) => acc + (q.organicPosition ? Math.max(0, 100 - q.organicPosition * 5) : 0), 0) / queries.length * 0.4
  ))

  const aiPenalty = queries.filter(q => q.aiOverview.present && !q.aiOverview.mentioned).length / Math.max(1, queries.length)
  const afterScore = Math.max(0, Math.round(beforeScore * (1 - aiPenalty * 0.55)))
  const visibilityLoss = beforeScore > 0 ? Math.round(((beforeScore - afterScore) / beforeScore) * 100) : 0

  return { mapPackScore, aiOverviewScore, beforeScore, afterScore, visibilityLoss }
}

function generateRecommendations(
  scores: ReturnType<typeof calculateScores>,
  queries: QueryResult[]
): Recommendation[] {
  // Misma logica que lib/simulation.ts - genera recomendaciones
  // basadas en los scores REALES
  const recs: Recommendation[] = []

  if (scores.aiOverviewScore < 40) {
    recs.push({
      title: "Optimizar contenido para AI Overviews",
      description: "Crea contenido estructurado con preguntas y respuestas claras. Google AI prioriza fuentes que proporcionan respuestas directas y bien organizadas.",
      impact: "high",
      category: "Contenido",
    })
  }

  if (scores.mapPackScore < 50) {
    recs.push({
      title: "Mejorar perfil de Google Business",
      description: "Completa al 100% tu perfil de Google Business Profile: fotos actualizadas, horarios exactos, descripcion detallada y categorias correctas.",
      impact: "high",
      category: "Google Business",
    })
  }

  recs.push({
    title: "Implementar Schema Markup LocalBusiness",
    description: "Agrega datos estructurados Schema.org de tipo LocalBusiness en tu sitio web para mejorar la comprension de Google sobre tu negocio.",
    impact: "high",
    category: "SEO Tecnico",
  })

  if (scores.visibilityLoss > 30) {
    recs.push({
      title: "Diversificar canales de adquisicion",
      description: "No dependas solo de Google Search. Desarrolla presencia en redes sociales, directorios locales, y plataformas especificas de tu industria.",
      impact: "medium",
      category: "Estrategia",
    })
  }

  recs.push({
    title: "Crear contenido E-E-A-T",
    description: "Desarrolla contenido que demuestre Experiencia, Conocimiento, Autoridad y Confianza. Los AI Overviews priorizan fuentes con alto E-E-A-T.",
    impact: "medium",
    category: "Contenido",
  })

  recs.push({
    title: "Crear FAQPage estructurada",
    description: "Agrega una seccion de preguntas frecuentes con Schema FAQPage. Este formato es altamente compatible con AI Overviews y featured snippets.",
    impact: "medium",
    category: "SEO Tecnico",
  })

  return recs
}
```

---

## Paso 4: Modificar el Frontend para Usar la API Real

Reemplazar la llamada al simulador en `app/page.tsx`:

### Antes (simulado):
```typescript
import { generateReport } from "@/lib/simulation"

const handleSubmit = useCallback((data: BusinessInput) => {
  setIsLoading(true)
  setTimeout(() => {
    const result = generateReport(data)
    setReport(result)
    setIsLoading(false)
  }, 1500)
}, [])
```

### Despues (datos reales):
```typescript
// Ya no importar generateReport de simulation

const handleSubmit = useCallback(async (data: BusinessInput) => {
  setIsLoading(true)
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || "Error en el analisis")
    }

    const result: VisibilityReport = await response.json()
    setReport(result)
  } catch (error) {
    console.error("Error:", error)
    // Mostrar error al usuario
  } finally {
    setIsLoading(false)
  }
}, [])
```

---

## Paso 5 (Opcional): Analisis Avanzado con Gemini

Para analizar el texto del AI Overview con mayor precision (detectar menciones indirectas, contexto, sentimiento), integra la API de Gemini:

```typescript
// lib/gemini-analyzer.ts

const GEMINI_KEY = process.env.GEMINI_API_KEY

interface AiAnalysis {
  mentioned: boolean
  mentionType: "direct" | "indirect" | "absent"
  sentiment: "positive" | "neutral" | "negative"
  context: string
  position: number | null
}

export async function analyzeAiOverviewWithGemini(
  aiOverviewText: string,
  businessName: string
): Promise<AiAnalysis> {
  const prompt = `Analiza el siguiente texto de un AI Overview de Google Search.
Determina si el negocio "${businessName}" es mencionado.

Texto del AI Overview:
"""
${aiOverviewText}
"""

Responde en JSON con este formato exacto:
{
  "mentioned": true/false,
  "mentionType": "direct" | "indirect" | "absent",
  "sentiment": "positive" | "neutral" | "negative",
  "context": "breve descripcion de como se menciona",
  "position": numero de la oracion donde aparece (null si no aparece)
}

Criterios:
- "direct": el nombre exacto del negocio aparece en el texto
- "indirect": se hace referencia al negocio sin nombrarlo (ej: "una clinica en la zona")
- "absent": no hay ninguna referencia al negocio
`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    }
  )

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return JSON.parse(text)
}
```

Luego en la API route, despues de obtener el AI Overview de SerpAPI:

```typescript
import { analyzeAiOverviewWithGemini } from "@/lib/gemini-analyzer"

// Dentro de parseAiOverview, si hay texto de AI Overview:
if (aiOverview?.text && process.env.GEMINI_API_KEY) {
  const analysis = await analyzeAiOverviewWithGemini(aiOverview.text, businessName)
  return {
    present: true,
    mentioned: analysis.mentioned,
    mentionType: analysis.mentionType,
    position: analysis.position,
  }
}
```

---

## Paso 6 (Opcional): Cache con Vercel KV / Upstash Redis

Para evitar gastar creditos en busquedas repetidas, cachea los resultados:

```typescript
// En la API route, antes de llamar a SerpAPI:
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()

const cacheKey = `visibility:${body.name}:${body.location}:${body.category}`.toLowerCase()
const cached = await redis.get<VisibilityReport>(cacheKey)

if (cached) {
  return NextResponse.json(cached)
}

// ... hacer las busquedas reales ...

// Guardar en cache por 24 horas
await redis.set(cacheKey, report, { ex: 86400 })
```

---

## Resumen de Cambios Necesarios

| Paso | Archivo | Accion |
|------|---------|--------|
| 1 | - | Registrarse en SerpAPI (u otro proveedor) |
| 2 | Vercel Vars | Configurar `SERPAPI_API_KEY` |
| 3 | `app/api/analyze/route.ts` | **CREAR** - API route con llamadas reales |
| 4 | `app/page.tsx` | **EDITAR** - Usar `fetch("/api/analyze")` en vez de `generateReport()` |
| 5 | `lib/gemini-analyzer.ts` | **CREAR** (opcional) - Analisis con Gemini |
| 6 | `app/api/analyze/route.ts` | **EDITAR** (opcional) - Agregar cache con Redis |
| 7 | `lib/simulation.ts` | **ELIMINAR** cuando todo funcione |

---

## Costes Estimados por Analisis

Cada analisis ejecuta 6 consultas de busqueda:

| Proveedor | Coste por analisis | Plan minimo |
|-----------|-------------------|-------------|
| SerpAPI | ~$0.30 (6 busquedas) | $50/mes (100 busquedas = ~16 analisis) |
| DataForSEO | ~$0.012 (6 busquedas) | Pay-per-use |
| ValueSERP | ~$0.06 (6 busquedas) | $50/mes (5000 busquedas = ~833 analisis) |
| Gemini (opcional) | ~$0.001 por analisis | Gratis hasta cierto limite |

---

## Notas Importantes

1. **Rate Limiting**: SerpAPI tiene limites de velocidad. El codigo incluye un `await` de 1 segundo entre peticiones. En produccion, considera usar una cola de trabajos.

2. **AI Overviews no siempre aparecen**: Google no muestra AI Overviews en todas las busquedas ni en todos los paises. Los resultados variaran.

3. **Geolocalizacion**: El parametro `location` de SerpAPI debe coincidir con ubicaciones reales de Google (ej: "Madrid, Community of Madrid, Spain"). Consulta https://serpapi.com/google-locations-api para obtener los nombres exactos.

4. **La estructura de `ai_overview` en SerpAPI puede cambiar**: Google modifica el formato de AI Overviews frecuentemente. Revisa la documentacion actualizada de tu proveedor.

5. **El tipo `QueryResult` no necesita cambios**: La interfaz de datos es la misma tanto para datos simulados como reales. Los componentes de UI no requieren modificacion.
