import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppNotification {
  id: string
  message: string
  type: string
  time: number
  read: boolean
  projectId?: string
}

interface NotificationsState {
  notifications: AppNotification[]
  addNotification: (notif: AppNotification) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notif) => set((state) => {
        // Prevent exact duplicates if needed, but here we just prepend
        return { notifications: [notif, ...state.notifications] }
      }),
      markAllAsRead: () => set((state) => ({ 
        notifications: state.notifications.map(n => ({ ...n, read: true })) 
      })),
      removeNotification: (id) => set((state) => ({ 
        notifications: state.notifications.filter(n => n.id !== id) 
      })),
    }),
    {
      name: 'notifications-storage',
    }
  )
)
