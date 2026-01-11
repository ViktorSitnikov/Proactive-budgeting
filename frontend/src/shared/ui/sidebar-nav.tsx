"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Home, PlusCircle, FolderOpen, User, BarChart3, LogOut } from "lucide-react"

interface SidebarNavProps {
  currentPage: string
  onNavigate: (page: string) => void
  onLogout: () => void
  role: "initiator" | "npo"
}

export function SidebarNav({ currentPage, onNavigate, onLogout, role }: SidebarNavProps) {
  const initiatorLinks = [
    { id: "home", label: "Главная", icon: Home },
    { id: "create", label: "Создать заявку", icon: PlusCircle },
    { id: "all-projects", label: "Все проекты", icon: FolderOpen },
    { id: "current-projects", label: "Текущие проекты", icon: FolderOpen },
    { id: "profile", label: "Профиль", icon: User },
  ]

  const npoLinks = [
    { id: "home", label: "Главная", icon: Home },
    { id: "profile-stats", label: "Профиль и статистика", icon: BarChart3 },
    { id: "requested-projects", label: "Запросы на помощь", icon: PlusCircle },
    { id: "current-projects", label: "Текущие проекты", icon: FolderOpen },
  ]

  const links = role === "initiator" ? initiatorLinks : npoLinks

  return (
    <aside className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <span className="text-xl font-bold text-white">B</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg">BudgetFlow</h2>
            <p className="text-xs text-muted-foreground">{role === "initiator" ? "Инициатор" : "НКО Партнер"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Button
              key={link.id}
              variant={currentPage === link.id ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3", currentPage === link.id && "bg-secondary")}
              onClick={() => onNavigate(link.id)}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          Выйти
        </Button>
      </div>
    </aside>
  )
}
