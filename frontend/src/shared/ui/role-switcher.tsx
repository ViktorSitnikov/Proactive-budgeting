"use client"

import { Button } from "@/components/ui/button"
import { Lightbulb, Building2, Shield } from "lucide-react"

type Role = "initiator" | "npo" | "admin"

interface RoleSwitcherProps {
  currentRole: Role
  onRoleChange: (role: Role) => void
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-lg">
      <Button
        variant={currentRole === "initiator" ? "default" : "ghost"}
        size="sm"
        onClick={() => onRoleChange("initiator")}
        className="gap-2"
      >
        <Lightbulb className="w-4 h-4" />
        Initiator
      </Button>
      <Button
        variant={currentRole === "npo" ? "default" : "ghost"}
        size="sm"
        onClick={() => onRoleChange("npo")}
        className="gap-2"
      >
        <Building2 className="w-4 h-4" />
        Partner
      </Button>
      <Button
        variant={currentRole === "admin" ? "default" : "ghost"}
        size="sm"
        onClick={() => onRoleChange("admin")}
        className="gap-2"
      >
        <Shield className="w-4 h-4" />
        Admin
      </Button>
    </div>
  )
}
