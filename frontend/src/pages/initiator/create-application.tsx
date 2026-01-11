"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut } from "lucide-react"
import type { User } from "@/src/shared/lib/mock-data"
import { InitiatorStep1 } from "@/src/widgets/initiator/step-1"
import { InitiatorStep2 } from "@/src/widgets/initiator/step-2"
import { InitiatorStep3 } from "@/src/widgets/initiator/step-3"
import { InitiatorStep4 } from "@/src/widgets/initiator/step-4"
import { InitiatorStep5 } from "@/src/widgets/initiator/step-5"
import { useApplication } from "@/src/shared/lib/application-context"
import { AiProcessingLoader, type LoaderMode } from "@/src/features/ai-simulation/ui/ai-processing-loader"
import { useToast } from "@/hooks/use-toast"
import { projectsApi } from "@/src/shared/api/projects"

type InitiatorStep = 1 | 2 | 3 | 4 | 5 | 'ai_loading'

interface CreateApplicationPageProps {
  user: User
  onBack: () => void
  onLogout: () => void
  onNavigateToCurrentProjects?: () => void
  initialStep?: InitiatorStep
}

export function CreateApplicationPage({
  user,
  onBack,
  onLogout,
  onNavigateToCurrentProjects,
  initialStep = 1,
}: CreateApplicationPageProps) {
  const { toast } = useToast()
  
  // Если заходим в черновик, который уже прошел 1 шаг, 
  // запускаем проверку дубликатов заново по требованию
  const shouldStartWithLoader = initialStep !== 1 && initialStep !== 'ai_loading';
  
  const [currentStep, setCurrentStep] = useState<InitiatorStep>(
    shouldStartWithLoader ? 'ai_loading' : initialStep
  )
  const [targetStep, setTargetStep] = useState<InitiatorStep>(initialStep)
  const [loaderMode, setLoaderMode] = useState<LoaderMode>(
    shouldStartWithLoader ? 'adequacy_duplicates' : 'adequacy_duplicates'
  )
  const [isPublishing, setIsPublishing] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  
  const { data, updateData, resetData } = useApplication()

  // Сохранение черновика
  const saveCurrentDraft = async (step: number) => {
    try {
      if (data.id) {
        await projectsApi.updateDraft(data.id, {
          title: data.title,
          description: data.idea,
          step: step,
          resources: data.resources,
          type: data.type,
          photos: data.photoUrls
        });
      } else if (data.title || data.idea) {
        const newDraft = await projectsApi.saveDraft({
          title: data.title,
          description: data.idea,
          step: step,
          resources: data.resources,
          type: data.type,
          photos: data.photoUrls
        });
        updateData({ id: newDraft.id });
      }
    } catch (err) {
      console.error("Ошибка при сохранении черновика:", err);
    }
  };

  const handleNextWithLoader = (target: InitiatorStep, mode: LoaderMode) => {
    // Сохраняем черновик перед переходом
    if (typeof target === 'number') {
        saveCurrentDraft(target);
    }
    setTargetStep(target)
    setLoaderMode(mode)
    setCurrentStep('ai_loading')
  }

  const handleAiLoadingComplete = async () => {
    if (targetStep === 5) {
      // Создаем реальный проект
      try {
        setIsPublishing(true)
        const project = await projectsApi.createProject({
          title: data.title,
          description: data.idea,
          location: data.location.address,
          coordinates: { lat: data.location.lat, lng: data.location.lng },
          image: data.photoUrls.length > 0 ? data.photoUrls[0] : undefined,
          resources: data.resources,
          type: data.type,
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
    setCurrentStep(1) // Возвращаем на первый шаг
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

  // Проверка условия провала (адекватность): меньше 2 символов в описании
  const isAdequacyFailed = data.idea.length < 2

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
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
          <Button variant="ghost" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Выйти
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InitiatorStep1
                onNext={() => handleNextWithLoader(2, 'adequacy_duplicates')}
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
                mode={loaderMode} 
                onComplete={handleAiLoadingComplete} 
                onFail={handleAiLoadingFail}
                failCondition={loaderMode === 'adequacy_duplicates' && isAdequacyFailed}
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
                onNext={() => handleNextWithLoader(3, 'resources')}
                onBack={() => setCurrentStep(1)}
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
