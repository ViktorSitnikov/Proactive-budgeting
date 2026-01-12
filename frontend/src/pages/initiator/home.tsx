"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, FolderOpen, Clock, UserIcon, LogOut, LayoutGrid, Map as MapIcon, Loader2 } from "lucide-react"
import { ProjectStatuses, type User, type Project } from "../../shared/lib/mock-data"
import { CreateApplicationPage } from "./create-application"
import { AllProjectsPage } from "./all-projects"
import { ProfilePage } from "./profile"
import { CurrentProjectsPage } from "./current-projects"
import { ApplicationsListPage } from "./applications-list"
import { useApplication } from "@/src/shared/lib/application-context"
import { ProjectMap } from "@/src/shared/ui/project-map"
import { ProjectView } from "@/src/shared/ui/project-view"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { projectsApi } from "../../shared/api/projects"

type InitiatorPage = "home" | "create" | "all-projects" | "profile" | "current-projects" | "applications-list" | "project-view"

interface InitiatorHomeProps {
  user: User
  onLogout: () => void
}

export function InitiatorHome({ user, onLogout }: InitiatorHomeProps) {
  const [currentPage, setCurrentPage] = useState<InitiatorPage>("home")
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [initialCreateStep, setInitialCreateStep] = useState<number>(1)
  const [isMapHovered, setIsMapHovered] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { updateData, resetData } = useApplication()

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

  const mapProjects = useMemo(() => projects.filter(p => 
    p.status === ProjectStatuses.active || 
    p.status === ProjectStatuses.ngo_partnered ||
    p.status === ProjectStatuses.success
  ).map(p => ({...p, status: p.status === ProjectStatuses.ngo_partnered ? ProjectStatuses.active : p.status})
  ), [projects]);

  const handleCreateNew = useCallback(() => {
    resetData()
    setInitialCreateStep(1)
    setCurrentPage("create")
  }, [resetData]);

  const handleContinueDraft = useCallback((draft: any) => {
    updateData({
      title: draft.title,
      idea: draft.description,
      status: draft.status,
      currentStep: draft.step,
      resources: draft.resources || []
    })
    setInitialCreateStep(draft.step)
    setCurrentPage("create")
  }, [updateData]);

  const handleViewProject = useCallback((project: any) => {
    setSelectedProject(project)
    setCurrentPage("project-view")
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentPage("home")
  }, []);

  if (currentPage === "project-view" && selectedProject) {
    return <ProjectView project={selectedProject} onBack={handleBackToHome} currentUserId={user.id} />
  }

  if (currentPage === "create") {
    return (
      <CreateApplicationPage 
        user={user} 
        onBack={() => setCurrentPage("home")} 
        onLogout={onLogout} 
        initialStep={initialCreateStep as any}
      />
    )
  }

  if (currentPage === "all-projects") {
    return <AllProjectsPage user={user} onBack={() => setCurrentPage("home")} onLogout={onLogout} />
  }

  if (currentPage === "profile") {
    return <ProfilePage user={user} onBack={() => setCurrentPage("home")} onLogout={onLogout} />
  }

  if (currentPage === "current-projects") {
    return <CurrentProjectsPage user={user} onBack={() => setCurrentPage("home")} onLogout={onLogout} />
  }

  if (currentPage === "applications-list") {
    return (
      <ApplicationsListPage 
        onBack={() => setCurrentPage("home")} 
        onCreateNew={handleCreateNew} 
        onContinueDraft={handleContinueDraft}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-emerald-50 text-foreground">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight text-slate-900">
              Городская<span className="text-blue-600">Инициатива</span>
            </h1>
            <div className="flex sm:hidden items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onLogout} className="text-slate-400">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <Tabs value={viewMode} onValueChange={(v: string) => setViewMode(v as any)} className="w-full sm:w-[300px] shrink-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grid" className="gap-2 text-xs md:text-sm">
                  <LayoutGrid className="w-4 h-4" />
                  Кабинет
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2 text-xs md:text-sm">
                  <MapIcon className="w-4 h-4" />
                  Карта
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="hidden sm:flex items-center gap-4 border-l pl-6">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-[10px] uppercase font-black text-blue-600 tracking-tighter">Гражданин</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} className="text-slate-400 hover:text-destructive transition-colors">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="relative">
          {/* Grid View */}
          <div className={`${viewMode === 'grid' ? 'block' : 'hidden'}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={viewMode === 'grid' ? { opacity: 1, y: 0 } : {}}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Личный кабинет</h2>
                  <p className="text-slate-500 mt-2 text-lg">Управляйте своими инициативами и следите за изменениями</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card
                    className="cursor-pointer border-none shadow-lg hover:shadow-2xl transition-all h-full bg-white group overflow-hidden"
                    onClick={() => setCurrentPage("applications-list")}
                  >
                    <div className="h-2 w-full bg-blue-500" />
                    <CardHeader>
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-blue-600 transition-all duration-500 transform group-hover:rotate-12">
                        <PlusCircle className="w-7 h-7 text-blue-600 group-hover:text-white" />
                      </div>
                      <CardTitle className="text-2xl font-black text-slate-900">Мои заявки</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Создание новых проектов и редактирование черновиков
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card
                    className="cursor-pointer border-none shadow-lg hover:shadow-2xl transition-all h-full bg-white group overflow-hidden"
                    onClick={() => setCurrentPage("all-projects")}
                  >
                    <div className="h-2 w-full bg-emerald-500" />
                    <CardHeader>
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-emerald-600 transition-all duration-500 transform group-hover:-rotate-12">
                        <FolderOpen className="w-7 h-7 text-emerald-600 group-hover:text-white" />
                      </div>
                      <CardTitle className="text-2xl font-black text-slate-900">Все проекты</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Карта города и список всех инициатив с фильтрами
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card
                    className="cursor-pointer border-none shadow-lg hover:shadow-2xl transition-all h-full bg-white group overflow-hidden"
                    onClick={() => setCurrentPage("current-projects")}
                  >
                    <div className="h-2 w-full bg-purple-500" />
                    <CardHeader>
                      <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-purple-600 transition-all duration-500 transform group-hover:scale-110">
                        <Clock className="w-7 h-7 text-purple-600 group-hover:text-white" />
                      </div>
                      <CardTitle className="text-2xl font-black text-slate-900">Мои проекты</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Проекты, которые реализуются прямо сейчас
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card
                    className="cursor-pointer border-none shadow-lg hover:shadow-2xl transition-all h-full bg-white group overflow-hidden"
                    onClick={() => setCurrentPage("profile")}
                  >
                    <div className="h-2 w-full bg-orange-500" />
                    <CardHeader>
                      <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-orange-600 transition-all duration-500">
                        <UserIcon className="w-7 h-7 text-orange-600 group-hover:text-white" />
                      </div>
                      <CardTitle className="text-2xl font-black text-slate-900">Мой профиль</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Ваша статистика, достижения и настройки аккаунта
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Map View */}
          <div className={`${viewMode === 'map' ? 'block' : 'hidden'}`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={viewMode === 'map' ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4 }}
              className="relative h-[calc(100vh-150px)] min-h-[100px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white group"
              onMouseEnter={() => setIsMapHovered(true)}
              onMouseLeave={() => setIsMapHovered(false)}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-slate-500 font-bold">Загружаем карту города...</p>
                </div>
              ) : (
                <>
                  <ProjectMap 
                    projects={mapProjects}
                    onProjectClick={handleViewProject}
                    className={`h-full w-full transition-all duration-700 ${isMapHovered ? 'scale-105' : 'scale-100 opacity-80'}`}
                    initialZoom={12}
                  />
                  
                  <AnimatePresence>
                    {!isMapHovered && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10"
                      >
                        <div className="text-center p-8 bg-white/10 rounded-full border border-white/20 backdrop-blur-xl">
                          <MapIcon className="w-12 h-12 text-white mx-auto mb-2 animate-pulse" />
                          <p className="text-white font-black text-xl uppercase tracking-widest">Исследовать город</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Map Stats Floating Badge */}
                  <div className={`absolute top-8 right-8 z-20 hidden lg:block transition-all duration-500 ${isMapHovered ? 'opacity-0 translate-x-10' : 'opacity-100'}`}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/20 space-y-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-sm font-black text-slate-800 uppercase">Проектов в работе: {mapProjects.filter(p => p.status === ProjectStatuses.active).length}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm font-black text-slate-800 uppercase">Успешно завершено: {mapProjects.filter(p => p.status === ProjectStatuses.success).length}</span>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
