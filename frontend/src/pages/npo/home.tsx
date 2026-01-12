"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserIcon, Briefcase, Clock, LogOut, TrendingUp, CheckCircle2, Globe, Building2, Bell } from "lucide-react"
import { type User, type Project, ProjectStatuses } from "@/src/shared/lib/mock-data"
import { ProfileStatsPage } from "./profile-stats"
import { RequestedProjectsPage } from "./requested-projects"
import { CurrentProjectsNPOPage } from "./current-projects"
import { projectsApi } from "../../shared/api/projects"

type NPOPage = "home" | "profile" | "requested" | "current-projects"

interface NPOHomeProps {
  user: User
  onLogout: () => void
}

export function NPOHome({ user, onLogout }: NPOHomeProps) {
  const [currentPage, setCurrentPage] = useState<NPOPage>("home")
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const data = await projectsApi.getProjects()
        setProjects(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = {
    active: projects.filter(p => p.npoId === user.id && p.status !== ProjectStatuses.success).length,
    completed: projects.filter(p => p.npoId === user.id && p.status === ProjectStatuses.success).length,
    requested: projects.filter(p => 
      !p.npoId && (
        p.status === ProjectStatuses.active || 
        p.ngoPartnerRequests?.some(r => r.npoId === user.id)
      )
    ).length,
    totalBudget: projects.filter(p => p.npoId === user.id).reduce((sum, p) => sum + p.budget, 0)
  }

  if (currentPage === "profile") {
    return <ProfileStatsPage user={user} onBack={() => setCurrentPage("home")} onLogout={onLogout} />
  }

  if (currentPage === "requested") {
    return <RequestedProjectsPage user={user} onBack={() => setCurrentPage("home")} onLogout={onLogout} />
  }

  if (currentPage === "current-projects") {
    return <CurrentProjectsNPOPage user={user} onBack={() => setCurrentPage("home")} onLogout={onLogout} />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">
                Городская<span className="text-blue-600">Инициатива</span>
              </h1>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Партнерская панель</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-l pl-6">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-none">{user.organization || user.name}</p>
                <p className="text-[10px] uppercase font-black text-emerald-600 tracking-tighter mt-1">НКО-Партнер</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} className="text-slate-400 hover:text-destructive transition-colors">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Добро пожаловать!</h2>
              <p className="text-slate-500 mt-2 text-lg">Ваш вклад делает город лучше и комфортнее для всех.</p>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[140px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">В работе</p>
                <p className="text-2xl font-black text-blue-600">{stats.active}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[140px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Завершено</p>
                <p className="text-2xl font-black text-emerald-600">{stats.completed}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[140px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Бюджет</p>
                <p className="text-2xl font-black text-slate-900">{(stats.totalBudget / 1000000).toFixed(1)}M ₽</p>
              </div>
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card
                className="cursor-pointer border-none shadow-xl hover:shadow-2xl transition-all h-full bg-white group overflow-hidden relative"
                onClick={() => setCurrentPage("requested")}
              >
                <div className="absolute top-0 right-0 p-6">
                  {stats.requested > 0 && (
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs animate-bounce shadow-lg shadow-red-200">
                      {stats.requested}
                    </div>
                  )}
                </div>
                <div className="h-2 w-full bg-blue-500" />
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-all duration-500 transform group-hover:rotate-12">
                    <Briefcase className="w-8 h-8 text-blue-600 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-2xl font-black">Запросы на помощь</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Проекты горожан, которые ищут опытного партнера для реализации.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card
                className="cursor-pointer border-none shadow-xl hover:shadow-2xl transition-all h-full bg-white group overflow-hidden"
                onClick={() => setCurrentPage("current-projects")}
              >
                <div className="h-2 w-full bg-purple-500" />
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-all duration-500 transform group-hover:scale-110">
                    <Clock className="w-8 h-8 text-purple-600 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-2xl font-black">Текущие проекты</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Управление активными инициативами, контроль смет и сроков.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card
                className="cursor-pointer border-none shadow-xl hover:shadow-2xl transition-all h-full bg-white group overflow-hidden"
                onClick={() => setCurrentPage("profile")}
              >
                <div className="h-2 w-full bg-emerald-500" />
                <CardHeader>
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-all duration-500">
                    <UserIcon className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-2xl font-black">Профиль НКО</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Настройка компетенций вашей организации и детальная статистика.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Social Proof Placeholder */}
          <div className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/20 blur-[100px] -ml-32 -mb-32" />
            
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-3xl font-black mb-4 italic">"Сила города — в его людях и их инициативности"</h3>
              <p className="text-slate-400 text-lg">
                Вы помогаете превращать идеи в реальные объекты городской среды. 
                Ваша экспертиза — ключ к успешному прохождению бюрократических барьеров.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}