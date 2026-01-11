"use client"

import { motion } from "framer-motion"
import {
  Lightbulb,
  Sparkles,
  Calculator,
  Target,
  Handshake,
  FileCheck,
  Settings,
  FileText,
  Database,
  BarChart3,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Role = "initiator" | "npo" | "admin"
type InitiatorStep = 1 | 2 | 3

interface SidebarProps {
  role: Role
  currentStep?: InitiatorStep
}

export function Sidebar({ role, currentStep }: SidebarProps) {
  const menuItems = {
    initiator: [
      { icon: Lightbulb, label: "Creative Input", step: 1 },
      { icon: Sparkles, label: "AI Matching", step: 2 },
      { icon: Calculator, label: "Financials", step: 3 },
    ],
    npo: [
      { icon: Target, label: "Dashboard" },
      { icon: Handshake, label: "Opportunities" },
      { icon: FileCheck, label: "Active Projects" },
    ],
    admin: [
      { icon: Settings, label: "Global Settings" },
      { icon: FileText, label: "Templates" },
      { icon: Database, label: "Knowledge Base" },
      { icon: BarChart3, label: "AI Metrics" },
    ],
  }

  const items = menuItems[role]

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border p-6 z-40"
    >
      <div className="mb-8">
        <h1 className="text-xl font-bold text-sidebar-foreground">BudgetFlow</h1>
        <p className="text-sm text-muted-foreground">Proactive Budgeting</p>
      </div>

      <nav className="space-y-2">
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = "step" in item ? item.step === currentStep : index === 0
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {"step" in item && (
                <Badge variant="secondary" className="ml-auto">
                  {item.step}
                </Badge>
              )}
            </div>
          )
        })}
      </nav>
    </motion.aside>
  )
}
