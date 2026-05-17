import { projectsApi } from "@/src/shared/api/projects"
import { parseCheckIdeaResponse } from "./check-idea-integration"

export type CheckIdeaFetchResult = {
  adequate: boolean
  category?: string
  feedback: { comment?: string; suggestion?: string }
}

export async function fetchCheckIdeaForStore(idea: string): Promise<CheckIdeaFetchResult> {
  const raw = await projectsApi.checkIdea(idea.trim())
  const parsed = parseCheckIdeaResponse(raw)
  return {
    adequate: parsed.adequate,
    category: parsed.category,
    feedback: parsed.feedback,
  }
}
