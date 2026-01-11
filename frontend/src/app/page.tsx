"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/src/features/auth/ui/login-form"
import { RegisterForm } from "@/src/features/auth/ui/register-form"
import type { User } from "@/src/shared/lib/mock-data"
import { InitiatorHome } from "@/src/pages/initiator/home"
import { NPOHome } from "@/src/pages/npo/home"
import { AdminHome } from "@/src/pages/admin/home"
import { fetchApi } from "@/src/shared/api/base"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const user = await fetchApi<User>("/auth/me")
          setCurrentUser(user)
        } catch (err) {
          console.error("Auth check failed", err)
          localStorage.removeItem("token")
        }
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    setCurrentUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser) {
    if (isRegistering) {
      return (
        <RegisterForm 
          onRegister={(user) => {
            setCurrentUser(user)
            setIsRegistering(false)
          }} 
          onBackToLogin={() => setIsRegistering(false)} 
        />
      )
    }
    return (
      <LoginForm 
        onLogin={setCurrentUser} 
        onRegisterClick={() => setIsRegistering(true)} 
      />
    )
  }

  return (
    <>
      {currentUser.role === "initiator" && <InitiatorHome user={currentUser} onLogout={handleLogout} />}
      {currentUser.role === "npo" && <NPOHome user={currentUser} onLogout={handleLogout} />}
      {currentUser.role === "admin" && <AdminHome user={currentUser} onLogout={handleLogout} />}
    </>
  )
}
