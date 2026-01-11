// ===========================
// ИНТЕРФЕЙСЫ И ТИПЫ ДАННЫХ
// ===========================

export interface User {
  id: string
  email: string
  password: string
  role: "initiator" | "npo" | "admin"
  name: string
  avatar?: string
  organization?: string
  phone?: string
  address?: string
  bio?: string
}

export enum ProjectStatuses {
  draft = "DRAFT",
  ai_scoring = "AI_SCORING",
  duplicate_check = "DUPLICATE_CHECK",
  resource_generation = "RESOURCE_GENERATION",
  refinement = "REFINEMENT",
  active = "ACTIVE",
  ngo_partnered = "NGO_PARTNERED",
  rejected = "REJECTED",
  appeal_pending = "APPEAL_PENDING",
  success = "SUCCESS"
}

export interface Project {
  id: string
  title: string
  description: string
  budget: number
  image: string
  location: string
  coordinates: { lat: number; lng: number }
  status: ProjectStatuses
  initiatorId: string
  npoId?: string
  createdAt: string
  participants?: string[]
  pendingJoinRequests?: string[]
  ngoPartnerRequests?: Array<{ npoId: string; npoName: string; message: string }>
  resources?: any[]
  type?: string
}

export interface Neighbor {
  id: string
  name: string
  avatar: string
  idea: string
  distance: string
}

export interface NPO {
  id: string
  name: string
  expertise: string[]
  rating: number
  avatar: string
  activeProjects: number
  pendingRequests: number
  status?: "pending" | "approved" | "rejected"
  description?: string
  registrationDate?: string
}

export interface EstimateItem {
  id: string
  resource: string
  category: string
  basePrice: number
  quantity: number
}

export interface Opportunity {
  id: string
  title: string
  location: string
  budget: number
  matchReason: string
  tags: string[]
  initiatorId: string
  status: "open" | "applied" | "matched"
}

export interface ProjectDetails {
  id: string
  projectId: string
  stage: string
  progress: number
  nextMilestone: string
  collaborators: Array<{ name: string; role: string; avatar: string }>
  documents: Array<{ name: string; type: string; date: string; url: string }>
  budget: { spent: number; remaining: number; total: number }
}

export interface Template {
  id: string
  name: string
  category: string
  content: string
  lastModified: string
}

export interface KnowledgeBaseEntry {
  id: string
  title: string
  region: string
  budget: number
  outcomes: string
  tags: string[]
}

// Данные больше не хранятся здесь, так как они загружаются из API.
// Пустые массивы оставлены для совместимости типов, если где-то они еще импортируются как значения.
export const mockUsers: User[] = []
export const mockProjects: Project[] = []
export const mockNeighbors: Neighbor[] = []
export const mockNPOs: NPO[] = []
export const mockEstimateItems: EstimateItem[] = []
export const mockOpportunities: Opportunity[] = []
export const mockProjectDetails: Record<string, ProjectDetails> = {}
export const mockTemplates: Template[] = []
export const mockKnowledgeBase: KnowledgeBaseEntry[] = []
export const mockGlobalSettings = {
  inflationRate: 8,
  maxBudget: 1000000,
  minBudget: 50000,
  defaultSubsidyRate: 95,
  currentYear: 2024,
}
