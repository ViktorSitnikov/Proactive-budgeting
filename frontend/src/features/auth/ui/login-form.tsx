"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fetchApi } from "@/src/shared/api/base"
import type { User } from "@/src/shared/lib/mock-data"

interface LoginFormProps {
  onLogin: (user: User) => void
  onRegisterClick: () => void
}

export function LoginForm({ onLogin, onRegisterClick }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const data = await fetchApi<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      localStorage.setItem("token", data.access_token)
      onLogin(data.user)
    } catch (err: any) {
      setError(err.message || "Неверный email или пароль")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-emerald-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">B</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Добро пожаловать в BudgetFlow</CardTitle>
          <CardDescription className="text-center">Войдите, чтобы получить доступ к панели управления</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Загрузка..." : "Войти"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onRegisterClick}>
              Нет аккаунта? Зарегистрироваться
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Демо аккаунты:</p>
            <div className="space-y-1 text-xs">
              <p>
                <strong>Инициатор:</strong> citizen@example.com / password123
              </p>
              <p>
                <strong>НКО Партнер:</strong> npo@example.com / password123
              </p>
              <p>
                <strong>Администратор:</strong> admin@example.com / password123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
