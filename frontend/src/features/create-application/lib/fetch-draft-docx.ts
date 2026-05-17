import { API_HOST } from "@/src/shared/api/base"

/** Скачать DOCX черновика с авторизацией. */
export async function fetchDraftDocxBlob(draftId: string): Promise<Blob | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const url = `${API_HOST}/api/projects/drafts/${draftId}/document/download`
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return null
  return res.blob()
}
