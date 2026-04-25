"use client"

import { Sidebar } from "@/src/shared/ui/sidebar"
import { AdminOverview } from "@/src/widgets/admin/overview"
import type { User } from "@/src/shared/lib/mock-data"

interface AdminDashboardProps {
  user: User
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  return (
    <>
      <Sidebar role="admin" />
      <div className="ml-64 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-8">
          <AdminOverview user={user} />
        </div>
      </div>
    </>
  )
}
