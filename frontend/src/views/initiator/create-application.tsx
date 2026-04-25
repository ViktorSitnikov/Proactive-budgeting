"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut, Save } from "lucide-react"
import type { User } from "@/src/shared/lib/mock-data"
import { InitiatorStep1 } from "@/src/features/create-application/ui/step-1"
import { InitiatorStep2 } from "@/src/features/create-application/ui/step-2"
import { InitiatorStep3 } from "@/src/features/create-application/ui/step-3"
import { InitiatorStep4 } from "@/src/features/create-application/ui/step-4"
import { InitiatorStep5 } from "@/src/features/create-application/ui/step-5"
import { useApplicationStore } from "@/src/shared/lib/application-store"
import { AiProcessingLoader, type LoaderMode } from "@/src/features/ai-simulation/ui/ai-processing-loader"
import { useToast } from "@/hooks/use-toast"
import { projectsApi } from "@/src/shared/api/projects"

type InitiatorStep = 1 | 2 | 3 | 4 | 5 | 'ai_loading'

interface CreateApplicationPageProps {
  user: User
  onBack: () => void
  onLogout: () => void
  onNavigateToCurrentProjects?: () => void
  /** После шага 1 «Назад» с шага 2 ведёт сюда (например, к списку черновиков), а не на шаг 1 */
  onExitToApplicationsList?: () => void
  initialStep?: InitiatorStep
}

import { NotificationListener } from "@/src/shared/ui/notification-listener"

