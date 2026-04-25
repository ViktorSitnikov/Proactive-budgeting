"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, ChevronRight, Calendar, ArrowLeft, Trash2, Loader2 } from "lucide-react"
import { useApplicationStore } from "@/src/shared/lib/application-store"
import { ProjectStatuses } from "../../shared/lib/mock-data"
import { projectsApi, type Draft } from "@/src/shared/api/projects"


interface ApplicationsListPageProps {
  onCreateNew: () => void
  onContinueDraft: (draft: Draft) => void
  onBack: () => void
}

import { NotificationListener } from "@/src/shared/ui/notification-listener"

export function ApplicationsListPage({ onCreateNew, onContinueDraft, onBack }: ApplicationsListPageProps) {
  const queryClient = useQueryClient()
  
  const { data: drafts = [], isLoading, error } = useQuery({
    queryKey: ['drafts'],
    queryFn: async () => await projectsApi.getDrafts(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.deleteDraft(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['drafts'], (old: Draft[] = []) => 
        old.filter(d => d.id !== deletedId)
      )
    },
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот черновик?")) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 md:gap-2 px-2 md:px-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Назад</span>
            </Button>
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Мои заявки</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationListener />
            <Button onClick={onCreateNew} className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100">
              <Plus className="w-4 h-4" />
              <span>Создать заявку</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="space-y-6 md:space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                Ваши черновики
              </h2>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-20 text-muted-foreground bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <Loader2 className="w-8 md:w-10 h-8 md:h-10 animate-spin text-blue-500 mb-4" />
                <p className="font-medium text-sm md:text-base">Загружаем сохраненные идеи...</p>
              </div>
            ) : error ? (
              <div className="p-6 md:p-8 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center">
                <p className="font-bold mb-2">Упс! Что-то пошло не так</p>
                <p className="text-xs md:text-sm opacity-80">{error.message}</p>
                <Button variant="outline" className="mt-4 border-red-200 hover:bg-red-100" onClick={() => window.location.reload()}>
                  Попробовать снова
                </Button>
              </div>
            ) : drafts.length > 0 ? (
              <div className="grid gap-3 md:gap-4">
                {drafts.map((draft) => (
                  <Card key={draft.id} className="group hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base md:text-lg font-bold group-hover:text-blue-600 transition-colors truncate">
                              {draft.title}
                            </h3>
                            <span className="shrink-0 text-[8px] md:text-[10px] uppercase font-black tracking-widest px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                              Шаг {draft.step}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                            {draft.description}
                          </p>
                          <div className="flex items-center gap-4 pt-2 md:pt-3">
                            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium text-slate-400">
                              <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                              Обновлено: {new Date(draft.lastModified).toLocaleString("ru-RU")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 md:h-10 md:w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleDelete(draft.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="default" 
                            className="flex-1 sm:flex-none gap-2 bg-slate-900 hover:bg-blue-600 transition-all rounded-full px-4 md:px-6 text-xs md:text-sm h-9 md:h-10"
                            onClick={() => onContinueDraft(draft)}
                          >
                            <span>Продолжить</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50/50 border-2 border-dashed rounded-2xl text-muted-foreground">
                <p className="font-medium text-lg mb-2">Черновиков пока нет</p>
                <p className="text-sm max-w-xs mx-auto">Все ваши идеи, которые вы начнете оформлять, появятся здесь автоматически.</p>
              </div>
            )}
          </section>

          <section className="bg-blue-50/50 rounded-2xl p-8 border-2 border-dashed border-blue-200 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">Есть новая идея?</h3>
              <p className="text-sm text-muted-foreground">
                Начните создание новой заявки, и наш ИИ поможет вам оформить её по всем правилам
              </p>
              <Button onClick={onCreateNew} size="lg" className="w-full">
                Создать заявку
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

