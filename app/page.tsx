'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { db, generateId } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { User, UserStats, Habit, Task, PomodoroSession } from '@/lib/db/schema';
import { notificationManager, scheduleHabitReminders } from '@/lib/notifications';
import WelcomeModal from '@/components/WelcomeModal';
import Tutorial from '@/components/Tutorial';
import Image from 'next/image';
import {
  Target,
  Clock,
  CheckCircle2,
  TrendingUp,
  Flame,
  Plus,
  Play,
  ListTodo,
  Brain,
  Trophy,
  Gift,
  BarChart3,
  FileText,
  BookOpen,
  Bell,
  BellOff,
  Calendar,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

// Mapeamento de ícones para as ações rápidas
const quickActionIcons = {
  pomodoro: { icon: Play, imageName: 'pomodoro', color: 'red' },
  habits: { icon: Plus, imageName: 'habits', color: 'green' },
  tasks: { icon: ListTodo, imageName: 'tasks', color: 'blue' },
  addictions: { icon: Target, imageName: 'addictions', color: 'purple' },
  study: { icon: Brain, imageName: 'study', color: 'indigo' },
  schedule: { icon: Calendar, imageName: 'timeblock', color: 'violet' },
  journal: { icon: BookOpen, imageName: 'journal', color: 'orange' },
  analytics: { icon: BarChart3, imageName: 'analytics', color: 'cyan' },
  achievements: { icon: Trophy, imageName: 'achievements', color: 'yellow' },
  rewards: { icon: Gift, imageName: 'rewards', color: 'pink' },
  timeblock: { icon: Clock, imageName: 'timeblock', color: 'cyan' },
  reports: { icon: FileText, imageName: 'reports', color: 'teal' },
};

export default function HomePage() {
  const { user, userStats, setUser, setUserStats, setInitialized, darkMode, useImageIcons } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [todayFocusTime, setTodayFocusTime] = useState(0);
  const [consistencyScore, setConsistencyScore] = useState(0);
  const [sobrietyDays, setSobrietyDays] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    initializeApp();
    // Verificar status das notificações
    setNotificationsEnabled(notificationManager.isEnabled());
  }, []);

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      alert('Para desativar notificações, vá nas configurações do navegador');
      return;
    }

    const granted = await notificationManager.requestPermission();
    if (granted) {
      setNotificationsEnabled(true);
      
      // Agendar lembretes de hábitos com horário definido
      const habitsWithTime = todayHabits.filter(h => h.time);
      if (habitsWithTime.length > 0) {
        scheduleHabitReminders(habitsWithTime.map(h => ({ name: h.name, time: h.time })));
      }
      
      // Notificação de teste
      await notificationManager.send({
        title: 'Notificações Ativadas!',
        body: 'Você receberá lembretes de hábitos e tarefas'
      });
    } else {
      alert('Permissão negada. Ative nas configurações do navegador.');
    }
  };

  const initializeApp = async () => {
    try {
      await db.init();
      
      // Verificar se já existe um usuário
      const users = await db.getAll<User>(STORES.users);
      let currentUser: User;
      
      if (users.length === 0) {
        // Criar usuário temporário sem nome
        const newUser: User = {
          id: generateId(),
          name: '',
          createdAt: new Date(),
          settings: {
            darkMode: false,
            notifications: true,
            pomodoroTime: 25,
            shortBreak: 5,
            longBreak: 15,
            dailyGoal: 120, // 2 horas por dia
            journalReminderEnabled: false,
            weeklyPlanningEnabled: false
          }
        };
        
        await db.add(STORES.users, newUser);
        setUser(newUser);
        currentUser = newUser;
        setShowWelcomeModal(true);
        
        // Criar stats iniciais
        const newStats: UserStats = {
          id: generateId(),
          userId: newUser.id,
          level: 1,
          xp: 0,
          totalFocusTime: 0,
          totalStudyTime: 0,
          habitsCompleted: 0,
          tasksCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastUpdated: new Date()
        };
        
        await db.add(STORES.userStats, newStats);
        setUserStats(newStats);
      } else {
        setUser(users[0]);
        currentUser = users[0];
        
        // Verificar se o usuário não tem nome definido
        if (!users[0].name || users[0].name.trim() === '' || users[0].name === 'Usuário') {
          setShowWelcomeModal(true);
        }
        
        const stats = await db.getByIndex<UserStats>(STORES.userStats, 'userId', users[0].id);
        if (stats.length > 0) {
          setUserStats(stats[0]);
        }
      }
      
      setInitialized(true);
      
      // Carregar dados do dashboard usando o usuário local
      await loadDashboardDataWithUser(currentUser);
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeComplete = async (name: string) => {
    if (!user) return;
    
    try {
      const updatedUser: User = {
        ...user,
        name: name
      };
      
      await db.update(STORES.users, updatedUser);
      setUser(updatedUser);
      setShowWelcomeModal(false);
      
      // Mostrar tutorial após o modal de boas-vindas
      setTimeout(() => {
        setShowTutorial(true);
      }, 500);
      
      // Notificação de boas-vindas
      if (notificationManager.isEnabled()) {
        await notificationManager.send({
          title: `Bem-vindo, ${name}!`,
          body: 'Vamos começar sua jornada de produtividade'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar nome:', error);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    // Salvar que o tutorial foi completado
    if (user) {
      localStorage.setItem(`tutorial_completed_${user.id}`, 'true');
    }
  };

  const loadDashboardDataWithUser = async (currentUser: User) => {
    if (!currentUser) return;
    
    try {
      // Carregar hábitos ativos
      const habits = await db.getByIndex<Habit>(STORES.habits, 'userId', currentUser.id);
      const activeHabits = habits.filter(h => h.active);
      setTodayHabits(activeHabits);
      
      // Carregar tarefas de hoje
      const tasks = await db.getByIndex<Task>(STORES.tasks, 'userId', currentUser.id);
      const todayTasks = tasks.filter(t => !t.completed && t.category === 'today');
      setTodayTasks(todayTasks);
      
      // Calcular tempo de foco de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessions = await db.getByIndex<PomodoroSession>(STORES.pomodoroSessions, 'userId', currentUser.id);
      const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime() && s.completed;
      });
      const totalMinutes = todaySessions.reduce((acc, s) => acc + (s.actualDuration || s.duration), 0);
      setTodayFocusTime(totalMinutes);

      // Calcular score de consistência (0-100)
      await calculateConsistencyScore(currentUser, activeHabits, todayTasks, totalMinutes);

      // Calcular dias de sobriedade
      await calculateSobrietyDays(currentUser);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;
    await loadDashboardDataWithUser(user);
  };

  const calculateConsistencyScore = async (currentUser: User, habits: Habit[], tasks: Task[], focusTime: number) => {
    let score = 0;
    
    // Hábitos completados hoje (30 pontos)
    const habitLogs = await db.getAll<any>(STORES.habitLogs);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = habitLogs.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && log.completed;
    });
    const habitScore = habits.length > 0 ? (todayLogs.length / habits.length) * 30 : 0;
    score += habitScore;

    // Tarefas completadas (30 pontos)
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskScore = tasks.length > 0 ? (completedTasks / tasks.length) * 30 : 0;
    score += taskScore;

    // Tempo de foco (25 pontos - meta: 120 min)
    const focusScore = Math.min((focusTime / 120) * 25, 25);
    score += focusScore;

    // Sobriedade (15 pontos)
    const addictions = await db.getByIndex<any>(STORES.addictions, 'userId', currentUser.id);
    const activeAddictions = addictions.filter(a => a.active);
    if (activeAddictions.length > 0) {
      const addictionLogs = await db.getAll<any>(STORES.addictionLogs);
      const todayRelapses = addictionLogs.filter(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime() && log.relapsed;
      });
      const sobrietyScore = todayRelapses.length === 0 ? 15 : 0;
      score += sobrietyScore;
    } else {
      score += 15; // Bônus se não tem vícios cadastrados
    }

    setConsistencyScore(Math.round(score));
  };

  const calculateSobrietyDays = async (currentUser: User) => {
    const addictions = await db.getByIndex<any>(STORES.addictions, 'userId', currentUser.id);
    const activeAddictions = addictions.filter(a => a.active);
    
    if (activeAddictions.length === 0) {
      setSobrietyDays(0);
      return;
    }

    const addictionLogs = await db.getAll<any>(STORES.addictionLogs);
    const sortedLogs = addictionLogs
      .filter(log => log.relapsed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedLogs.length === 0) {
      // Nunca teve recaída, conta desde o início do vício mais antigo
      const oldestAddiction = activeAddictions.reduce((oldest, current) => {
        return new Date(current.startDate) < new Date(oldest.startDate) ? current : oldest;
      });
      const days = Math.floor((Date.now() - new Date(oldestAddiction.startDate).getTime()) / (1000 * 60 * 60 * 24));
      setSobrietyDays(days);
    } else {
      // Conta desde a última recaída
      const lastRelapse = new Date(sortedLogs[0].date);
      const days = Math.floor((Date.now() - lastRelapse.getTime()) / (1000 * 60 * 60 * 24));
      setSobrietyDays(days);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando Controle de Si...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header com design único */}
      <header className="border-b border-slate-800/50 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-700 transition-colors">
                <img
                  src="/logo.png"
                  alt="Controle de Si"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent tracking-tight">
                  Controle de Si
                </h1>
                <p className="text-sm text-slate-400 font-medium">
                  E aí, <span className="text-violet-400 font-bold">{user?.name}</span>! Bora dominar o dia
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Botão de Alternância de Ícones */}
              <button
                onClick={() => useAppStore.getState().toggleImageIcons()}
                className={`p-3 rounded-xl transition-all ${
                  useImageIcons
                    ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                    : 'bg-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500/30'
                }`}
                title={useImageIcons ? 'Usar ícones do sistema' : 'Usar imagens personalizadas'}
              >
                {useImageIcons ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </button>

              {/* Botão de Notificações */}
              <button
                onClick={toggleNotifications}
                className={`p-3 rounded-xl transition-all ${
                  notificationsEnabled
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
                title={notificationsEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
              >
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </button>

              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Level</p>
                <p className="text-3xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {userStats?.level || 1}
                </p>
              </div>
              <div className="w-40">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{userStats?.xp || 0} XP</span>
                  <span>{(userStats?.level || 1) * 100} XP</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{
                      width: `${((userStats?.xp || 0) / ((userStats?.level || 1) * 100)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score de Consistência + Próxima Ação */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Score de Consistência */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-900/30 border-2 border-violet-500/30 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-2">
                    Score de Consistência
                  </p>
                  <h2 className="text-6xl font-black text-white mb-2">
                    {consistencyScore}
                    <span className="text-3xl text-slate-400">/100</span>
                  </h2>
                  <p className="text-slate-400">
                    {consistencyScore >= 80 && 'Você está dominando!'}
                    {consistencyScore >= 60 && consistencyScore < 80 && 'Bom ritmo, continue!'}
                    {consistencyScore >= 40 && consistencyScore < 60 && 'Melhorando aos poucos'}
                    {consistencyScore < 40 && 'Todo começo é difícil'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-24 h-24 rounded-full border-8 border-slate-800 relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-violet-500"
                        strokeDasharray={`${(consistencyScore / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Breakdown do Score */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Hábitos</p>
                  <p className="text-lg font-black text-green-400">30pts</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Tarefas</p>
                  <p className="text-lg font-black text-blue-400">30pts</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Foco</p>
                  <p className="text-lg font-black text-orange-400">25pts</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Sobriedade</p>
                  <p className="text-lg font-black text-purple-400">15pts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions + Sobriedade */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Ações Rápidas
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: '/habits', key: 'habits', label: 'Novo Hábito', gradient: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' },
                  { href: '/pomodoro', key: 'pomodoro', label: 'Pomodoro', gradient: 'from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700' },
                  { href: '/tasks', key: 'tasks', label: 'Nova Tarefa', gradient: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700' },
                  { href: '/study', key: 'study', label: 'Estudar', gradient: 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' },
                ].map(({ href, key, label, gradient }) => {
                  const iconData = quickActionIcons[key as keyof typeof quickActionIcons];
                  const Icon = iconData.icon;
                  
                  return (
                    <a
                      key={key}
                      href={href}
                      className={`bg-gradient-to-br ${gradient} rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95`}
                    >
                      {useImageIcons ? (
                        <div className="relative w-6 h-6">
                          <Image
                            src={`/menu-icons/${iconData.imageName}.png`}
                            alt={label}
                            fill
                            sizes="24px"
                            className="object-contain "
                          />
                        </div>
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                      <span className="text-white font-bold text-sm text-center">{label}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Sobriedade */}
            {sobrietyDays > 0 && (
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
                    Dias Limpo
                  </p>
                  <p className="text-5xl font-black text-white mb-1">
                    {sobrietyDays}
                  </p>
                  <p className="text-white/80 text-sm">
                    {sobrietyDays === 1 && 'Primeiro dia!'}
                    {sobrietyDays > 1 && sobrietyDays < 7 && 'Segue firme!'}
                    {sobrietyDays >= 7 && sobrietyDays < 30 && 'Uma semana+!'}
                    {sobrietyDays >= 30 && sobrietyDays < 90 && 'Um mês+!'}
                    {sobrietyDays >= 90 && 'Lendário!'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - Design mais ousado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 relative overflow-hidden group hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            <div className="relative">
              {useImageIcons ? (
                <div className="relative w-8 h-8 mb-3">
                  <Image
                    src="/menu-icons/sequencia.gif"
                    alt="Sequência"
                    fill
                    sizes="32px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <Flame className="w-8 h-8 text-white/80 mb-3" />
              )}
              <p className="text-white/80 text-sm font-medium mb-1">Sequência</p>
              <p className="text-4xl font-black text-white">{userStats?.currentStreak || 0}</p>
              <p className="text-white/60 text-xs mt-1">dias seguidos</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 relative overflow-hidden group hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            <div className="relative">
              {useImageIcons ? (
                <div className="relative w-8 h-8 mb-3">
                  <Image
                    src="/menu-icons/focohj.gif"
                    alt="Foco Hoje"
                    fill
                    sizes="32px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <Clock className="w-8 h-8 text-white/80 mb-3" />
              )}
              <p className="text-white/80 text-sm font-medium mb-1">Foco Hoje</p>
              <p className="text-4xl font-black text-white">{todayFocusTime}</p>
              <p className="text-white/60 text-xs mt-1">minutos</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 relative overflow-hidden group hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            <div className="relative">
              {useImageIcons ? (
                <div className="relative w-8 h-8 mb-3">
                  <Image
                    src="/menu-icons/tarefashome.gif"
                    alt="Tarefas"
                    fill
                    sizes="32px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <CheckCircle2 className="w-8 h-8 text-white/80 mb-3" />
              )}
              <p className="text-white/80 text-sm font-medium mb-1">Tarefas</p>
              <p className="text-4xl font-black text-white">
                {todayTasks.filter(t => t.completed).length}/{todayTasks.length}
              </p>
              <p className="text-white/60 text-xs mt-1">concluídas</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 relative overflow-hidden group hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            <div className="relative">
              {useImageIcons ? (
                <div className="relative w-8 h-8 mb-3">
                  <Image
                    src="/menu-icons/xp.gif"
                    alt="XP Total"
                    fill
                    sizes="32px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <TrendingUp className="w-8 h-8 text-white/80 mb-3" />
              )}
              <p className="text-white/80 text-sm font-medium mb-1">XP Total</p>
              <p className="text-4xl font-black text-white">{userStats?.xp || 0}</p>
              <p className="text-white/60 text-xs mt-1">pontos</p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Design mais ousado */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-11 gap-2 sm:gap-3 mb-8">
          <a href="/sistema-m" className="group bg-slate-900 border-2 border-purple-500/30 hover:border-purple-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/home.png" alt="Sistema M" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Sistema M</span>
            </div>
          </a>

          <a href="/pomodoro" className="group bg-slate-900 border-2 border-red-500/30 hover:border-red-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/pomodoro.png" alt="Pomodoro" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Pomodoro</span>
            </div>
          </a>

          <a href="/habits" className="group bg-slate-900 border-2 border-green-500/30 hover:border-green-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/habits.png" alt="Hábitos" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Hábitos</span>
            </div>
          </a>

          <a href="/tasks" className="group bg-slate-900 border-2 border-blue-500/30 hover:border-blue-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/tasks.png" alt="Tarefas" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <ListTodo className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Tarefas</span>
            </div>
          </a>

          <a href="/addictions" className="group bg-slate-900 border-2 border-purple-500/30 hover:border-purple-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/addictions.png" alt="Vícios" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Vícios</span>
            </div>
          </a>

          <a href="/study" className="group bg-slate-900 border-2 border-indigo-500/30 hover:border-indigo-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/study.png" alt="Estudar" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Estudar</span>
            </div>
          </a>

          <a href="/schedule" className="group bg-slate-900 border-2 border-violet-500/30 hover:border-violet-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-violet-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-500/20 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/timeblock.png" alt="Cronograma" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Cronograma</span>
            </div>
          </a>

          <a href="/journal" className="group bg-slate-900 border-2 border-orange-500/30 hover:border-orange-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/journal.jpg" alt="Diário" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Diário</span>
            </div>
          </a>

          <a href="/analytics" className="group bg-slate-900 border-2 border-cyan-500/30 hover:border-cyan-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/analytics.png" alt="Análises" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Análises</span>
            </div>
          </a>

          <a href="/rewards" className="group bg-slate-900 border-2 border-pink-500/30 hover:border-pink-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/20 rounded-lg flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/rewards.png" alt="Prêmios" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Prêmios</span>
            </div>
          </a>

          <a href="/timeblock" className="group bg-slate-900 border-2 border-cyan-500/30 hover:border-cyan-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/timeblock.png" alt="Agenda" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Agenda</span>
            </div>
          </a>

          <a href="/reports" className="group bg-slate-900 border-2 border-teal-500/30 hover:border-teal-500 rounded-xl p-3 sm:p-4 transition-all hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 active:scale-95">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500/20 rounded-lg flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                {useImageIcons ? (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <Image src="/menu-icons/reports.jpg" alt="Relatório" fill sizes="24px" className="object-contain " />
                  </div>
                ) : (
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 group-hover:text-white" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">Relatório</span>
            </div>
          </a>
        </div>

        {/* Today's Overview - Design atualizado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hábitos de Hoje */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              Hábitos de Hoje
            </h2>
            {todayHabits.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500 mb-4">Nenhum hábito ainda</p>
                <a href="/habits" className="text-green-400 hover:text-green-300 font-bold">
                  Criar primeiro hábito →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {todayHabits.slice(0, 5).map(habit => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-green-500/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                        <Flame className="w-5 h-5 text-green-400 group-hover:text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {habit.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {habit.streak} dias
                        </p>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-lg border-2 border-slate-700 hover:border-green-500 hover:bg-green-500 transition-all group">
                      <CheckCircle2 className="w-5 h-5 text-slate-600 group-hover:text-white mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tarefas de Hoje */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <ListTodo className="w-6 h-6 text-blue-400" />
              Tarefas de Hoje
            </h2>
            {todayTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500 mb-4">Nenhuma tarefa ainda</p>
                <a href="/tasks" className="text-blue-400 hover:text-blue-300 font-bold">
                  Adicionar tarefa →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                    <p className={`flex-1 font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </p>
                    {task.priority === 'high' && (
                      <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
                        ALTA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <WelcomeModal onComplete={handleWelcomeComplete} />
      )}

      {/* Tutorial */}
      {showTutorial && (
        <Tutorial onComplete={handleTutorialComplete} />
      )}
    </div>
  );
}

// Made with Bob
