"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fetchApi } from "@/src/shared/api/base"
import type { User } from "@/src/shared/lib/mock-data"
import { BrandMark } from "@/src/shared/ui/brand-mark"

interface LoginFormProps {
  onLogin: () => void | Promise<void>
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
      const data = await fetchApi<{ access_token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      localStorage.setItem("token", data.access_token)
      await onLogin()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Неверный email или пароль")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="brand-page-gradient min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 shadow-xl">
        <CardHeader className="space-y-4">
          <BrandMark className="justify-center" compact />
          <CardTitle className="text-2xl text-center">Вход в систему</CardTitle>
          <CardDescription className="text-center">
            Войдите, чтобы управлять инициативами и проектами
          </CardDescription>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти"}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Нет аккаунта? </span>
              <button
                type="button"
                onClick={onRegisterClick}
                className="text-primary font-medium hover:underline"
              >
                Зарегистрироваться
              </button>
            </div>
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
              {/* <p>
                <strong>Администратор:</strong> admin@example.com / password123
              </p> */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
