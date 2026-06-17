'use client';

import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import type { MProject } from '@/lib/db/schema';

interface Question {
  id: keyof MProject['answers'];
  text: string;
  help?: string;
  type: 'boolean' | 'nullable-boolean';
}

const QUESTIONS: Question[] = [
  {
    id: 'wantToMaster',
    text: 'Quer dominar isso ou só dar uma olhada?',
    help: 'Dominar = vai dedicar tempo de verdade. Olhada = só curiosidade mesmo.',
    type: 'boolean'
  },
  {
    id: 'wantToMonetize',
    text: 'Quer ganhar dinheiro com isso?',
    help: 'Cuidado: transformar hobby em trabalho pode matar o prazer.',
    type: 'nullable-boolean'
  },
  {
    id: 'hasMarketDemand',
    text: 'As pessoas pagam bem por isso?',
    help: 'Tem demanda real ou é só algo que você acha legal?',
    type: 'nullable-boolean'
  },
  {
    id: 'isGoodAt',
    text: 'Você manda bem nisso?',
    help: 'Ou pelo menos tem saco pra ficar bom? Seja sincero.',
    type: 'nullable-boolean'
  },
  {
    id: 'stillInterestedIn1Year',
    text: 'Daqui 1 ano você ainda vai estar nessa?',
    help: 'Ou é só empolgação de momento?',
    type: 'nullable-boolean'
  },
  {
    id: 'complementsCareer',
    text: 'Isso ajuda no seu trampo principal?',
    help: 'Habilidades que se conectam te deixam mais forte.',
    type: 'nullable-boolean'
  },
  {
    id: 'wouldDoWithout10Hours',
    text: 'Com 10h livres na semana, você faria isso?',
    help: 'Tempo mostra o que você realmente quer.',
    type: 'nullable-boolean'
  },
  {
    id: 'alignsWithGoals',
    text: 'Isso te leva pra onde você quer chegar?',
    help: 'Não é sobre fazer, é sobre quem você quer ser.',
    type: 'nullable-boolean'
  },
  {
    id: 'canAbandonWithoutGuilt',
    text: 'Pode largar isso sem peso na consciência?',
    help: 'Se sim, é só curiosidade. Tá tudo bem.',
    type: 'nullable-boolean'
  },
  {
    id: 'feedsCreativity',
    text: 'Isso te inspira? Te dá ideias?',
    help: 'Nem tudo precisa virar grana. Às vezes é só combustível criativo.',
    type: 'nullable-boolean'
  },
  {
    id: 'wouldDoWithoutPraise',
    text: 'Faria isso mesmo se ninguém soubesse?',
    help: 'Tira o ego da jogada. Você faz por você ou pelos outros?',
    type: 'nullable-boolean'
  },
  {
    id: 'regretNotTrying',
    text: 'Vai se arrepender se não tentar?',
    help: 'A gente se arrepende mais do que não fez do que do que tentou.',
    type: 'nullable-boolean'
  },
  {
    id: 'isEscape',
    text: 'Tá usando isso pra fugir de algo chato?',
    help: 'Às vezes a gente começa coisa nova só pra não encarar o difícil.',
    type: 'nullable-boolean'
  },
  {
    id: 'requiresDepth',
    text: 'Precisa ir fundo nisso pra valer a pena?',
    help: 'Tipo medicina, programação... ou dá pra curtir na superfície?',
    type: 'nullable-boolean'
  }
];

interface Props {
  onClose: () => void;
  onComplete: (data: {
    name: string;
    description: string;
    answers: MProject['answers'];
    suggestedPillar: 'stability' | 'growth' | 'curiosity';
  }) => void;
}

