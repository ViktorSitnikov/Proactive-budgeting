"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Users, ChevronRight, ChevronLeft, MapPin, Coins, UserPlus, Loader2, Search } from "lucide-react"
import { ProjectStatuses, type Project } from "@/src/shared/lib/mock-data"
import { getImageUrl } from "@/src/shared/api/base"
import { useToast } from "@/hooks/use-toast"
import { useApplicationStore } from "@/src/shared/lib/application-store"
import { ProjectView } from "@/src/shared/ui/project-view"
import { projectsApi } from "@/src/shared/api/projects"

interface InitiatorStep2Props {
  onNext: () => void
  onBack: () => void
  /** Подпись кнопки возврата (например «К моим заявкам», если назад на шаг 1 нельзя) */
  backButtonLabel?: string
  onSubscribeAndExit?: (projectId: string) => void
  currentUserId?: string
}

export function InitiatorStep2({
  onNext,
  onBack,
  backButtonLabel = "Назад",
  onSubscribeAndExit,
  currentUserId,
}: InitiatorStep2Props) {
  const { toast } = useToast()
  const { data } = useApplicationStore()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedSuccessProject, setSelectedSuccessProject] = useState<Project | null>(null)
  const [subscribedProjects, setSubscribedProjects] = useState<string[]>([])

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['polygonIntersections', data.polygon, data.id],
    queryFn: async () => {
      if (data.polygon && data.polygon.length >= 3) {
        return await projectsApi.findPolygonIntersections(data.polygon, data.id)
      }
      return []
    },
    enabled: !!data.polygon && data.polygon.length >= 3,
  })

  if (selectedProject) {
    return <ProjectView project={selectedProject} onBack={() => setSelectedProject(null)} currentUserId={currentUserId} />
  }

  if (selectedSuccessProject) {
    return <ProjectView project={selectedSuccessProject} onBack={() => setSelectedSuccessProject(null)} currentUserId={currentUserId} />
  }

  const nearbyProjects = projects.filter((p) => p.status !== ProjectStatuses.success)
  // Блок успешных кейсов скрыт по запросу
  // const successProjects = projects.filter((p) => p.status === ProjectStatuses.success)

  const handleViewProject = (project: Project) => {
    setSelectedProject(project)
  }

  const handleSubscribe = (projectId: string) => {
    setSubscribedProjects([...subscribedProjects, projectId])
    toast({
      title: "Успешно подписались!",
      description: "Проект добавлен в ваши текущие проекты.",
      duration: 3000,
    })
    setSelectedProject(null)

    if (onSubscribeAndExit) {
      setTimeout(() => {
        onSubscribeAndExit(projectId)
      }, 1500)
    }
  }

  // Блок успешных кейсов скрыт по запросу
  // const handleViewSuccessProject = (project: Project) => {
  //   setSelectedSuccessProject(project)
  // }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Проверка на дубликаты</h2>
        <p className="text-muted-foreground">
          {data.polygon && data.polygon.length >= 3 
            ? "Мы ищем похожие проекты в выделенной вами области. Вы можете присоединиться к ним или продолжить создание своего." 
            : "Для поиска похожих проектов необходимо выделить полигон на карте на предыдущем шаге."}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="font-medium">Ищем похожие идеи поблизости...</p>
        </div>
      ) : (
        <>
          <Card className="border-border bg-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                {data.polygon && data.polygon.length >= 3 ? (
                  <>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Users className="w-5 h-5" />
                      Найдено {nearbyProjects.length} похожих проектов
                    </CardTitle>
                    <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                      Поиск по полигону
                    </div>
                  </>
                ) : (
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <MapPin className="w-5 h-5" />
                    Полигон не задан, поиск дубликатов пропущен
                  </CardTitle>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {nearbyProjects.length > 0 ? (
                nearbyProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewProject(project)}
                  >
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                          src={getImageUrl(project.image)}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      {subscribedProjects.includes(project.id) && (
                        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">Подписан</Badge>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base line-clamp-1">{project.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  Пересечений с другими инициативами в этой зоне не найдено.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex items-center justify-between">
        <Button size="lg" variant="outline" onClick={onBack} className="gap-2 bg-transparent">
          <ChevronLeft className="w-4 h-4" />
          {backButtonLabel}
        </Button>
        <Button size="lg" onClick={onNext} className="gap-2">
          Всё уникально, далее
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Диалоги ProjectView убраны: они рендерятся через `if (selectedProject)` выше */}
    </div>
  )
}
