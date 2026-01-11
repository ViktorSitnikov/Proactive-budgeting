"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Calendar, 
  Mail,
  Loader2,
  ExternalLink,
  Award,
  Clock
} from "lucide-react"
import { type NPO } from "@/src/shared/lib/mock-data"
import { projectsApi } from "@/src/shared/api/projects"
import { useToast } from "@/hooks/use-toast"

interface NPOManagementPageProps {
  onActionComplete?: () => void
}

export function NPOManagementPage({ onActionComplete }: NPOManagementPageProps) {
  const { toast } = useToast()
  const [npos, setNpos] = useState<NPO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNPOs = async () => {
    try {
      setIsLoading(true)
      const data = await projectsApi.getNPOs()
      setNpos(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNPOs()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await projectsApi.updateNPOStatus(id, "approved")
      setNpos(prev => prev.map(n => n.id === id ? { ...n, status: "approved" } : n))
      toast({
        title: "НКО одобрена",
        description: "Организация получила доступ к партнерской панели.",
      })
      if (onActionComplete) onActionComplete()
    } catch (err) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось одобрить НКО" })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await projectsApi.updateNPOStatus(id, "rejected")
      setNpos(prev => prev.filter(n => n.id !== id))
      toast({
        title: "Заявка отклонена",
        description: "НКО уведомлена об отказе в регистрации.",
      })
      if (onActionComplete) onActionComplete()
    } catch (err) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось отклонить заявку" })
    }
  }

  const pendingNPOs = npos.filter(n => n.status === "pending")
  const approvedNPOs = npos.filter(n => n.status === "approved")

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Управление партнерами</h2>
          <p className="text-slate-500 mt-1">Верификация НКО и мониторинг их деятельности</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Верифицировано</p>
              <p className="text-sm font-black">{approvedNPOs.length}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">В очереди</p>
              <p className="text-sm font-black">{pendingNPOs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="font-bold text-slate-400">Синхронизация реестра...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pending Applications */}
          {pendingNPOs.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                Новые заявки на регистрацию
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {pendingNPOs.map(npo => (
                  <Card key={npo.id} className="border-none shadow-xl bg-white overflow-hidden group">
                    <CardContent className="p-0 flex flex-col md:flex-row">
                      <div className="w-full md:w-1/3 bg-slate-50 p-8 border-r">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">{npo.name}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            Заявка от: {new Date(npo.registrationDate || '').toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Mail className="w-3.5 h-3.5" />
                            info@{npo.id}.org
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-8 flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-slate-600 leading-relaxed mb-6">
                            {npo.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {npo.expertise.map(exp => (
                              <Badge key={exp} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-bold">
                                {exp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t">
                          <Button 
                            variant="ghost" 
                            onClick={() => handleReject(npo.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                          >
                            Отклонить
                          </Button>
                          <Button 
                            onClick={() => handleApprove(npo.id)}
                            className="bg-slate-900 hover:bg-emerald-600 transition-all font-bold px-8 rounded-xl shadow-lg"
                          >
                            Подтвердить статус
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Approved Partners */}
          <section className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Верифицированные партнеры</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {approvedNPOs.map(npo => (
                <Card key={npo.id} className="border-none shadow-lg bg-white hover:shadow-2xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
                        <Award className="w-4 h-4" />
                        {npo.rating > 0 ? npo.rating.toFixed(1) : 'NEW'}
                      </div>
                    </div>
                    <h4 className="font-black text-slate-900 mb-1">{npo.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Проектов: {npo.activeProjects} • Запросов: {npo.pendingRequests}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-6">
                      {npo.expertise.slice(0, 2).map(exp => (
                        <Badge key={exp} variant="outline" className="text-[9px] uppercase font-bold border-slate-100 text-slate-500">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-lg border-slate-200 hover:bg-slate-50 gap-2">
                      <ExternalLink className="w-3 h-3" />
                      Детальный отчет
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

