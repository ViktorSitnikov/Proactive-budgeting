import { create } from 'zustand'
import { ProjectStatuses } from './mock-data'

interface ApplicationData {
  id?: string
  title: string
  idea: string
  location: { lat: number; lng: number; address: string }
  polygon: number[][]
  photos: File[]
  projectPhotoUrls: string[]
  analysisPhotoUrls: string[]
  status: ProjectStatuses
  currentStep: number
  resources: any[]
  type: string
  budget: number
}

interface ApplicationStore {
  data: ApplicationData
  updateData: (newData: Partial<ApplicationData>) => void
  resetData: () => void
  setFromDraft: (draft: any) => void
}

const initialData: ApplicationData = {
  title: '',
  idea: '',
  location: { lat: 56.8389, lng: 60.6057, address: '' },
  polygon: [],
  photos: [],
  projectPhotoUrls: [],
  analysisPhotoUrls: [],
  status: ProjectStatuses.draft,
  currentStep: 1,
  resources: [],
  type: 'Благоустройство',
  budget: 0
}

export const useApplicationStore = create<ApplicationStore>((set) => ({
  data: initialData,
  
  updateData: (newData) => 
    set((state) => ({ 
      data: { ...state.data, ...newData } 
    })),
    
  resetData: () => 
    set({ data: initialData }),
    
  setFromDraft: (draft) => {
    const coords = draft.coordinates || {}
    const address =
      typeof draft.location === 'string'
        ? draft.location
        : draft.location?.address ?? ''
    set({
      data: {
        id: draft.id,
        title: draft.title || '',
        idea: draft.description || '',
        location: {
          lat: typeof coords.lat === 'number' ? coords.lat : 56.8389,
          lng: typeof coords.lng === 'number' ? coords.lng : 60.6057,
          address,
        },
        polygon: Array.isArray(draft.polygon) ? draft.polygon : [],
        photos: [],
        projectPhotoUrls: draft.projectPhotos || draft.photos || [],
        analysisPhotoUrls: draft.analysisPhotos || [],
        status: draft.status || ProjectStatuses.draft,
        currentStep: draft.step || 1,
        resources: draft.resources || [],
        type: draft.type || 'Благоустройство',
        budget: draft.budget || 0,
      },
    })
  },
}))
