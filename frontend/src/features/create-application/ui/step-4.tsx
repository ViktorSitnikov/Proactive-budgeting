"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ChevronLeft, ChevronRight, CheckCircle2, Download, Pencil } from "lucide-react"
import { useApplicationStore } from "@/src/shared/lib/application-store"
import { API_HOST, getImageUrl } from "@/src/shared/api/base"
import { projectsApi } from "@/src/shared/api/projects"
import { useToast } from "@/hooks/use-toast"
import { DocxPreviewPane } from "./docx-preview-pane"
import { DocxEditorModal } from "./docx-editor-modal"

interface InitiatorStep4Props {
  onBack: () => void
  onNext: () => void
}

export function InitiatorStep4({ onBack, onNext }: InitiatorStep4Props) {
  const { toast } = useToast()
  const { data, updateData } = useApplicationStore()
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  const fallbackHtml =
    data.documentHtml?.trim() ||
    `<p>Документ ещё не сформирован. Вернитесь на предыдущий шаг и перейдите снова для генерации.</p>`

  const handleSaveDocx = async (docxBlob: Blob) => {
    if (!data.id) {
      toast({
        variant: "destructive",
        title: "Нет черновика",
        description: "Сохраните заявку перед редактированием документа.",
      })
      return
    }
    setSaving(true)
    try {
      const res = await projectsApi.uploadDraftDocumentDocx(data.id, docxBlob)
      updateData({
        documentHtml: res.previewHtml,
        documentDownloadUrl: res.downloadUrl || "",
      })
      setPreviewKey((k) => k + 1)
      setEditorOpen(false)
      toast({ title: "Сохранено", description: "Файл DOCX обновлён в черновике." })
    } catch (e) {
      console.error(e)
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить DOCX." })
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (data.documentDownloadUrl) {
      window.open(getImageUrl(data.documentDownloadUrl), "_blank")
      return
    }
    if (!data.id) return
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const url = `${API_HOST}/api/projects/drafts/${data.id}/document/download`
    if (!token) return
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = `project_${data.id}.docx`
        a.click()
        URL.revokeObjectURL(a.href)
      })
      .catch(console.error)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Юридическая сборка</h2>
          <p className="text-muted-foreground">
            Предпросмотр DOCX как в Word. Редактирование — в полноценном редакторе.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditorOpen(true)}
            className="gap-2"
            disabled={!data.id || !data.documentDownloadUrl}
          >
            <Pencil className="w-4 h-4" />
            Редактировать
          </Button>
          <Button variant="outline" onClick={handleDownload} className="gap-2" disabled={!data.id}>
            <Download className="w-4 h-4" />
            Скачать DOCX
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Проектное предложение
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 sm:p-6 bg-slate-50 rounded-lg border-2 border-slate-200 space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Заголовок</p>
              <p className="text-lg font-semibold border-b border-slate-300 pb-2">
                ПРОЕКТ: {data.title || "БЕЗ НАЗВАНИЯ"}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                Содержательная часть (предпросмотр DOCX)
              </p>
              <DocxPreviewPane
                key={`${data.id}-${data.documentDownloadUrl}-${previewKey}`}
                draftId={data.id}
                downloadUrl={data.documentDownloadUrl}
                fallbackHtml={fallbackHtml}
              />
            </div>

          </div>
        </CardContent>
      </Card>

      <DocxEditorModal
        open={editorOpen}
        draftId={data.id}
        saving={saving}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveDocx}
      />

      <div className="flex items-center justify-between">
        <Button size="lg" variant="outline" onClick={onBack} className="gap-2 bg-transparent">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
        >
          Подтвердить публикацию
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
