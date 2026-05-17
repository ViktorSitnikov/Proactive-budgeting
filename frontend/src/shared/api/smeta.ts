import { fetchApi } from "./base"

/** Ответ микросервиса сметы (прокси основного бэка); поля см. бриф. */
export type AnalyseSmetaResponse = Record<string, unknown> & {
  smeta?: unknown[]
  warnings?: unknown[]
}

/** Длинный таймаут: vision + n8n + поиск по позициям (до 10 мин). */
const SMETA_CLIENT_TIMEOUT_MS = 10 * 60 * 1000

function longRunningSignal(): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined") return undefined
  const ctor = AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }
  if (typeof ctor.timeout === "function") {
    return ctor.timeout(SMETA_CLIENT_TIMEOUT_MS)
  }
  return undefined
}

export async function analyseAndSmeta(params: {
  idea: string
  /** Строка JSON: GeoJSON Polygon */
  polygon: string
  photos?: File[]
}): Promise<AnalyseSmetaResponse> {
  const fd = new FormData()
  fd.append("idea", params.idea)
  fd.append("polygon", params.polygon)
  for (const file of params.photos ?? []) {
    fd.append("photos", file)
  }
  const signal = longRunningSignal()
  return fetchApi<AnalyseSmetaResponse>("/analyse-and-smeta", {
    method: "POST",
    body: fd,
    ...(signal ? { signal } : {}),
  })
}

export async function analyseAndSmetaSingle(params: {
  idea: string
  polygon: string
  photo: File
}): Promise<AnalyseSmetaResponse> {
  const fd = new FormData()
  fd.append("idea", params.idea)
  fd.append("polygon", params.polygon)
  fd.append("photo", params.photo)
  const signal = longRunningSignal()
  return fetchApi<AnalyseSmetaResponse>("/analyse-and-smeta-single", {
    method: "POST",
    body: fd,
    ...(signal ? { signal } : {}),
  })
}

export async function smetaServiceHealth(): Promise<{ status?: string }> {
  return fetchApi("/analyse-smeta/health")
}
