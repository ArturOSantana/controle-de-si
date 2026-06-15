'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Clock, Calendar, CheckCircle2, Circle, Edit, Trash2, X } from 'lucide-react';
import { db } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { TimeBlock, User, Task, Habit } from '@/lib/db/schema';

// Cores por categoria
const CATEGORY_COLORS = {
  work: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
  study: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
  exercise: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
  personal: { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-400' },
  social: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' },
  rest: { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-400' },
  meal: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
  commute: { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400' },
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function TimeBlockPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    if (user) {
      loadTimeBlocks();
    }
  }, [user, selectedDate]);

  const initializePage = async () => {
    try {
      await db.init();
      const users = await db.getAll<User>(STORES.users);
      
      if (users.length === 0) {
        router.push('/');
        return;
      }

      const currentUser = users[0];
      setUser(currentUser);
      
      // Carregar tarefas e hábitos para vincular
      const allTasks = await db.getAll<Task>(STORES.tasks);
      const userTasks = allTasks.filter(t => t.userId === currentUser.id && !t.completed);
      setTasks(userTasks);

      const allHabits = await db.getAll<Habit>(STORES.habits);
      const userHabits = allHabits.filter(h => h.userId === currentUser.id && h.active);
      setHabits(userHabits);
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeBlocks = async () => {
    if (!user) return;

    try {
      const allBlocks = await db.getAll<TimeBlock>(STORES.timeBlocks);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const filtered = allBlocks.filter(block => {
        const blockDateStr = new Date(block.date).toISOString().split('T')[0];
        return block.userId === user.id && blockDateStr === dateStr;
      });

      // Ordenar por horário de início
      filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setTimeBlocks(filtered);
    } catch (error) {
      console.error('Erro ao carregar blocos:', error);
    }
  };

  const toggleBlockCompletion = async (block: TimeBlock) => {
    try {
      const updated = { ...block, completed: !block.completed };
      await db.update(STORES.timeBlocks, updated);
      loadTimeBlocks();
    } catch (error) {
      console.error('Erro ao atualizar bloco:', error);
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm('Deseja deletar este bloco de tempo?')) return;
    
    try {
      await db.delete(STORES.timeBlocks, blockId);
      loadTimeBlocks();
    } catch (error) {
      console.error('Erro ao deletar bloco:', error);
    }
  };

  const openEditModal = (block: TimeBlock) => {
    setEditingBlock(block);
    setShowAddModal(true);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const calculateStats = () => {
    const total = timeBlocks.length;
    const completed = timeBlocks.filter(b => b.completed).length;
    const totalMinutes = timeBlocks.reduce((sum, block) => {
      const [startH, startM] = block.startTime.split(':').map(Number);
      const [endH, endM] = block.endTime.split(':').map(Number);
      const duration = (endH * 60 + endM) - (startH * 60 + startM);
      return sum + duration;
    }, 0);
    const completedMinutes = timeBlocks.filter(b => b.completed).reduce((sum, block) => {
      const [startH, startM] = block.startTime.split(':').map(Number);
      const [endH, endM] = block.endTime.split(':').map(Number);
      const duration = (endH * 60 + endM) - (startH * 60 + startM);
      return sum + duration;
    }, 0);

    return { total, completed, totalMinutes, completedMinutes };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl font-bold">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-bold uppercase text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center gap-3">
              <Clock className="w-10 h-10 text-cyan-400" />
              TIME BLOCKING
            </h1>
            <p className="text-slate-400 font-medium">
              Planeje seu dia visualmente com blocos de tempo
            </p>
          </div>

          <button
            onClick={() => {
              setEditingBlock(null);
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-black uppercase shadow-lg shadow-cyan-500/50 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Bloco
          </button>
        </div>
      </header>

      {/* Date Navigation */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => changeDate(-1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
          >
            ← Anterior
          </button>

          <div className="flex-1 text-center">
            <div className="text-2xl font-black text-white mb-1 capitalize">
              {formatDate(selectedDate)}
            </div>
            {!isToday() && (
              <button
                onClick={goToToday}
                className="text-sm text-cyan-400 hover:text-cyan-300 font-bold uppercase"
              >
                Ir para Hoje
              </button>
            )}
          </div>

          <button
            onClick={() => changeDate(1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
          >
            Próximo →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-sm font-bold uppercase mb-1">Total de Blocos</div>
          <div className="text-3xl font-black text-white">{stats.total}</div>
        </div>
        <div className="bg-slate-900 border-2 border-green-500/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm font-bold uppercase mb-1">Completados</div>
          <div className="text-3xl font-black text-green-400">{stats.completed}</div>
        </div>
        <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-sm font-bold uppercase mb-1">Tempo Planejado</div>
          <div className="text-3xl font-black text-white">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</div>
        </div>
        <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm font-bold uppercase mb-1">Tempo Realizado</div>
          <div className="text-3xl font-black text-cyan-400">{Math.floor(stats.completedMinutes / 60)}h {stats.completedMinutes % 60}m</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-cyan-400" />
          LINHA DO TEMPO
        </h2>

        {timeBlocks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-lg">
              Nenhum bloco de tempo para este dia
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Clique em "Novo Bloco" para começar a planejar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeBlocks.map((block) => {
              const colors = CATEGORY_COLORS[block.category];
              return (
                <div
                  key={block.id}
                  className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4 transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      onClick={() => toggleBlockCompletion(block)}
                      className="flex-shrink-0 mt-1"
                    >
                      {block.completed ? (
                        <CheckCircle2 className={`w-6 h-6 ${colors.text}`} />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-xl font-black ${colors.text} ${block.completed ? 'line-through opacity-60' : ''}`}>
                          {block.title}
                        </h3>
                      </div>

                      {block.description && (
                        <p className="text-slate-400 text-sm mb-2 font-medium">
                          {block.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className={`${colors.text} font-bold flex items-center gap-1`}>
                          <Clock className="w-4 h-4" />
                          {block.startTime} - {block.endTime}
                        </span>
                        <span className="text-slate-500 font-bold uppercase text-xs">
                          {block.category}
                        </span>
                        {block.recurring && (
                          <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold uppercase">
                            {block.recurring}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(block)}
                        className="text-slate-600 hover:text-blue-500 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddBlockModal
          onClose={() => {
            setShowAddModal(false);
            setEditingBlock(null);
          }}
          onAdd={() => {
            setShowAddModal(false);
            setEditingBlock(null);
            loadTimeBlocks();
          }}
          userId={user.id}
          selectedDate={selectedDate}
          editingBlock={editingBlock}
          tasks={tasks}
          habits={habits}
        />
      )}
    </div>
  );
}

function AddBlockModal({ onClose, onAdd, userId, selectedDate, editingBlock, tasks, habits }: {
  onClose: () => void;
  onAdd: () => void;
  userId: string;
  selectedDate: Date;
  editingBlock?: TimeBlock | null;
  tasks: Task[];
  habits: Habit[];
}) {
  const [title, setTitle] = useState(editingBlock?.title || '');
  const [description, setDescription] = useState(editingBlock?.description || '');
  const [category, setCategory] = useState<TimeBlock['category']>(editingBlock?.category || 'work');
  const [startTime, setStartTime] = useState(editingBlock?.startTime || '09:00');
  const [endTime, setEndTime] = useState(editingBlock?.endTime || '10:00');
  const [recurring, setRecurring] = useState<TimeBlock['recurring']>(editingBlock?.recurring);
  const [taskId, setTaskId] = useState(editingBlock?.taskId || '');
  const [habitId, setHabitId] = useState(editingBlock?.habitId || '');

  useEffect(() => {
    if (editingBlock) {
      setTitle(editingBlock.title);
      setDescription(editingBlock.description || '');
      setCategory(editingBlock.category);
      setStartTime(editingBlock.startTime);
      setEndTime(editingBlock.endTime);
      setRecurring(editingBlock.recurring);
      setTaskId(editingBlock.taskId || '');
      setHabitId(editingBlock.habitId || '');
    }
  }, [editingBlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    try {
      if (editingBlock) {
        const updated: TimeBlock = {
          ...editingBlock,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          startTime,
          endTime,
          recurring,
          taskId: taskId || undefined,
          habitId: habitId || undefined,
        };
        await db.update(STORES.timeBlocks, updated);
      } else {
        const block: TimeBlock = {
          id: generateId(),
          userId,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          date: selectedDate,
          startTime,
          endTime,
          completed: false,
          recurring,
          taskId: taskId || undefined,
          habitId: habitId || undefined,
          createdAt: new Date(),
        };
        await db.add(STORES.timeBlocks, block);
      }

      onAdd();
    } catch (error) {
      console.error('Erro ao salvar bloco:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-white">
            {editingBlock ? 'EDITAR BLOCO' : 'NOVO BLOCO'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião de equipe, Estudar React, Treino"
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors font-medium"
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
              placeholder="Detalhes sobre a atividade..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
                Início *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
                Fim *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Categoria *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TimeBlock['category'])}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors font-bold uppercase"
            >
              <option value="work">Trabalho</option>
              <option value="study">Estudo</option>
              <option value="exercise">Exercício</option>
              <option value="personal">Pessoal</option>
              <option value="social">Social</option>
              <option value="rest">Descanso</option>
              <option value="meal">Refeição</option>
              <option value="commute">Deslocamento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Recorrência (opcional)
            </label>
            <select
              value={recurring || ''}
              onChange={(e) => setRecurring(e.target.value as TimeBlock['recurring'] || undefined)}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors font-bold uppercase"
            >
              <option value="">Não repetir</option>
              <option value="daily">Diariamente</option>
              <option value="weekdays">Dias úteis</option>
              <option value="weekends">Fins de semana</option>
              <option value="weekly">Semanalmente</option>
            </select>
          </div>

          {tasks.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
                Vincular Tarefa (opcional)
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors font-medium"
              >
                <option value="">Nenhuma tarefa</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>
          )}

          {habits.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
                Vincular Hábito (opcional)
              </label>
              <select
                value={habitId}
                onChange={(e) => setHabitId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors font-medium"
              >
                <option value="">Nenhum hábito</option>
                {habits.map(habit => (
                  <option key={habit.id} value={habit.id}>{habit.name}</option>
                ))}
              </select>
            </div>
          )}

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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-black uppercase shadow-lg shadow-cyan-500/50 hover:scale-105 transition-all"
            >
              {editingBlock ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Made with Bob
