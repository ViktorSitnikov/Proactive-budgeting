"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Users, FileText, PieChart, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { type Project, type ProjectDetails } from "@/src/shared/lib/mock-data"
import { projectsApi } from "@/src/shared/api/projects"
import { getImageUrl } from "@/src/shared/api/base"

interface ProjectDetailsModalProps {
  project: Project | null
  open: boolean
  onClose: () => void
}

export function ProjectDetailsModal({ project, open, onClose }: ProjectDetailsModalProps) {
  const [details, setDetails] = useState<ProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (project && open) {
      const loadDetails = async () => {
        try {
          setIsLoading(true)
          const data = await projectsApi.getProjectDetails(project.id)
          setDetails(data)
        } catch (err) {
          console.error("Failed to load project details:", err)
        } finally {
          setIsLoading(false)
        }
      }
      loadDetails()
    }
  }, [project, open])

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p>Загрузка деталей проекта...</p>
          </div>
        ) : details ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="uppercase tracking-widest text-[10px] font-bold">
                  ID: {project.id}
                </Badge>
                <Badge className="bg-blue-500">{project.status}</Badge>
              </div>
              <DialogTitle className="text-3xl font-black">{project.title}</DialogTitle>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{project.location}</span>
              </div>
            </DialogHeader>

            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <Card className="col-span-2">
                <CardContent className="p-0">
                  <img
                    src={getImageUrl(project.image)}
                    alt={project.title}
                    className="w-full aspect-video object-cover rounded-t-xl"
                  />
                  <div className="p-6">
                    <h4 className="font-bold mb-2 uppercase tracking-tight text-sm text-slate-400">Описание проекта</h4>
                    <p className="text-slate-600 leading-relaxed">{project.description}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Прогресс</span>
                        <span className="text-xl font-black text-blue-600">{details.progress}%</span>
                      </div>
                      <Progress value={details.progress} className="h-2" />
                    </div>
                    <div className="pt-4 border-t">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Текущая стадия</span>
                      <p className="font-bold text-slate-900">{details.stage}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Следующий этап</span>
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <Clock className="w-4 h-4" />
                        {details.nextMilestone}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-none shadow-xl">
                  <CardContent className="p-6">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Бюджет проекта</span>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-400">Освоено:</span>
                        <span className="font-bold">{(details.budget.spent || 0).toLocaleString()} ₽</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-400">Остаток:</span>
                        <span className="font-bold">{(details.budget.remaining || 0).toLocaleString()} ₽</span>
                      </div>
                      <div className="pt-3 border-t border-slate-800 flex justify-between items-end">
                        <span className="text-xs text-slate-400">Всего:</span>
                        <span className="text-xl font-black text-emerald-400">{(details.budget.total || 0).toLocaleString()} ₽</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Tabs defaultValue="team" className="mt-8">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="team" className="rounded-lg font-bold uppercase text-[10px] tracking-widest">
                  Команда
                </TabsTrigger>
                <TabsTrigger value="docs" className="rounded-lg font-bold uppercase text-[10px] tracking-widest">
                  Документы
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-lg font-bold uppercase text-[10px] tracking-widest">
                  Аналитика
                </TabsTrigger>
              </TabsList>
              <TabsContent value="team" className="mt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {details.collaborators.map((member, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm">
                      <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{member.name}</p>
                        <p className="text-xs text-blue-600 font-medium">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="docs" className="mt-6">
                <div className="space-y-3">
                  {details.documents.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      className="flex items-center justify-between p-4 rounded-xl border hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {doc.name}
                          </p>
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            {doc.type} • {doc.date}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full border flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </a>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="stats" className="mt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <PieChart className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-black text-slate-900">1.2к</p>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Поддержка жителей</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-2xl font-black text-slate-900">12</p>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Волонтеров</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-black text-slate-900">85%</p>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Успешность KPI</p>
                    </CardContent>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="p-10 text-center text-muted-foreground">Не удалось загрузить данные о проекте.</div>
          )}
        </DialogContent>
      </Dialog>
  )
}
