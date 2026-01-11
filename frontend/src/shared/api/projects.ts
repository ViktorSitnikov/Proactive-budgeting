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
}

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
  getProjects: (params?: { initiatorId?: string, npoId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.initiatorId) searchParams.append('initiator_id', params.initiatorId);
    if (params?.npoId) searchParams.append('npo_id', params.npoId);
    const queryString = searchParams.toString();
    return fetchApi<Project[]>(`/projects${queryString ? `?${queryString}` : ''}`);
  },
  
  getProjectById: (id: string) => fetchApi<Project>(`/projects/${id}`),

  createProject: (data: any) => fetchApi<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
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
