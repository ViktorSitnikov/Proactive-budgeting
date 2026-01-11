"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Gavel, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock, 
  MapPin, 
  Coins,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { type Project, ProjectStatuses } from "@/src/shared/lib/mock-data"
import { projectsApi } from "@/src/shared/api/projects"
import { useToast } from "@/hooks/use-toast"
import { ProjectView } from "../../shared/ui/project-view"
import { getImageUrl } from "@/src/shared/api/base"

interface AppealsPageProps {
  onActionComplete?: () => void
}

export function AppealsPage({ onActionComplete }: AppealsPageProps) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const loadAppeals = async () => {
    try {
      setIsLoading(true)
      const allProjects = await projectsApi.getProjects()
      setProjects(allProjects.filter(p => p.status === ProjectStatuses.appeal_pending))
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAppeals()
  }, [])

  const handleApproveAppeal = async (projectId: string) => {
    try {
      await projectsApi.handleAppeal(projectId, 'approve')
      setProjects(prev => prev.filter(p => p.id !== projectId))
      toast({
        title: "Апелляция удовлетворена",
        description: "Проект переведен в статус ACTIVE и опубликован на карте.",
      })
      if (selectedProject?.id === projectId) setSelectedProject(null)
      if (onActionComplete) onActionComplete()
    } catch (err) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось одобрить апелляцию" })
    }
  }

  const handleRejectAppeal = async (projectId: string) => {
    try {
      await projectsApi.handleAppeal(projectId, 'reject')
      setProjects(prev => prev.filter(p => p.id !== projectId))
      toast({
        title: "Апелляция отклонена",
        description: "Проект окончательно переведен в статус REJECTED.",
      })
      if (selectedProject?.id === projectId) setSelectedProject(null)
      if (onActionComplete) onActionComplete()
    } catch (err) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось отклонить апелляцию" })
    }
  }

  if (selectedProject) {
    return (
      <div className="space-y-6">
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-3xl flex items-center justify-between mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Gavel className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900">Режим рассмотрения апелляции</h3>
              <p className="text-sm text-slate-500">Внимательно изучите материалы дела и аргументы пользователя</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => handleRejectAppeal(selectedProject.id)} 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 gap-2 font-bold"
            >
              <XCircle className="w-4 h-4" />
              Оставить отказ в силе
            </Button>
            <Button 
              onClick={() => handleApproveAppeal(selectedProject.id)} 
              className="bg-emerald-600 hover:bg-emerald-700 gap-2 font-bold shadow-lg shadow-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4" />
              Удовлетворить апелляцию
            </Button>
          </div>
        </div>
        <ProjectView project={selectedProject} onBack={() => setSelectedProject(null)} userRole="admin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Очередь апелляций</h2>
          <p className="text-slate-500 mt-1">Проекты, где пользователи не согласны с решением ИИ</p>
        </div>
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-1.5 font-bold uppercase tracking-wider text-[10px]">
          Ожидают решения: {projects.length}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="font-bold text-slate-400">Загрузка очереди...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-2xl transition-all border-none shadow-lg overflow-hidden bg-white">
              <CardContent className="p-0 flex flex-col md:flex-row h-full">
                <div className="w-full md:w-64 h-48 md:h-auto relative shrink-0">
                  <img src={getImageUrl(project.image)} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-all" />
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-slate-200">
                        {project.location}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Подано: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-black text-slate-900">{(project.budget || 0).toLocaleString()} ₽</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-tighter">Спорный статус</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setSelectedProject(project)} 
                      className="bg-slate-900 hover:bg-blue-600 rounded-full px-6 font-bold text-xs"
                    >
                      Изучить дело
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Все апелляции рассмотрены</h3>
          <p className="text-slate-400 max-w-sm mx-auto">На данный момент в системе нет активных протестов от пользователей.</p>
        </div>
      )}
    </div>
  )
}

