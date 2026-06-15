'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { db, generateId } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { Task } from '@/lib/db/schema';
import { 
  Home, 
  Plus, 
  Inbox,
  Calendar,
  Clock,
  Archive,
  CheckCircle2,
  Circle,
  Trash2,
  AlertCircle,
  Star
} from 'lucide-react';

type TaskCategory = 'inbox' | 'today' | 'scheduled' | 'someday' | 'delegated' | 'archived';

export default function TasksPage() {
  const router = useRouter();
  const { user, addXP, updateStats, userStats } = useAppStore();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('inbox');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [user, selectedCategory]);

  const loadTasks = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const allTasks = await db.getByIndex<Task>(STORES.tasks, 'userId', user.id);
      const filteredTasks = allTasks
        .filter(t => t.category === selectedCategory)
        .sort((a, b) => {
          // Ordenar por prioridade e data
          if (a.priority !== b.priority) {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : undefined;
    
    await db.update(STORES.tasks, task);
    
    if (task.completed) {
      addXP(15);
      updateStats({
        tasksCompleted: (userStats?.tasksCompleted || 0) + 1
      });
    }
    
    loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    await db.delete(STORES.tasks, taskId);
    loadTasks();
  };

  const moveTask = async (task: Task, newCategory: TaskCategory) => {
    task.category = newCategory;
    await db.update(STORES.tasks, task);
    loadTasks();
  };

  const categories = [
    { id: 'inbox' as TaskCategory, name: 'Caixa de Entrada', icon: Inbox, color: 'text-gray-600' },
    { id: 'today' as TaskCategory, name: 'Hoje', icon: Star, color: 'text-yellow-600' },
    { id: 'scheduled' as TaskCategory, name: 'Agendadas', icon: Calendar, color: 'text-blue-600' },
    { id: 'someday' as TaskCategory, name: 'Algum Dia', icon: Clock, color: 'text-purple-600' },
    { id: 'delegated' as TaskCategory, name: 'Delegadas', icon: AlertCircle, color: 'text-orange-600' },
    { id: 'archived' as TaskCategory, name: 'Arquivadas', icon: Archive, color: 'text-gray-400' }
  ];

  const stats = {
    inbox: tasks.filter(t => t.category === 'inbox' && !t.completed).length,
    today: tasks.filter(t => t.category === 'today' && !t.completed).length,
    total: tasks.filter(t => !t.completed && t.category !== 'archived').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
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
              GTD - TAREFAS
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-black uppercase shadow-lg shadow-blue-500/50 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nova</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                const count = tasks.filter(t => t.category === cat.id && !t.completed).length;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold ${
                      selectedCategory === cat.id
                        ? 'bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/50'
                        : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="uppercase text-sm">{cat.name}</span>
                    </div>
                    {count > 0 && (
                      <span className="bg-slate-950 text-white px-2.5 py-1 rounded-lg text-xs font-black">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-black text-white mb-4 uppercase text-sm">Resumo</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-xs">📥 Inbox</span>
                  <span className="font-black text-white text-lg">{stats.inbox}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-xs">Hoje</span>
                  <span className="font-black text-white text-lg">{stats.today}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-xs">Total</span>
                  <span className="font-black text-blue-400 text-xl">{stats.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="lg:col-span-3">
            {tasks.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/50">
                    <Plus className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">
                    NENHUMA TAREFA AQUI
                  </h3>
                  <p className="text-slate-400 mb-8 font-medium">
                    Capture suas ideias e organize sua vida! 🚀
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-black uppercase shadow-lg shadow-blue-500/50 hover:scale-105 transition-all"
                  >
                    Adicionar Tarefa
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task)}
                    onDelete={() => deleteTask(task.id)}
                    onMove={(category) => moveTask(task, category)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setShowAddModal(false);
            loadTasks();
          }}
          userId={user?.id || ''}
          initialCategory={selectedCategory}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, onMove }: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onMove: (category: TaskCategory) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const priorityColors = {
    high: 'border-l-4 border-red-500',
    medium: 'border-l-4 border-yellow-500',
    low: 'border-l-4 border-green-500'
  };

  return (
    <div className={`bg-slate-900 border-2 border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all ${priorityColors[task.priority]}`}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="flex-shrink-0 mt-1 transition-transform hover:scale-110">
          {task.completed ? (
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          ) : (
            <Circle className="w-7 h-7 text-slate-700 hover:text-blue-500 transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`font-black text-lg ${task.completed ? 'line-through text-slate-600' : 'text-white'}`}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className="text-sm text-slate-400 mt-2 font-medium">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-lg font-black uppercase ${
              task.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
              'bg-green-500/20 text-green-400 border border-green-500/50'
            }`}>
              {task.priority === 'high' ? '🔴 Alta' : task.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
            </span>

            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {task.tags.map(tag => (
                  <span key={tag} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-lg font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onDelete}
          className="flex-shrink-0 text-slate-600 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function AddTaskModal({ onClose, onAdd, userId, initialCategory }: {
  onClose: () => void;
  onAdd: () => void;
  userId: string;
  initialCategory: TaskCategory;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState<TaskCategory>(initialCategory);
  const [tags, setTags] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const task: Task = {
      id: generateId(),
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      completed: false,
      createdAt: new Date(),
      tags: tags.trim() ? tags.split(',').map(t => t.trim()) : undefined
    };

    await db.add(STORES.tasks, task);
    onAdd();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-black text-white mb-6">
          ➕ NOVA TAREFA
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors font-medium"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors font-bold"
              >
                <option value="low">🟢 Baixa</option>
                <option value="medium">🟡 Média</option>
                <option value="high">🔴 Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors font-bold"
              >
                <option value="inbox">Inbox</option>
                <option value="today">Hoje</option>
                <option value="scheduled">Agendada</option>
                <option value="someday">🕐 Algum Dia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="trabalho, urgente, pessoal"
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors font-medium"
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-black uppercase shadow-lg shadow-blue-500/50 hover:scale-105 transition-all"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Made with Bob
