"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import type { Project } from "@/shared/lib/mock-data"
import { getImageUrl } from "@/src/shared/api/base"

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 relative">
        <img src={getImageUrl(project.image)} alt={project.title} className="w-full h-full object-cover" />
        <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">{project.status}</Badge>
      </div>
      <CardHeader>
        <CardTitle className="text-base">{project.title}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs">
          <MapPin className="w-3 h-3" />
          {project.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Budget</span>
          <span className="font-semibold text-emerald-600">{(project.budget || 0).toLocaleString()} ₽</span>
        </div>
      </CardContent>
    </Card>
  )
}
