"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calculator,
  Coins,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { projectsApi } from "@/src/shared/api/projects"
import { ResourceTable, type Resource } from "@/src/features/resource-crud/ui/resource-table"
import { useApplicationStore } from "@/src/shared/lib/application-store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface InitiatorStep3Props {
  onBack: () => void
  onNext: () => void
  smetaWarnings?: string[]
}

export function InitiatorStep3({ onBack, onNext, smetaWarnings = [] }: InitiatorStep3Props) {
  const { data, updateData } = useApplicationStore()
  const [inflationRate, setInflationRate] = useState(8)
  const [resources, setResources] = useState<Resource[]>(
    (data.resources as Resource[])?.length ? (data.resources as Resource[]) : []
  )

  useEffect(() => {
    projectsApi.getGlobalSettings().then((s) => setInflationRate(s.inflationRate)).catch(console.error)
  }, [])

  useEffect(() => {
    if (data.resources?.length) {
      setResources(data.resources as Resource[])
    }
  }, [data.resources])

  const handleResourcesChange = (newResources: Resource[]) => {
    setResources(newResources)
    const totalBase = newResources.reduce(
      (sum, item) => sum + (item.basePrice ?? item.estimatedCost ?? 0) * item.quantity,
      0
    )
    const totalAdjusted = totalBase * (1 + inflationRate / 100)
    updateData({ resources: newResources, budget: totalAdjusted })
  }

  const totalBase = resources.reduce(
    (sum, item) => sum + (item.basePrice ?? item.estimatedCost ?? 0) * item.quantity,
    0
  )
  const totalAdjusted = totalBase * (1 + inflationRate / 100)
  const userContribution = totalAdjusted * 0.05
  const subsidy = totalAdjusted - userContribution

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Финансы проекта</h2>
        <p className="text-muted-foreground">
          Смета сформирована автоматически. При необходимости скорректируйте позиции вручную.
        </p>
      </div>

      {smetaWarnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Предупреждения сервиса сметы</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 text-sm space-y-1 mt-2">
              {smetaWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Авто-смета
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
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Ручная корректировка</p>
              <p className="text-sm text-muted-foreground">
                Вы можете изменить количество или стоимость ресурсов перед оформлением документа
              </p>
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
