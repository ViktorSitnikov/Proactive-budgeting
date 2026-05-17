"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Home, PlusCircle, FolderOpen, User, BarChart3, LogOut } from "lucide-react"
import { BrandMark } from "@/src/shared/ui/brand-mark"

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
        <BrandMark
          compact
          tagline={role === "initiator" ? "Инициатор" : "НКО-партнёр"}
        />
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Button
              key={link.id}
              variant={currentPage === link.id ? "default" : "ghost"}
              className={cn("w-full justify-start gap-3", currentPage === link.id && "bg-primary")}
              onClick={() => onNavigate(link.id)}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
          Выйти
        </Button>
      </div>
    </aside>
  )
}
