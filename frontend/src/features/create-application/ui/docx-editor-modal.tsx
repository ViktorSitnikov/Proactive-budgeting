"use client"

import "@eigenpal/docx-js-editor/styles.css"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { fetchDraftDocxBlob } from "@/src/features/create-application/lib/fetch-draft-docx"
import type { DocxEditorRef } from "@eigenpal/docx-js-editor"

const DocxEditor = dynamic(
  () => import("@eigenpal/docx-js-editor").then((m) => m.DocxEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Загрузка редактора…
      </div>
    ),
  }
)

interface DocxEditorModalProps {
  open: boolean
  draftId?: string
  saving?: boolean
  onClose: () => void
  onSave: (docxBlob: Blob) => void | Promise<void>
}

export function DocxEditorModal({
  open,
  draftId,
  saving,
  onClose,
  onSave,
}: DocxEditorModalProps) {
  const editorRef = useRef<DocxEditorRef>(null)
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !draftId) {
      setBuffer(null)
      setLoadError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    fetchDraftDocxBlob(draftId)
      .then(async (blob) => {
        if (cancelled) return
        if (!blob) {
          setLoadError("DOCX не найден. Сначала сформируйте документ на предыдущем шаге.")
          setBuffer(null)
          return
        }
        setBuffer(await blob.arrayBuffer())
      })
      .catch(() => {
        if (!cancelled) setLoadError("Не удалось загрузить документ для редактирования.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, draftId])

  const handleSave = useCallback(async () => {
    const ref = editorRef.current
    if (!ref) return

    try {
      let arrayBuffer: ArrayBuffer | undefined

      const saved = await ref.save()
      arrayBuffer = saved ?? undefined

      if (!arrayBuffer?.byteLength) {
        setLoadError("Редактор не вернул файл. Попробуйте скачать DOCX и загрузить снова.")
        return
      }

      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
      await onSave(blob)
    } catch (e) {
      console.error(e)
      setLoadError("Не удалось сохранить DOCX из редактора.")
    }
  }, [onSave])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "docx-editor-modal",
          "!flex flex-col gap-0 overflow-hidden p-0",
          "w-[calc(100vw-1rem)] max-w-none sm:max-w-none",
          "h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)]",
          "top-2 left-[50%] translate-x-[-50%] translate-y-0",
          "rounded-xl border shadow-2xl"
        )}
      >
        <DialogHeader className="shrink-0 border-b px-4 py-3 space-y-0.5 text-left">
          <DialogTitle className="text-base sm:text-lg pr-8">
            Редактирование заявки (DOCX)
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-normal hidden sm:block">
            Таблицы и стили сохраняются в файле.
          </p>
        </DialogHeader>

        <div className="docx-editor-host flex-1 min-h-0 overflow-hidden bg-slate-200/80">
          {loading && (
            <div className="flex min-h-[50vh] h-full items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Загрузка документа…
            </div>
          )}
          {loadError && !loading && (
            <p className="text-destructive text-sm text-center py-12 px-6">{loadError}</p>
          )}
          {!loading && !loadError && buffer && open && (
            <DocxEditor
              ref={editorRef}
              documentBuffer={buffer}
              mode="editing"
              showToolbar
              showRuler
              className="docx-editor-surface h-full min-h-0 w-full"
            />
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-background px-4 py-3 sm:px-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || loading || !buffer} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Сохранить DOCX
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
