"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/src/shared/ui/sidebar"
import { InitiatorStep1 } from "@/src/widgets/initiator/step-1"
import { InitiatorStep2 } from "@/src/widgets/initiator/step-2"
import { InitiatorStep3 } from "@/src/widgets/initiator/step-3"
import type { User } from "@/src/shared/lib/mock-data"

type InitiatorStep = 1 | 2 | 3

interface InitiatorDashboardProps {
  user: User
}

export function InitiatorDashboard({ user }: InitiatorDashboardProps) {
  const [currentStep, setCurrentStep] = useState<InitiatorStep>(1)
  const [projectData, setProjectData] = useState({
    idea: "",
    photos: [] as File[],
  })

  return (
    <>
      <Sidebar role="initiator" currentStep={currentStep} />
      <div className="ml-64 min-h-screen bg-background">
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
                  projectData={projectData}
                  setProjectData={setProjectData}
                  onNext={() => setCurrentStep(2)}
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
                <InitiatorStep2 onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />
              </motion.div>
            )}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <InitiatorStep3 onBack={() => setCurrentStep(2)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
