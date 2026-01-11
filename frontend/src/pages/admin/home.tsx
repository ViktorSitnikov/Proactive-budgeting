"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  LogOut, 
  LayoutDashboard, 
  Gavel, 
  Building2, 
  Cpu, 
  Settings,
  Bell,
  Search,
  Menu,
  X
} from "lucide-react"
import { type User, ProjectStatuses } from "@/src/shared/lib/mock-data"
import { projectsApi } from "@/src/shared/api/projects"
import { AdminOverview } from "@/src/widgets/admin/overview"
import { AppealsPage } from "./appeals"
import { NPOManagementPage } from "./npo-management"
import { AIModelsPage } from "./ai-models"

type AdminPage = "overview" | "appeals" | "npos" | "models"

interface AdminHomeProps {
  user: User
  onLogout: () => void
}

export function AdminHome({ user, onLogout }: AdminHomeProps) {
  const [currentPage, setCurrentPage] = useState<AdminPage>("overview")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [counts, setCounts] = useState({ appeals: 0, npos: 0 })

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

    const fetchCounts = async () => {
      try {
        const [projects, npos] = await Promise.all([
          projectsApi.getProjects(),
          projectsApi.getNPOs()
        ])
        setCounts({
          appeals: projects.filter(p => p.status === ProjectStatuses.appeal_pending).length,
          npos: npos.filter(n => n.status === "pending").length
        })
      } catch (err) {
        console.error("Failed to fetch counts:", err)
      }
    }

  useEffect(() => {
    fetchCounts()
  }, [])

  const navItems = [
    { id: "overview", label: "Система", icon: Settings },
    { id: "appeals", label: "Апелляции", icon: Gavel, badge: counts.appeals },
    { id: "npos", label: "Управление НКО", icon: Building2, badge: counts.npos },
    { id: "models", label: "ИИ Модели", icon: Cpu },
  ]

  const renderContent = () => {
    switch (currentPage) {
      case "overview":
        return <AdminOverview user={user} />
      case "appeals":
        return <AppealsPage onActionComplete={fetchCounts} />
      case "npos":
        return <NPOManagementPage onActionComplete={fetchCounts} />
      case "models":
        return <AIModelsPage />
      default:
        return <AdminOverview user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 80),
          x: isSidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -280 : 0)
        }}
        className="bg-slate-900 text-white flex flex-col fixed h-full z-50 transition-all duration-300 md:relative"
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">A</div>
                <span className="font-black uppercase tracking-tighter text-sm">Панель администратора</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id as AdminPage);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentPage === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-bold text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold text-sm">Выход</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div 
        className="flex-1 transition-all duration-300 w-full"
        style={{ 
          marginLeft: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : (isSidebarOpen ? 0 : 0) 
        }}
      >
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {!isSidebarOpen && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setIsSidebarOpen(true)}
                 className="md:hidden"
               >
                 <Menu className="w-5 h-5" />
               </Button>
             )}
             <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight truncate">
            {navItems.find(i => i.id === currentPage)?.label}
          </h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3 pl-4 md:pl-6 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black leading-none">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Super Admin</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-base">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-6xl">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
