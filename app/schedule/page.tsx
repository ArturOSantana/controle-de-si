'use client';

import { useState, useEffect } from 'react';
import { db, generateId } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { User, StudySubject, StudyTopic, StudySchedule, StudyGoal } from '@/lib/db/schema';
import { Calendar, Clock, Plus, BookOpen, Target, TrendingUp, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SchedulePage() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modais
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  // Estados para formulários
  const [selectedSubject, setSelectedSubject] = useState<StudySubject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<StudySchedule | null>(null);
  
  // Visualização
  const [view, setView] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'schedule' | 'subjects' | 'topics' | 'goals'>('schedule');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const users = await db.getAll<User>(STORES.users);
      if (users.length > 0) {
        const currentUser = users[0];
        setUser(currentUser);
        
        const [subjectsData, topicsData, schedulesData, goalsData] = await Promise.all([
          db.getByIndex<StudySubject>(STORES.studySubjects, 'userId', currentUser.id),
          db.getByIndex<StudyTopic>(STORES.studyTopics, 'userId', currentUser.id),
          db.getByIndex<StudySchedule>(STORES.studySchedules, 'userId', currentUser.id),
          db.getByIndex<StudyGoal>(STORES.studyGoals, 'userId', currentUser.id),
        ]);
        
        setSubjects(subjectsData.filter(s => s.active));
        setTopics(topicsData);
        setSchedules(schedulesData);
        setGoals(goalsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async (data: Partial<StudySubject>) => {
    if (!user) return;
    
    const newSubject: StudySubject = {
      id: generateId(),
      userId: user.id,
      name: data.name || '',
      description: data.description,
      color: data.color || '#8B5CF6',
      priority: data.priority || 'medium',
      active: true,
      createdAt: new Date(),
      ...data,
    };
    
    await db.add(STORES.studySubjects, newSubject);
    await loadData();
    setShowSubjectModal(false);
  };

  const addTopic = async (data: Partial<StudyTopic>) => {
    if (!user || !data.subjectId) return;
    
    const newTopic: StudyTopic = {
      id: generateId(),
      userId: user.id,
      subjectId: data.subjectId,
      name: data.name || '',
      description: data.description,
      estimatedHours: data.estimatedHours,
      hoursSpent: 0,
      status: 'not-started',
      difficulty: data.difficulty || 'medium',
      priority: data.priority || 3,
      createdAt: new Date(),
      ...data,
    };
    
    await db.add(STORES.studyTopics, newTopic);
    await loadData();
    setShowTopicModal(false);
  };

  const addSchedule = async (data: Partial<StudySchedule>) => {
    if (!user || !data.subjectId) return;
    
    const start = data.startTime || '09:00';
    const end = data.endTime || '10:00';
    const duration = calculateDuration(start, end);
    
    const newSchedule: StudySchedule = {
      id: generateId(),
      userId: user.id,
      subjectId: data.subjectId,
      topicId: data.topicId,
      title: data.title || '',
      description: data.description,
      date: data.date || new Date(),
      startTime: start,
      endTime: end,
      duration,
      completed: false,
      recurring: data.recurring,
      recurringDays: data.recurringDays,
      createdAt: new Date(),
      ...data,
    };
    
    await db.add(STORES.studySchedules, newSchedule);
    await loadData();
    setShowScheduleModal(false);
  };

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  const toggleScheduleComplete = async (schedule: StudySchedule) => {
    const updated = { ...schedule, completed: !schedule.completed };
    await db.update(STORES.studySchedules, updated);
    await loadData();
  };

  const deleteSchedule = async (id: string) => {
    if (confirm('Deseja remover este agendamento?')) {
      await db.delete(STORES.studySchedules, id);
      await loadData();
    }
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(s => {
      const scheduleDate = new Date(s.date);
      return scheduleDate.toDateString() === date.toDateString();
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getTotalHoursThisWeek = () => {
    const weekDays = getWeekDays();
    let total = 0;
    
    weekDays.forEach(day => {
      const daySchedules = getSchedulesForDate(day);
      daySchedules.forEach(s => {
        if (s.completed) total += s.actualDuration || s.duration;
      });
    });
    
    return (total / 60).toFixed(1);
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Carregando cronograma...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              CRONOGRAMA DE ESTUDOS
            </h1>
            <p className="text-slate-400">Organize seus estudos e alcance suas metas</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSubjectModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Matéria
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Agendar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Matérias Ativas</span>
            </div>
            <p className="text-3xl font-black text-white">{subjects.length}</p>
          </div>
          
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-pink-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Tópicos</span>
            </div>
            <p className="text-3xl font-black text-white">{topics.length}</p>
          </div>
          
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Horas Esta Semana</span>
            </div>
            <p className="text-3xl font-black text-white">{getTotalHoursThisWeek()}h</p>
          </div>
          
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Agendamentos</span>
            </div>
            <p className="text-3xl font-black text-white">{schedules.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'schedule', label: 'Cronograma', icon: Calendar },
            { id: 'subjects', label: 'Matérias', icon: BookOpen },
            { id: 'topics', label: 'Tópicos', icon: Target },
            { id: 'goals', label: 'Metas', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'schedule' && (
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() - 7);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h3 className="text-xl font-black">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() + 7);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {getWeekDays().map((day, index) => {
                const daySchedules = getSchedulesForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`bg-slate-800 rounded-xl p-4 ${
                      isToday ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <div className="text-center mb-3">
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </p>
                      <p className={`text-2xl font-black ${isToday ? 'text-purple-400' : 'text-white'}`}>
                        {day.getDate()}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {daySchedules.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">Sem agendamentos</p>
                      ) : (
                        daySchedules.map(schedule => {
                          const subject = getSubjectById(schedule.subjectId);
                          return (
                            <div
                              key={schedule.id}
                              className={`p-3 rounded-lg border-2 ${
                                schedule.completed
                                  ? 'bg-green-900/20 border-green-700'
                                  : 'bg-slate-900 border-slate-700'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: subject?.color }}
                                />
                                <button
                                  onClick={() => toggleScheduleComplete(schedule)}
                                  className={`p-1 rounded ${
                                    schedule.completed
                                      ? 'bg-green-600 text-white'
                                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs font-bold text-white mb-1">{schedule.title}</p>
                              <p className="text-xs text-slate-400">
                                {schedule.startTime} - {schedule.endTime}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">{subject?.name}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(subject => {
              const subjectTopics = topics.filter(t => t.subjectId === subject.id);
              const totalHours = subjectTopics.reduce((sum, t) => sum + t.hoursSpent, 0);
              
              return (
                <div
                  key={subject.id}
                  className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: subject.color + '20' }}
                    >
                      <BookOpen className="w-6 h-6" style={{ color: subject.color }} />
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      subject.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                      subject.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-green-900/30 text-green-400'
                    }`}>
                      {subject.priority === 'high' ? 'Alta' : subject.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-white mb-2">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-sm text-slate-400 mb-4">{subject.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{subjectTopics.length} tópicos</span>
                    <span className="text-slate-400">{totalHours.toFixed(1)}h estudadas</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedSubject(subject);
                      setShowTopicModal(true);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-sm transition-colors"
                  >
                    Adicionar Tópico
                  </button>
                </div>
              );
            })}
            
            {subjects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Nenhuma matéria cadastrada</p>
                <button
                  onClick={() => setShowSubjectModal(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors"
                >
                  Adicionar Primeira Matéria
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6">
            {subjects.map(subject => {
              const subjectTopics = topics.filter(t => t.subjectId === subject.id);
              if (subjectTopics.length === 0) return null;
              
              return (
                <div key={subject.id} className="mb-8 last:mb-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: subject.color }}
                    />
                    <h3 className="text-xl font-black text-white">{subject.name}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {subjectTopics.map(topic => (
                      <div
                        key={topic.id}
                        className="bg-slate-800 rounded-xl p-4 hover:bg-slate-750 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-white mb-1">{topic.name}</h4>
                            {topic.description && (
                              <p className="text-sm text-slate-400 mb-2">{topic.description}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${
                            topic.status === 'mastered' ? 'bg-green-900/30 text-green-400' :
                            topic.status === 'review' ? 'bg-blue-900/30 text-blue-400' :
                            topic.status === 'in-progress' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {topic.status === 'mastered' ? 'Dominado' :
                             topic.status === 'review' ? 'Revisão' :
                             topic.status === 'in-progress' ? 'Em Progresso' :
                             'Não Iniciado'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>Dificuldade: {
                            topic.difficulty === 'hard' ? 'Difícil' :
                            topic.difficulty === 'medium' ? 'Médio' : 'Fácil'
                          }</span>
                          <span>•</span>
                          <span>{topic.hoursSpent}h / {topic.estimatedHours || '?'}h</span>
                          <span>•</span>
                          <span>Prioridade: {topic.priority}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {topics.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum tópico cadastrado</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6">
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Sistema de metas em desenvolvimento</p>
              <button
                onClick={() => setShowGoalModal(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors"
              >
                Criar Meta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Adicionar Matéria */}
      {showSubjectModal && (
        <SubjectModal
          onClose={() => setShowSubjectModal(false)}
          onSave={addSubject}
        />
      )}

      {/* Modal: Adicionar Tópico */}
      {showTopicModal && (
        <TopicModal
          subjects={subjects}
          selectedSubject={selectedSubject}
          onClose={() => {
            setShowTopicModal(false);
            setSelectedSubject(null);
          }}
          onSave={addTopic}
        />
      )}

      {/* Modal: Agendar Estudo */}
      {showScheduleModal && (
        <ScheduleModal
          subjects={subjects}
          topics={topics}
          onClose={() => setShowScheduleModal(false)}
          onSave={addSchedule}
        />
      )}
    </div>
  );
}

// Modal Components
function SubjectModal({ onClose, onSave }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const colors = [
    '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border-2 border-slate-800">
        <h2 className="text-2xl font-black mb-4">Nova Matéria</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Nome da Matéria</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
              placeholder="Ex: Matemática, Programação..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none resize-none"
              rows={3}
              placeholder="Detalhes sobre a matéria..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Cor</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Prioridade</label>
            <div className="flex gap-2">
              {[
                { value: 'high', label: 'Alta', color: 'red' },
                { value: 'medium', label: 'Média', color: 'yellow' },
                { value: 'low', label: 'Baixa', color: 'green' },
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value as any)}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                    priority === p.value
                      ? `bg-${p.color}-600 text-white`
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ name, description, color, priority })}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-bold transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function TopicModal({ subjects, selectedSubject, onClose, onSave }: any) {
  const [subjectId, setSubjectId] = useState(selectedSubject?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [priority, setPriority] = useState(3);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border-2 border-slate-800">
        <h2 className="text-2xl font-black mb-4">Novo Tópico</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Matéria</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
            >
              <option value="">Selecione uma matéria</option>
              {subjects.map((s: StudySubject) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Nome do Tópico</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
              placeholder="Ex: Derivadas, Arrays em JavaScript..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none resize-none"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Horas Estimadas</label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
              placeholder="Ex: 10"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Dificuldade</label>
            <div className="flex gap-2">
              {[
                { value: 'easy', label: 'Fácil' },
                { value: 'medium', label: 'Médio' },
                { value: 'hard', label: 'Difícil' },
              ].map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value as any)}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                    difficulty === d.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Prioridade: {priority}/5</label>
            <input
              type="range"
              min="1"
              max="5"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ 
              subjectId, 
              name, 
              description, 
              estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
              difficulty,
              priority
            })}
            disabled={!subjectId || !name.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-bold transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ subjects, topics, onClose, onSave }: any) {
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [recurring, setRecurring] = useState<'daily' | 'weekly' | 'weekdays' | 'weekends' | undefined>();

  const filteredTopics = topics.filter((t: StudyTopic) => t.subjectId === subjectId);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border-2 border-slate-800 my-8">
        <h2 className="text-2xl font-black mb-4">Agendar Estudo</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Matéria</label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId('');
              }}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
            >
              <option value="">Selecione uma matéria</option>
              {subjects.map((s: StudySubject) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          {subjectId && filteredTopics.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Tópico (opcional)</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
              >
                <option value="">Nenhum tópico específico</option>
                {filteredTopics.map((t: StudyTopic) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
              placeholder="Ex: Estudar Derivadas"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none resize-none"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Fim</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Recorrência (opcional)</label>
            <select
              value={recurring || ''}
              onChange={(e) => setRecurring(e.target.value as any || undefined)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-purple-500 outline-none"
            >
              <option value="">Não repetir</option>
              <option value="daily">Diariamente</option>
              <option value="weekdays">Dias úteis</option>
              <option value="weekends">Fins de semana</option>
              <option value="weekly">Semanalmente</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ 
              subjectId, 
              topicId: topicId || undefined,
              title, 
              description,
              date: new Date(date),
              startTime,
              endTime,
              recurring
            })}
            disabled={!subjectId || !title.trim()}
            className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-bold transition-colors"
          >
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
