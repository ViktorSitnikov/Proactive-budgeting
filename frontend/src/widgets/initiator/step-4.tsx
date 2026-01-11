"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ChevronLeft, ChevronRight, CheckCircle2, Download } from "lucide-react"
import { useApplication } from "@/src/shared/lib/application-context"
import { Textarea } from "@/components/ui/textarea"

interface InitiatorStep4Props {
  onBack: () => void
  onNext: () => void
}

export function InitiatorStep4({ onBack, onNext }: InitiatorStep4Props) {
  const { data, updateData } = useApplication()

  const handleDownload = () => {
    const content = `
ЗАЯВКА НА ПРОЕКТ: ${data.title.toUpperCase()}
=========================================
ДАТА СОЗДАНИЯ: ${new Date().toLocaleDateString()}
СТАТУС: ПОДГОТОВЛЕНО ИИ (REFINDED BY USER)

ЦЕЛИ И ОПИСАНИЕ:
----------------
${data.idea}

МЕСТОПОЛОЖЕНИЕ:
---------------
Адрес: ${data.location.address}
Координаты: ${data.location.lat}, ${data.location.lng}

-----------------------------------------
Сгенерировано в системе прямой демократии
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Project_${data.title.replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Юридическая сборка</h2>
          <p className="text-muted-foreground">ИИ упаковал ваши данные в шаблон. Проверьте и подтвердите публикацию.</p>
        </div>
        <Button variant="outline" onClick={handleDownload} className="gap-2">
          <Download className="w-4 h-4" />
          Скачать заявку (.pdf)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Редактирование проектного предложения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-lg border-2 border-slate-200 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                  Заголовок документа
                </label>
                <p className="text-lg font-semibold border-b border-slate-300 pb-2">
                  ПРОЕКТ: {data.title || "БЕЗ НАЗВАНИЯ"}
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                  Содержательная часть (LLM Редактор)
                </label>
                <Textarea 
                  className="min-h-[200px] bg-white text-base leading-relaxed"
                  value={data.idea}
                  onChange={(e) => updateData({ idea: e.target.value })}
                  placeholder="Текст документа..."
                />
              </div>

              <div className="bg-emerald-50 p-4 rounded border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <p className="text-sm text-emerald-800">
                  Этот текст будет использован для формирования официальной заявки. 
                  Вы можете редактировать его прямо здесь.
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
        <Button size="lg" onClick={onNext} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
          Подтвердить публикацию
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
