"use client"

import { useEffect, useRef, useState } from "react"
import { fetchDraftDocxBlob } from "@/src/features/create-application/lib/fetch-draft-docx"
import { getImageUrl } from "@/src/shared/api/base"

interface DocxPreviewPaneProps {
  draftId?: string
  downloadUrl?: string
  /** HTML-запасной вариант, если DOCX ещё нет */
  fallbackHtml?: string
  className?: string
}

export function DocxPreviewPane({
  draftId,
  downloadUrl,
  fallbackHtml,
  className = "",
}: DocxPreviewPaneProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useHtmlFallback, setUseHtmlFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      setUseHtmlFallback(false)

      if (bodyRef.current) bodyRef.current.innerHTML = ""
      if (styleRef.current) styleRef.current.innerHTML = ""

      try {
        let blob: Blob | null = null

        if (draftId) {
          blob = await fetchDraftDocxBlob(draftId)
        } else if (downloadUrl) {
          const res = await fetch(getImageUrl(downloadUrl))
          if (res.ok) blob = await res.blob()
        }

        if (cancelled) return

        if (!blob || blob.size < 4) {
          if (fallbackHtml?.trim()) {
            setUseHtmlFallback(true)
            return
          }
          setError("Файл DOCX не найден. Перейдите с шага «Финансы» ещё раз.")
          return
        }

        const { renderAsync } = await import("docx-preview")
        if (!bodyRef.current || cancelled) return

        await renderAsync(blob, bodyRef.current, styleRef.current ?? bodyRef.current, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
        })
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          if (fallbackHtml?.trim()) {
            setUseHtmlFallback(true)
          } else {
            setError("Не удалось отобразить DOCX. Скачайте файл и откройте в Word.")
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [draftId, downloadUrl, fallbackHtml])

  if (useHtmlFallback && fallbackHtml) {
    return (
      <div
        className={`docx-html-fallback min-h-[280px] bg-white border border-slate-200 rounded-md p-4 prose prose-sm max-w-none overflow-auto ${className}`}
        dangerouslySetInnerHTML={{ __html: fallbackHtml }}
      />
    )
  }

  return (
    <div className={`docx-viewport relative ${className}`}>
      <div ref={styleRef} className="docx-style-host" aria-hidden />
      {loading && (
        <p className="text-sm text-muted-foreground py-12 text-center absolute inset-0 bg-white/80 z-10">
          Загрузка документа…
        </p>
      )}
      {error && !loading && (
        <p className="text-sm text-destructive py-8 text-center">{error}</p>
      )}
      <div ref={bodyRef} className="docx-body min-h-[280px]" />
    </div>
  )
}
