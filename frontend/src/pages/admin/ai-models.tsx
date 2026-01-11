"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Cpu, 
  TrendingUp, 
  RefreshCw, 
  Activity, 
  BarChart3, 
  CheckCircle2,
  AlertCircle,
  Zap,
  HardDrive,
  BrainCircuit,
  Settings2,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { projectsApi } from "@/src/shared/api/projects"

export function AIModelsPage() {
  const { toast } = useToast()
  const [isRetraining, setIsRetraining] = useState<string | null>(null)
  const [showLogs, setShowLogs] = useState<string | null>(null)

  const models = [
    {
      id: "vision-1",
      name: "Vision Classifier v4.2",
      type: "Computer Vision",
      status: "online",
      accuracy: 94.2,
      latency: "124ms",
      lastTrained: "2024-02-15",
      load: 42
    },
    {
      id: "llm-1",
      name: "LLM Proposal Gen v2.0",
      type: "Text Generation",
      status: "online",
      accuracy: 89.5,
      latency: "840ms",
      lastTrained: "2024-03-01",
      load: 68
    },
    {
      id: "vector-1",
      name: "Semantic Matcher v1.5",
      type: "Vector Search",
      status: "online",
      accuracy: 96.8,
      latency: "45ms",
      lastTrained: "2024-01-20",
      load: 15
    }
  ]

  const handleRetrain = async (id: string) => {
    try {
      setIsRetraining(id)
      await projectsApi.retrainModel(id)
      toast({
        title: "Переобучение запущено",
        description: "Модель поставлена в очередь на дообучение на новых данных.",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось запустить переобучение",
      })
    } finally {
      setIsRetraining(null)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Управление ИИ-ядром</h2>
          <p className="text-slate-500 mt-1">Мониторинг производительности и жизненный цикл моделей</p>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Общая точность", value: "93.4%", sub: "+1.2% за неделю", icon: TargetIcon, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Запросов/мин", value: "1,240", sub: "Пик: 2,400", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Средний Latency", value: "320ms", sub: "-45ms оптимизация", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "GPU Load", value: "64%", sub: "Tesla A100 Active", icon: HardDrive, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
              <p className="text-[10px] font-bold text-slate-500 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Models List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Активные модели</h3>
          {models.map(model => (
            <Card key={model.id} className="border-none shadow-lg bg-white overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                      <BrainCircuit className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{model.name}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{model.type}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-none uppercase text-[10px] font-black">
                      {model.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 italic">v{model.id.split('-')[1]}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Точность</p>
                    <p className="text-lg font-black text-blue-600">{model.accuracy}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Задержка</p>
                    <p className="text-lg font-black text-slate-900">{model.latency}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Обучена</p>
                    <p className="text-sm font-black text-slate-900">{model.lastTrained}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Текущая нагрузка</span>
                    <span className={model.load > 80 ? 'text-red-500' : 'text-slate-900'}>{model.load}%</span>
                  </div>
                  <Progress value={model.load} className="h-1.5" />
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 font-bold hover:bg-blue-50 gap-2"
                    onClick={() => setShowLogs(model.id)}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Логи обучения
                  </Button>
                  <Button 
                    disabled={isRetraining === model.id}
                    onClick={() => handleRetrain(model.id)}
                    className="bg-slate-900 hover:bg-blue-600 font-bold rounded-xl gap-2 min-w-[160px]"
                  >
                    {isRetraining === model.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Переобучить
                  </Button>
                </div>

                <AnimatePresence>
                  {showLogs === model.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 pt-6 border-t border-dashed"
                    >
                      <div className="bg-slate-50 rounded-xl p-4 font-mono text-[10px] space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-black uppercase text-slate-400">Training History</span>
                          <Button variant="ghost" size="sm" onClick={() => setShowLogs(null)} className="h-6 w-6 p-0">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-emerald-600">[2024-03-01] Epoch 50/50: loss: 0.0234 - accuracy: 0.9812</div>
                        <div className="text-slate-600">[2024-03-01] Epoch 45/50: loss: 0.0412 - accuracy: 0.9645</div>
                        <div className="text-slate-600">[2024-03-01] Validation complete. Saving checkpoint...</div>
                        <div className="text-blue-600">[2024-03-01] Starting training on 12,400 new samples.</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Training Logs / History */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Журнал событий ИИ</h3>
          <Card className="border-none shadow-xl bg-slate-900 text-white">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Лог системы
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-4 font-mono text-[10px]">
                {[
                  { time: "12:45:01", type: "INFO", msg: "Model Semantic Matcher inference complete (34ms)" },
                  { time: "12:44:12", type: "WARN", msg: "GPU memory usage high (82%) on Node-01" },
                  { time: "12:40:00", type: "SUCCESS", msg: "Batch re-indexing of vector space complete" },
                  { time: "12:35:15", type: "INFO", msg: "User appeal #892 submitted for Vision Scoring" },
                  { time: "12:30:45", type: "ERROR", msg: "Vision API timeout (retrying...)" },
                  { time: "12:28:10", type: "INFO", msg: "Retraining of LLM-01 scheduled for 02:00 AM" },
                ].map((log, i) => (
                  <div key={i} className="flex gap-3 leading-relaxed">
                    <span className="text-slate-500 shrink-0">{log.time}</span>
                    <span className={
                      log.type === 'ERROR' ? 'text-red-400' : 
                      log.type === 'WARN' ? 'text-amber-400' : 
                      log.type === 'SUCCESS' ? 'text-emerald-400' : 'text-blue-400'
                    }>[{log.type}]</span>
                    <span className="text-slate-300">{log.msg}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardContent className="p-6">
              <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Авто-обучение
              </h4>
              <p className="text-xs text-blue-100 mb-4 leading-relaxed">
                Система автоматически собирает данные отклоненных апелляций для улучшения классификатора.
              </p>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-2">
                <span>Прогресс датасета</span>
                <span>82%</span>
              </div>
              <Progress value={82} className="h-1 bg-white/20" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TargetIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

