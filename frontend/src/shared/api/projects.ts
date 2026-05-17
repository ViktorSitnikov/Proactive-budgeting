import { fetchApi } from './base';
import { ProjectStatuses, type Project, type NPO, type User, type EstimateItem, type Opportunity, type ProjectDetails, type Template, type KnowledgeBaseEntry } from '../lib/mock-data';

export interface Draft {
  id: string;
  title: string;
  description: string;
  lastModified: string;
  status: ProjectStatuses;
  step: number;
  resources?: any[];
  type?: string;
  budget?: number;
  photos?: string[];
  projectPhotos?: string[];
  analysisPhotos?: string[];
  /** Текстовый адрес (как у проекта) */
  location?: string;
  coordinates?: { lat: number; lng: number };
  polygon?: number[][];
  proposalDocumentHtml?: string;
  proposalDocumentPath?: string;
}

export interface DraftDocumentResponse {
  previewHtml: string;
  downloadUrl?: string | null;
  warnings?: string[];
}

export type CheckIdeaResponse = Record<string, unknown>

export const projectsApi = {
  // Пользователи
  getUser: (id: string) => fetchApi<User>(`/users/${id}`),

  updateProfile: (data: Partial<User>) => fetchApi<User>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<{ url: string }>('/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Проекты
  getProjects: (params?: { initiatorId?: string, npoId?: string, lat?: number, lng?: number, radius?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.initiatorId) searchParams.append('initiator_id', params.initiatorId);
    if (params?.npoId) searchParams.append('npo_id', params.npoId);
    if (params?.lat !== undefined) searchParams.append('lat', params.lat.toString());
    if (params?.lng !== undefined) searchParams.append('lng', params.lng.toString());
    if (params?.radius !== undefined) searchParams.append('radius', params.radius.toString());
    
    const queryString = searchParams.toString();
    return fetchApi<Project[]>(`/projects${queryString ? `?${queryString}` : ''}`);
  },
  
  getProjectById: (id: string) => fetchApi<Project>(`/projects/${id}`),

  checkIdea: (idea: string) => fetchApi<CheckIdeaResponse>('/projects/check-idea', {
    method: 'POST',
    body: JSON.stringify({ idea }),
  }),

  createProject: (data: any) => fetchApi<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  findPolygonIntersections: (coordinates: number[][], draftId?: string) => fetchApi<Project[]>('/projects/intersections', {
    method: 'POST',
    body: JSON.stringify({ coordinates, draftId }),
  }),

  getProjectDetails: (id: string) => fetchApi<ProjectDetails>(`/projects/${id}/details`),

  updateProjectStatus: (id: string, status: ProjectStatuses) => fetchApi<Project>(`/projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  updateProjectEstimate: (id: string, resources: any[]) => fetchApi<Project>(`/projects/${id}/estimate`, {
    method: 'PATCH',
    body: JSON.stringify({ resources }),
  }),

  joinProject: (id: string) => fetchApi<void>(`/projects/${id}/join`, {
    method: 'POST',
  }),

  handleJoinRequest: (projectId: string, name: string, action: 'approve' | 'reject') => fetchApi<void>(`/projects/${projectId}/requests`, {
    method: 'POST',
    body: JSON.stringify({ name, action }),
  }),

  becomePartner: (projectId: string, npoId: string) => fetchApi<void>(`/projects/${projectId}/partner`, {
    method: 'POST',
    body: JSON.stringify({ npoId }),
  }),

  sendPartnerRequest: (projectId: string, npoId: string, npoName: string, message: string) => fetchApi<void>(`/projects/${projectId}/partner-request`, {
    method: 'POST',
    body: JSON.stringify({ npoId, npoName, message }),
  }),

  handleAppeal: (projectId: string, action: 'approve' | 'reject') => fetchApi<Project>(`/projects/${projectId}/appeal`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  }),

  // Возможности (Opportunities)
  getOpportunities: () => fetchApi<Opportunity[]>('/opportunities'),

  // Черновики (Заявки)
  getDrafts: () => fetchApi<Draft[]>('/projects/drafts'),
  
  getDraftById: (id: string) => fetchApi<Draft>(`/projects/drafts/${id}`),
  
  saveDraft: (data: Partial<Draft>) => fetchApi<Draft>('/projects/drafts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateDraft: (id: string, data: Partial<Draft>) => fetchApi<Draft>(`/projects/drafts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  deleteDraft: (id: string) => fetchApi<void>(`/projects/drafts/${id}`, {
    method: 'DELETE',
  }),

  generateDraftDocument: (draftId: string) =>
    fetchApi<DraftDocumentResponse>(`/projects/drafts/${draftId}/generate-document`, {
      method: 'POST',
      timeoutMs: 11 * 60 * 1000, // AI: 2–10 мин + запас
    }),

  getDraftDocument: (draftId: string) =>
    fetchApi<DraftDocumentResponse>(`/projects/drafts/${draftId}/document`),

  saveDraftDocument: (draftId: string, documentHtml: string) =>
    fetchApi<DraftDocumentResponse>(`/projects/drafts/${draftId}/document`, {
      method: 'PATCH',
      body: JSON.stringify({ documentHtml }),
    }),

  uploadDraftDocumentDocx: (draftId: string, file: Blob) => {
    const formData = new FormData()
    formData.append('file', file, 'Заявка_Инициативное_Бюджетирование.docx')
    return fetchApi<DraftDocumentResponse>(`/projects/drafts/${draftId}/document/upload`, {
      method: 'POST',
      body: formData,
    })
  },

  // НКО
  getNPOs: () => fetchApi<NPO[]>('/npos'),

  updateNPOStatus: (id: string, status: 'approved' | 'rejected') => fetchApi<NPO>(`/npos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Ресурсы/Сметы
  getEstimateResources: () => fetchApi<EstimateItem[]>('/resources'),

  // Админ/ИИ
  getGlobalSettings: () => fetchApi<any>('/admin/settings'),
  getTemplates: () => fetchApi<Template[]>('/admin/templates'),
  getKnowledgeBase: () => fetchApi<KnowledgeBaseEntry[]>('/admin/knowledge-base'),

  retrainModel: (modelId: string) => fetchApi<void>(`/ai/models/${modelId}/retrain`, {
    method: 'POST',
  }),
};
