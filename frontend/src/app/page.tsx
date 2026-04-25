"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { LoginForm } from "@/src/features/auth/ui/login-form"
import { RegisterForm } from "@/src/features/auth/ui/register-form"
import type { User } from "@/src/shared/lib/mock-data"
import { InitiatorHome } from "@/src/views/initiator/home"
import { NPOHome } from "@/src/views/npo/home"
import { AdminHome } from "@/src/views/admin/home"
import { fetchApi } from "@/src/shared/api/base"

export default function HomePage() {
  const queryClient = useQueryClient()
  const [isRegistering, setIsRegistering] = useState(false)

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      const token = localStorage.getItem("token")
      if (!token) return null
      try {
        return await fetchApi<User>("/auth/me")
      } catch (err) {
        console.error("Auth check failed", err)
        localStorage.removeItem("token")
        return null
      }
    }
  })

  const handleLoginOrRegister = (user: User) => {
    queryClient.setQueryData(['authUser'], user)
    setIsRegistering(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    queryClient.setQueryData(['authUser'], null)
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
          onRegister={handleLoginOrRegister} 
          onBackToLogin={() => setIsRegistering(false)} 
        />
      )
    }
    return (
      <LoginForm 
        onLogin={handleLoginOrRegister} 
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
