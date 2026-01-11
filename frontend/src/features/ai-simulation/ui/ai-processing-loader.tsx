"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Search, FileCheck, Calculator, Sparkles, AlertTriangle } from "lucide-react"

export type LoaderMode = 'adequacy_duplicates' | 'resources' | 'template' | 'finalization'

interface Stage {
  id: string
  text: string
  icon: React.ReactNode
}

const MODES: Record<LoaderMode, Stage[]> = {
  adequacy_duplicates: [
    { id: "adequacy", text: "Оцениваю адекватность описания и фото...", icon: <Search className="w-8 h-8 text-blue-500" /> },
    { id: "duplicates", text: "Ищу похожие проекты в радиусе 500м...", icon: <Brain className="w-8 h-8 text-purple-500" /> },
  ],
  resources: [
    { id: "calc", text: "Анализирую объем работ по тексту и фото...", icon: <Calculator className="w-8 h-8 text-emerald-500" /> },
    { id: "market", text: "Сверяюсь с рыночными ценами на ресурсы...", icon: <Calculator className="w-8 h-8 text-blue-500" /> },
  ],
  template: [
    { id: "legal", text: "Подбираю подходящий юридический шаблон...", icon: <FileCheck className="w-8 h-8 text-orange-500" /> },
    { id: "packing", text: "Упаковываю данные в документ...", icon: <FileCheck className="w-8 h-8 text-emerald-500" /> },
  ],
  finalization: [
    { id: "verify", text: "Финальная проверка данных...", icon: <Sparkles className="w-8 h-8 text-yellow-500" /> },
    { id: "npo", text: "Подбираю подходящие НКО для партнерства...", icon: <Brain className="w-8 h-8 text-blue-500" /> },
  ]
}

interface AiProcessingLoaderProps {
  mode: LoaderMode
  onComplete: () => void
  onFail?: (reason: string) => void
  failCondition?: boolean
}

export function AiProcessingLoader({ mode, onComplete, onFail, failCondition }: AiProcessingLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [isFailed, setIsFailed] = useState(false)
  const stages = MODES[mode]

  useEffect(() => {
    if (isFailed) return

    if (currentStageIndex < stages.length) {
      const timer = setTimeout(() => {
        // Проверка условия провала на первом этапе оценки адекватности
        if (currentStageIndex === 0 && failCondition) {
          setIsFailed(true)
          setTimeout(() => {
            onFail?.("Описание слишком короткое для анализа ИИ (минимум 2 символа).")
          }, 2000)
          return
        }
        setCurrentStageIndex(prev => prev + 1)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      const finalTimer = setTimeout(onComplete, 500)
      return () => clearTimeout(finalTimer)
    }
  }, [currentStageIndex, onComplete, stages, failCondition, isFailed, onFail])

  const currentStage = stages[currentStageIndex] || stages[stages.length - 1]

  if (isFailed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 p-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-red-50 p-6 rounded-full"
        >
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </motion.div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-red-600">Ошибка анализа</h3>
          <p className="text-muted-foreground">Проект не прошел проверку адекватности</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 p-12">
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-white p-6 rounded-full shadow-xl relative z-10"
        >
          {currentStage.icon}
        </motion.div>
        
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="absolute inset-0 bg-blue-400 rounded-full blur-xl"
        />
      </div>

      <div className="text-center space-y-4 max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <h3 className="text-xl font-bold flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              AI Магия в процессе
            </h3>
            <p className="text-muted-foreground text-lg">
              {currentStage.text}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-4">
          {stages.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${
                index <= currentStageIndex ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
