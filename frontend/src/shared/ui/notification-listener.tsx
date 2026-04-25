"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BASE_URL } from "../api/base"
import { Bell, BellDot, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNotificationsStore, type AppNotification } from "../lib/notifications-store"
import { formatBeautifulDateTime } from "../lib/format-date"

export function NotificationListener() {
  const { notifications, addNotification, markAllAsRead, removeNotification } = useNotificationsStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const queryClient = useQueryClient()
  
  const user = queryClient.getQueryData(['authUser']) as any
  const userId = user?.id

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!userId) return

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    // Extracts host from BASE_URL or uses default
    let host = "localhost:5000"
    try {
      if (BASE_URL.startsWith("http")) {
        const url = new URL(BASE_URL)
        host = url.host
      }
    } catch (e) {
      // ignore
    }
    
    const wsUrl = `${wsProtocol}//${host}/api/ws/notifications/${userId}`
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl)
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Create a new notification object
            const newNotif: AppNotification = {
              id: Date.now().toString(),
              message: data.message,
              type: data.type,
              time: Date.now(),
              read: false,
              projectId: data.project_id
            }
            
            addNotification(newNotif)

            // Refresh the projects data so the new request appears in the UI
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            queryClient.invalidateQueries({ queryKey: ["projectDetails"] })

            // Also show a toast notification
            toast.success(data.message, {
              duration: 5000,
            })
          } catch (err) {
            console.error("Failed to parse websocket message", err)
          }
        }

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connect, 5000)
        }
      } catch (err) {
        console.error("WebSocket connection error:", err)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.close()
      }
    }
  }, [userId, addNotification, queryClient])

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isClient) return null

  const handleNavigate = (projectId?: string) => {
    setIsOpen(false)
    if (projectId) {
      window.dispatchEvent(new CustomEvent('NAVIGATE_TO_PROJECT', { detail: { projectId } }))
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open && unreadCount > 0) markAllAsRead()
    }}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-slate-400 hover:text-slate-800"
        >
          {unreadCount > 0 ? (
            <>
              <BellDot className="w-5 h-5 text-blue-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </>
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Уведомления</h3>
          <span className="text-xs font-medium text-slate-500">{notifications.length} всего</span>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Пока нет новых уведомлений</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 group relative ${notif.read ? 'opacity-70' : ''}`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  <div className="flex-1 pr-6">
                    <p className="text-sm text-slate-800 font-medium leading-snug">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1 capitalize">
                      {formatBeautifulDateTime(notif.time)}
                    </p>
                    {notif.projectId && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => handleNavigate(notif.projectId)}
                        className="h-auto p-0 mt-1.5 text-blue-600 text-xs font-bold gap-1"
                      >
                        Перейти
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <button 
                    onClick={() => removeNotification(notif.id)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
