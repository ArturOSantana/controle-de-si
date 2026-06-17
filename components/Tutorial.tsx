'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  target?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'E aí! Bem-vindo',
    description: 'Vou te mostrar rapidinho como funciona. São só 5 passos!'
  },
  {
    title: 'Frase do Dia',
    description: 'Todo dia você vê uma frase inspiradora de santos. Atualiza a cada F5!'
  },
  {
    title: 'Score de Consistência',
    description: 'Aqui você vê como tá indo hoje, de 0 a 100. Quanto maior, melhor!'
  },
  {
    title: 'Notificações',
    description: 'Ativa as notificações pra receber lembretes diários (20h), a cada 6h e 12h, além de avisos de pomodoro e hábitos!'
  },
  {
    title: 'Pronto pra começar!',
    description: 'Explora o menu pra ver Hábitos, Tarefas, Pomodoro e mais. Bora dominar o dia!'
  }
];

interface TutorialProps {
  onComplete: () => void;
}

export default function Tutorial({ onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl max-w-lg w-full p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all ${
                index <= currentStep
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white mb-3 uppercase">
            {step.title}
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-6 rounded-xl font-bold uppercase transition-all"
            >
              Pular
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${
              isLastStep ? 'flex-1' : 'flex-1'
            } bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-bold uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/50`}
          >
            {isLastStep ? 'Começar' : 'Próximo'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Step counter */}
        <p className="text-center text-slate-500 text-sm mt-4 font-bold">
          {currentStep + 1} de {TUTORIAL_STEPS.length}
        </p>
      </div>
    </div>
  );
}

// Made with Bob
