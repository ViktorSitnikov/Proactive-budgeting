"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  MapPin, 
  Coins, 
  Calendar, 
  Users, 
  ArrowLeft, 
  Share2, 
  CheckCircle2,
  Clock,
  Info,
  UserCheck,
  Bell,
  Check,
  X,
  FileEdit,
  TrendingUp,
  LayoutDashboard,
  Loader2,
  Building2
} from 'lucide-react';
import { Project, ProjectStatuses, type User } from '@/src/shared/lib/mock-data';
import { ResourceTable } from '@/src/features/resource-crud/ui/resource-table';
import { projectsApi } from '@/src/shared/api/projects';
import { getImageUrl } from '@/src/shared/api/base';

interface ProjectViewProps {
  project: Project;
  onBack?: () => void;
  userRole?: 'initiator' | 'npo' | 'admin';
  currentUserId?: string;
  initialEditEstimate?: boolean;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ 
  project: initialProject, 
  onBack,
  userRole = 'initiator',
  currentUserId,
  initialEditEstimate = false
}) => {
  const [project, setProject] = useState(initialProject);
  const [isPending, setIsPending] = useState(false);
  const [isEditingEstimate, setIsEditingEstimate] = useState(initialEditEstimate);
  const [resources, setResources] = useState<any[]>([]);
  const [initiator, setInitiator] = useState<any>(null);
  const [npo, setNpo] = useState<any>(null);

  useEffect(() => {
    const loadInitiator = async () => {
      try {
        const userData = await projectsApi.getUser(project.initiatorId);
        setInitiator(userData);
      } catch (err) {
        console.error("Failed to load initiator:", err);
      }
    };
    loadInitiator();
  }, [project.initiatorId]);

  useEffect(() => {
    const loadNPO = async () => {
      if (project.npoId) {
        try {
          const npos = await projectsApi.getNPOs();
          const currentNPO = npos.find(n => n.id === project.npoId);
          setNpo(currentNPO);
        } catch (err) {
          console.error("Failed to load NPO:", err);
        }
      }
    };
    loadNPO();
  }, [project.npoId]);

  const initiatorName = initiator?.name || 'Загрузка...';
  const initiatorAvatar = initiatorName.split(' ').map((n: string) => n[0]).join('');

  useEffect(() => {
    if (project.resources && project.resources.length > 0) {
        setResources(project.resources);
    } else {
        // Fallback for projects without resources in DB
        setResources([
          { id: "res-1", name: "Игровое оборудование", quantity: 5, unit: "шт.", estimatedCost: 30000 },
          { id: "res-2", name: "Резиновое покрытие", quantity: 100, unit: "м²", estimatedCost: 2500 },
          { id: "res-3", name: "Лавочки", quantity: 8, unit: "шт.", estimatedCost: 10000 },
        ]);
    }
  }, [project.id, project.resources]);

  const handleResourcesChange = (newResources: any[]) => {
    setResources(newResources);
  };

  const calculateTotal = (resList: any[]) => {
    return resList.reduce((sum, r) => {
      const price = r.basePrice || r.estimatedCost || 0;
      const qty = r.quantity || 0;
      return sum + (price * qty);
    }, 0);
  };

  const totalBudget = (resources.length > 0 ? calculateTotal(resources) : (project.budget || 0)) || 0;

  const handleSaveEstimate = async () => {
    try {
      setIsPending(true);
      await projectsApi.updateProjectEstimate(project.id, resources);
      toast.success('Смета успешно обновлена');
      setIsEditingEstimate(false);
    } catch (err) {
      toast.error('Ошибка сохранения');
    } finally {
      setIsPending(false);
    }
  };
  
  const isInitiator = currentUserId === project.initiatorId;
  const isParticipant = project.participants?.includes(currentUserId || '');
  const isSuccess = project.status === ProjectStatuses.success;
  const isNPOPartner = userRole === 'npo' && project.npoId === currentUserId;

  const shouldHideParticipation = isSuccess || isInitiator || isParticipant || userRole === 'npo' || userRole === 'admin';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.title,
        text: project.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована в буфер обмена');
    }
  };

  const handleAcceptRequest = async (name: string) => {
    try {
      setIsPending(true);
      await projectsApi.handleJoinRequest(project.id, name, 'approve');
      setProject(prev => ({
        ...prev,
        pendingJoinRequests: prev.pendingJoinRequests?.filter(n => n !== name),
        participants: [...(prev.participants || []), name]
      }));
      toast.success(`Участник ${name} добавлен в проект`);
    } catch (err) {
      toast.error('Ошибка при обработке запроса');
    } finally {
      setIsPending(false);
    }
  };

  const handleRejectRequest = async (name: string) => {
    try {
      setIsPending(true);
      await projectsApi.handleJoinRequest(project.id, name, 'reject');
      setProject(prev => ({
        ...prev,
        pendingJoinRequests: prev.pendingJoinRequests?.filter(n => n !== name)
      }));
      toast.error(`Запрос от ${name} отклонен`);
    } catch (err) {
      toast.error('Ошибка при обработке запроса');
    } finally {
      setIsPending(false);
    }
  };

  const handleJoinRequest = async () => {
    try {
      setIsPending(true);
      await projectsApi.joinProject(project.id);
      toast.success('Запрос на вступление отправлен автору');
      
      // Имитируем обновление для UI
      setProject(prev => ({
        ...prev,
        pendingJoinRequests: [...(prev.pendingJoinRequests || []), 'Вы (ожидание)']
      }));
    } catch (err) {
      toast.error('Ошибка при отправке запроса');
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: ProjectStatuses) => {
    try {
      setIsPending(true);
      await projectsApi.updateProjectStatus(project.id, newStatus);
      setProject(prev => ({ ...prev, status: newStatus }));
      toast.success(`Статус проекта обновлен на: ${newStatus === ProjectStatuses.success ? 'Реализован' : 'В работе'}`);
    } catch (err) {
      toast.error('Ошибка обновления статуса');
    } finally {
      setIsPending(false);
    }
  };

  const handleDownloadDocs = () => {
    const content = `
ДОКУМЕНТАЦИЯ ПРОЕКТА: ${project.title}
------------------------------------------
Статус: ${project.status}
Дата формирования: ${new Date().toLocaleDateString()}
Автор: ${initiatorName}
Локация: ${project.location}
Бюджет: ${(project.budget || 0).toLocaleString()} ₽

ОПИСАНИЕ:
${project.description}

ФИНАНСОВЫЙ ПЛАН:
${resources.map(r => `- ${r.name || r.resource}: ${r.quantity} ${r.unit} x ${(r.basePrice || r.estimatedCost || 0)} ₽ = ${(r.quantity * (r.basePrice || r.estimatedCost || 0)).toLocaleString()} ₽`).join('\n')}

Итого: ${(project.budget || 0).toLocaleString()} ₽
------------------------------------------
Сгенерировано системой Прямой Демократии
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Project_Docs_${project.id}.pdf.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Документация скачана');
  };

  const getStatusConfig = (status: ProjectStatuses) => {
    switch (status) {
      case ProjectStatuses.success:
        return { label: 'Реализован', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case ProjectStatuses.active:
        return { label: 'В работе', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock };
      default:
        return { label: 'На проверке', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Info };
    }
  };

  const statusConfig = getStatusConfig(project.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Поделиться
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Author Notifications */}
        {isInitiator && ((project.pendingJoinRequests?.length || 0) > 0 || (project.ngoPartnerRequests?.length || 0) > 0) ? (
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-orange-500 animate-bounce" />
              <h2 className="text-lg font-bold text-slate-800">Уведомления проекта</h2>
            </div>
            
            {project.pendingJoinRequests?.map((name, idx) => (
              <motion.div 
                key={`join-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col sm:items-center sm:flex-row justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center font-bold text-orange-700 shrink-0">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">Хочет присоединиться к команде</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    onClick={() => handleAcceptRequest(name)}
                    className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 h-8 px-3 text-xs"
                  >
                    Принять
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleRejectRequest(name)}
                    className="flex-1 sm:flex-none h-8 px-3 text-xs text-slate-400 hover:text-red-500"
                  >
                    Отклонить
                  </Button>
                </div>
              </motion.div>
            ))}

            {project.ngoPartnerRequests?.map((req, idx) => (
              <motion.div 
                key={`ngo-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col sm:items-center sm:flex-row justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700 shrink-0">
                    НКО
                  </div>
                  <div className="max-w-md">
                    <p className="text-sm font-bold text-slate-900">{req.npoName}</p>
                    <p className="text-xs text-slate-600 line-clamp-1 italic">"{req.message}"</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs">Обсудить партнерство</Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl mb-6">
                <img 
                  src={getImageUrl(project.image)} 
                  alt={project.title} 
                  className="w-full h-full object-cover"
                />
                <Badge className={`absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-bold shadow-lg ${statusConfig.color} border-2`}>
                  <StatusIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 inline" />
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="space-y-4">
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {project.title}
                </h1>
                
                <div className="flex flex-wrap gap-2 md:gap-4 text-slate-500">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium">
                    <Badge variant="secondary" className="bg-blue-600 text-white border-none">{project.type || 'Благоустройство'}</Badge>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                    {project.location}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                    {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                    Участников: {project.participants?.length || 0}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="prose prose-slate max-w-none"
            >
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">О проекте</h3>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </motion.section>

            {/* Resources/Budget Preview */}
            <Card className="border-none shadow-lg bg-slate-50 overflow-hidden">
              <CardHeader className="bg-white border-b flex flex-row items-center justify-between p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Coins className="w-5 h-5 text-blue-600" />
                  Финансовый план
                </CardTitle>
                {isNPOPartner && !isSuccess && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-xs"
                    onClick={() => setIsEditingEstimate(!isEditingEstimate)}
                  >
                    <FileEdit className="w-4 h-4" />
                    {isEditingEstimate ? 'Отмена' : 'Правка'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {isEditingEstimate ? (
                  <div className="p-4 md:p-6 bg-white space-y-6">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                      <Info className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-800">
                        Вы редактируете смету как официальный партнер. После сохранения изменения станут доступны автору проекта.
                      </p>
                    </div>
                    <ResourceTable resources={resources} onResourcesChange={handleResourcesChange} />
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingEstimate(false)}>Отмена</Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveEstimate} disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-white gap-4">
                      <div>
                        <p className="text-xs md:text-sm text-slate-500">Общий бюджет проекта</p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900">
                          {(totalBudget || 0).toLocaleString()} ₽
                        </p>
                      </div>
                      <Badge variant="outline" className="px-3 py-1 md:px-4 md:py-2 border-blue-200 bg-blue-50 text-blue-700 font-bold text-[10px] md:text-xs w-fit">
                        Инициативное бюджетирование
                      </Badge>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left bg-white min-w-[400px]">
                        <thead className="bg-slate-50 text-[9px] md:text-[10px] uppercase font-black text-slate-400 tracking-widest border-y">
                          <tr>
                            <th className="px-4 md:px-8 py-4">Ресурс</th>
                            <th className="px-4 md:px-8 py-4">Кол-во</th>
                            <th className="px-4 md:px-8 py-4 text-right">Сумма</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {resources.slice(0, 3).map((res, i) => {
                            const name = res.resource || res.name;
                            const price = res.basePrice || res.estimatedCost || 0;
                            return (
                              <tr key={i}>
                                <td className="px-4 md:px-8 py-4 md:py-5">
                                  <p className="font-bold text-slate-900 text-sm">{name}</p>
                                </td>
                                <td className="px-4 md:px-8 py-4 md:py-5 text-slate-600 font-medium text-xs">{res.quantity} {res.unit || ''}</td>
                                <td className="px-4 md:px-8 py-4 md:py-5 text-right font-black text-slate-900 text-sm">{(price * res.quantity).toLocaleString()} ₽</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-blue-50/50">
                          <tr>
                            <td colSpan={2} className="px-4 md:px-8 py-4 md:py-6 text-slate-900 font-bold text-sm">Итоговая оценка</td>
                            <td className="px-4 md:px-8 py-4 md:py-6 text-right font-black text-lg md:text-xl text-blue-600">{(totalBudget || 0).toLocaleString()} ₽</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isNPOPartner && !isSuccess && (
              <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
                <CardHeader className="bg-slate-800 border-b border-slate-700">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-blue-400" />
                    Управление проектом
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  <div className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white border-slate-700 gap-2 h-11 shadow-lg"
                        >
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          Обновить статус
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Обновление статуса проекта</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-slate-500">Выберите новый этап реализации проекта:</p>
                          <div className="grid gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-start gap-3 h-14"
                              onClick={() => handleUpdateStatus(ProjectStatuses.active)}
                              disabled={isPending || project.status === ProjectStatuses.active}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-sm">В работе</p>
                                <p className="text-[10px] text-slate-400">Продолжение активной фазы</p>
                              </div>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-start gap-3 h-14 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleUpdateStatus(ProjectStatuses.success)}
                              disabled={isPending || project.status === ProjectStatuses.success}
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-sm">Реализован</p>
                                <p className="text-[10px] text-slate-400">Проект полностью завершен</p>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white border-slate-700 gap-2 h-11 shadow-lg"
                      onClick={handleDownloadDocs}
                    >
                      <Building2 className="w-4 h-4 text-blue-400" />
                      Документы проекта
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {!shouldHideParticipation && (
              <Card className="border-2 border-blue-100 shadow-xl overflow-hidden">
                <CardHeader className="bg-blue-600 text-white">
                  <CardTitle className="text-lg">Участие в проекте</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-slate-600">
                    Вы можете стать частью команды реализации этого проекта и помочь городу.
                  </p>
                  <div className="space-y-3 pt-2">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
                      disabled={isPending}
                      onClick={handleJoinRequest}
                    >
                      {isPending ? 'Запрос отправлен' : 'Отправить запрос на вступление'}
                    </Button>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500">Заполнено команды</span>
                      <span className="text-blue-600">45%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-blue-500 h-full w-[45%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Партнер проекта</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {npo ? (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center font-bold text-blue-600 overflow-hidden">
                      {npo.avatar ? <img src={npo.avatar} alt={npo.name} className="w-full h-full object-cover" /> : npo.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{npo.name}</p>
                      <p className="text-xs text-slate-500">НКО-партнер</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Партнер еще не выбран</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                  Инициативная группа
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium">Активные участники ({project.participants?.length || 1})</p>
                  <div className="space-y-3">
                    {/* Автор всегда в топе */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                        {initiatorAvatar}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">{initiatorName}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase mt-1 tracking-tighter">Автор идеи</p>
                      </div>
                    </div>
                    
                    {/* Другие участники */}
                    {project.participants?.filter(p => p !== initiatorName).map((participant, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] text-emerald-700 font-bold">
                          {participant.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 leading-none">{participant}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase">Участник</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-xs h-8 border-slate-200 text-slate-600 mt-2">
                        Весь список
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Участники проекта</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">{initiatorAvatar}</div>
                          <div>
                            <p className="font-bold">{initiatorName}</p>
                            <p className="text-xs text-blue-600">Автор идеи</p>
                          </div>
                        </div>
                        {project.participants?.map((name, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 border-b last:border-0">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                              {name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold">{name}</p>
                              <p className="text-xs text-slate-400">Участник</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

