# Instrucciones de Integración para AntGravity / OpenCode

Esta herramienta ha sido expuesta como una API RESTful estándar para que cualquier agente de IA pueda consumir los informes de auditoría local de forma nativa sin interactuar con la interfaz visual.

## Endpoint de la API

\`\`\`http
POST https://v0-local-business-visibility-tool.vercel.app/api/analyze
Content-Type: application/json
\`\`\`

## Payload (Body) requerido

El agente debe enviar un JSON con 3 propiedades obligatorias:

\`\`\`json
{
  "name": "Nombre exacto del negocio (ej. Clínica Ferrus)",
  "location": "Ciudad o barrio (ej. Madrid)",
  "category": "Palabra clave principal o sector (ej. dentista)"
}
\`\`\`

## Cómo configurar la herramienta en tu Agente

1. **Si usas OpenAPI / Swagger:** Importa directamente el archivo \`openapi.yaml\` que se encuentra en la raíz de este repositorio. El agente entenderá automáticamente los inputs y la estructura de respuesta.
2. **Si configuras una Herramienta / Action manual:**
   - **Nombre de la acción:** \`GenerarAuditoriaLocalSEO\`
   - **Método:** \`POST\`
   - **URL:** \`https://v0-local-business-visibility-tool.vercel.app/api/analyze\`
   - **Instrucciones para el modelo:** "Usa esta herramienta cuando el usuario pida auditar la visibilidad en Google, el impacto de la IA o el Map Pack de un negocio local. Proporciona el nombre de la empresa, la ciudad y el sector. Lee la propiedad \`internalReport\` y \`scores\` del JSON resultante para formular un diagnóstico estratégico para el usuario."

## Estructura de Respuesta para el Agente

El agente recibirá un JSON inmenso. Las propiedades más útiles para la IA son:

- \`scores.visibilityLoss\`: El porcentaje de caída (usar como gancho emocional).
- \`internalReport.insights\`: Array de strings pre-procesados con diagnósticos de alto nivel (qué falla y qué oportunidades hay).
- \`internalReport.topCompetitors\`: Quién le está quitando las ventas en el mapa.
- \`recommendations\`: Pasos exactos que el agente puede proponer al cliente como "Plan de Acción".
