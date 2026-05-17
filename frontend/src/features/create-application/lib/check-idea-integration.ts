import type { CheckIdeaResponse } from "@/src/shared/api/projects"

export type AdequacyFeedback = {
  comment?: string
  suggestion?: string
}

export type ParsedCheckIdea = {
  adequate: boolean
  category?: string
  feedback: AdequacyFeedback
}

function pickString(data: CheckIdeaResponse, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = data[key]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return undefined
}

function pickBool(data: CheckIdeaResponse, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = data[key]
    if (typeof v === "boolean") return v
  }
  return undefined
}

/** Разбор ответа микросервиса check-idea (поля могут отличаться по версии). */
export function parseCheckIdeaResponse(data: CheckIdeaResponse): ParsedCheckIdea {
  const adequateExplicit = pickBool(data, [
    "is_adequate",
    "isAdequate",
    "adequate",
    "ok",
  ])

  const comment = pickString(data, ["comment", "message", "feedback", "reason"])
  const suggestion = pickString(data, ["suggestion", "recommendation", "advice"])
  const category = pickString(data, ["category", "project_category", "type"])

  // Явный отказ ИИ
  if (adequateExplicit === false) {
    return { adequate: false, category, feedback: { comment, suggestion } }
  }

  // Явное одобрение
  if (adequateExplicit === true) {
    return { adequate: true, category, feedback: { comment, suggestion } }
  }

  // Нет флага — если есть негативный комментарий без suggestion, всё равно пускаем,
  // но показываем feedback (мягкий режим для старых ответов API)
  return {
    adequate: true,
    category,
    feedback: { comment, suggestion },
  }
}
