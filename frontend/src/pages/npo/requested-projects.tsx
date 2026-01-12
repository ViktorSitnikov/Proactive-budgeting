"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, LogOut, MapPin, Coins, CheckCircle2, Loader2, Building2 } from "lucide-react"
import type { User, Project } from "@/src/shared/lib/mock-data"
import { ProjectStatuses } from "@/src/shared/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { projectsApi } from "@/src/shared/api/projects"
import { ProjectView } from "../../shared/ui/project-view"
import { getImageUrl } from "@/src/shared/api/base"

interface RequestedProjectsPageProps {
  user: User
  onBack: () => void
  onLogout: () => void
}

export function RequestedProjectsPage({ user, onBack, onLogout }: RequestedProjectsPageProps) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        const data = await projectsApi.getProjects()
        // Фильтруем проекты, которые либо активны (ищут партнера), 
        // либо уже запросили помощь именно у этой НКО, НО при этом у них еще нет партнера
        const requested = data.filter(p => 
          !p.npoId && (
            p.status === ProjectStatuses.active || 
            p.ngoPartnerRequests?.some(req => req.npoId === user.id)
          )
        )
        setProjects(requested)
      } catch (err) {
        console.error("Failed to load projects:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [user.id])

  const handleAccept = async (projectId: string) => {
    try {
      setIsAccepting(projectId)
      await projectsApi.becomePartner(projectId, user.id)
      
      setProjects(prev => prev.filter(p => p.id !== projectId))
      
      toast({
        title: "Проект принят",
        description: "Вы стали официальным партнером проекта. Он добавлен в список ваших текущих проектов.",
      })
      
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось принять проект. Попробуйте позже.",
      })
    } finally {
      setIsAccepting(null)
    }
  }

  if (selectedProject) {
    return (
      <ProjectView 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
        currentUserId={user.id}
        userRole="npo"
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 md:gap-2 text-slate-600 px-2 md:px-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Назад</span>
            </Button>
            <h1 className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px] md:max-w-none">Запросы на партнерство</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Организация</p>
              <p className="text-xs md:text-sm font-black text-slate-900 leading-none truncate max-w-[100px]">{user.organization || user.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-slate-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-6 md:mb-10 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Новые возможности</h2>
          <p className="text-sm md:text-base text-slate-500">Проекты горожан, ожидающие поддержки НКО</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 text-muted-foreground bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm mx-4">
            <Loader2 className="w-10 md:w-12 h-10 md:h-12 animate-spin text-blue-500 mb-4" />
            <p className="font-bold text-sm md:text-base">Ищем активные инициативы...</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            {projects.map((project) => {
              const hasDirectRequest = project.ngoPartnerRequests?.some(req => req.npoId === user.id)
              const directRequestMessage = project.ngoPartnerRequests?.find(req => req.npoId === user.id)?.message

              return (
                <Card key={project.id} className={`group hover:shadow-2xl transition-all border-none shadow-lg overflow-hidden mx-2 md:mx-0 ${hasDirectRequest ? 'ring-2 ring-blue-500 shadow-blue-100' : ''}`}>
                  <CardHeader className="bg-white border-b border-slate-50 p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {hasDirectRequest && (
                            <Badge className="bg-blue-600 text-white border-none animate-pulse text-[10px]">Персональный запрос</Badge>
                          )}
                          <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase font-bold tracking-wider border-slate-200">
                            ID: {project.id.slice(0, 8)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg md:text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {project.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-x-4 md:gap-6 mt-3 md:mt-4 text-[10px] md:text-sm font-bold text-slate-400">
                          <div className="flex items-center gap-1 md:gap-2">
                            <MapPin className="w-3 md:w-4 h-3 md:h-4 text-blue-500 shrink-0" />
                            <span className="truncate">{project.location}</span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2">
                            <Coins className="w-3 md:w-4 h-3 md:h-4 text-emerald-500 shrink-0" />
                            <span>{(project.budget || 0).toLocaleString()} ₽</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden shadow-inner shrink-0">
                        <img src={getImageUrl(project.image)} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 bg-white">
                    {hasDirectRequest && directRequestMessage && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 md:p-4 mb-4 md:mb-6 rounded-r-xl">
                        <p className="text-xs md:text-sm font-medium text-blue-900 italic">
                          "{directRequestMessage}"
                        </p>
                      </div>
                    )}

                    <p className="text-xs md:text-base text-slate-600 line-clamp-3 mb-4 md:mb-6 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t pt-4 md:pt-6 gap-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Готовность к партнерству: 100%
                        </span>
                      </div>
                      <div className="flex gap-2 md:gap-3">
                        <Button 
                          variant="ghost" 
                          className="flex-1 sm:flex-none font-bold text-slate-500 hover:text-slate-900 text-xs md:text-sm"
                          onClick={() => setSelectedProject(project)}
                        >
                          Подробнее
                        </Button>
                        <Button 
                          onClick={() => handleAccept(project.id)} 
                          disabled={isAccepting === project.id}
                          className="flex-[2] sm:flex-none gap-2 bg-slate-900 hover:bg-emerald-600 transition-all rounded-full px-4 md:px-8 shadow-xl text-xs md:text-sm h-9 md:h-10"
                        >
                          {isAccepting === project.id ? (
                            <Loader2 className="w-3 md:w-4 h-3 md:h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 md:w-4 h-3 md:h-4" />
                          )}
                          {isAccepting === project.id ? "Принимаем..." : "Стать партнером"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="font-bold text-xl text-slate-400">Новых запросов пока нет</p>
            <p className="text-slate-400 mt-2">Мы уведомим вас, когда появятся подходящие проекты</p>
          </div>
        )}
      </div>
    </div>
  )
}