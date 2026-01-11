"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PhotoUploader } from "@/src/features/photo-upload/ui/photo-uploader"
import { MapSelector } from "@/src/features/map-selector/ui/map-selector"
import { Lightbulb, ChevronRight } from "lucide-react"
import { useApplication } from "@/src/shared/lib/application-context" // Используем контекст

interface InitiatorStep1Props {
  onNext: () => void
}

export function InitiatorStep1({ onNext }: InitiatorStep1Props) {
  const { data, updateData } = useApplication()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Что вы хотите построить?</h2>
        <p className="text-muted-foreground">
          Поделитесь своим креативным видением, и мы поможем воплотить его в жизнь
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            Ваша идея проекта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Название проекта</Label>
            <Input
              placeholder="Например: Инклюзивная детская площадка"
              value={data.title}
              onChange={(e) => updateData({ title: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-2 block">Тип проекта</Label>
            <Select 
              value={data.type} 
              onValueChange={(value) => updateData({ type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию проекта" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Благоустройство">Благоустройство</SelectItem>
                <SelectItem value="Дороги">Дороги</SelectItem>
                <SelectItem value="Освещение">Освещение</SelectItem>
                <SelectItem value="Спорт">Спорт</SelectItem>
                <SelectItem value="Культура">Культура</SelectItem>
                <SelectItem value="Экология">Экология</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Опишите ваш проект</Label>
            <Textarea
              placeholder="Я хочу создать инклюзивную детскую площадку с качелями..."
              className="min-h-32"
              value={data.idea}
              onChange={(e) => updateData({ idea: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-2 block">Загрузите фотографии</Label>
            <PhotoUploader
              initialUrls={data.photoUrls}
              onUpload={(urls) => updateData({ photoUrls: urls })}
            />
            {data.photoUrls.length > 0 && (
              <p className="text-sm text-emerald-600 mt-2">✓ Загружено фотографий: {data.photoUrls.length}</p>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Выберите местоположение</Label>
            <MapSelector
              initialLocation={data.location}
              onLocationSelect={(location) => updateData({ location })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={onNext} 
          className="gap-2" 
          disabled={!data.idea || !data.title}
        >
          Продолжить к AI подбору
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}