function normalizeApiBase(raw: string | undefined): string {
  const fallback = "http://localhost:5000/api"
  let base = (raw ?? fallback).trim().replace(/\/+$/, "")
  if (!base.endsWith("/api")) {
    base = `${base}/api`
  }
  return base
}

/** База REST (…/api). Сборка: NEXT_PUBLIC_API_URL, например https://www.prototiva.ru/api */
export const BASE_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL)

/**
 * Происхождение для относительных путей с бэка (/static/uploads/…).
 * На сервере в nginx нужен location /static/ → тот же upstream, что и API.
 */
export const API_HOST = BASE_URL.endsWith("/api") ? BASE_URL.slice(0, -"/api".length) : BASE_URL

export function getImageUrl(url: string | undefined): string {
  if (!url) return '/placeholder.svg';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_HOST}${url}`;
}

export type FetchApiOptions = RequestInit & {
  /** Таймаут запроса (мс). Для generate-docx — 10+ минут. */
  timeoutMs?: number
}

export async function fetchApi<T>(endpoint: string, options: FetchApiOptions = {}): Promise<T> {
  const { timeoutMs, ...requestInit } = options
  const url = `${BASE_URL}${endpoint}`;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(requestInit.headers as Record<string, string>),
  };

  // Если тело запроса - FormData, браузер сам должен выставить Content-Type с boundary
  if (requestInit.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const controller = timeoutMs ? new AbortController() : undefined
  const scheduleTimeout =
    typeof window !== "undefined" ? window.setTimeout.bind(window) : setTimeout
  const clearScheduled =
    typeof window !== "undefined" ? window.clearTimeout.bind(window) : clearTimeout
  const timeoutId =
    controller && timeoutMs
      ? scheduleTimeout(() => controller.abort(), timeoutMs)
      : undefined

  let response: Response
  try {
    response = await fetch(url, {
      ...requestInit,
      headers,
      signal: controller?.signal ?? requestInit.signal,
    })
  } catch (e) {
    if (controller?.signal.aborted) {
      throw new Error(
        `Превышено время ожидания ответа (${Math.round((timeoutMs ?? 0) / 60000)} мин). Попробуйте позже.`
      )
    }
    throw e
  } finally {
    if (timeoutId !== undefined) clearScheduled(timeoutId)
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Если токен протух или база сброшена — разлогиниваем
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/'; 
      }
    }
    const raw = await response.text().catch(() => "");
    let detail: string | undefined;
    try {
      const parsed = raw ? (JSON.parse(raw) as { detail?: unknown }) : {};
      if (typeof parsed.detail === "string") {
        detail = parsed.detail;
      } else if (Array.isArray(parsed.detail)) {
        detail = parsed.detail
          .map((e: unknown) => (typeof e === "object" && e !== null && "msg" in e ? String((e as { msg: unknown }).msg) : JSON.stringify(e)))
          .join("; ");
      } else if (parsed.detail != null) {
        detail = JSON.stringify(parsed.detail);
      }
    } catch {
      // не JSON (часто nginx отдаёт HTML при 502)
    }
    const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 400);
    const suffix =
      detail ||
      snippet ||
      `${response.statusText || "Ошибка"} (${response.status}). URL: ${url}`;
    throw new Error(suffix);
  }

  return await response.json();
}
