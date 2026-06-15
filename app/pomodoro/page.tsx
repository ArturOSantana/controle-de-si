'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { db, generateId } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { PomodoroSession } from '@/lib/db/schema';
import { Play, Pause, RotateCcw, Home, Coffee, Brain } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

type TimerMode = 'focus' | 'short-break' | 'long-break';

export default function PomodoroPage() {
  const router = useRouter();
  const { user, userStats, updateStats, addXP } = useAppStore();
  
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos em segundos
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    // Atualizar tempo baseado no modo
    const settings = user?.settings;
    if (!settings) return;

    switch (mode) {
      case 'focus':
        setTimeLeft(settings.pomodoroTime * 60);
        break;
      case 'short-break':
        setTimeLeft(settings.shortBreak * 60);
        break;
      case 'long-break':
        setTimeLeft(settings.longBreak * 60);
        break;
    }
  }, [mode, user?.settings]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleStart = async () => {
    if (!user) return;

    setIsRunning(true);
    startTimeRef.current = new Date();

    // Criar sessão no banco
    const session: PomodoroSession = {
      id: generateId(),
      userId: user.id,
      startTime: new Date(),
      duration: Math.floor(timeLeft / 60),
      completed: false,
      interrupted: false,
      type: mode
    };

    await db.add(STORES.pomodoroSessions, session);
    setCurrentSessionId(session.id);
  };

  const handlePause = async () => {
    setIsRunning(false);

    if (currentSessionId && startTimeRef.current) {
      const session = await db.get<PomodoroSession>(STORES.pomodoroSessions, currentSessionId);
      if (session) {
        const actualDuration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 60000);
        session.interrupted = true;
        session.actualDuration = actualDuration;
        session.endTime = new Date();
        await db.update(STORES.pomodoroSessions, session);
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    const settings = user?.settings;
    if (!settings) return;

    switch (mode) {
      case 'focus':
        setTimeLeft(settings.pomodoroTime * 60);
        break;
      case 'short-break':
        setTimeLeft(settings.shortBreak * 60);
        break;
      case 'long-break':
        setTimeLeft(settings.longBreak * 60);
        break;
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);

    // Tocar som de notificação
    if (typeof Audio !== 'undefined') {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    }

    // Atualizar sessão no banco
    if (currentSessionId && startTimeRef.current && user) {
      const session = await db.get<PomodoroSession>(STORES.pomodoroSessions, currentSessionId);
      if (session) {
        const actualDuration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 60000);
        session.completed = true;
        session.actualDuration = actualDuration;
        session.endTime = new Date();
        await db.update(STORES.pomodoroSessions, session);

        // Adicionar XP e atualizar stats
        if (mode === 'focus') {
          addXP(25); // 25 XP por pomodoro completo
          updateStats({
            totalFocusTime: (userStats?.totalFocusTime || 0) + actualDuration
          });
          setCompletedPomodoros(prev => prev + 1);
        }
      }
    }

    // Mostrar notificação
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Controle de Si', {
        body: mode === 'focus' ? 'Pomodoro completo! Hora de descansar.' : 'Pausa terminada! Hora de focar.',
        icon: '/icon-192x192.png'
      });
    }

    // Alternar automaticamente entre foco e pausa
    if (mode === 'focus') {
      const newCompletedCount = completedPomodoros + 1;
      if (newCompletedCount % 4 === 0) {
        setMode('long-break');
      } else {
        setMode('short-break');
      }
    } else {
      setMode('focus');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = user?.settings 
    ? ((1 - timeLeft / (mode === 'focus' 
        ? user.settings.pomodoroTime * 60 
        : mode === 'short-break' 
          ? user.settings.shortBreak * 60 
          : user.settings.longBreak * 60)) * 100)
    : 0;

  const tutorialSteps = [
    {
      title: "Bem-vindo ao Pomodoro!",
      description: "A Técnica Pomodoro divide seu trabalho em blocos de 25 minutos de foco intenso, seguidos de pausas curtas. Isso aumenta a produtividade e mantém sua mente fresca."
    },
    {
      title: "Como Funcionar",
      description: "Clique em PLAY para iniciar um pomodoro de 25 minutos. Quando terminar, você ganhará XP e o timer mudará automaticamente para uma pausa de 5 minutos."
    },
    {
      title: "Pausas Longas",
      description: "A cada 4 pomodoros completados, você ganha uma pausa longa de 15 minutos. Use esse tempo para relaxar completamente!"
    },
    {
      title: "Controles",
      description: "Use PAUSE para pausar o timer, e RESET para reiniciar. Você pode alternar entre os modos Foco, Pausa Curta e Pausa Longa clicando nos botões no topo."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Pomodoro"
          description="Técnica de produtividade com blocos de foco"
          gradient="from-red-400 to-orange-500"
          tutorialSteps={tutorialSteps}
        />

        {/* Main Content */}
        <main>
        {/* Mode Selector */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => !isRunning && setMode('focus')}
            disabled={isRunning}
            className={`px-6 py-3 rounded-xl font-black uppercase transition-all ${
              mode === 'focus'
                ? 'bg-red-500 text-white scale-105 shadow-lg shadow-red-500/50'
                : 'bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white hover:border-red-500/50'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Foco
            </div>
          </button>
          <button
            onClick={() => !isRunning && setMode('short-break')}
            disabled={isRunning}
            className={`px-6 py-3 rounded-xl font-black uppercase transition-all ${
              mode === 'short-break'
                ? 'bg-green-500 text-white scale-105 shadow-lg shadow-green-500/50'
                : 'bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white hover:border-green-500/50'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              Curta
            </div>
          </button>
          <button
            onClick={() => !isRunning && setMode('long-break')}
            disabled={isRunning}
            className={`px-6 py-3 rounded-xl font-black uppercase transition-all ${
              mode === 'long-break'
                ? 'bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/50'
                : 'bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white hover:border-blue-500/50'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              Longa
            </div>
          </button>
        </div>

        {/* Timer Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 mb-8">
          <div className="relative">
            {/* Progress Circle */}
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={
                  mode === 'focus' 
                    ? 'text-red-500' 
                    : mode === 'short-break' 
                      ? 'text-green-500' 
                      : 'text-blue-500'
                }
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>

            {/* Time Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl font-black text-white mb-4">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xl font-bold text-slate-400 uppercase">
                  {mode === 'focus' ? 'Foco Total' : mode === 'short-break' ? 'Pausa Curta' : 'Pausa Longa'}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mt-8">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl font-black text-lg shadow-lg shadow-green-500/50 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 uppercase"
              >
                <Play className="w-6 h-6" />
                Iniciar
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-10 py-4 rounded-xl font-black text-lg shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 uppercase"
              >
                <Pause className="w-6 h-6" />
                Pausar
              </button>
            )}
            <button
              onClick={handleReset}
              className="bg-slate-800 border-2 border-slate-700 hover:border-slate-600 text-white px-10 py-4 rounded-xl font-black text-lg hover:scale-105 transition-all flex items-center gap-3 uppercase"
            >
              <RotateCcw className="w-6 h-6" />
              Resetar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 text-center hover:border-red-500/50 transition-all">
            <p className="text-slate-400 text-sm font-bold uppercase mb-2">Pomodoros Hoje</p>
            <p className="text-5xl font-black text-white">
              {completedPomodoros}
            </p>
          </div>
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 text-center hover:border-green-500/50 transition-all">
            <p className="text-slate-400 text-sm font-bold uppercase mb-2">Tempo Total</p>
            <p className="text-5xl font-black text-white">
              {userStats?.totalFocusTime || 0}<span className="text-2xl text-slate-500">m</span>
            </p>
          </div>
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all">
            <p className="text-slate-400 text-sm font-bold uppercase mb-2">Meta Diária</p>
            <p className="text-5xl font-black text-white">
              {user?.settings.dailyGoal || 120}<span className="text-2xl text-slate-500">m</span>
            </p>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}

// Made with Bob
