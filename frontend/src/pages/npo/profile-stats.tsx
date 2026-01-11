"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, LogOut, Save, TrendingUp, Award, Users, Briefcase } from "lucide-react"
import type { User } from "@/src/shared/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

interface ProfileStatsPageProps {
  user: User
  onBack: () => void
  onLogout: () => void
}

export function ProfileStatsPage({ user, onBack, onLogout }: ProfileStatsPageProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    organization: user.organization || "Фонд Городской Радости",
    email: user.email,
    phone: "+7 (343) 123-45-67",
    address: "Екатеринбург, ул. Ленина 40",
    expertise: ["Общественные пространства", "Развитие сообществ"],
    description: "Мы специализируемся на создании инклюзивных общественных пространств и развитии местных сообществ.",
  })

  const handleSave = () => {
    toast({
      title: "Профиль сохранен",
      description: "Изменения успешно сохранены",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
            <h1 className="text-xl font-bold text-foreground">Профиль организации</h1>
          </div>
          <Button variant="ghost" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Выйти
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid gap-6">
          {/* Statistics Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">Активных проектов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Завершено проектов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">4.8</p>
                    <p className="text-xs text-muted-foreground">Средний рейтинг</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-xs text-muted-foreground">Новых запросов</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Edit */}
          <Card>
            <CardHeader>
              <CardTitle>Информация об организации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Название организации</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Области экспертизы</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.expertise.map((exp, idx) => (
                    <Badge key={idx} variant="secondary">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание организации</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} className="w-full gap-2">
                <Save className="w-4 h-4" />
                Сохранить изменения
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
