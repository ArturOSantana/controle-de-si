'use client';

import { Home, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  gradient: string;
  tutorialSteps?: TutorialStep[];
}

interface TutorialStep {
  title: string;
  description: string;
}

export default function PageHeader({ title, description, gradient, tutorialSteps }: PageHeaderProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNextStep = () => {
    if (tutorialSteps && currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowTutorial(false);
      setCurrentStep(0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="p-3 bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 hover:border-slate-700 rounded-xl transition-all hover:scale-105 active:scale-95"
              title="Voltar para Home"
            >
              <Home className="w-5 h-5 text-white" />
            </a>
            <div>
              <h1 className={`text-4xl font-black mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {title}
              </h1>
              <p className="text-slate-400">{description}</p>
            </div>
          </div>
          
          {tutorialSteps && tutorialSteps.length > 0 && (
            <button
              onClick={() => setShowTutorial(true)}
              className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              title="Ver Tutorial"
            >
              <HelpCircle className="w-5 h-5 text-white" />
              <span className="text-white font-bold hidden sm:inline">Tutorial</span>
            </button>
          )}
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && tutorialSteps && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full border-2 border-purple-500/30 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Passo {currentStep + 1} de {tutorialSteps.length}</span>
                  <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-4">
                  {tutorialSteps[currentStep].title}
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed">
                  {tutorialSteps[currentStep].description}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTutorial(false);
                    setCurrentStep(0);
                  }}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors"
                >
                  Pular
                </button>
                
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors"
                  >
                    Voltar
                  </button>
                )}
                
                <button
                  onClick={handleNextStep}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-white transition-all"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Concluir' : 'Próximo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Made with Bob
