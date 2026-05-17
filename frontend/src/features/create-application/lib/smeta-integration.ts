import { getImageUrl } from "@/src/shared/api/base"
import type { Resource, Supplier } from "@/src/features/resource-crud/ui/resource-table"

const MAX_PHOTOS = 8

/** Кольцо [lng, lat][] → GeoJSON Polygon (замкнутое, минимум 4 точки в кольце). */
export function buildPolygonGeoJsonString(ring: number[][]): string | null {
  if (!ring || ring.length < 3) return null
  let coords = ring
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .map((p) => [Number(p[0]), Number(p[1])])
  if (coords.length < 3) return null
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords = [...coords, [...first]]
  }
  if (coords.length < 4) return null
  return JSON.stringify({
    type: "Polygon",
    coordinates: [coords],
  })
}

function newResourceId(index: number): string {
  const c = globalThis.crypto
  if (c?.randomUUID) return `smeta-${index}-${c.randomUUID()}`
  return `smeta-${index}-${Date.now()}`
}

function padSuppliers(suppliers: Supplier[]): Supplier[] {
  const out = [...suppliers]
  while (out.length < 3) {
    out.push({ price: 0, name: "", url: "" })
  }
  return out.slice(0, 3)
}

/** Ответ микросервиса → строки таблицы ресурсов. */
export function mapSmetaToResources(smeta: unknown[]): Resource[] {
  if (!Array.isArray(smeta) || smeta.length === 0) return []

  return smeta.map((raw, index) => {
    const row = raw as Record<string, unknown>
    const name = String(row.name ?? "").trim() || `Позиция ${index + 1}`
    const unit = String(row.unit ?? "шт.").trim() || "шт."
    const qtyRaw = row.quantity
    const quantity =
      typeof qtyRaw === "number" && !Number.isNaN(qtyRaw)
        ? qtyRaw
        : typeof qtyRaw === "string"
          ? parseFloat(qtyRaw.replace(",", ".")) || 1
          : 1

    const links = Array.isArray(row.supplier_links) ? (row.supplier_links as Record<string, unknown>[]) : []
    const suppliers: Supplier[] = links
      .filter((l) => l && typeof l.url === "string" && (l.url as string).trim() !== "")
      .slice(0, 3)
      .map((l) => ({
        price: typeof l.price === "number" && !Number.isNaN(l.price) ? l.price : 0,
        name: String(l.title ?? l.snippet ?? "").slice(0, 200),
        url: String(l.url),
      }))

    const positivePrices = links
      .map((l) => l.price)
      .filter((p): p is number => typeof p === "number" && !Number.isNaN(p) && p > 0)
    const minFromLinks = positivePrices.length > 0 ? Math.min(...positivePrices) : 0
    const basePrice = minFromLinks > 0 ? minFromLinks : suppliers.find((s) => s.price > 0)?.price ?? 0

    return {
      id: newResourceId(index),
      name,
      resource: name,
      quantity: quantity > 0 ? quantity : 1,
      unit,
      basePrice,
      estimatedCost: basePrice,
      suppliers: padSuppliers(suppliers),
    }
  })
}

export function normalizeSmetaWarnings(resp: Record<string, unknown>): string[] {
  const w = resp.warnings
  if (!Array.isArray(w)) return []
  return w.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).filter(Boolean)
}

/** Скачивает изображения по URL (как после PhotoUploader) для multipart. */
export async function collectPhotoFilesFromUrls(urls: string[], max: number = MAX_PHOTOS): Promise<File[]> {
  const slice = urls.slice(0, max)
  const out: File[] = []
  let i = 0
  for (const u of slice) {
    const abs = getImageUrl(u)
    try {
      const res = await fetch(abs)
      if (!res.ok) continue
      const blob = await res.blob()
      const ext = blob.type?.includes("png") ? "png" : blob.type?.includes("webp") ? "webp" : "jpg"
      out.push(new File([blob], `photo-${i}.${ext}`, { type: blob.type || "image/jpeg" }))
      i += 1
    } catch {
      // пропускаем недоступные
    }
  }
  return out
}

export function defaultDemoResources(): Resource[] {
  return [
    { id: "res-1", name: "Игровое оборудование", quantity: 5, unit: "шт.", estimatedCost: 30000 },
    { id: "res-2", name: "Резиновое покрытие", quantity: 100, unit: "м²", estimatedCost: 2500 },
    { id: "res-3", name: "Лавочки", quantity: 8, unit: "шт.", estimatedCost: 10000 },
    { id: "res-4", name: "Освещение", quantity: 12, unit: "шт.", estimatedCost: 10000 },
  ]
}
