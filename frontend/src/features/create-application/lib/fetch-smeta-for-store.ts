import { analyseAndSmeta } from "@/src/shared/api/smeta"
import type { Resource } from "@/src/features/resource-crud/ui/resource-table"
import {
  buildPolygonGeoJsonString,
  collectPhotoFilesFromUrls,
  defaultDemoResources,
  mapSmetaToResources,
  normalizeSmetaWarnings,
} from "./smeta-integration"

export type SmetaFetchResult = {
  resources: Resource[]
  warnings: string[]
  usedFallback: boolean
}

type StoreSnapshot = {
  idea: string
  title: string
  polygon: number[][]
  photos: File[]
  projectPhotoUrls: string[]
  analysisPhotoUrls: string[]
  resources: unknown[]
}

export async function fetchSmetaForStore(data: StoreSnapshot): Promise<SmetaFetchResult> {
  if (Array.isArray(data.resources) && data.resources.length > 0) {
    return {
      resources: data.resources as Resource[],
      warnings: [],
      usedFallback: false,
    }
  }

  const polyStr = buildPolygonGeoJsonString(data.polygon)
  if (!polyStr) {
    return { resources: defaultDemoResources(), warnings: ["Нет полигона на карте"], usedFallback: true }
  }

  const ideaText = (data.idea || data.title || "").trim()
  if (ideaText.length < 5) {
    return { resources: defaultDemoResources(), warnings: ["Слишком короткое описание"], usedFallback: true }
  }

  const fromUrls = await collectPhotoFilesFromUrls(
    [...(data.projectPhotoUrls ?? []), ...(data.analysisPhotoUrls ?? [])].filter(Boolean)
  )
  const photos = [...(data.photos ?? []), ...fromUrls].slice(0, 8)

  const resp = await analyseAndSmeta({
    idea: ideaText,
    polygon: polyStr,
    photos: photos.length > 0 ? photos : undefined,
  })

  const warnings = normalizeSmetaWarnings(resp)
  const mapped = mapSmetaToResources((resp.smeta as unknown[]) ?? [])
  if (mapped.length > 0) {
    return { resources: mapped, warnings, usedFallback: false }
  }
  return {
    resources: defaultDemoResources(),
    warnings: [...warnings, "Пустая смета от сервиса"],
    usedFallback: true,
  }
}
