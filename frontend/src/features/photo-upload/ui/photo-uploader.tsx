"use client"

import { useState, useEffect } from "react"
import { Upload, X, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { projectsApi } from "@/src/shared/api/projects"
import { useToast } from "@/hooks/use-toast"
import { getImageUrl } from "@/src/shared/api/base"

interface PhotoUploaderProps {
  onUpload: (urls: string[]) => void
  initialUrls?: string[]
  maxFiles?: number
}

export function PhotoUploader({ onUpload, initialUrls = [], maxFiles = 5 }: PhotoUploaderProps) {
  const { toast } = useToast()
  const [urls, setUrls] = useState<string[]>(initialUrls)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    if (urls.length + selectedFiles.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Превышен лимит",
        description: `Максимальное количество файлов: ${maxFiles}`
      })
      return
    }

    setIsUploading(true)
    const newUrls = [...urls]

    try {
      for (const file of selectedFiles) {
        const { url } = await projectsApi.uploadFile(file)
        newUrls.push(url)
      }
      setUrls(newUrls)
      onUpload(newUrls)
      toast({
        title: "Успех",
        description: "Фотографии загружены"
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: "Не удалось загрузить одну или несколько фотографий"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index)
    setUrls(newUrls)
    onUpload(newUrls)
  }

  return (
    <div className="space-y-4">
      <div className={`border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-blue-400 transition-colors relative ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {isUploading ? (
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
        ) : (
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {isUploading ? "Загрузка..." : "Нажмите или перетащите фото сюда"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG до 10MB (макс. {maxFiles} фото)</p>
      </div>

      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {urls.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={getImageUrl(url)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-lg shadow-sm"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeFile(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute top-1 right-1 bg-white rounded-full p-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
