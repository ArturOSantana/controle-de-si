'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { db, generateId } from '@/lib/db';
import { STORES } from '@/lib/db/schema';
import type { Addiction, AddictionLog } from '@/lib/db/schema';
import { 
  Home, 
  Plus, 
  Flame,
  AlertTriangle,
  TrendingDown,
  Calendar,
  Clock,
  Heart,
  Shield,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { differenceInDays, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AddictionsPage() {
  const router = useRouter();
  const { user, addXP, updateStats } = useAppStore();
  
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [logs, setLogs] = useState<AddictionLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [selectedAddiction, setSelectedAddiction] = useState<Addiction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddictions();
  }, [user]);

  const loadAddictions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const allAddictions = await db.getByIndex<Addiction>(STORES.addictions, 'userId', user.id);
      const activeAddictions = allAddictions.filter(a => a.active);
      setAddictions(activeAddictions);
      
      const allLogs = await db.getByIndex<AddictionLog>(STORES.addictionLogs, 'userId', user.id);
      setLogs(allLogs);
    } catch (error) {
      console.error('Erro ao carregar vícios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSobrietyDays = (addiction: Addiction): number => {
    if (!addiction.sobrietyDate) return 0;
    return differenceInDays(new Date(), new Date(addiction.sobrietyDate));
  };

  const getRelapseCount = (addictionId: string): number => {
    return logs.filter(l => l.addictionId === addictionId && l.relapsed).length;
  };

  const handleRelapse = async (addiction: Addiction, trigger?: string, emotion?: string) => {
    if (!user) return;

    const log: AddictionLog = {
      id: generateId(),
      addictionId: addiction.id,
      userId: user.id,
      date: new Date(),
      relapsed: true,
      trigger,
      emotion: emotion as any,
      notes: ''
    };

    await db.add(STORES.addictionLogs, log);
    
    // Resetar data de sobriedade
    addiction.sobrietyDate = new Date();
    await db.update(STORES.addictions, addiction);
    
    loadAddictions();
  };

  const handleVictory = async (addiction: Addiction) => {
    if (!user) return;

    const log: AddictionLog = {
      id: generateId(),
      addictionId: addiction.id,
      userId: user.id,
      date: new Date(),
      relapsed: false,
      notes: 'Dia de vitória!'
    };

    await db.add(STORES.addictionLogs, log);
    
    const days = getSobrietyDays(addiction);
    
    // Recompensas por marcos
    if (days === 1) addXP(50);
    if (days === 7) addXP(100);
    if (days === 30) addXP(500);
    if (days === 90) addXP(1000);
    
    loadAddictions();
  };

  const deleteAddiction = async (addictionId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vício?')) return;
    
    const addiction = addictions.find(a => a.id === addictionId);
    if (addiction) {
      addiction.active = false;
      await db.update(STORES.addictions, addiction);
      loadAddictions();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Home className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Combate a Vícios
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Novo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SOS Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowSOSModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-xl font-bold"
          >
            <AlertTriangle className="w-8 h-8" />
            MODO SOS - PRECISO DE AJUDA AGORA
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vícios Ativos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{addictions.length}</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Maior Sobriedade</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.max(...addictions.map(a => getSobrietyDays(a)), 0)} dias
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                <Flame className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Recaídas</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {logs.filter(l => l.relapsed).length}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Addictions List */}
        {addictions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-green-100 dark:bg-green-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum vício cadastrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comece sua jornada de libertação registrando o que deseja superar
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Cadastrar Vício
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addictions.map(addiction => {
              const sobrietyDays = getSobrietyDays(addiction);
              const relapseCount = getRelapseCount(addiction.id);
              
              return (
                <div
                  key={addiction.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {addiction.name}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {addiction.type === 'digital' ? 'Digital' : 
                         addiction.type === 'substance' ? 'Substância' : 'Comportamento'}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteAddiction(addiction.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {addiction.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {addiction.description}
                    </p>
                  )}

                  {/* Sobriety Counter */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dias Limpo</p>
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                          {sobrietyDays}
                        </p>
                      </div>
                      <Flame className="w-12 h-12 text-green-500" />
                    </div>
                    {addiction.sobrietyDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Desde {format(new Date(addiction.sobrietyDate), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Recaídas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{relapseCount}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Início</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(addiction.startDate), 'dd/MM/yy')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVictory(addiction)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Vitória Hoje
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAddiction(addiction);
                        setShowSOSModal(true);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Recaída
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Addiction Modal */}
      {showAddModal && (
        <AddAddictionModal
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setShowAddModal(false);
            loadAddictions();
          }}
          userId={user?.id || ''}
        />
      )}

      {/* SOS Modal */}
      {showSOSModal && (
        <SOSModal
          onClose={() => {
            setShowSOSModal(false);
            setSelectedAddiction(null);
          }}
          addiction={selectedAddiction}
          onRelapse={(trigger, emotion) => {
            if (selectedAddiction) {
              handleRelapse(selectedAddiction, trigger, emotion);
            }
            setShowSOSModal(false);
            setSelectedAddiction(null);
          }}
        />
      )}
    </div>
  );
}

function AddAddictionModal({ onClose, onAdd, userId }: {
  onClose: () => void;
  onAdd: () => void;
  userId: string;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'digital' | 'substance' | 'behavior'>('digital');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const addiction: Addiction = {
      id: generateId(),
      userId,
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      startDate: new Date(),
      sobrietyDate: new Date(),
      active: true
    };

    await db.add(STORES.addictions, addiction);
    onAdd();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Cadastrar Vício
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Vício *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Instagram, Cigarro, Procrastinação"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="digital">Digital (redes sociais, jogos)</option>
              <option value="substance">Substância (cigarro, álcool)</option>
              <option value="behavior">Comportamento (procrastinação)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por que deseja superar isso?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SOSModal({ onClose, addiction, onRelapse }: {
  onClose: () => void;
  addiction: Addiction | null;
  onRelapse: (trigger?: string, emotion?: string) => void;
}) {
  const [step, setStep] = useState<'breathing' | 'trigger' | 'emotion'>('breathing');
  const [breathCount, setBreathCount] = useState(0);
  const [trigger, setTrigger] = useState('');
  const [emotion, setEmotion] = useState('');

  const emotions = ['bored', 'anxious', 'lonely', 'tired', 'stressed'];
  const triggers = ['Notificação', 'Tédio', 'Estresse', 'Solidão', 'Cansaço'];

  if (step === 'breathing') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Respire Comigo
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Vamos fazer 5 respirações profundas juntos
          </p>

          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center animate-pulse">
              <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                {breathCount}/5
              </p>
            </div>
          </div>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            Inspire por 4 segundos<br />
            Segure por 7 segundos<br />
            Expire por 8 segundos
          </p>

          <button
            onClick={() => {
              if (breathCount < 5) {
                setBreathCount(breathCount + 1);
              } else {
                setStep('trigger');
              }
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {breathCount < 5 ? 'Próxima Respiração' : 'Continuar'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'trigger') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border-2 border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-8">
          <h2 className="text-3xl font-black text-white mb-4 uppercase text-center">
            O que te levou a isso?
          </h2>
          <p className="text-slate-400 mb-8 text-center font-medium">
            Identificar gatilhos ajuda a prevenir futuras recaídas
          </p>

          <div className="space-y-3 mb-8">
            {triggers.map(t => (
              <button
                key={t}
                onClick={() => setTrigger(t)}
                className={`w-full px-6 py-4 rounded-xl border-2 transition-all font-bold uppercase ${
                  trigger === t
                    ? 'border-red-500 bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20 scale-105'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-red-500/50 hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 border-2 border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              onClick={() => setStep('emotion')}
              disabled={!trigger}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl transition-all font-black uppercase shadow-lg shadow-red-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-black text-white mb-4 uppercase text-center">
          💭 Como você estava se sentindo?
        </h2>

        <div className="space-y-3 mb-8">
          {emotions.map(e => (
            <button
              key={e}
              onClick={() => setEmotion(e)}
              className={`w-full px-6 py-4 rounded-xl border-2 transition-all font-bold uppercase ${
                emotion === e
                  ? 'border-orange-500 bg-orange-500/20 text-orange-400 shadow-lg shadow-orange-500/20 scale-105'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-orange-500/50 hover:bg-slate-700'
              }`}
            >
              {e === 'bored' ? '😐 Entediado' :
               e === 'anxious' ? '😰 Ansioso' :
               e === 'lonely' ? 'Solitário' :
               e === 'tired' ? 'Cansado' : 'Estressado'}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 border-2 border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all font-bold uppercase"
          >
            Cancelar
          </button>
          <button
            onClick={() => onRelapse(trigger, emotion)}
            disabled={!emotion}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-black uppercase shadow-lg shadow-red-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
