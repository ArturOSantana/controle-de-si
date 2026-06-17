'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { db, generateId } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { MProject } from '@/lib/db/schema';
import QuestionnaireModal from '@/components/sistema-m/QuestionnaireModal';
import {
  Home,
  Plus,
  Target,
  TrendingUp,
  Lightbulb,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  HelpCircle,
  ArrowRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

const PILLAR_INFO = {
  stability: {
    name: 'Estabilidade',
    color: 'from-blue-500 to-cyan-600',
    icon: Target,
    description: 'Paga as contas'
  },
  growth: {
    name: 'Crescimento',
    color: 'from-green-500 to-emerald-600',
    icon: TrendingUp,
    description: 'Tá desenvolvendo agora'
  },
  curiosity: {
    name: 'Curiosidade',
    color: 'from-purple-500 to-pink-600',
    icon: Lightbulb,
    description: 'Só explorando'
  }
};

export default function SistemaMPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [projects, setProjects] = useState<MProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<'all' | 'stability' | 'growth' | 'curiosity'>('all');
  const [error, setError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<MProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<MProject | null>(null);
  const [showPillarConfirm, setShowPillarConfirm] = useState(false);
  const [suggestedData, setSuggestedData] = useState<{
    name: string;
    description: string;
    answers: MProject['answers'];
    suggestedPillar: 'stability' | 'growth' | 'curiosity';
  } | null>(null);

  useEffect(() => {
    initPage();
  }, [user]);

  const initPage = async () => {
    try {
      // Inicializar banco de dados
      await db.init();
      
      // Verificar se é primeira vez
      const hasSeenTutorial = localStorage.getItem('sistema_m_tutorial_seen');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
      
      // Carregar projetos
      await loadProjects();
    } catch (error) {
      console.error('Erro ao inicializar página:', error);
      setError('Erro ao carregar. Tente recarregar a página.');
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await db.getByIndex<MProject>(STORES.mProjects, 'userId', user.id);
      setProjects(data.sort((a, b) => b.priority - a.priority));
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      setError('Erro ao carregar projetos. O banco de dados pode precisar ser atualizado.');
    } finally {
      setLoading(false);
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('sistema_m_tutorial_seen', 'true');
  };

  const handleQuestionnaireComplete = (data: any) => {
    setSuggestedData(data);
    setShowPillarConfirm(true);
    setShowAddModal(false);
  };

  const handleConfirmPillar = async (finalPillar: 'stability' | 'growth' | 'curiosity') => {
    if (!user || !suggestedData) {
      console.log('Faltando user ou suggestedData:', { user, suggestedData });
      return;
    }

    console.log('Adicionando projeto:', { finalPillar, suggestedData });

    try {
      // Garantir que o banco está inicializado
      await db.init();

      const newProject: MProject = {
        id: generateId(),
        userId: user.id,
        name: suggestedData.name,
        description: suggestedData.description || '',
        pillar: finalPillar,
        answers: suggestedData.answers,
        hoursSpent: 0,
        startDate: new Date(),
        status: 'active',
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Projeto a ser adicionado:', newProject);

      await db.add(STORES.mProjects, newProject);
      console.log('Projeto adicionado com sucesso!');
      
      await loadProjects();
      console.log('Projetos recarregados');
      
      setShowPillarConfirm(false);
      setSuggestedData(null);
      
      // Feedback visual
      alert('Projeto adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
      alert(`Erro ao adicionar projeto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    try {
      await db.delete(STORES.mProjects, deletingProject.id);
      await loadProjects();
      setDeletingProject(null);
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      alert('Erro ao deletar projeto. Tente novamente.');
    }
  };

  const handleToggleStatus = async (project: MProject) => {
    try {
      const newStatus = project.status === 'active' ? 'paused' : 'active';
      const updated: MProject = {
        ...project,
        status: newStatus,
        updatedAt: new Date()
      };
      await db.update(STORES.mProjects, updated);
      await loadProjects();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleChangePillar = async (project: MProject, newPillar: 'stability' | 'growth' | 'curiosity') => {
    try {
      const updated: MProject = {
        ...project,
        pillar: newPillar,
        updatedAt: new Date()
      };
      await db.update(STORES.mProjects, updated);
      await loadProjects();
    } catch (error) {
      console.error('Erro ao mudar pilar:', error);
    }
  };

  const filteredProjects = selectedPillar === 'all' 
    ? projects 
    : projects.filter(p => p.pillar === selectedPillar);

  const projectsByPillar = {
    stability: projects.filter(p => p.pillar === 'stability' && p.status === 'active'),
    growth: projects.filter(p => p.pillar === 'growth' && p.status === 'active'),
    curiosity: projects.filter(p => p.pillar === 'curiosity' && p.status === 'active')
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-bold">Carregando Sistema M...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border-2 border-red-500/50 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Erro ao Carregar</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Recarregar Página
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all"
            >
              Voltar ao Início
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-6">
            Se o problema persistir, limpe o cache do navegador (Ctrl+Shift+Delete)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b-2 border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 sm:gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm sm:text-base"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Voltar</span>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-lg sm:text-2xl font-black text-white flex items-center justify-center gap-1 sm:gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                Sistema M
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Gerencie seus múltiplos interesses</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 sm:px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Novo Projeto</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tutorial Card */}
        {showTutorial && (
          <div className="mb-8 bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-2 border-purple-500/50 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">E aí! Bem-vindo ao Sistema M</h2>
                  <p className="text-slate-300">Organiza seus interesses em 3 pilares</p>
                </div>
              </div>
              <button
                onClick={closeTutorial}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {Object.entries(PILLAR_INFO).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <div key={key} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-purple-400" />
                      <h3 className="font-black text-white">{info.name}</h3>
                    </div>
                    <p className="text-sm text-slate-400">{info.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-300 mb-2">
                <strong className="text-white">Como funciona:</strong>
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Adiciona seus projetos e interesses</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Responde umas perguntas pra classificar nos pilares</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Foca no que importa em cada fase da vida</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Revisa todo mês e ajusta quando precisar</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {Object.entries(PILLAR_INFO).map(([key, info]) => {
            const Icon = info.icon;
            const count = projectsByPillar[key as keyof typeof projectsByPillar].length;
            
            return (
              <div
                key={key}
                className={`bg-gradient-to-br ${info.color} rounded-2xl p-4 sm:p-6 relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform`}
                onClick={() => setSelectedPillar(key as any)}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    <span className="text-3xl sm:text-4xl font-black text-white">{count}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-1">{info.name}</h3>
                  <p className="text-white/80 text-xs sm:text-sm">{info.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPillar('all')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${
              selectedPillar === 'all'
                ? 'bg-white text-slate-900'
                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            TODOS
          </button>
          {Object.entries(PILLAR_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setSelectedPillar(key as any)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${
                selectedPillar === key
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              {info.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Nada por aqui ainda</h3>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">Bora adicionar seus interesses e projetos</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all text-sm sm:text-base"
            >
              Adicionar Primeiro Projeto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map((project) => {
              const pillarInfo = PILLAR_INFO[project.pillar];
              const PillarIcon = pillarInfo.icon;
              
              return (
                <div
                  key={project.id}
                  className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 sm:p-6 hover:border-slate-700 transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${pillarInfo.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <PillarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => handleToggleStatus(project)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                        title={project.status === 'active' ? 'Pausar' : 'Ativar'}
                      >
                        {project.status === 'active' ? (
                          <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeletingProject(project)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 hover:bg-red-500 flex items-center justify-center transition-colors group"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-black text-white mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{project.hoursSpent}h</span>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      project.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                      project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {project.status === 'active' ? 'Ativo' :
                       project.status === 'paused' ? 'Pausado' :
                       project.status === 'completed' ? 'Concluído' :
                       'Abandonado'}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">{pillarInfo.name}</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < project.priority ? 'bg-purple-500' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Questionário Modal */}
      {showAddModal && (
        <QuestionnaireModal
          onClose={() => setShowAddModal(false)}
          onComplete={handleQuestionnaireComplete}
        />
      )}

      {/* Confirmação de Pilar */}
      {showPillarConfirm && suggestedData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-2xl font-black text-white mb-2">Classificação Sugerida</h2>
              <p className="text-slate-400">Baseado nas suas respostas, sugerimos:</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Pilar Sugerido */}
              <div className={`bg-gradient-to-br ${PILLAR_INFO[suggestedData.suggestedPillar].color} rounded-2xl p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const Icon = PILLAR_INFO[suggestedData.suggestedPillar].icon;
                      return <Icon className="w-8 h-8 text-white" />;
                    })()}
                    <div>
                      <p className="text-sm text-white/80 font-bold uppercase">Pilar Sugerido</p>
                      <h3 className="text-2xl font-black text-white">{PILLAR_INFO[suggestedData.suggestedPillar].name}</h3>
                    </div>
                  </div>
                  <p className="text-white/90">{PILLAR_INFO[suggestedData.suggestedPillar].description}</p>
                </div>
              </div>

              {/* Projeto Info */}
              <div className="bg-slate-800 rounded-xl p-4">
                <h4 className="font-black text-white mb-2">{suggestedData.name}</h4>
                {suggestedData.description && (
                  <p className="text-sm text-slate-400">{suggestedData.description}</p>
                )}
              </div>

              {/* Opções */}
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Ou escolha outro pilar:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(PILLAR_INFO).map(([key, info]) => {
                    const Icon = info.icon;
                    const isSelected = key === suggestedData.suggestedPillar;
                    return (
                      <button
                        key={key}
                        onClick={() => handleConfirmPillar(key as any)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'bg-white/10 border-white scale-105'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {info.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setShowPillarConfirm(false);
                  setSuggestedData(null);
                }}
                className="flex-1 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmPillar(suggestedData.suggestedPillar)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all"
              >
                Confirmar Sugestão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-2xl font-black text-white">Excluir Projeto?</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-slate-300 mb-4">
                Tem certeza que quer excluir <strong className="text-white">"{deletingProject.name}"</strong>?
              </p>
              <p className="text-sm text-slate-500">
                Não dá pra desfazer depois. Todos os dados e logs vão embora junto.
              </p>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setDeletingProject(null)}
                className="flex-1 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProject}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob
