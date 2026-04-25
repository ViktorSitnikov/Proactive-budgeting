"use client"

import { useEffect } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step1Schema, type Step1FormValues } from "../model/schema"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PhotoUploader } from "@/src/features/photo-upload/ui/photo-uploader"
import { MapSelector } from "@/src/features/map-selector/ui/map-selector"
import { Lightbulb, ChevronRight, AlertCircle } from "lucide-react"
import { useApplicationStore } from "@/src/shared/lib/application-store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface InitiatorStep1Props {
  onNext: () => void
}

export function InitiatorStep1({
  onNext,
}: InitiatorStep1Props) {
  const { data, updateData } = useApplicationStore()

  const form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      title: data.title,
      type: data.type,
      idea: data.idea,
      projectPhotoUrls: data.projectPhotoUrls,
      analysisPhotoUrls: data.analysisPhotoUrls,
      location: data.location,
      polygon: data.polygon,
    },
    mode: "onTouched",
  })

  const { register, control, handleSubmit, formState: { errors } } = form

  const watched = useWatch({ control })
  useEffect(() => {
    const t = window.setTimeout(() => {
      updateData(watched as Step1FormValues)
    }, 400)
    return () => window.clearTimeout(t)
  }, [watched, updateData])

  const onSubmit = (values: Step1FormValues) => {
    updateData(values)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Что вы хотите построить?</h2>
        <p className="text-muted-foreground">
          Поделитесь своим креативным видением, и мы поможем воплотить его в жизнь
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Ваша идея проекта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Название проекта</Label>
            <Input
              placeholder="Например: Инклюзивная детская площадка"
              {...register("title")}
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label className="mb-2 block">Опишите ваш проект</Label>
            <Textarea
              placeholder="Я хочу создать инклюзивную детскую площадку с качелями..."
              className="min-h-32"
              {...register("idea")}
            />
            {errors.idea && <p className="text-sm text-red-500 mt-1">{errors.idea.message}</p>}
          </div>

          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Фото проекта (для отображения в системе)</Label>
              <Controller
                name="projectPhotoUrls"
                control={control}
                render={({ field }) => (
                  <>
                    <PhotoUploader
                      initialUrls={field.value}
                      onUpload={field.onChange}
                    />
                    {field.value.length > 0 && (
                      <p className="text-sm text-primary mt-2">✓ Загружено фото проекта: {field.value.length}</p>
                    )}
                  </>
                )}
              />
              {errors.projectPhotoUrls && <p className="text-sm text-red-500 mt-1">{errors.projectPhotoUrls.message}</p>}
            </div>

            <div>
              <Label className="mb-2 block">Фото для анализа (AI + смета)</Label>
              <Controller
                name="analysisPhotoUrls"
                control={control}
                render={({ field }) => (
                  <>
                    <PhotoUploader
                      initialUrls={field.value}
                      onUpload={field.onChange}
                    />
                    {field.value.length > 0 && (
                      <p className="text-sm text-primary mt-2">✓ Загружено фото для анализа: {field.value.length}</p>
                    )}
                  </>
                )}
              />
              {errors.analysisPhotoUrls && <p className="text-sm text-red-500 mt-1">{errors.analysisPhotoUrls.message}</p>}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Выберите местоположение</Label>
            <Controller
              name="polygon"
              control={control}
              render={({ field: { value, onChange } }) => (
                <MapSelector
                  initialLocation={form.getValues("location")}
                  initialPolygon={value}
                  onLocationSelect={(location) => form.setValue("location", location)}
                  onPolygonSelect={(polygon) => {
                    onChange(polygon ?? [])
                  }}
                />
              )}
            />
            {errors.polygon && <p className="text-sm text-red-500 mt-1">{errors.polygon.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-end gap-2">
        <Button type="submit" size="lg" className="gap-2">
          Продолжить к AI подбору
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
