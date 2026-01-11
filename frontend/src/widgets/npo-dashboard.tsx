"use client"

import { Sidebar } from "@/src/shared/ui/sidebar"
import { NPOOverview } from "@/src/widgets/npo/overview"
import type { User } from "@/src/shared/lib/mock-data"

interface NPODashboardProps {
  user: User
}

export function NPODashboard({ user }: NPODashboardProps) {
  return (
    <>
      <Sidebar role="npo" />
      <div className="ml-64 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-8">
          <NPOOverview user={user} />
        </div>
      </div>
    </>
  )
}
