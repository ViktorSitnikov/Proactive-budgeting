"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, LogOut, MapPin, Coins, Loader2, Users, FileEdit, Clock } from "lucide-react"
import type { User, Project } from "@/src/shared/lib/mock-data"
import { ProjectStatuses } from "@/src/shared/lib/mock-data"
import { projectsApi } from "@/src/shared/api/projects"
import { ProjectView } from "../../shared/ui/project-view"
import { getImageUrl } from "@/src/shared/api/base"

interface CurrentProjectsNPOPageProps {
  user: User
  onBack: () => void
  onLogout: () => void
}

export function CurrentProjectsNPOPage({ user, onBack, onLogout }: CurrentProjectsNPOPageProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        const data = await projectsApi.getProjects({ npoId: user.id })
        // Дополнительная фильтрация по статусу, если бэкенд возвращает все проекты НКО
        const current = data.filter((p) => p.status !== ProjectStatuses.success)
        setProjects(current)
      } catch (err) {
        console.error("Failed to load projects:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [user.id])

  if (selectedProject) {
    return (
      <ProjectView 
        project={selectedProject} 
        onBack={() => {
          setSelectedProject(null)
          setIsEditMode(false)
        }} 
        currentUserId={user.id}
        userRole="npo"
        initialEditEstimate={isEditMode}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-slate-600">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Проекты в работе</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Партнер</p>
              <p className="text-sm font-black text-slate-900 leading-none">{user.organization || user.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-slate-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="font-bold">Загружаем активные проекты...</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-2xl transition-all border-none shadow-lg overflow-hidden group bg-white"
                onClick={() => setSelectedProject(project)}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img
                    src={getImageUrl(project.image)}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <Badge className="absolute top-4 right-4 bg-emerald-500 text-white border-none px-3 py-1 font-bold uppercase text-[10px] tracking-widest">
                    В реализации
                  </Badge>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-black text-white line-clamp-1">{project.title}</h3>
                  </div>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Бюджет</p>
                      <div className="flex items-center gap-1.5 text-slate-900 font-black">
                        <Coins className="w-4 h-4 text-emerald-500" />
                        {(project.budget || 0).toLocaleString()} ₽
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Участники</p>
                      <div className="flex items-center gap-1.5 text-slate-900 font-black justify-end">
                        <Users className="w-4 h-4 text-blue-500" />
                        {project.participants?.length || 1} чел.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-400">Прогресс выполнения</span>
                      <span className="text-emerald-600">65%</span>
                    </div>
                    <Progress value={65} className="h-2 bg-slate-100" />
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="line-clamp-1">{project.location}</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="w-full bg-slate-900 hover:bg-blue-600 gap-2 font-bold rounded-xl shadow-lg"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setIsEditMode(true);
                        setSelectedProject(project);
                      }}
                    >
                      <FileEdit className="w-4 h-4" />
                      Управление сметой
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Активных проектов нет</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Выберите проект в разделе "Запросы на партнерство", чтобы начать работу</p>
            <Button onClick={onBack} variant="outline" className="rounded-full px-8">Вернуться в панель</Button>
          </div>
        )}
      </div>
    </div>
  )
}