"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Building2, Loader2 } from "lucide-react"
import { type NPO } from "@/src/shared/lib/mock-data"
import { NPOCard } from "@/src/entities/npo/ui/npo-card"
import { useToast } from "@/hooks/use-toast"
import { projectsApi } from "@/src/shared/api/projects"

interface InitiatorStep5Props {
  onComplete: () => void
  projectId: string
}

export function InitiatorStep5({ onComplete, projectId }: InitiatorStep5Props) {
  const { toast } = useToast()
  const [npos, setNpos] = useState<NPO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [requestingNpoId, setRequestingNpoId] = useState<string | null>(null)

  useEffect(() => {
    const loadNPOs = async () => {
      try {
        setIsLoading(true)
        const data = await projectsApi.getNPOs()
        setNpos(data)
      } catch (err) {
        console.error("Failed to load NPOs:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadNPOs()
  }, [])

  const handleRequestHelp = async (npo: NPO) => {
    if (!projectId) return

    try {
      setRequestingNpoId(npo.id)
      await projectsApi.sendPartnerRequest(
        projectId, 
        npo.id, 
        npo.name, 
        "Здравствуйте! Мы создали проект и были бы рады видеть вашу организацию в качестве партнера."
      )
      
    toast({
      title: "Запрос отправлен",
        description: `Ваш запрос партнерства с ${npo.name} был отправлен!`,
    })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось отправить запрос. Попробуйте позже.",
      })
    } finally {
      setRequestingNpoId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Проект опубликован!</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Ваша заявка теперь видна всем на карте. Чтобы ускорить реализацию, выберите подходящую НКО для сотрудничества.
        </p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Рекомендуемые НКО партнеры
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-sm text-emerald-700">Подбираем партнеров...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {npos.map((npo) => (
                <NPOCard 
                  key={npo.id} 
                  npo={npo} 
                  onRequest={() => handleRequestHelp(npo)} 
                  isLoading={requestingNpoId === npo.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" onClick={onComplete} className="px-12 font-bold">
          Завершить и перейти в дашборд
        </Button>
      </div>
    </div>
  )
}

