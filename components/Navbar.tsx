'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Target,
  Clock,
  ListTodo,
  Shield,
  Brain,
  Trophy,
  Gift,
  BarChart3,
  FileText,
  BookOpen,
  Calendar,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import Image from 'next/image';

const navItems = [
  { href: '/', icon: Home, label: 'Início', imageName: 'home', ext: 'png' },
  { href: '/habits', icon: Target, label: 'Hábitos', imageName: 'habits', ext: 'png' },
  { href: '/pomodoro', icon: Clock, label: 'Pomodoro', imageName: 'pomodoro', ext: 'png' },
  { href: '/tasks', icon: ListTodo, label: 'Tarefas', imageName: 'tasks', ext: 'png' },
  { href: '/addictions', icon: Shield, label: 'Vícios', imageName: 'addictions', ext: 'png' },
  { href: '/study', icon: Brain, label: 'Estudos', imageName: 'study', ext: 'png' },
  { href: '/timeblock', icon: Calendar, label: 'Agenda', imageName: 'timeblock', ext: 'png' },
  { href: '/journal', icon: BookOpen, label: 'Diário', imageName: 'journal', ext: 'jpg' },
  { href: '/analytics', icon: BarChart3, label: 'Análises', imageName: 'analytics', ext: 'png' },
  { href: '/reports', icon: FileText, label: 'Relatórios', imageName: 'reports', ext: 'jpg' },
  { href: '/achievements', icon: Trophy, label: 'Conquistas', imageName: 'achievements', ext: 'png' },
  { href: '/rewards', icon: Gift, label: 'Recompensas', imageName: 'rewards', ext: 'png' },
];

export default function Navbar() {
  const pathname = usePathname();
  const useImageIcons = useAppStore((state) => state.useImageIcons);
  const toggleImageIcons = useAppStore((state) => state.toggleImageIcons);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/50 z-50">
        {/* Logo */}
        <Link href="/" className="mb-8 group">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-all group-hover:scale-110">
            <img
              src="/logo.png"
              alt="Controle de Si"
              className="w-10 h-10 object-contain"
            />
          </div>
        </Link>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center justify-center w-full h-14 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30' 
                    : 'hover:bg-slate-800/50'
                  }
                `}
                title={item.label}
              >
                {useImageIcons ? (
                  <div className="relative w-6 h-6">
                    <Image
                      src={`/menu-icons/${item.imageName}.${item.ext}`}
                      alt={item.label}
                      fill
                      sizes="24px"
                      className={`object-contain ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'} transition-opacity`}
                      onError={(e) => {
                        // Fallback para ícone do sistema se a imagem não existir
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const iconElement = document.createElement('div');
                          iconElement.innerHTML = `<svg class="w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors" />`;
                          parent.appendChild(iconElement);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl border border-slate-700">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800" />
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Botão de Alternância de Ícones - Desktop */}
        <div className="mt-auto pt-4 px-3 border-t border-slate-800/50">
          <button
            onClick={toggleImageIcons}
            className={`w-full h-12 rounded-xl transition-all group relative ${
              useImageIcons
                ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600'
                : 'bg-gradient-to-br from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600'
            }`}
            title={useImageIcons ? 'Usar ícones do sistema' : 'Usar imagens personalizadas'}
          >
            {useImageIcons ? (
              <Sparkles className="w-5 h-5 text-white transition-colors mx-auto" />
            ) : (
              <ImageIcon className="w-5 h-5 text-white transition-colors mx-auto" />
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl border border-slate-700 z-50">
              {useImageIcons ? 'Ícones Sistema' : 'Ícones Imagem'}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800" />
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-between px-2 py-2">
          {/* Botão de Alternância - Mobile */}
          <button
            onClick={toggleImageIcons}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] ${
              useImageIcons
                ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                : 'bg-gradient-to-br from-fuchsia-500 to-pink-500'
            }`}
          >
            {useImageIcons ? (
              <Sparkles className="w-5 h-5 text-white" />
            ) : (
              <ImageIcon className="w-5 h-5 text-white" />
            )}
            <span className="text-[10px] font-medium text-white">
              {useImageIcons ? 'Sistema' : 'Imagem'}
            </span>
          </button>

          {/* Nav Items */}
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]
                  ${isActive 
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' 
                    : 'hover:bg-slate-800/50'
                  }
                `}
              >
                {useImageIcons ? (
                  <div className="relative w-5 h-5">
                    <Image
                      src={`/menu-icons/${item.imageName}.${item.ext}`}
                      alt={item.label}
                      fill
                      sizes="20px"
                      className={`object-contain ${isActive ? 'opacity-100' : 'opacity-70'} transition-opacity`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                )}
                <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// Made with Bob
