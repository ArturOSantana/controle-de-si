'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { db } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { Habit, HabitLog, Task, PomodoroSession } from '@/lib/db/schema';
import { 
  Home, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Flame,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  thisWeek: {
    habitsCompleted: number;
    habitsTotal: number;
    tasksCompleted: number;
    focusMinutes: number;
    xpEarned: number;
    consistency: number;
  };
  lastWeek: {
    habitsCompleted: number;
    habitsTotal: number;
    tasksCompleted: number;
    focusMinutes: number;
    xpEarned: number;
    consistency: number;
  };
  changes: {
    habits: number;
    tasks: number;
    focus: number;
    xp: number;
    consistency: number;
  };
  bestHabit: { name: string; streak: number } | null;
  worstHabit: { name: string; completionRate: number } | null;
  insights: string[];
  recommendations: string[];
}

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    generateWeeklyReport();
  }, [user]);

  const generateWeeklyReport = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { locale: ptBR });
      const thisWeekEnd = endOfWeek(now, { locale: ptBR });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: ptBR });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: ptBR });

      // Carregar dados
      const [habits, habitLogs, tasks, pomodoroSessions] = await Promise.all([
        db.getByIndex<Habit>(STORES.habits, 'userId', user.id),
        db.getByIndex<HabitLog>(STORES.habitLogs, 'userId', user.id),
        db.getByIndex<Task>(STORES.tasks, 'userId', user.id),
        db.getByIndex<PomodoroSession>(STORES.pomodoroSessions, 'userId', user.id),
      ]);

      const activeHabits = habits.filter(h => h.active);

      // Calcular métricas desta semana
      const thisWeekHabitLogs = habitLogs.filter(log => 
        log.completed && isWithinInterval(new Date(log.date), { start: thisWeekStart, end: thisWeekEnd })
      );
      const thisWeekTasks = tasks.filter(task => 
        task.completed && task.completedAt && isWithinInterval(new Date(task.completedAt), { start: thisWeekStart, end: thisWeekEnd })
      );
      const thisWeekPomodoros = pomodoroSessions.filter(session => 
        session.completed && isWithinInterval(new Date(session.startTime), { start: thisWeekStart, end: thisWeekEnd })
      );

      const thisWeekFocusMinutes = thisWeekPomodoros.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0);
      const thisWeekXP = (thisWeekHabitLogs.length * 10) + (thisWeekTasks.length * 15) + (thisWeekPomodoros.length * 25);
      const thisWeekConsistency = activeHabits.length > 0 
        ? Math.round((thisWeekHabitLogs.length / (activeHabits.length * 7)) * 100) 
        : 0;

      // Calcular métricas da semana passada
      const lastWeekHabitLogs = habitLogs.filter(log => 
        log.completed && isWithinInterval(new Date(log.date), { start: lastWeekStart, end: lastWeekEnd })
      );
      const lastWeekTasks = tasks.filter(task => 
        task.completed && task.completedAt && isWithinInterval(new Date(task.completedAt), { start: lastWeekStart, end: lastWeekEnd })
      );
      const lastWeekPomodoros = pomodoroSessions.filter(session => 
        session.completed && isWithinInterval(new Date(session.startTime), { start: lastWeekStart, end: lastWeekEnd })
      );

      const lastWeekFocusMinutes = lastWeekPomodoros.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0);
      const lastWeekXP = (lastWeekHabitLogs.length * 10) + (lastWeekTasks.length * 15) + (lastWeekPomodoros.length * 25);
      const lastWeekConsistency = activeHabits.length > 0 
        ? Math.round((lastWeekHabitLogs.length / (activeHabits.length * 7)) * 100) 
        : 0;

      // Calcular mudanças percentuais
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      // Identificar melhor e pior hábito
      const habitStats = activeHabits.map(habit => {
        const logsThisWeek = thisWeekHabitLogs.filter(log => log.habitId === habit.id).length;
        return {
          name: habit.name,
          streak: habit.streak,
          completionRate: Math.round((logsThisWeek / 7) * 100)
        };
      });

      const bestHabit = habitStats.length > 0 
        ? habitStats.reduce((best, current) => current.streak > best.streak ? current : best)
        : null;
      
      const worstHabit = habitStats.length > 0 
        ? habitStats.reduce((worst, current) => current.completionRate < worst.completionRate ? current : worst)
        : null;

      // Gerar insights
      const insights: string[] = [];
      const recommendations: string[] = [];

      if (thisWeekConsistency >= 80) {
        insights.push('Consistência excelente! Você está no caminho certo.');
      } else if (thisWeekConsistency >= 60) {
        insights.push('Boa consistência, mas há espaço para melhorar.');
      } else if (thisWeekConsistency >= 40) {
        insights.push('Consistência moderada. Foque em manter a rotina.');
      } else {
        insights.push('Consistência baixa. Hora de reagir!');
      }

      if (thisWeekFocusMinutes > lastWeekFocusMinutes) {
        insights.push(`Você focou ${thisWeekFocusMinutes - lastWeekFocusMinutes} minutos a mais que na semana passada!`);
      } else if (thisWeekFocusMinutes < lastWeekFocusMinutes) {
        insights.push(`Tempo de foco diminuiu ${lastWeekFocusMinutes - thisWeekFocusMinutes} minutos.`);
        recommendations.push('Tente fazer pelo menos 4 sessões Pomodoro por dia');
      }

      if (thisWeekTasks.length > lastWeekTasks.length) {
        insights.push(`${thisWeekTasks.length - lastWeekTasks.length} tarefas a mais concluídas!`);
      } else if (thisWeekTasks.length < lastWeekTasks.length) {
        recommendations.push('Defina 3 MITs (Most Important Tasks) toda manhã');
      }

      if (worstHabit && worstHabit.completionRate < 50) {
        recommendations.push(`Foque em "${worstHabit.name}" - está com apenas ${worstHabit.completionRate}% de conclusão`);
      }

      if (thisWeekConsistency < 60) {
        recommendations.push('Reduza o número de hábitos e foque em 3-5 essenciais');
        recommendations.push('Use a técnica de Habit Stacking para encadear hábitos');
      }

      if (thisWeekFocusMinutes < 300) {
        recommendations.push('Meta: 300 minutos de foco por semana (43min/dia)');
      }

      const weeklyReport: WeeklyReport = {
        weekStart: thisWeekStart,
        weekEnd: thisWeekEnd,
        thisWeek: {
          habitsCompleted: thisWeekHabitLogs.length,
          habitsTotal: activeHabits.length * 7,
          tasksCompleted: thisWeekTasks.length,
          focusMinutes: thisWeekFocusMinutes,
          xpEarned: thisWeekXP,
          consistency: thisWeekConsistency,
        },
        lastWeek: {
          habitsCompleted: lastWeekHabitLogs.length,
          habitsTotal: activeHabits.length * 7,
          tasksCompleted: lastWeekTasks.length,
          focusMinutes: lastWeekFocusMinutes,
          xpEarned: lastWeekXP,
          consistency: lastWeekConsistency,
        },
        changes: {
          habits: calculateChange(thisWeekHabitLogs.length, lastWeekHabitLogs.length),
          tasks: calculateChange(thisWeekTasks.length, lastWeekTasks.length),
          focus: calculateChange(thisWeekFocusMinutes, lastWeekFocusMinutes),
          xp: calculateChange(thisWeekXP, lastWeekXP),
          consistency: thisWeekConsistency - lastWeekConsistency,
        },
        bestHabit,
        worstHabit,
        insights,
        recommendations,
      };

      setReport(weeklyReport);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white font-bold uppercase">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white">Erro ao gerar relatório</p>
      </div>
    );
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-5 h-5" />;
    if (change < 0) return <TrendingDown className="w-5 h-5" />;
    return <ArrowRight className="w-5 h-5" />;
  };

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
              RELATÓRIO SEMANAL
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Período */}
        <div className="mb-8 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-2 border-blue-500/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-black text-white uppercase">Período Analisado</h2>
          </div>
          <p className="text-slate-300 font-bold">
            {format(report.weekStart, "dd 'de' MMMM", { locale: ptBR })} até {format(report.weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Comparação Semanal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Hábitos */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-8 h-8 text-green-400" />
              <div className={`flex items-center gap-2 ${getChangeColor(report.changes.habits)}`}>
                {getChangeIcon(report.changes.habits)}
                <span className="font-black text-lg">{report.changes.habits > 0 ? '+' : ''}{report.changes.habits}%</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase mb-2">Hábitos</p>
            <p className="text-3xl font-black text-white mb-1">{report.thisWeek.habitsCompleted}</p>
            <p className="text-sm text-slate-500 font-medium">
              Semana passada: {report.lastWeek.habitsCompleted}
            </p>
          </div>

          {/* Tarefas */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-8 h-8 text-blue-400" />
              <div className={`flex items-center gap-2 ${getChangeColor(report.changes.tasks)}`}>
                {getChangeIcon(report.changes.tasks)}
                <span className="font-black text-lg">{report.changes.tasks > 0 ? '+' : ''}{report.changes.tasks}%</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase mb-2">Tarefas</p>
            <p className="text-3xl font-black text-white mb-1">{report.thisWeek.tasksCompleted}</p>
            <p className="text-sm text-slate-500 font-medium">
              Semana passada: {report.lastWeek.tasksCompleted}
            </p>
          </div>

          {/* Foco */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-orange-400" />
              <div className={`flex items-center gap-2 ${getChangeColor(report.changes.focus)}`}>
                {getChangeIcon(report.changes.focus)}
                <span className="font-black text-lg">{report.changes.focus > 0 ? '+' : ''}{report.changes.focus}%</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase mb-2">Foco</p>
            <p className="text-3xl font-black text-white mb-1">{report.thisWeek.focusMinutes}<span className="text-lg text-slate-500">min</span></p>
            <p className="text-sm text-slate-500 font-medium">
              Semana passada: {report.lastWeek.focusMinutes}min
            </p>
          </div>

          {/* XP */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-yellow-400" />
              <div className={`flex items-center gap-2 ${getChangeColor(report.changes.xp)}`}>
                {getChangeIcon(report.changes.xp)}
                <span className="font-black text-lg">{report.changes.xp > 0 ? '+' : ''}{report.changes.xp}%</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase mb-2">XP Ganho</p>
            <p className="text-3xl font-black text-white mb-1">{report.thisWeek.xpEarned}</p>
            <p className="text-sm text-slate-500 font-medium">
              Semana passada: {report.lastWeek.xpEarned}
            </p>
          </div>
        </div>

        {/* Consistência */}
        <div className="mb-8 bg-slate-900 border-2 border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 uppercase">
            <Target className="w-7 h-7 text-purple-400" />
            Taxa de Consistência
          </h2>
          <div className="flex items-end gap-8">
            <div className="flex-1">
              <p className="text-sm text-slate-400 font-bold uppercase mb-2">Esta Semana</p>
              <div className="h-8 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-500 flex items-center justify-end pr-4"
                  style={{ width: `${report.thisWeek.consistency}%` }}
                >
                  <span className="text-white font-black text-sm">{report.thisWeek.consistency}%</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400 font-bold uppercase mb-2">Semana Passada</p>
              <div className="h-8 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-700 transition-all duration-500 flex items-center justify-end pr-4"
                  style={{ width: `${report.lastWeek.consistency}%` }}
                >
                  <span className="text-slate-400 font-black text-sm">{report.lastWeek.consistency}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`mt-4 flex items-center gap-2 ${getChangeColor(report.changes.consistency)}`}>
            {getChangeIcon(report.changes.consistency)}
            <span className="font-black">
              {report.changes.consistency > 0 ? '+' : ''}{report.changes.consistency} pontos percentuais
            </span>
          </div>
        </div>

        {/* Melhor e Pior Hábito */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {report.bestHabit && (
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-400 font-bold uppercase">Melhor Hábito</p>
                  <p className="text-xl font-black text-white">{report.bestHabit.name}</p>
                </div>
              </div>
              <p className="text-slate-300 font-bold">
                Streak de <span className="text-green-400">{report.bestHabit.streak} dias</span>
              </p>
            </div>
          )}

          {report.worstHabit && (
            <div className="bg-gradient-to-br from-red-500/20 to-orange-600/20 border-2 border-red-500/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-400 font-bold uppercase">Precisa de Atenção</p>
                  <p className="text-xl font-black text-white">{report.worstHabit.name}</p>
                </div>
              </div>
              <p className="text-slate-300 font-bold">
                📉 Apenas <span className="text-red-400">{report.worstHabit.completionRate}%</span> de conclusão
              </p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="mb-8 bg-slate-900 border-2 border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white mb-6 uppercase">Insights da Semana</h2>
          <div className="space-y-3">
            {report.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-slate-800 rounded-xl">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <p className="text-slate-300 font-medium flex-1">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendações */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-2 border-purple-500/50 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white mb-6 uppercase">Recomendações para Próxima Semana</h2>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-purple-500/30">
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-sm">{index + 1}</span>
                </div>
                <p className="text-white font-bold flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Made with Bob