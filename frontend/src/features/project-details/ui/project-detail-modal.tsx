"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, UserPlus } from "lucide-react"
import { useState } from "react"

interface ProjectDocument {
  id: string
  name: string
  type: string
  url: string
}

interface ProjectDetailModalProps {
  isOpen: boolean
  onClose: () => void
  project: {
    id: string
    title: string
    description: string
    location: string
    budget: number
    timeline: string
    status: string
    documents?: ProjectDocument[]
    participants?: number
  }
  canJoin?: boolean
  onJoin?: () => void
  userRole?: "initiator" | "npo" | "admin"
}

export function ProjectDetailModal({
  isOpen,
  onClose,
  project,
  canJoin = false,
  onJoin,
  userRole = "initiator",
}: ProjectDetailModalProps) {
  const [joined, setJoined] = useState(false)

  const handleJoin = () => {
    setJoined(true)
    onJoin?.()
  }

  const handleDownload = (doc: ProjectDocument) => {
    // Симуляция скачивания документа
    console.log("[v0] Downloading document:", doc.name)
    alert(`Скачивание документа: ${doc.name}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Описание</h4>
            <p className="text-sm text-slate-600">{project.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1 text-sm">Локация</h4>
              <p className="text-sm text-slate-600">{project.location}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-sm">Бюджет</h4>
              <p className="text-sm text-slate-600">{(project.budget || 0).toLocaleString()} ₽</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-sm">Сроки</h4>
              <p className="text-sm text-slate-600">{project.timeline}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-sm">Статус</h4>
              <Badge variant="secondary">{project.status}</Badge>
            </div>
          </div>

          {project.participants && (
            <div>
              <h4 className="font-semibold mb-1 text-sm">Участники</h4>
              <p className="text-sm text-slate-600">{project.participants} человек</p>
            </div>
          )}

          {project.documents && project.documents.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Документы проекта</h4>
              <div className="space-y-2">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.type}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {canJoin && !joined && (
              <Button onClick={handleJoin} className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Присоединиться к проекту
              </Button>
            )}
            {joined && (
              <div className="flex-1 text-center p-2 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                Вы присоединились к проекту!
              </div>
            )}
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
