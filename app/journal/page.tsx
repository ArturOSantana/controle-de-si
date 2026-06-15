'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { db, generateId } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { PomodoroSession, StudySession } from '@/lib/db/schema';
import {
  Home,
  Plus,
  BookOpen,
  Clock,
  Calendar,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Save,
  Lightbulb,
  Target,
  TrendingUp,
  Bell
} from 'lucide-react';
import { format, startOfDay, subDays, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JournalEntry {
  id: string;
  userId: string;
  date: Date;
  type: 'pomodoro' | 'study' | 'reflection';
  title: string;
  content: string;
  tags: string[];
  sessionId?: string; // ID da sessão de Pomodoro ou Study
  rating?: number; // 1-5
  learned?: string[]; // O que aprendi
  questions?: string[]; // Dúvidas que surgiram
  nextSteps?: string[]; // Próximos passos
}

export default function JournalPage() {
  const router = useRouter();
  const { user } = useAppStore();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pomodoro' | 'study' | 'reflection'>('all');
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<{pomodoro: PomodoroSession[], study: StudySession[]}>({
    pomodoro: [],
    study: []
  });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    loadEntries();
    loadRecentSessions();
  }, [user]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, filterType]);

  const loadEntries = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Por enquanto vamos simular com dados vazios
      // Em produção, você criaria uma nova store no IndexedDB
      const mockEntries: JournalEntry[] = [];
      setEntries(mockEntries);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSessions = async () => {
    if (!user) return;
    
    try {
      const allPomodoro = await db.getByIndex<PomodoroSession>(STORES.pomodoroSessions, 'userId', user.id);
      const allStudy = await db.getByIndex<StudySession>(STORES.studySessions, 'userId', user.id);
      
      // Últimas 5 sessões de cada tipo
      const recentPomodoro = allPomodoro
        .filter(s => s.completed && !s.interrupted)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5);
      
      const recentStudy = allStudy
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      setRecentSessions({ pomodoro: recentPomodoro, study: recentStudy });
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  // Carregar configurações de lembrete
  useEffect(() => {
    if (user?.settings) {
      setReminderTime(user.settings.journalReminderTime || '20:00');
      setReminderEnabled(user.settings.journalReminderEnabled || false);
      
      if (user.settings.journalReminderEnabled && user.settings.journalReminderTime) {
        scheduleJournalReminder(user.settings.journalReminderTime);
      }
    }
  }, [user]);

  // Função para agendar lembrete do diário
  const scheduleJournalReminder = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    
    // Se o horário já passou hoje, agendar para amanhã
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilReminder = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Hora do Diário!', {
          body: 'Que tal escrever sobre o que você aprendeu hoje?',
          icon: '/icon-192x192.png',
          tag: 'journal-reminder'
        });
      }
      
      // Reagendar para o próximo dia
      scheduleJournalReminder(time);
    }, timeUntilReminder);
  };

  // Função para salvar configurações de lembrete
  const saveReminderSettings = async () => {
    if (!user) return;
    
    try {
      const updatedUser = {
        ...user,
        settings: {
          ...user.settings,
          journalReminderTime: reminderTime,
          journalReminderEnabled: reminderEnabled
        }
      };
      
      await db.update(STORES.users, updatedUser);
      
      // Solicitar permissão de notificação se ainda não foi concedida
      if (reminderEnabled && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      // Agendar lembrete se habilitado
      if (reminderEnabled) {
        scheduleJournalReminder(reminderTime);
      }
      
      setShowReminderModal(false);
      alert('Configurações de lembrete salvas!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    }
  };

  const filterEntries = () => {
    let filtered = entries;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.type === filterType);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(term) ||
        e.content.toLowerCase().includes(term) ||
        e.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredEntries(filtered);
  };

  const addEntry = async (entry: Omit<JournalEntry, 'id' | 'userId' | 'date'>) => {
    if (!user) return;
    
    const newEntry: JournalEntry = {
      ...entry,
      id: generateId(),
      userId: user.id,
      date: new Date()
    };
    
    // Aqui você salvaria no IndexedDB
    setEntries([newEntry, ...entries]);
    setShowAddModal(false);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta entrada?')) return;
    setEntries(entries.filter(e => e.id !== id));
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
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
              DIÁRIO DE APRENDIZADO
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReminderModal(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all"
                title="Configurar lembretes"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-black uppercase shadow-lg shadow-purple-500/50 hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nova Entrada</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Total</p>
                <p className="text-4xl font-black text-white">{entries.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Pomodoro</p>
                <p className="text-4xl font-black text-white">
                  {entries.filter(e => e.type === 'pomodoro').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Estudo</p>
                <p className="text-4xl font-black text-white">
                  {entries.filter(e => e.type === 'study').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50">
                <Target className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Reflexões</p>
                <p className="text-4xl font-black text-white">
                  {entries.filter(e => e.type === 'reflection').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, conteúdo ou tags..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors font-medium"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-3 rounded-xl font-bold uppercase text-sm transition-all ${
                  filterType === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('pomodoro')}
                className={`px-4 py-3 rounded-xl font-bold uppercase text-sm transition-all ${
                  filterType === 'pomodoro'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Pomodoro
              </button>
              <button
                onClick={() => setFilterType('study')}
                className={`px-4 py-3 rounded-xl font-bold uppercase text-sm transition-all ${
                  filterType === 'study'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Estudo
              </button>
              <button
                onClick={() => setFilterType('reflection')}
                className={`px-4 py-3 rounded-xl font-bold uppercase text-sm transition-all ${
                  filterType === 'reflection'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Reflexão
              </button>
            </div>
          </div>
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                {searchTerm || filterType !== 'all' ? 'NENHUMA ENTRADA ENCONTRADA' : 'COMECE SEU DIÁRIO'}
              </h3>
              <p className="text-slate-400 mb-8 font-medium">
                {searchTerm || filterType !== 'all' 
                  ? 'Tente ajustar os filtros ou buscar por outros termos.'
                  : 'Documente seus aprendizados após cada sessão de estudo!'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-black uppercase shadow-lg shadow-purple-500/50 hover:scale-105 transition-all"
                >
                  Criar Primeira Entrada
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map(entry => (
              <div
                key={entry.id}
                className="bg-slate-900 border-2 border-slate-800 hover:border-purple-500/50 rounded-xl p-6 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                        entry.type === 'pomodoro' ? 'bg-blue-500/20 text-blue-400' :
                        entry.type === 'study' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {entry.type === 'pomodoro' ? 'Pomodoro' :
                         entry.type === 'study' ? 'Estudo' :
                         'Reflexão'}
                      </span>
                      <span className="text-slate-500 text-sm font-bold">
                        {getDateLabel(new Date(entry.date))}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">
                      {entry.title}
                    </h3>
                    <p className="text-slate-400 font-medium mb-4">
                      {entry.content}
                    </p>
                    
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {entry.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {entry.learned && entry.learned.length > 0 && (
                      <div className="mb-3">
                        <p className="text-green-400 text-sm font-bold uppercase mb-2">Aprendi:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {entry.learned.map((item, i) => (
                            <li key={i} className="text-slate-300 text-sm font-medium">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {entry.questions && entry.questions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-yellow-400 text-sm font-bold uppercase mb-2">❓ Dúvidas:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {entry.questions.map((item, i) => (
                            <li key={i} className="text-slate-300 text-sm font-medium">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {entry.nextSteps && entry.nextSteps.length > 0 && (
                      <div>
                        <p className="text-blue-400 text-sm font-bold uppercase mb-2">Próximos Passos:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {entry.nextSteps.map((item, i) => (
                            <li key={i} className="text-slate-300 text-sm font-medium">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-slate-600 hover:text-red-500 transition-colors ml-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {entry.rating && (
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                    <span className="text-slate-500 text-sm font-bold uppercase">Avaliação:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={star <= entry.rating! ? 'text-yellow-400' : 'text-slate-700'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Reminder Settings Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Bell className="w-7 h-7 text-purple-400" />
                LEMBRETES DO DIÁRIO
              </h2>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-slate-700 bg-slate-800 checked:bg-purple-500 checked:border-purple-500 transition-colors"
                  />
                  <span className="text-white font-bold">Ativar lembretes diários</span>
                </label>
              </div>

              {reminderEnabled && (
                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
                    Horário do Lembrete
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors font-bold"
                  />
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Você receberá uma notificação todos os dias neste horário
                  </p>
                </div>
              )}

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <p className="text-sm text-purple-300 font-medium">
                  Dica: Escrever no diário ajuda a consolidar o aprendizado e identificar padrões de crescimento!
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl hover:border-slate-600 transition-all font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveReminderSettings}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-black uppercase shadow-lg shadow-purple-500/50 hover:scale-105 transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <AddEntryModal
          onClose={() => setShowAddModal(false)}
          onAdd={addEntry}
          recentSessions={recentSessions}
        />
      )}
    </div>
  );
}

function AddEntryModal({ onClose, onAdd, recentSessions }: {
  onClose: () => void;
  onAdd: (entry: Omit<JournalEntry, 'id' | 'userId' | 'date'>) => void;
  recentSessions: {pomodoro: PomodoroSession[], study: StudySession[]};
}) {
  const [type, setType] = useState<'pomodoro' | 'study' | 'reflection'>('reflection');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [rating, setRating] = useState(3);
  const [learned, setLearned] = useState('');
  const [questions, setQuestions] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) return;

    onAdd({
      type,
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      rating,
      learned: learned.split('\n').map(l => l.trim()).filter(Boolean),
      questions: questions.split('\n').map(q => q.trim()).filter(Boolean),
      nextSteps: nextSteps.split('\n').map(n => n.trim()).filter(Boolean)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full p-8 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-white">
            ➕ NOVA ENTRADA
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
              Tipo de Entrada
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setType('pomodoro')}
                className={`p-4 rounded-xl font-bold uppercase text-sm transition-all ${
                  type === 'pomodoro'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Pomodoro
              </button>
              <button
                type="button"
                onClick={() => setType('study')}
                className={`p-4 rounded-xl font-bold uppercase text-sm transition-all ${
                  type === 'study'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Estudo
              </button>
              <button
                type="button"
                onClick={() => setType('reflection')}
                className={`p-4 rounded-xl font-bold uppercase text-sm transition-all ${
                  type === 'reflection'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Reflexão
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aprendi sobre React Hooks"
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Conteúdo *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o que você aprendeu, suas reflexões..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors font-medium resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              O que aprendi (um por linha)
            </label>
            <textarea
              value={learned}
              onChange={(e) => setLearned(e.target.value)}
              placeholder="useState gerencia estado local&#10;useEffect executa efeitos colaterais&#10;Custom hooks reutilizam lógica"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors font-medium resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              ❓ Dúvidas que surgiram (uma por linha)
            </label>
            <textarea
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="Como otimizar re-renders?&#10;Quando usar useCallback?"
              rows={2}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none transition-colors font-medium resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Próximos passos (um por linha)
            </label>
            <textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Praticar com projeto real&#10;Ler documentação oficial&#10;Fazer exercícios"
              rows={2}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors font-medium resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="react, hooks, frontend"
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Avaliação da Sessão
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  {star <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-black uppercase shadow-lg shadow-purple-500/50 hover:scale-105 transition-all"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Made with Bob