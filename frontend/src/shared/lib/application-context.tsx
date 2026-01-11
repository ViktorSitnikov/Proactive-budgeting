'use client'

import React, { createContext, useContext, useState, ReactNode } from "react"
import { ProjectStatuses } from './mock-data'

interface ApplicationData {
    id?: string
    title: string
    idea: string
    location: {lat: number, lng: number, address: string}
    photos: File[]
    photoUrls: string[]
    status: ProjectStatuses
    currentStep: number
    resources: any[]
    type: string
}

interface ApplicationContextType {
    data: ApplicationData
    updateData: (newData: Partial<ApplicationData>) => void
    resetData: () => void
    setFromDraft: (draft: any) => void
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined)

export function ApplicationProvider({children}: {children: ReactNode}) {
    const [data, setData] = useState<ApplicationData>({
        title: '',
        idea: '',
        location: { lat: 56.8389, lng: 60.6057, address: '' },
        photos: [],
        photoUrls: [],
        status: ProjectStatuses.draft,
        currentStep: 1,
        resources: [],
        type: 'Благоустройство'
    })

    const updateData = (newData: Partial<ApplicationData>) => {
        setData(prev => ({...prev, ...newData}))
    }

    const setFromDraft = (draft: any) => {
        setData({
            id: draft.id,
            title: draft.title || '',
            idea: draft.description || '',
            location: draft.location || { lat: 56.8389, lng: 60.6057, address: '' },
            photos: [],
            photoUrls: draft.photos || [],
            status: draft.status || ProjectStatuses.draft,
            currentStep: draft.step || 1,
            resources: draft.resources || [],
            type: draft.type || 'Благоустройство'
        })
    }

    const resetData = () => {
        setData({
            title: '',
            idea: '',
            location: { lat: 56.8389, lng: 60.6057, address: '' },
            photos: [],
            photoUrls: [],
            status: ProjectStatuses.draft,
            currentStep: 1,
            resources: [],
            type: 'Благоустройство'
          })
    }

    return (
        <ApplicationContext.Provider value={{data, updateData, resetData, setFromDraft}}>
            {children}
        </ApplicationContext.Provider>
    )
}

export function useApplication() {
    const context = useContext(ApplicationContext)
    if (context == undefined) {
        throw new Error('useApplication must be used within an ApplicationProvider')
    }
    return context
}
