'use client';

import { useAppStore } from '@/stores/useAppStore';
import { Image as ImageIcon, Sparkles } from 'lucide-react';

export default function IconModeToggle() {
  const useImageIcons = useAppStore((state) => state.useImageIcons);
  const toggleImageIcons = useAppStore((state) => state.toggleImageIcons);

  return (
    <button
      onClick={toggleImageIcons}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-xl hover:bg-slate-700/90 transition-all group shadow-lg hover:shadow-xl"
      title={useImageIcons ? 'Usar ícones do sistema' : 'Usar imagens personalizadas'}
    >
      {useImageIcons ? (
        <>
          <Sparkles className="w-4 h-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors hidden sm:inline">
            Ícones Sistema
          </span>
        </>
      ) : (
        <>
          <ImageIcon className="w-4 h-4 text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors" />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors hidden sm:inline">
            Ícones Imagem
          </span>
        </>
      )}
      
      {/* Indicador visual */}
      <div className="relative w-10 h-5 bg-slate-700 rounded-full transition-colors">
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
            useImageIcons
              ? 'translate-x-5 bg-gradient-to-br from-violet-500 to-fuchsia-500'
              : 'translate-x-0 bg-slate-500'
          }`}
        />
      </div>
    </button>
  );
}

// Made with Bob