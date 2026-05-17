"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchApi } from "@/src/shared/api/base"
import { BrandMark } from "@/src/shared/ui/brand-mark"

interface RegisterFormProps {
  onRegister: () => void | Promise<void>
  onBackToLogin: () => void
}

export function RegisterForm({ onRegister, onBackToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("initiator")
  const [organization, setOrganization] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const data = await fetchApi<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          organization: role === "npo" ? organization : undefined
        }),
      })

      localStorage.setItem("token", data.access_token)
      await onRegister()
    } catch (err: any) {
      setError(err.message || "Ошибка при регистрации")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="brand-page-gradient min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 shadow-xl">
        <CardHeader className="space-y-4">
          <BrandMark className="justify-center" compact />
          <CardTitle className="text-2xl text-center">Регистрация</CardTitle>
          <CardDescription className="text-center">Создайте аккаунт в Проектории</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ФИО / Название</Label>
              <Input
                id="name"
                placeholder="Иван Иванов"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initiator">Инициатор (Житель)</SelectItem>
                  <SelectItem value="npo">НКО / Бизнес партнер</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "npo" && (
              <div className="space-y-2">
                <Label htmlFor="org">Организация</Label>
                <Input
                  id="org"
                  placeholder="Название фонда"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Загрузка..." : "Зарегистрироваться"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onBackToLogin}>
              Уже есть аккаунт? Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

