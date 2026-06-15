import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserSettings, UserStats } from '@/lib/db/schema';

interface AppState {
  // User
  user: User | null;
  userStats: UserStats | null;
  isInitialized: boolean;
  
  // UI
  darkMode: boolean;
  sidebarOpen: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setUserStats: (stats: UserStats | null) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setInitialized: (value: boolean) => void;
  
  // Stats
  addXP: (amount: number) => void;
  incrementLevel: () => void;
  updateStats: (updates: Partial<UserStats>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      userStats: null,
      isInitialized: false,
      darkMode: false,
      sidebarOpen: true,

      // Actions
      setUser: (user) => set({ user }),
      
      setUserStats: (stats) => set({ userStats: stats }),
      
      updateSettings: (settings) => set((state) => ({
        user: state.user ? {
          ...state.user,
          settings: { ...state.user.settings, ...settings }
        } : null
      })),
      
      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.darkMode;
        if (typeof document !== 'undefined') {
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return { darkMode: newDarkMode };
      }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setInitialized: (value) => set({ isInitialized: value }),
      
      addXP: (amount) => set((state) => {
        if (!state.userStats) return state;
        
        const newXP = state.userStats.xp + amount;
        const xpForNextLevel = state.userStats.level * 100;
        
        if (newXP >= xpForNextLevel) {
          return {
            userStats: {
              ...state.userStats,
              xp: newXP - xpForNextLevel,
              level: state.userStats.level + 1,
              lastUpdated: new Date()
            }
          };
        }
        
        return {
          userStats: {
            ...state.userStats,
            xp: newXP,
            lastUpdated: new Date()
          }
        };
      }),
      
      incrementLevel: () => set((state) => ({
        userStats: state.userStats ? {
          ...state.userStats,
          level: state.userStats.level + 1,
          lastUpdated: new Date()
        } : null
      })),
      
      updateStats: (updates) => set((state) => ({
        userStats: state.userStats ? {
          ...state.userStats,
          ...updates,
          lastUpdated: new Date()
        } : null
      }))
    }),
    {
      name: 'controle-de-si-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
);

// Made with Bob
