'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  onComplete: (name: string) => void;
}

export default function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Por favor, digite seu nome');
      return;
    }

    if (name.trim().length < 2) {
      setError('Nome muito curto');
      return;
    }

    onComplete(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl font-black text-white">C</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
            E aí! Bem-vindo
          </h1>
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent uppercase">
            Controle de Si
          </h2>
          <p className="text-slate-400 mt-4 font-bold">
            Seu sistema de produtividade e autocontrole
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
              Como quer ser chamado?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Digite seu nome"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-bold"
              autoFocus
              maxLength={50}
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 font-bold">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-4 rounded-xl font-black text-lg uppercase tracking-wide shadow-lg shadow-purple-500/50 hover:shadow-xl hover:scale-105 transition-all"
          >
            Bora Começar
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-slate-500 text-xs text-center font-bold">
            Seus dados ficam só no seu dispositivo
          </p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
