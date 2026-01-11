"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Settings, FileText, Database, BarChart3, Plus, Save, Edit2, Trash2, Loader2 } from "lucide-react"
import {
  type Template,
  type KnowledgeBaseEntry,
  type User,
} from "@/src/shared/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { projectsApi } from "@/src/shared/api/projects"

interface AdminOverviewProps {
  user: User
}

export function AdminOverview({ user }: AdminOverviewProps) {
  const { toast } = useToast()
  const [inflationRate, setInflationRate] = useState(0)
  const [maxBudget, setMaxBudget] = useState(0)
  const [subsidyRate, setSubsidyRate] = useState(0)
  const [templates, setTemplates] = useState<Template[]>([])
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [settings, tmpls, kb] = await Promise.all([
          projectsApi.getGlobalSettings(),
          projectsApi.getTemplates(),
          projectsApi.getKnowledgeBase()
        ])
        setInflationRate(settings.inflationRate)
        setMaxBudget(settings.maxBudget)
        setSubsidyRate(settings.defaultSubsidyRate)
        setTemplates(tmpls)
        setKnowledgeBase(kb)
      } catch (err) {
        console.error("Failed to load admin data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])
  const [newKBEntry, setNewKBEntry] = useState({
    title: "",
    region: "",
    budget: "",
    outcomes: "",
    tags: "",
  })

  const handleSaveSettings = () => {
    console.log("[v0] Сохранение глобальных настроек:", { inflationRate, maxBudget, subsidyRate })
    toast({
      title: "Настройки сохранены",
      description: "Глобальные настройки системы были успешно обновлены.",
    })
  }

  const handleSaveTemplate = () => {
    if (!editingTemplate) return
    console.log("[v0] Сохранение шаблона:", editingTemplate.id)
    setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t)))
    setEditingTemplate(null)
    toast({
      title: "Шаблон обновлен",
      description: `Шаблон "${editingTemplate.name}" был сохранен.`,
    })
  }

  const handleDeleteTemplate = (templateId: string) => {
    console.log("[v0] Удаление шаблона:", templateId)
    setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    toast({
      title: "Шаблон удален",
      description: "Шаблон был удален из системы.",
    })
  }

  const handleAddKBEntry = () => {
    if (!newKBEntry.title || !newKBEntry.region) {
      toast({
        title: "Недостаточно данных",
        description: "Пожалуйста, заполните хотя бы название и регион.",
        variant: "destructive",
      })
      return
    }

    const entry: KnowledgeBaseEntry = {
      id: `kb-${Date.now()}`,
      title: newKBEntry.title,
      region: newKBEntry.region,
      budget: Number.parseInt(newKBEntry.budget) || 0,
      outcomes: newKBEntry.outcomes,
      tags: newKBEntry.tags.split(",").map((t) => t.trim()),
    }

    console.log("[v0] Добавление записи в базу знаний:", entry)
    setKnowledgeBase((prev) => [entry, ...prev])
    setNewKBEntry({ title: "", region: "", budget: "", outcomes: "", tags: "" })
    toast({
      title: "Запись добавлена",
      description: "Новая запись базы знаний была успешно добавлена.",
    })
  }

  const handleDeleteKBEntry = (entryId: string) => {
    console.log("[v0] Удаление записи базы знаний:", entryId)
    setKnowledgeBase((prev) => prev.filter((e) => e.id !== entryId))
    toast({
      title: "Запись удалена",
      description: "Запись базы знаний была удалена.",
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p>Загрузка панели администратора...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Центр управления администратора</h2>
        <p className="text-muted-foreground">Управление системными настройками и базой знаний</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Глобальные настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Уровень инфляции (%)</label>
              <Input
                type="number"
                value={inflationRate}
                onChange={(e) => setInflationRate(Number.parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Макс. бюджет (₽)</label>
              <Input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number.parseInt(e.target.value))}
                min="0"
                step="10000"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Доля субсидии (%)</label>
              <Input
                type="number"
                value={subsidyRate}
                onChange={(e) => setSubsidyRate(Number.parseInt(e.target.value))}
                min="0"
                max="100"
              />
            </div>
          </div>
          <Button onClick={handleSaveSettings} className="gap-2">
            <Save className="w-4 h-4" />
            Сохранить настройки
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Шаблоны документов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="border border-border rounded-lg p-4 space-y-3">
              {editingTemplate?.id === template.id ? (
                <>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="Название шаблона"
                  />
                  <Textarea
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                    placeholder="Содержимое шаблона"
                    className="min-h-32"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveTemplate} className="gap-2">
                      <Save className="w-3 h-3" />
                      Сохранить
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}>
                      Отмена
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {template.category} • Изменено: {template.lastModified}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTemplate(template)}
                        className="gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded text-sm font-mono whitespace-pre-wrap">
                    {template.content.substring(0, 150)}...
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            База знаний
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Добавить новую запись
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                placeholder="Название проекта"
                value={newKBEntry.title}
                onChange={(e) => setNewKBEntry({ ...newKBEntry, title: e.target.value })}
              />
              <Input
                placeholder="Регион"
                value={newKBEntry.region}
                onChange={(e) => setNewKBEntry({ ...newKBEntry, region: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Бюджет"
                value={newKBEntry.budget}
                onChange={(e) => setNewKBEntry({ ...newKBEntry, budget: e.target.value })}
              />
              <Input
                placeholder="Теги (через запятую)"
                value={newKBEntry.tags}
                onChange={(e) => setNewKBEntry({ ...newKBEntry, tags: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Результаты проекта и влияние"
              value={newKBEntry.outcomes}
              onChange={(e) => setNewKBEntry({ ...newKBEntry, outcomes: e.target.value })}
              className="min-h-20"
            />
            <Button onClick={handleAddKBEntry} className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить запись
            </Button>
          </div>

          <div className="space-y-3">
            {knowledgeBase.map((entry) => (
              <div key={entry.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{entry.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {entry.region} • Бюджет: {entry.budget.toLocaleString()} ₽
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteKBEntry(entry.id)}
                    className="gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Удалить
                  </Button>
                </div>
                <p className="text-sm mb-2">{entry.outcomes}</p>
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      <Card className="bg-gradient-to-br from-blue-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Дашборд ИИ-метрик
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">94.5%</p>
              <p className="text-xs text-muted-foreground mt-1">Точность соответствия</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">127</p>
              <p className="text-xs text-muted-foreground mt-1">Успешных мэтчей</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-600">2.3 дня</p>
              <p className="text-xs text-muted-foreground mt-1">Ср. время ответа</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-violet-600">89%</p>
              <p className="text-xs text-muted-foreground mt-1">Удовлетворенность</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
