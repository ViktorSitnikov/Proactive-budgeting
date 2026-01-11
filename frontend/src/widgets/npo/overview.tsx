"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OpportunityCard } from "@/src/entities/opportunity/ui/opportunity-card"
import { ProjectCard } from "@/src/entities/project/ui/project-card"
import { ProjectDetailsModal } from "@/src/features/project-details/ui/project-details-modal"
import { TrendingUp, Clock, Handshake, Sparkles, Loader2 } from "lucide-react"
import { type User, type Project, type Opportunity } from "@/src/shared/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { projectsApi } from "@/src/shared/api/projects"

interface NPOOverviewProps {
  user: User
}

export function NPOOverview({ user }: NPOOverviewProps) {
  const { toast } = useToast()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [activeProjects, setActiveProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [opps, projects] = await Promise.all([
          projectsApi.getOpportunities(),
          projectsApi.getProjects({ npoId: user.id })
        ])
        setOpportunities(opps)
        setActiveProjects(projects)
      } catch (err) {
        console.error("Failed to load NPO overview data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user.id])

  const handleApply = (opportunityId: string) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === opportunityId ? { ...opp, status: "applied" as const } : opp)),
    )
    toast({
      title: "Запрос отправлен",
      description: "Ваш запрос на партнерство отправлен инициатору проекта!",
    })
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
    setDetailsOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="font-medium">Загрузка данных панели...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Панель партнера</h2>
        <p className="text-muted-foreground">Управляйте возможностями и отслеживайте свое влияние</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Handshake className="w-4 h-4" />
              Активные проекты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{activeProjects.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Проектов в работе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" />
              Входящие запросы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{opportunities.filter(o => o.status === 'open').length}</p>
            <p className="text-xs text-muted-foreground mt-1">Ожидают вашего рассмотрения</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
              <TrendingUp className="w-4 h-4" />
              Общий вклад
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-emerald-600">12</p>
            <p className="text-xs text-emerald-700 mt-1">Завершенных проектов</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold">AI-Curated Opportunities</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onApply={() => handleApply(opportunity.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Current Active Projects</h3>
        {activeProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {activeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={() => handleProjectClick(project)} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No active projects yet. Apply to opportunities above to get started!
            </CardContent>
          </Card>
        )}
      </div>

      <ProjectDetailsModal project={selectedProject} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </div>
  )
}
