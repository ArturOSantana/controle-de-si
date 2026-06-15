'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Flame, Target, Clock, Brain, Home, Trophy, Zap, TrendingDown, Award } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '@/lib/db';
import { STORES, PomodoroSession, HabitLog, Task, Addiction } from '@/lib/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface DayData {
  date: string;
  xp: number;
  focusMinutes: number;
  habitsCompleted: number;
  tasksCompleted: number;
}

interface WeekComparison {
  thisWeek: number;
  lastWeek: number;
  change: number;
}

export default function StatsPage() {
  const router = useRouter();
  const { user, userStats } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [heatmapData, setHeatmapData] = useState<{ date: string; value: number; habits: number; focus: number; tasks: number }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(30);
  const [weekComparison, setWeekComparison] = useState<WeekComparison>({ thisWeek: 0, lastWeek: 0, change: 0 });
  const [bestDay, setBestDay] = useState<DayData | null>(null);
  const [sobrietyDays, setSobrietyDays] = useState(0);
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'habits' | 'focus' | 'tasks'>('all');

  useEffect(() => {
    loadData();
  }, [user, selectedPeriod]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const endDate = new Date();
      const startDate = subDays(endDate, selectedPeriod);

      // Carregar dados
      const [pomodoroSessions, habitLogs, tasks, addictions] = await Promise.all([
        db.getByIndex<PomodoroSession>(STORES.pomodoroSessions, 'userId', user.id),
        db.getByIndex<HabitLog>(STORES.habitLogs, 'userId', user.id),
        db.getByIndex<Task>(STORES.tasks, 'userId', user.id),
        db.getByIndex<Addiction>(STORES.addictions, 'userId', user.id),
      ]);

      // Calcular dias de sobriedade
      const activeAddictions = addictions.filter(a => a.active);
      if (activeAddictions.length > 0) {
        const maxSobriety = Math.max(...activeAddictions.map(a => {
          if (!a.sobrietyDate) return 0;
          return Math.floor((Date.now() - new Date(a.sobrietyDate).getTime()) / (1000 * 60 * 60 * 24));
        }));
        setSobrietyDays(maxSobriety);
      }

      // Processar dados por dia
      const dataByDay = new Map<string, DayData>();

      for (let i = 0; i < selectedPeriod; i++) {
        const date = subDays(endDate, i);
        const dateStr = format(date, 'dd/MM');
        dataByDay.set(dateStr, {
          date: dateStr,
          xp: 0,
          focusMinutes: 0,
          habitsCompleted: 0,
          tasksCompleted: 0,
        });
      }

      // Processar Pomodoros
      pomodoroSessions
        .filter((s) => s.completed && s.startTime >= startDate)
        .forEach((session) => {
          const dateStr = format(new Date(session.startTime), 'dd/MM');
          const data = dataByDay.get(dateStr);
          if (data) {
            data.focusMinutes += session.actualDuration || session.duration;
            data.xp += 25;
          }
        });

      // Processar Hábitos
      habitLogs
        .filter((log) => log.completed && new Date(log.date) >= startDate)
        .forEach((log) => {
          const dateStr = format(new Date(log.date), 'dd/MM');
          const data = dataByDay.get(dateStr);
          if (data) {
            data.habitsCompleted += 1;
            data.xp += 10;
          }
        });

      // Processar Tarefas
      tasks
        .filter((task) => task.completed && task.completedAt && new Date(task.completedAt) >= startDate)
        .forEach((task) => {
          const dateStr = format(new Date(task.completedAt!), 'dd/MM');
          const data = dataByDay.get(dateStr);
          if (data) {
            data.tasksCompleted += 1;
            data.xp += 15;
          }
        });

      const chartArray = Array.from(dataByDay.values()).reverse();
      setChartData(chartArray);

      // Encontrar melhor dia
      const best = chartArray.reduce((max, day) => day.xp > max.xp ? day : max, chartArray[0]);
      setBestDay(best);

      // Comparação semanal
      const thisWeekStart = startOfWeek(new Date(), { locale: ptBR });
      const thisWeekEnd = endOfWeek(new Date(), { locale: ptBR });
      const lastWeekStart = startOfWeek(subDays(new Date(), 7), { locale: ptBR });
      const lastWeekEnd = endOfWeek(subDays(new Date(), 7), { locale: ptBR });

      const thisWeekXP = pomodoroSessions
        .filter(s => s.completed && isWithinInterval(new Date(s.startTime), { start: thisWeekStart, end: thisWeekEnd }))
        .length * 25 +
        habitLogs
          .filter(log => log.completed && isWithinInterval(new Date(log.date), { start: thisWeekStart, end: thisWeekEnd }))
          .length * 10 +
        tasks
          .filter(task => task.completed && task.completedAt && isWithinInterval(new Date(task.completedAt), { start: thisWeekStart, end: thisWeekEnd }))
          .length * 15;

      const lastWeekXP = pomodoroSessions
        .filter(s => s.completed && isWithinInterval(new Date(s.startTime), { start: lastWeekStart, end: lastWeekEnd }))
        .length * 25 +
        habitLogs
          .filter(log => log.completed && isWithinInterval(new Date(log.date), { start: lastWeekStart, end: lastWeekEnd }))
          .length * 10 +
        tasks
          .filter(task => task.completed && task.completedAt && isWithinInterval(new Date(task.completedAt), { start: lastWeekStart, end: lastWeekEnd }))
          .length * 15;

      const change = lastWeekXP > 0 ? ((thisWeekXP - lastWeekXP) / lastWeekXP) * 100 : 0;
      setWeekComparison({ thisWeek: thisWeekXP, lastWeek: lastWeekXP, change });

      // Gerar heatmap (últimos 90 dias) com detalhamento por área
      const heatmap: { date: string; value: number; habits: number; focus: number; tasks: number }[] = [];
      for (let i = 0; i < 90; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const focusCount = pomodoroSessions.filter(
          (s) => s.completed && format(new Date(s.startTime), 'yyyy-MM-dd') === dateStr
        ).length;
        
        const habitsCount = habitLogs.filter(
          (log) => log.completed && format(new Date(log.date), 'yyyy-MM-dd') === dateStr
        ).length;
        
        const tasksCount = tasks.filter(
          (task) => task.completed && task.completedAt && format(new Date(task.completedAt), 'yyyy-MM-dd') === dateStr
        ).length;

        const totalActivity = focusCount + habitsCount + tasksCount;

        heatmap.push({
          date: dateStr,
          value: totalActivity,
          habits: habitsCount,
          focus: focusCount,
          tasks: tasksCount
        });
      }
      setHeatmapData(heatmap.reverse());
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (value: number, filter: string) => {
    if (value === 0) return 'bg-slate-800 border border-slate-700';
    
    // Cores diferentes por filtro
    if (filter === 'habits') {
      if (value <= 2) return 'bg-green-900 border border-green-800';
      if (value <= 5) return 'bg-green-700 border border-green-600';
      if (value <= 10) return 'bg-green-500 border border-green-400';
      return 'bg-green-300 border border-green-200';
    } else if (filter === 'focus') {
      if (value <= 2) return 'bg-blue-900 border border-blue-800';
      if (value <= 5) return 'bg-blue-700 border border-blue-600';
      if (value <= 10) return 'bg-blue-500 border border-blue-400';
      return 'bg-blue-300 border border-blue-200';
    } else if (filter === 'tasks') {
      if (value <= 2) return 'bg-purple-900 border border-purple-800';
      if (value <= 5) return 'bg-purple-700 border border-purple-600';
      if (value <= 10) return 'bg-purple-500 border border-purple-400';
      return 'bg-purple-300 border border-purple-200';
    } else {
      // 'all' - verde padrão
      if (value <= 2) return 'bg-green-900 border border-green-800';
      if (value <= 5) return 'bg-green-700 border border-green-600';
      if (value <= 10) return 'bg-green-500 border border-green-400';
      return 'bg-green-300 border border-green-200';
    }
  };

  const getFilteredHeatmapValue = (day: typeof heatmapData[0]) => {
    switch (heatmapFilter) {
      case 'habits': return day.habits;
      case 'focus': return day.focus;
      case 'tasks': return day.tasks;
      default: return day.value;
    }
  };

  const totalXP = chartData.reduce((sum, day) => sum + day.xp, 0);
  const totalFocus = chartData.reduce((sum, day) => sum + day.focusMinutes, 0);
  const totalHabits = chartData.reduce((sum, day) => sum + day.habitsCompleted, 0);
  const totalTasks = chartData.reduce((sum, day) => sum + day.tasksCompleted, 0);

  const avgXPPerDay = chartData.length > 0 ? Math.round(totalXP / chartData.length) : 0;
  const avgFocusPerDay = chartData.length > 0 ? Math.round(totalFocus / chartData.length) : 0;

  // Mensagens personalizadas baseadas no desempenho
  const getMotivationalMessage = () => {
    if (weekComparison.change > 50) return "VOCÊ TÁ VOANDO! Essa semana foi absurda!";
    if (weekComparison.change > 20) return "MANDOU BEM! Evolução consistente!";
    if (weekComparison.change > 0) return "NO CAMINHO CERTO! Continue assim!";
    if (weekComparison.change > -20) return "ATENÇÃO! Semana fraca, bora reagir!";
    return "ACORDA! Você pode muito mais que isso!";
  };

  const getXPToNextReward = () => {
    const currentXP = totalXP;
    const nextMilestone = Math.ceil(currentXP / 1000) * 1000;
    return nextMilestone - currentXP;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b-2 border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase"
            >
              <Home className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              ANÁLISES
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagem Motivacional Personalizada */}
        <div className="mb-8 bg-gradient-to-r from-purple-500/20 to-pink-600/20 border-2 border-purple-500/50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black text-white mb-2">{getMotivationalMessage()}</p>
              <p className="text-slate-300 font-bold">
                {weekComparison.change >= 0 ? '↗' : '↘'} {Math.abs(Math.round(weekComparison.change))}% vs semana passada
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400 font-bold uppercase mb-1">Faltam para próxima recompensa</p>
              <p className="text-3xl font-black text-yellow-400">{getXPToNextReward()} XP</p>
            </div>
          </div>
        </div>

        {/* Seletor de Período */}
        <div className="flex justify-center gap-3 mb-8">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days as 7 | 30 | 90)}
              className={`px-8 py-3 rounded-xl font-black uppercase transition-all ${
                selectedPeriod === days
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white scale-110 shadow-lg shadow-purple-500/30'
                  : 'bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {days} DIAS
            </button>
          ))}
        </div>

        {/* Cards de Resumo com Comparação */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-5 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-400 text-xs font-black uppercase">XP Total</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{totalXP.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-bold">{avgXPPerDay} XP/dia</p>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-5 hover:border-blue-500/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-400 text-xs font-black uppercase">Foco</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{Math.round(totalFocus / 60)}h</p>
            <p className="text-xs text-slate-500 font-bold">{avgFocusPerDay}min/dia</p>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-5 hover:border-orange-500/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 p-2 rounded-lg">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-400 text-xs font-black uppercase">Hábitos</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{totalHabits}</p>
            <p className="text-xs text-slate-500 font-bold">completados</p>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-5 hover:border-green-500/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-400 text-xs font-black uppercase">Tarefas</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{totalTasks}</p>
            <p className="text-xs text-slate-500 font-bold">concluídas</p>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-5 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-2 rounded-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-400 text-xs font-black uppercase">Sobriedade</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{sobrietyDays}</p>
            <p className="text-xs text-slate-500 font-bold">dias limpo</p>
          </div>
        </div>

        {/* Melhor Dia */}
        {bestDay && bestDay.xp > 0 && (
          <div className="mb-8 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border-2 border-yellow-500/50 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-xl">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-bold uppercase mb-1">Seu Melhor Dia</p>
                <p className="text-3xl font-black text-white">{bestDay.date}</p>
                <p className="text-slate-300 font-bold mt-1">
                  {bestDay.xp} XP • {Math.round(bestDay.focusMinutes / 60)}h foco • {bestDay.habitsCompleted} hábitos • {bestDay.tasksCompleted} tarefas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico de XP */}
        <div className="mb-8 bg-slate-900 border-2 border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 uppercase">
            <Zap className="w-7 h-7 text-yellow-400" />
            EVOLUÇÃO DE XP
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(148,163,184,0.8)" 
                style={{ fontSize: '12px', fontWeight: 'bold' }} 
              />
              <YAxis 
                stroke="rgba(148,163,184,0.8)" 
                style={{ fontSize: '12px', fontWeight: 'bold' }} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(15,23,42)',
                  border: '2px solid rgb(71,85,105)',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="xp" 
                stroke="#fbbf24" 
                strokeWidth={4} 
                dot={{ fill: '#fbbf24', r: 6, strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Horas de Foco */}
        <div className="mb-8 bg-slate-900 border-2 border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 uppercase">
            <Clock className="w-7 h-7 text-blue-400" />
            MINUTOS DE FOCO POR DIA
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(148,163,184,0.8)" 
                style={{ fontSize: '12px', fontWeight: 'bold' }} 
              />
              <YAxis 
                stroke="rgba(148,163,184,0.8)" 
                style={{ fontSize: '12px', fontWeight: 'bold' }} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(15,23,42)',
                  border: '2px solid rgb(71,85,105)',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 'bold',
                }}
                formatter={(value) => [`${Math.round(Number(value))} min`, 'Foco']}
              />
              <Bar 
                dataKey="focusMinutes" 
                fill="url(#blueGradient)" 
                radius={[8, 8, 0, 0]} 
              />
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap de Atividades com Filtros */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase">
              <Calendar className="w-7 h-7 text-green-400" />
              HEATMAP - ÚLTIMOS 90 DIAS
            </h2>
            
            {/* Filtros */}
            <div className="flex gap-2">
              <button
                onClick={() => setHeatmapFilter('all')}
                className={`px-4 py-2 rounded-xl font-bold uppercase text-sm transition-all ${
                  heatmapFilter === 'all'
                    ? 'bg-green-500 text-white border-2 border-green-400'
                    : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-green-500'
                }`}
              >
                Tudo
              </button>
              <button
                onClick={() => setHeatmapFilter('habits')}
                className={`px-4 py-2 rounded-xl font-bold uppercase text-sm transition-all ${
                  heatmapFilter === 'habits'
                    ? 'bg-green-500 text-white border-2 border-green-400'
                    : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-green-500'
                }`}
              >
                Hábitos
              </button>
              <button
                onClick={() => setHeatmapFilter('focus')}
                className={`px-4 py-2 rounded-xl font-bold uppercase text-sm transition-all ${
                  heatmapFilter === 'focus'
                    ? 'bg-blue-500 text-white border-2 border-blue-400'
                    : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-blue-500'
                }`}
              >
                Foco
              </button>
              <button
                onClick={() => setHeatmapFilter('tasks')}
                className={`px-4 py-2 rounded-xl font-bold uppercase text-sm transition-all ${
                  heatmapFilter === 'tasks'
                    ? 'bg-purple-500 text-white border-2 border-purple-400'
                    : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-purple-500'
                }`}
              >
                Tarefas
              </button>
            </div>
          </div>
          
          <p className="text-slate-400 font-bold mb-6">
            {heatmapFilter === 'all' && 'Quanto mais verde, mais produtivo você foi naquele dia'}
            {heatmapFilter === 'habits' && 'Visualizando apenas hábitos completados'}
            {heatmapFilter === 'focus' && 'Visualizando apenas sessões de foco (Pomodoro)'}
            {heatmapFilter === 'tasks' && 'Visualizando apenas tarefas concluídas'}
          </p>
          
          <div className="overflow-x-auto">
            <div className="grid grid-cols-13 gap-2 min-w-max">
              {heatmapData.map((day) => {
                const value = getFilteredHeatmapValue(day);
                return (
                  <div
                    key={day.date}
                    className={`w-4 h-4 rounded ${getHeatmapColor(value, heatmapFilter)} transition-all hover:scale-150 cursor-pointer`}
                    title={`${format(new Date(day.date), 'dd/MM/yyyy', { locale: ptBR })}: ${value} ${
                      heatmapFilter === 'all' ? 'atividades' :
                      heatmapFilter === 'habits' ? 'hábitos' :
                      heatmapFilter === 'focus' ? 'pomodoros' : 'tarefas'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-6 text-sm text-slate-400 font-bold">
              <span className="uppercase">Menos</span>
              <div className="flex gap-2">
                <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
                {heatmapFilter === 'focus' ? (
                  <>
                    <div className="w-4 h-4 rounded bg-blue-900 border border-blue-800" />
                    <div className="w-4 h-4 rounded bg-blue-700 border border-blue-600" />
                    <div className="w-4 h-4 rounded bg-blue-500 border border-blue-400" />
                    <div className="w-4 h-4 rounded bg-blue-300 border border-blue-200" />
                  </>
                ) : heatmapFilter === 'tasks' ? (
                  <>
                    <div className="w-4 h-4 rounded bg-purple-900 border border-purple-800" />
                    <div className="w-4 h-4 rounded bg-purple-700 border border-purple-600" />
                    <div className="w-4 h-4 rounded bg-purple-500 border border-purple-400" />
                    <div className="w-4 h-4 rounded bg-purple-300 border border-purple-200" />
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded bg-green-900 border border-green-800" />
                    <div className="w-4 h-4 rounded bg-green-700 border border-green-600" />
                    <div className="w-4 h-4 rounded bg-green-500 border border-green-400" />
                    <div className="w-4 h-4 rounded bg-green-300 border border-green-200" />
                  </>
                )}
              </div>
              <span className="uppercase">Mais</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Made with Bob
