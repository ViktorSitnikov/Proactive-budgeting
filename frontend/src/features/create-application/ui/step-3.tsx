"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, Coins, TrendingUp, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react"
import { projectsApi } from "@/src/shared/api/projects"
import { ResourceTable, type Resource } from "@/src/features/resource-crud/ui/resource-table"
import { useApplicationStore } from "@/src/shared/lib/application-store"

interface InitiatorStep3Props {
  onBack: () => void
  onNext: () => void
}

export function InitiatorStep3({ onBack, onNext }: InitiatorStep3Props) {
  const { data, updateData } = useApplicationStore()
  const [inflationRate, setInflationRate] = useState(8)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await projectsApi.getGlobalSettings()
        setInflationRate(settings.inflationRate)
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const [resources, setResources] = useState<Resource[]>(
    data.resources && data.resources.length > 0 
      ? data.resources 
      : [
          { id: "res-1", name: "Игровое оборудование", quantity: 5, unit: "шт.", estimatedCost: 30000 },
          { id: "res-2", name: "Резиновое покрытие", quantity: 100, unit: "м²", estimatedCost: 2500 },
          { id: "res-3", name: "Лавочки", quantity: 8, unit: "шт.", estimatedCost: 10000 },
          { id: "res-4", name: "Освещение", quantity: 12, unit: "шт.", estimatedCost: 10000 },
        ]
  )

  const handleResourcesChange = (newResources: Resource[]) => {
    setResources(newResources)
    const tb = newResources.reduce((sum, item) => sum + ((item.basePrice ?? item.estimatedCost ?? 0) * item.quantity), 0)
    const ta = tb * (1 + inflationRate / 100)
    updateData({ resources: newResources, budget: ta })
  }

  const totalBase = resources.reduce((sum, item) => sum + ((item.basePrice ?? item.estimatedCost ?? 0) * item.quantity), 0)
  const totalAdjusted = totalBase * (1 + inflationRate / 100)
  const userContribution = totalAdjusted * 0.05
  const subsidy = totalAdjusted - userContribution

  useEffect(() => {
    if (!isLoading && (!data.resources || data.resources.length === 0)) {
      updateData({ resources, budget: totalAdjusted })
    }
  }, [isLoading, data.resources, resources, totalAdjusted, updateData])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p>Загрузка параметров сметы...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Финансы проекта</h2>
        <p className="text-muted-foreground">AI сформировал черновик сметы на основе вашего описания, фото и похожих успешных проектов</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Авто-смета (Черновик)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceTable resources={resources} onResourcesChange={handleResourcesChange} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="w-4 h-4" />
              Общий бюджет
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{(totalAdjusted || 0).toLocaleString()} ₽</p>
            <p className="text-xs text-muted-foreground mt-1">С учетом инфляции {inflationRate}%</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <TrendingUp className="w-4 h-4" />
              Государственная субсидия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{(subsidy || 0).toLocaleString()} ₽</p>
            <p className="text-xs text-primary mt-1">95% покрыто</p>
          </CardContent>
        </Card>

        <Card className="bg-muted border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
              <Coins className="w-4 h-4" />
              Ваш взнос
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{(userContribution || 0).toLocaleString()} ₽</p>
            <p className="text-xs text-muted-foreground mt-1">Требуется только 5%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Ручная корректировка</p>
                <p className="text-sm text-muted-foreground">
                  Вы можете изменить количество или стоимость ресурсов, если считаете нужным
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button size="lg" variant="outline" onClick={onBack} className="gap-2 bg-transparent">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button size="lg" onClick={onNext} className="gap-2">
          Далее к оформлению
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
