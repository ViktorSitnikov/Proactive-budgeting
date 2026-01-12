"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, LogOut, Search, Filter, MapPin, Coins, Loader2 } from "lucide-react"
import { ProjectStatuses } from "../../shared/lib/mock-data"
import type { User, Project } from "../../shared/lib/mock-data"
import { ProjectView } from "../../shared/ui/project-view"
import { projectsApi } from "../../shared/api/projects"
import { getImageUrl } from "@/src/shared/api/base"

interface AllProjectsPageProps {
  user: User
  onBack: () => void
  onLogout: () => void
}

export function AllProjectsPage({ user, onBack, onLogout }: AllProjectsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "success" | "pending">("all")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        const data = await projectsApi.getProjects()
        // Фильтруем только Активные и Завершенные по умолчанию для общего списка
        const visibleProjects = data.filter(p => 
          p.status === ProjectStatuses.active || 
          p.status === ProjectStatuses.ngo_partnered ||
          p.status === ProjectStatuses.success ||
          p.initiatorId === user.id // Но автор видит свои проекты в любом статусе
        ).map(p => ({
          ...p, status: (p.status === ProjectStatuses.ngo_partnered ? ProjectStatuses.active : p.status)
        }))
        setProjects(visibleProjects)
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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && project.status === ProjectStatuses.active) ||
      (statusFilter === "success" && project.status === ProjectStatuses.success) ||
      (statusFilter === "pending" && project.status === ProjectStatuses.ai_scoring)

    return matchesSearch && matchesStatus
  })

  const getStatusLabel = (status: ProjectStatuses) => {
    const labels: Record<ProjectStatuses, string> = {
      [ProjectStatuses.success]: "Завершен",
      [ProjectStatuses.active]: "Активный",
      [ProjectStatuses.ai_scoring]: "В ожидании",
      [ProjectStatuses.draft]: "Черновик",
      [ProjectStatuses.duplicate_check]: "Проверка дублей",
      [ProjectStatuses.resource_generation]: "Генерация сметы",
      [ProjectStatuses.refinement]: "На правках",
      [ProjectStatuses.ngo_partnered]: "С НКО",
      [ProjectStatuses.rejected]: "Отклонено",
      [ProjectStatuses.appeal_pending]: "Апелляция",
    }
    return labels[status] || status
  }

  const getStatusColor = (status: ProjectStatuses) => {
    if (status === ProjectStatuses.success) return "bg-emerald-100 text-emerald-700 border-emerald-200"
    if (status === ProjectStatuses.active) return "bg-blue-100 text-blue-700 border-blue-200"
    if (status === ProjectStatuses.ai_scoring) return "bg-orange-100 text-orange-700 border-orange-200"
    return "bg-gray-100 text-gray-700 border-gray-200"
  }

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
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Все проекты</h1>
          </div>
          <Button variant="ghost" onClick={onLogout} className="gap-2 px-2 md:px-4">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Search and Filter */}
        <div className="mb-6 md:mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 md:h-11"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-transparent h-10 md:h-11 justify-center sm:justify-start">
              <Filter className="w-4 h-4" />
              <span>Фильтры</span>
            </Button>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="rounded-full px-4"
            >
              Все
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              className="rounded-full px-4"
            >
              Активные
            </Button>
            <Button
              variant={statusFilter === "success" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("success")}
              className="rounded-full px-4"
            >
              Завершенные
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
              className="rounded-full px-4 whitespace-nowrap"
            >
              В ожидании
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="font-medium">Загружаем список проектов...</p>
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden"
                  onClick={() => setSelectedProject(project)}
                >
                  {project.initiatorId === user.id && (
                    <div className="absolute top-0 left-0 z-10 bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-br-lg shadow-md">
                      Вы автор
                    </div>
                  )}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={getImageUrl(project.image)}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 border-none shadow-sm backdrop-blur-sm">
                      {project.type || 'Благоустройство'}
                    </Badge>
                    <Badge className={`absolute top-3 right-3 ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {project.location}
                    </div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                              <Coins className="w-4 h-4" />
                              {(getProjectBudget(project) || 0).toLocaleString()} ₽
                            </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Проекты не найдены</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
