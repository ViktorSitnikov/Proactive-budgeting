"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, LogOut, Save, UserIcon, Mail, Phone, MapPin, Loader2, Camera } from "lucide-react"
import type { User } from "@/src/shared/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { projectsApi } from "../../shared/api/projects"
import { getImageUrl } from "@/src/shared/api/base"

interface ProfilePageProps {
  user: User
  onBack: () => void
  onLogout: () => void
}

export function ProfilePage({ user, onBack, onLogout }: ProfilePageProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    address: user.address || "",
    bio: user.bio || "",
    avatar: user.avatar || "",
  })

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const { url } = await projectsApi.uploadFile(file)
      setFormData({ ...formData, avatar: url })
      toast({ title: "Успех", description: "Аватар загружен" })
    } catch (err) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить фото" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await projectsApi.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
        avatar: formData.avatar
      })
      
    toast({
      title: "Профиль сохранен",
        description: "Ваши изменения успешно сохранены на сервере",
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description: "Не удалось обновить профиль",
    })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ... header code ... */}
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 md:gap-2 px-2 md:px-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Назад</span>
            </Button>
            <h1 className="text-lg md:text-xl font-bold text-foreground">Профиль</h1>
          </div>
          <Button variant="ghost" onClick={onLogout} className="gap-2 px-2 md:px-4">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="grid gap-4 md:gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : formData.avatar ? (
                      <img src={getImageUrl(formData.avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl md:text-2xl truncate">{formData.name}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">{formData.email}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Edit Form */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Редактировать профиль</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">О себе</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} className="w-full gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">2</div>
                  <p className="text-sm text-muted-foreground mt-1">Созданных проектов</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">1</div>
                  <p className="text-sm text-muted-foreground mt-1">Активных проектов</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">3</div>
                  <p className="text-sm text-muted-foreground mt-1">Подписок на проекты</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