export function CreateApplicationPage({
  user,
  onBack,
  onLogout,
  onNavigateToCurrentProjects,
  onExitToApplicationsList,
  initialStep = 1,
}: CreateApplicationPageProps) {
  const { toast } = useToast()

  /** Продолжение черновика с шага ≥ 2: без шага 1 и без повторного check-idea */
  const isResumeFromDraft =
    typeof initialStep === "number" && initialStep >= 2

  const [currentStep, setCurrentStep] = useState<InitiatorStep>(() => {
    if (isResumeFromDraft && typeof initialStep === "number") {
      return initialStep
    }
    if (initialStep === "ai_loading") return "ai_loading"
    return 1
  })
  const [targetStep, setTargetStep] = useState<InitiatorStep>(
    typeof initialStep === "number" && initialStep >= 2 ? initialStep : 2
  )
  const [loaderMode, setLoaderMode] = useState<LoaderMode>("duplicates")
  const [isPublishing, setIsPublishing] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const { data, updateData, resetData } = useApplicationStore()

  const readStore = () => useApplicationStore.getState().data

  const handleManualSave = async () => {
    setIsSavingDraft(true)
    try {
      await saveCurrentDraft(typeof currentStep === "number" ? currentStep : targetStep)
      toast({
        title: "Сохранено",
        description: "Черновик успешно сохранен",
      })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось сохранить черновик",
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Автосохранение
  useEffect(() => {
    if (currentStep === "ai_loading" || isPublishing) return

    const timer = setInterval(() => {
      const d = readStore()
      if ((d.title?.trim() ?? "") !== "" || (d.idea?.trim() ?? "") !== "" || (d.polygon?.length ?? 0) >= 3) {
        saveCurrentDraft(typeof currentStep === "number" ? currentStep : targetStep)
      }
    }, 60 * 1000) // каждые 15 секунд

    return () => clearInterval(timer)
  }, [currentStep, targetStep, isPublishing])

  // Сохранение черновика (читаем актуальный store — в т.ч. после debounce с шага 1)
  const saveCurrentDraft = async (step: number) => {
    try {
      const d = readStore()
      const geo = {
        location: d.location.address || undefined,
        coordinates: { lat: d.location.lat, lng: d.location.lng },
        polygon: d.polygon.length >= 3 ? d.polygon : undefined,
      }
      if (d.id) {
        await projectsApi.updateDraft(d.id, {
          title: d.title,
          description: d.idea,
          step: step,
          resources: d.resources,
          type: d.type,
          budget: d.budget,
          projectPhotos: d.projectPhotoUrls,
          analysisPhotos: d.analysisPhotoUrls,
          ...geo,
        })
      } else if (d.title || d.idea) {
        const newDraft = await projectsApi.saveDraft({
          title: d.title,
          description: d.idea,
          step: step,
          resources: d.resources,
          type: d.type,
          budget: d.budget,
          projectPhotos: d.projectPhotoUrls,
          analysisPhotos: d.analysisPhotoUrls,
          ...geo,
        })
        updateData({ id: newDraft.id })
      }
    } catch (err) {
      console.error("Ошибка при сохранении черновика:", err)
    }
  }

  /** Выход с шага 1: сохранить прогресс, чтобы можно было продолжить с фазы 1 */
  const persistDraftOnLeaveFromStepOne = async () => {
    if (isResumeFromDraft) return
    if (currentStep !== 1) return
    const d = readStore()
    const hasContent =
      (d.title?.trim() ?? "") !== "" ||
      (d.idea?.trim() ?? "") !== "" ||
      (d.projectPhotoUrls?.length ?? 0) > 0 ||
      (d.analysisPhotoUrls?.length ?? 0) > 0 ||
      (d.polygon?.length ?? 0) >= 3 ||
      (d.location?.address?.trim() ?? "") !== ""
    if (!hasContent) return
    await saveCurrentDraft(1)
  }

  const handleLeaveToHome = async () => {
    await persistDraftOnLeaveFromStepOne()
    onBack()
  }

  const handleNextWithLoader = (target: InitiatorStep, mode: LoaderMode) => {
    if (typeof target === "number") {
      void saveCurrentDraft(target)
    }
    setTargetStep(target)
    setLoaderMode(mode)
    setCurrentStep("ai_loading")
  }

  const handleAiLoadingComplete = async () => {
    if (targetStep === 2 && loaderMode === "duplicates") {
      setCurrentStep(2)
      toast({
        title: "Готово",
        description: "Переходим к проверке похожих проектов.",
      })
      return
    }

    if (targetStep === 5) {
      // Создаем реальный проект
      try {
        setIsPublishing(true)
        const project = await projectsApi.createProject({
          title: data.title,
          description: data.idea,
          location: data.location.address,
          coordinates: { lat: data.location.lat, lng: data.location.lng },
          polygon: data.polygon.length > 0 ? data.polygon : undefined,
          image: data.projectPhotoUrls.length > 0 ? data.projectPhotoUrls[0] : undefined,
          projectPhotos: data.projectPhotoUrls,
          analysisPhotos: data.analysisPhotoUrls,
          resources: data.resources,
          type: data.type,
          budget: data.budget,
          draftId: data.id,
          status: 'ACTIVE'
        })
        setCreatedProjectId(project.id)
        setCurrentStep(5)
      } catch (err) {
        console.error("Ошибка при публикации проекта:", err)
        toast({
          variant: "destructive",
          title: "Ошибка публикации",
          description: "Не удалось создать проект. Попробуйте еще раз.",
        })
        setCurrentStep(4)
      } finally {
        setIsPublishing(false)
      }
    } else {
    setCurrentStep(targetStep)
    }
  }

  const handleAiLoadingFail = (reason: string) => {
    toast({
      variant: "destructive",
      title: "Анализ прерван",
      description: reason,
    })
    if (isResumeFromDraft) {
      ;(onExitToApplicationsList ?? onBack)()
    } else {
      setCurrentStep(1)
    }
  }

  const handleSubscribeAndExit = (projectId: string) => {
    if (onNavigateToCurrentProjects) {
      onNavigateToCurrentProjects()
    } else {
      onBack()
    }
  }

  const handleComplete = () => {
    resetData()
    onBack()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => void handleLeaveToHome()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Назад на главную
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Создание заявки</h1>
              <p className="text-sm text-muted-foreground">
                {currentStep === 'ai_loading' ? 'AI Анализ...' : `Шаг ${currentStep === 5 ? 4 : currentStep} из 4`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualSave} 
              disabled={isSavingDraft}
              className="gap-2 text-slate-600 bg-white"
            >
              <Save className="w-4 h-4" />
              {isSavingDraft ? "Сохранение..." : "Сохранить"}
            </Button>
            <NotificationListener />
            <Button variant="ghost" onClick={onLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && !isResumeFromDraft && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InitiatorStep1
                onNext={() => handleNextWithLoader(2, "duplicates")}
              />
            </motion.div>
          )}

          {currentStep === 'ai_loading' && (
            <motion.div
              key="ai_loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
            >
              <AiProcessingLoader
                key={`${loaderMode}-${targetStep}`}
                mode={loaderMode}
                onComplete={handleAiLoadingComplete}
                onFail={handleAiLoadingFail}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InitiatorStep2
                onNext={() => handleNextWithLoader(3, "resources")}
                backButtonLabel="К моим заявкам"
                onBack={() => {
                  ;(onExitToApplicationsList ?? onBack)()
                }}
                onSubscribeAndExit={handleSubscribeAndExit}
                currentUserId={user.id}
              />
            </motion.div>
          )}
          
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InitiatorStep3 
                onNext={() => handleNextWithLoader(4, 'template')}
                onBack={() => setCurrentStep(2)} 
              />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InitiatorStep4 
                onBack={() => setCurrentStep(3)} 
                onNext={() => handleNextWithLoader(5, 'finalization')}
              />
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InitiatorStep5 
                onComplete={handleComplete} 
                projectId={createdProjectId || ""}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
