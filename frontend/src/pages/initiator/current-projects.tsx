"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, LogOut, MapPin, Coins, Users, Loader2 } from "lucide-react"
import { ProjectStatuses } from "../../shared/lib/mock-data"
import type { User, Project } from "../../shared/lib/mock-data"
import { ProjectView } from "../../shared/ui/project-view"
import { projectsApi } from "../../shared/api/projects"
import { getImageUrl } from "@/src/shared/api/base"

interface CurrentProjectsPageProps {
  user: User
  onBack: () => void
  onLogout: () => void
}

export function CurrentProjectsPage({ user, onBack, onLogout }: CurrentProjectsPageProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        // Запрашиваем проекты конкретного пользователя через API
        const data = await projectsApi.getProjects({ initiatorId: user.id })
        setProjects(data)
      } catch (err) {
        console.error("Failed to load projects:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [user.id])

  if (selectedProject) {
    return <ProjectView project={selectedProject} onBack={() => setSelectedProject(null)} currentUserId={user.id} />
  }

  // Теперь проекты уже отфильтрованы бэкендом
  const userProjects = projects

  const getProjectBudget = (project: Project) => {
    if (project.budget > 0) return project.budget;
    if (!project.resources || project.resources.length === 0) return 0;
    return project.resources.reduce((sum, r) => {
      const price = r.basePrice || r.estimatedCost || 0;
      const qty = r.quantity || 0;
      return sum + (price * qty);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 md:gap-2 px-2 md:px-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Назад</span>
            </Button>
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Мои проекты</h1>
          </div>
          <Button variant="ghost" onClick={onLogout} className="gap-2 px-2 md:px-4">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="font-medium">Загружаем ваши проекты...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {userProjects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={getImageUrl(project.image)}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 border-none shadow-sm backdrop-blur-sm">
                      {project.type || 'Благоустройство'}
                    </Badge>
                    {project.initiatorId === user.id && (
                      <Badge className="absolute top-3 right-3 bg-blue-100 text-blue-700">Мой проект</Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {project.location}
                    </div>
                    <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                              <Coins className="w-4 h-4" />
                              {(getProjectBudget(project) || 0).toLocaleString()} ₽
                            </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />{project.participants?.length || 1} участника
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {userProjects.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">У вас пока нет активных проектов</p>
                  <Button onClick={onBack}>Создать первый проект</Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
