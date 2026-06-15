'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { db, generateId } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { Habit, HabitLog, User, UserStats } from '@/lib/db/schema';
import {
  Home,
  Plus,
  Flame,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  TrendingUp,
  Library,
  X,
  Link2,
  ArrowRight,
  Zap
} from 'lucide-react';
import { format, startOfDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HABITS_LIBRARY, HABIT_CATEGORIES, type HabitTemplate } from '@/lib/habits-library';

export default function HabitsPage() {
  const router = useRouter();
  const { user, addXP, updateStats, userStats, setUser, setUserStats } = useAppStore();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayLogs, setTodayLogs] = useState<Map<string, HabitLog>>(new Map());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitTemplate['category'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showStackingView, setShowStackingView] = useState(false);
  const [suggestedNextHabit, setSuggestedNextHabit] = useState<Habit | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const initializeUser = async () => {
    if (user) {
      loadHabits();
      return;
    }

    try {
      await db.init();
      const users = await db.getAll<User>(STORES.users);
      
      if (users.length > 0) {
        setUser(users[0]);
        const stats = await db.getByIndex<UserStats>(STORES.userStats, 'userId', users[0].id);
        if (stats.length > 0) {
          setUserStats(stats[0]);
        }
      } else {
        // Criar usuário padrão se não existir
        const newUser: User = {
          id: generateId(),
          name: 'Usuário',
          createdAt: new Date(),
          settings: {
            darkMode: false,
            notifications: true,
            pomodoroTime: 25,
            shortBreak: 5,
            longBreak: 15,
            dailyGoal: 120
          }
        };
        
        await db.add(STORES.users, newUser);
        setUser(newUser);
        
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
      }
    } catch (error) {
      console.error('Erro ao inicializar usuário:', error);
    }
  };

  const loadHabits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const allHabits = await db.getByIndex<Habit>(STORES.habits, 'userId', user.id);
      const activeHabits = allHabits.filter(h => h.active).sort((a, b) => b.streak - a.streak);
      setHabits(activeHabits);
      
      // Carregar logs de hoje
      const today = startOfDay(new Date());
      const logs = await db.getByIndex<HabitLog>(STORES.habitLogs, 'userId', user.id);
      const todayLogsMap = new Map<string, HabitLog>();
      
      logs.forEach(log => {
        const logDate = startOfDay(new Date(log.date));
        if (logDate.getTime() === today.getTime()) {
          todayLogsMap.set(log.habitId, log);
        }
      });
      
      setTodayLogs(todayLogsMap);
    } catch (error) {
      console.error('Erro ao carregar hábitos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;
    
    const existingLog = todayLogs.get(habit.id);
    
    if (existingLog) {
      // Desmarcar
      await db.delete(STORES.habitLogs, existingLog.id);
      todayLogs.delete(habit.id);
      setTodayLogs(new Map(todayLogs));
      
      // Atualizar streak
      habit.streak = Math.max(0, habit.streak - 1);
      await db.update(STORES.habits, habit);
      setSuggestedNextHabit(null);
    } else {
      // Marcar como completo
      const log: HabitLog = {
        id: generateId(),
        habitId: habit.id,
        userId: user.id,
        completed: true,
        date: new Date()
      };
      
      await db.add(STORES.habitLogs, log);
      todayLogs.set(habit.id, log);
      setTodayLogs(new Map(todayLogs));
      
      // Atualizar streak
      habit.streak += 1;
      habit.lastCompleted = new Date();
      await db.update(STORES.habits, habit);
      
      // Adicionar XP
      addXP(10);
      updateStats({
        habitsCompleted: (userStats?.habitsCompleted || 0) + 1,
        currentStreak: habit.streak
      });
      
      // Sugerir próximo hábito na corrente
      const nextHabit = habits.find(h => h.anchor === habit.name && !todayLogs.has(h.id));
      if (nextHabit) {
        setSuggestedNextHabit(nextHabit);
        setTimeout(() => setSuggestedNextHabit(null), 10000); // Remove sugestão após 10s
      }
    }
    
    loadHabits();
  };

  // Função para construir correntes de hábitos
  const buildHabitChains = () => {
    const chains: Habit[][] = [];
    const processed = new Set<string>();
    
    habits.forEach(habit => {
      if (processed.has(habit.id) || habit.anchor) return;
      
      const chain: Habit[] = [habit];
      processed.add(habit.id);
      
      let current = habit;
      while (true) {
        const next = habits.find(h => h.anchor === current.name && !processed.has(h.id));
        if (!next) break;
        chain.push(next);
        processed.add(next.id);
        current = next;
      }
      
      if (chain.length > 1) {
        chains.push(chain);
      }
    });
    
    return chains;
  };

  const habitChains = buildHabitChains();

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setShowAddModal(true);
  };

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Tem certeza que deseja excluir este hábito?')) return;
    
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      habit.active = false;
      await db.update(STORES.habits, habit);
      loadHabits();
    }
  };

  const createHabitFromTemplate = async (template: HabitTemplate) => {
    if (!user) {
      console.error('Usuário não encontrado');
      alert('Erro: Usuário não encontrado. Por favor, recarregue a página.');
      return;
    }
    
    try {
      const newHabit: Habit = {
        id: generateId(),
        userId: user.id,
        name: template.name,
        description: template.description,
        frequency: template.frequency,
        duration: template.duration,
        time: template.suggestedTime,
        streak: 0,
        createdAt: new Date(),
        active: true
      };
      
      await db.add(STORES.habits, newHabit);
      setShowLibraryModal(false);
      await loadHabits();
      
      // Feedback visual de sucesso
      alert(`Hábito "${template.name}" adicionado com sucesso!`);
    } catch (error) {
      console.error('Erro ao adicionar hábito:', error);
      alert('Erro ao adicionar hábito. Tente novamente.');
    }
  };

  const filteredLibraryHabits = selectedCategory === 'all'
    ? HABITS_LIBRARY
    : HABITS_LIBRARY.filter(h => h.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-white font-bold">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="uppercase">Voltar</span>
            </button>
            <h1 className="text-3xl font-black text-white">
              HÁBITOS
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLibraryModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-black uppercase shadow-lg shadow-purple-500/50 hover:scale-105 transition-all"
              >
                <Library className="w-5 h-5" />
                <span className="hidden sm:inline">Biblioteca</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-black uppercase shadow-lg shadow-green-500/50 hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Total</p>
                <p className="text-4xl font-black text-white">{habits.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Hoje</p>
                <p className="text-4xl font-black text-white">
                  {todayLogs.size}<span className="text-xl text-slate-500">/{habits.length}</span>
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Streak</p>
                <p className="text-4xl font-black text-white">
                  {Math.max(...habits.map(h => h.streak), 0)}<span className="text-xl text-slate-500">d</span>
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                <Flame className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Sugestão de Próximo Hábito */}
        {suggestedNextHabit && (
          <div className="mb-8 animate-bounce">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 border-2 border-yellow-400 rounded-2xl p-6 shadow-2xl shadow-yellow-500/50">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <Zap className="w-12 h-12 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-black text-lg uppercase mb-1">
                    ⚡ PRÓXIMO NA CORRENTE!
                  </p>
                  <p className="text-yellow-100 font-bold">
                    Que tal fazer agora: <span className="text-white">{suggestedNextHabit.name}</span>?
                  </p>
                </div>
                <button
                  onClick={() => toggleHabit(suggestedNextHabit)}
                  className="flex-shrink-0 bg-white text-yellow-600 px-6 py-3 rounded-xl font-black uppercase hover:scale-110 transition-all shadow-lg"
                >
                  Fazer Agora!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Correntes de Hábitos */}
        {habitChains.length > 0 && (
          <div className="mb-8">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Link2 className="w-7 h-7 text-cyan-400" />
                  CORRENTES DE HÁBITOS
                </h2>
                <button
                  onClick={() => setShowStackingView(!showStackingView)}
                  className="text-sm font-bold text-cyan-400 hover:text-cyan-300 uppercase transition-colors"
                >
                  {showStackingView ? 'Ocultar' : 'Ver Todas'}
                </button>
              </div>

              {showStackingView && (
                <div className="space-y-4">
                  {habitChains.map((chain, chainIndex) => (
                    <div key={chainIndex} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {chain.map((habit, index) => {
                          const isCompleted = todayLogs.has(habit.id);
                          return (
                            <div key={habit.id} className="flex items-center gap-3">
                              <div
                                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                  isCompleted
                                    ? 'bg-green-500/20 border-green-500 text-green-400'
                                    : 'bg-slate-700 border-slate-600 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <Circle className="w-4 h-4" />
                                  )}
                                  <span className="font-bold text-sm">{habit.name}</span>
                                </div>
                              </div>
                              {index < chain.length - 1 && (
                                <ArrowRight className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">
                          {chain.filter(h => todayLogs.has(h.id)).length}/{chain.length} completados hoje
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!showStackingView && habitChains.length > 0 && (
                <div className="text-center">
                  <p className="text-slate-400 font-medium">
                    Você tem <span className="text-cyan-400 font-black">{habitChains.length}</span> corrente
                    {habitChains.length > 1 ? 's' : ''} de hábitos ativa{habitChains.length > 1 ? 's' : ''}! 🔗
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
                <Plus className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                NENHUM HÁBITO AINDA
              </h3>
              <p className="text-slate-400 mb-8 font-medium">
                Comece criando seu primeiro hábito e transforme sua vida! 🚀
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-black uppercase shadow-lg shadow-green-500/50 hover:scale-105 transition-all"
              >
                Criar Primeiro Hábito
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map(habit => {
              const isCompleted = todayLogs.has(habit.id);
              
              return (
                <div
                  key={habit.id}
                  className={`bg-slate-900 border-2 rounded-xl p-6 transition-all hover:scale-105 ${
                    isCompleted
                      ? 'border-green-500 shadow-lg shadow-green-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <button
                      onClick={() => toggleHabit(habit)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      ) : (
                        <Circle className="w-10 h-10 text-slate-700 hover:text-green-500 transition-colors" />
                      )}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(habit)}
                        className="text-slate-600 hover:text-blue-500 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white mb-2">
                    {habit.name}
                  </h3>
                  
                  {habit.description && (
                    <p className="text-sm text-slate-400 mb-4 font-medium">
                      {habit.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-slate-300 font-bold">
                        {habit.streak} <span className="text-slate-500">dias</span>
                      </span>
                    </div>
                    <span className="text-slate-500 font-bold uppercase text-xs">
                      {habit.frequency === 'daily' ? 'Diário' : habit.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                    </span>
                  </div>

                  {habit.anchor && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        ⚓ Após: <span className="text-slate-400">{habit.anchor}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b-2 border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <Library className="w-8 h-8 text-purple-400" />
                  BIBLIOTECA DE HÁBITOS
                </h2>
                <button
                  onClick={() => setShowLibraryModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl font-bold uppercase text-sm transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({HABITS_LIBRARY.length})
                </button>
                {Object.entries(HABIT_CATEGORIES).map(([key, cat]) => {
                  const count = HABITS_LIBRARY.filter(h => h.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key as HabitTemplate['category'])}
                      className={`px-4 py-2 rounded-xl font-bold uppercase text-sm transition-all ${
                        selectedCategory === key
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.icon} {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Habits Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLibraryHabits.map(template => (
                  <div
                    key={template.id}
                    className="bg-slate-800 border-2 border-slate-700 hover:border-purple-500 rounded-xl p-4 transition-all hover:scale-105 cursor-pointer"
                    onClick={() => createHabitFromTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{template.icon}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                        template.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        template.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {template.difficulty === 'easy' ? 'Fácil' : template.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-black text-white mb-2">
                      {template.name}
                    </h3>
                    
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mb-3">
                      <span>{template.duration}min</span>
                      <span>{template.frequency === 'daily' ? 'Diário' : 'Semanal'}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.benefits.slice(0, 2).map((benefit, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-bold">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <AddHabitModal
          onClose={() => {
            setShowAddModal(false);
            setEditingHabit(null);
          }}
          onAdd={() => {
            setShowAddModal(false);
            setEditingHabit(null);
            loadHabits();
          }}
          userId={user?.id || ''}
          editingHabit={editingHabit}
        />
      )}
    </div>
  );
}

function AddHabitModal({ onClose, onAdd, userId, editingHabit }: {
  onClose: () => void;
  onAdd: () => void;
  userId: string;
  editingHabit?: Habit | null;
}) {
  const [name, setName] = useState(editingHabit?.name || '');
  const [description, setDescription] = useState(editingHabit?.description || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(editingHabit?.frequency || 'daily');
  const [anchor, setAnchor] = useState(editingHabit?.anchor || '');
  const [duration, setDuration] = useState(editingHabit?.duration || 5);
  const [existingHabits, setExistingHabits] = useState<Habit[]>([]);
  const [useCustomAnchor, setUseCustomAnchor] = useState(!!editingHabit?.anchor && !existingHabits.some(h => h.name === editingHabit.anchor));

  useEffect(() => {
    loadExistingHabits();
  }, [userId]);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description || '');
      setFrequency(editingHabit.frequency);
      setAnchor(editingHabit.anchor || '');
      setDuration(editingHabit.duration || 5);
    }
  }, [editingHabit]);

  const loadExistingHabits = async () => {
    try {
      const allHabits = await db.getByIndex<Habit>(STORES.habits, 'userId', userId);
      const activeHabits = allHabits.filter(h => h.active);
      setExistingHabits(activeHabits);
    } catch (error) {
      console.error('Erro ao carregar hábitos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    if (editingHabit) {
      // Atualizar hábito existente
      const updatedHabit: Habit = {
        ...editingHabit,
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
        anchor: anchor.trim() || undefined,
        duration
      };
      await db.update(STORES.habits, updatedHabit);
    } else {
      // Criar novo hábito
      const habit: Habit = {
        id: generateId(),
        userId,
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
        anchor: anchor.trim() || undefined,
        duration,
        streak: 0,
        createdAt: new Date(),
        active: true
      };
      await db.add(STORES.habits, habit);
    }

    onAdd();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-black text-white mb-6">
          {editingHabit ? 'EDITAR HÁBITO' : 'NOVO HÁBITO'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Nome do Hábito *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Meditar, Ler, Exercitar"
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre o hábito..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors font-medium resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Frequência
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-green-500 focus:outline-none transition-colors font-bold uppercase"
            >
              <option value="daily">📅 Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              🔗 Habit Stacking - Encadear após:
            </label>
            
            {existingHabits.length > 0 ? (
              <>
                <select
                  value={useCustomAnchor ? 'custom' : anchor}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setUseCustomAnchor(true);
                      setAnchor('');
                    } else if (e.target.value === '') {
                      setUseCustomAnchor(false);
                      setAnchor('');
                    } else {
                      setUseCustomAnchor(false);
                      setAnchor(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors font-bold"
                >
                  <option value="">🚫 Nenhum (hábito independente)</option>
                  {existingHabits.map(h => (
                    <option key={h.id} value={h.name}>
                      ⚓ Após: {h.name}
                    </option>
                  ))}
                  <option value="custom">Outra ação (texto livre)</option>
                </select>
                
                {useCustomAnchor && (
                  <input
                    type="text"
                    value={anchor}
                    onChange={(e) => setAnchor(e.target.value)}
                    placeholder="Ex: Escovar os dentes, Acordar, Tomar café"
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-cyan-500 rounded-xl text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors font-medium mt-3"
                    autoFocus
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                value={anchor}
                onChange={(e) => setAnchor(e.target.value)}
                placeholder="Ex: Escovar os dentes, Acordar, Tomar café"
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors font-medium"
              />
            )}
            
            <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-xs text-cyan-300 font-bold flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                <span>Encadeie hábitos para criar rotinas automáticas! Ex: "Após meditar → Fazer café da manhã"</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Duração (minutos)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min="1"
              max="120"
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-green-500 focus:outline-none transition-colors font-bold"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl hover:border-slate-600 transition-all font-black uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-black uppercase shadow-lg shadow-green-500/50 hover:scale-105 transition-all"
            >
              {editingHabit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Made with Bob
