"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Users, ChevronRight, ChevronLeft, MapPin, Coins, UserPlus, Loader2 } from "lucide-react"
import { ProjectStatuses, type Project } from "../../shared/lib/mock-data"
import { getImageUrl } from "@/src/shared/api/base"
import { useToast } from "@/hooks/use-toast"
import { useApplication } from "@/src/shared/lib/application-context"
import { ProjectView } from "../../shared/ui/project-view"
import { projectsApi } from "../../shared/api/projects"

interface InitiatorStep2Props {
  onNext: () => void
  onBack: () => void
  onSubscribeAndExit?: (projectId: string) => void
  currentUserId?: string
}

export function InitiatorStep2({ onNext, onBack, onSubscribeAndExit, currentUserId }: InitiatorStep2Props) {
  const { toast } = useToast()
  const { data } = useApplication()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedSuccessProject, setSelectedSuccessProject] = useState<Project | null>(null)
  const [subscribedProjects, setSubscribedProjects] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        const data = await projectsApi.getProjects()
        setProjects(data)
      } catch (err) {
        console.error("Failed to load projects:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [])

  if (selectedProject) {
    return <ProjectView project={selectedProject} onBack={() => setSelectedProject(null)} currentUserId={currentUserId} />
  }

  if (selectedSuccessProject) {
    return <ProjectView project={selectedSuccessProject} onBack={() => setSelectedSuccessProject(null)} currentUserId={currentUserId} />
  }

  const nearbyProjects = projects.filter((p) => p.status === ProjectStatuses.active || p.status === ProjectStatuses.ai_scoring)
  const successProjects = projects.filter((p) => p.status === ProjectStatuses.success)

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

  const handleViewSuccessProject = (project: Project) => {
    setSelectedSuccessProject(project)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Проверка на дубликаты</h2>
        <p className="text-muted-foreground">Мы нашли похожие проекты поблизости. Вы можете присоединиться к ним или продолжить создание своего.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="font-medium">Ищем похожие идеи поблизости...</p>
        </div>
      ) : (
        <>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Users className="w-5 h-5" />
                Найдено {nearbyProjects.length} похожих проектов поблизости!
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {nearbyProjects.map((project) => (
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
                      <Badge className="absolute top-3 right-3 bg-emerald-500 text-white">Подписан</Badge>
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
              ))}
            </CardContent>
          </Card>

          <div>
            <h3 className="text-xl font-semibold mb-4">Похожие успешные кейсы</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {successProjects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewSuccessProject(project)}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                        src={getImageUrl(project.image)}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 border-emerald-200">
                      Завершен
                    </Badge>
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
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <Coins className="w-3 h-3" />
                      {(project.budget || 0).toLocaleString()} ₽
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <Button size="lg" variant="outline" onClick={onBack} className="gap-2 bg-transparent">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button size="lg" onClick={onNext} className="gap-2">
          Всё уникально, далее
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <img
                src={selectedProject.image || "/placeholder.svg"}
                alt={selectedProject.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div>
                <h4 className="font-semibold mb-2">Описание</h4>
                <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Местоположение</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedProject.location}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Бюджет</h4>
                  <p className="text-sm text-emerald-600 flex items-center gap-1 font-semibold">
                    <Coins className="w-3 h-3" />
                    {(selectedProject.budget || 0).toLocaleString()} ₽
                  </p>
                </div>
              </div>
              {!subscribedProjects.includes(selectedProject.id) && (
                <Button onClick={() => handleSubscribe(selectedProject.id)} className="w-full gap-2">
                  <UserPlus className="w-4 h-4" />
                  Отправить запрос на вступление
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSuccessProject} onOpenChange={() => setSelectedSuccessProject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSuccessProject?.title}</DialogTitle>
          </DialogHeader>
          {selectedSuccessProject && (
            <div className="space-y-4">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Завершен успешно</Badge>
              <img
                src={selectedSuccessProject.image || "/placeholder.svg"}
                alt={selectedSuccessProject.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div>
                <h4 className="font-semibold mb-2">Описание</h4>
                <p className="text-sm text-muted-foreground">{selectedSuccessProject.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Местоположение</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedSuccessProject.location}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Бюджет</h4>
                  <p className="text-sm text-emerald-600 flex items-center gap-1 font-semibold">
                    <Coins className="w-3 h-3" />
                    {(selectedSuccessProject.budget || 0).toLocaleString()} ₽
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