export default function QuestionnaireModal({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [answers, setAnswers] = useState<Partial<MProject['answers']>>({});
  const [showHelp, setShowHelp] = useState(false);

  const isBasicInfoStep = step === 0;
  const currentQuestion = !isBasicInfoStep ? QUESTIONS[step - 1] : null;
  const progress = (step / (QUESTIONS.length + 1)) * 100;

  const handleAnswer = (value: boolean | null) => {
    if (!currentQuestion) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
    
    // Avançar automaticamente
    if (step < QUESTIONS.length) {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const calculatePillar = (): 'stability' | 'growth' | 'curiosity' => {
    const a = answers as MProject['answers'];
    
    // Lógica de classificação baseada nas respostas
    let stabilityScore = 0;
    let growthScore = 0;
    let curiosityScore = 0;

    // Estabilidade: paga contas, tem demanda, é bom nisso
    if (a.hasMarketDemand) stabilityScore += 3;
    if (a.isGoodAt) stabilityScore += 2;
    if (a.wantToMonetize) stabilityScore += 2;
    if (a.complementsCareer) stabilityScore += 1;

    // Crescimento: quer dominar, interesse de longo prazo, alinha com objetivos
    if (a.wantToMaster) growthScore += 3;
    if (a.stillInterestedIn1Year) growthScore += 2;
    if (a.alignsWithGoals) growthScore += 2;
    if (a.wouldDoWithout10Hours) growthScore += 2;
    if (a.complementsCareer) growthScore += 1;

    // Curiosidade: pode abandonar, alimenta criatividade, não requer profundidade
    if (a.canAbandonWithoutGuilt) curiosityScore += 3;
    if (a.feedsCreativity) curiosityScore += 2;
    if (!a.wantToMaster) curiosityScore += 2;
    if (!a.requiresDepth) curiosityScore += 1;

    // Retornar o maior score
    if (stabilityScore >= growthScore && stabilityScore >= curiosityScore) {
      return 'stability';
    } else if (growthScore >= curiosityScore) {
      return 'growth';
    } else {
      return 'curiosity';
    }
  };

  const handleComplete = () => {
    const suggestedPillar = calculatePillar();
    onComplete({
      name,
      description,
      answers: answers as MProject['answers'],
      suggestedPillar
    });
  };

  const canProceed = () => {
    if (isBasicInfoStep) return name.trim().length > 0;
    if (!currentQuestion) return false;
    return answers[currentQuestion.id] !== undefined;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-2xl font-black text-white">
              {isBasicInfoStep ? 'Informações Básicas' : `Pergunta ${step}/${QUESTIONS.length}`}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isBasicInfoStep ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nome do Projeto/Interesse *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Engenharia de Dados, Violão, Fotografia..."
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o que é e por que te interessa..."
                  rows={4}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <p className="text-sm text-slate-300">
                  <strong className="text-purple-400">Próximo passo:</strong> Você responderá {QUESTIONS.length} perguntas para classificar este projeto nos 3 pilares do Sistema M.
                </p>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">
                  {currentQuestion.text}
                </h3>
                
                {currentQuestion.help && (
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mb-4"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>{showHelp ? 'Ocultar' : 'Ver'} explicação</span>
                  </button>
                )}

                {showHelp && currentQuestion.help && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
                    <p className="text-slate-300 text-sm">{currentQuestion.help}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.type === 'boolean' ? (
                  <>
                    <button
                      onClick={() => handleAnswer(true)}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                        answers[currentQuestion.id] === true
                          ? 'bg-green-500/20 border-green-500 scale-105'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {currentQuestion.id === 'wantToMaster' ? 'Quero DOMINAR' : 'Sim'}
                        </span>
                        {answers[currentQuestion.id] === true && (
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleAnswer(false)}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                        answers[currentQuestion.id] === false
                          ? 'bg-blue-500/20 border-blue-500 scale-105'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {currentQuestion.id === 'wantToMaster' ? 'Só EXPERIMENTAR' : 'Não'}
                        </span>
                        {answers[currentQuestion.id] === false && (
                          <CheckCircle2 className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleAnswer(true)}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                        answers[currentQuestion.id] === true
                          ? 'bg-green-500/20 border-green-500 scale-105'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-bold text-white">Sim</span>
                        {answers[currentQuestion.id] === true && (
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleAnswer(false)}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                        answers[currentQuestion.id] === false
                          ? 'bg-red-500/20 border-red-500 scale-105'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-bold text-white">Não</span>
                        {answers[currentQuestion.id] === false && (
                          <CheckCircle2 className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleAnswer(null)}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                        answers[currentQuestion.id] === null
                          ? 'bg-slate-600/20 border-slate-500 scale-105'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-bold text-white">Não sei / Não se aplica</span>
                        {answers[currentQuestion.id] === null && (
                          <CheckCircle2 className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          {step === QUESTIONS.length ? (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
            >
              <span>Finalizar</span>
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
            >
              <span>Próxima</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
