'use client';

import { useEffect, useState } from 'react';
import { Trophy, Lock, Sparkles, Award, Target } from 'lucide-react';
import { db } from '@/lib/db';
import { STORES, Achievement, UserStats } from '@/lib/db/schema';
import { ACHIEVEMENT_DEFINITIONS, CATEGORY_COLORS, CATEGORY_NAMES } from '@/lib/achievements';
import { useAppStore } from '@/stores/useAppStore';

export default function AchievementsPage() {
  const { user } = useAppStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnlocked, setShowUnlocked] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [achievementsData, statsData] = await Promise.all([
        db.getByIndex<Achievement>(STORES.achievements, 'userId', user.id),
        db.getByIndex<UserStats>(STORES.userStats, 'userId', user.id),
      ]);

      setAchievements(achievementsData);
      setStats(statsData[0] || null);

      // Verificar e desbloquear novas conquistas
      if (statsData[0]) {
        await checkAndUnlockAchievements(statsData[0], achievementsData);
      }
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
    }
  };

  const checkAndUnlockAchievements = async (currentStats: UserStats, currentAchievements: Achievement[]) => {
    const unlockedIds = new Set(currentAchievements.filter(a => a.unlocked).map(a => a.id));
    const newUnlocks: Achievement[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (unlockedIds.has(def.id)) continue;

      const progress = def.checkProgress(currentStats);
      const isUnlocked = progress >= def.requirement;

      const existing = currentAchievements.find(a => a.id === def.id);

      if (existing) {
        // Atualizar progresso
        if (existing.progress !== progress || (isUnlocked && !existing.unlocked)) {
          const updated: Achievement = {
            ...existing,
            progress,
            unlocked: isUnlocked,
            unlockedAt: isUnlocked ? new Date() : existing.unlockedAt,
          };
          await db.update(STORES.achievements, updated);
          
          if (isUnlocked && !existing.unlocked) {
            newUnlocks.push(updated);
          }
        }
      } else {
        // Criar nova conquista
        const newAchievement: Achievement = {
          id: def.id,
          userId: user!.id,
          type: def.type,
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
          requirement: def.requirement,
          progress,
          unlocked: isUnlocked,
          unlockedAt: isUnlocked ? new Date() : undefined,
          xpReward: def.xpReward,
        };
        await db.add(STORES.achievements, newAchievement);
        
        if (isUnlocked) {
          newUnlocks.push(newAchievement);
        }
      }
    }

    if (newUnlocks.length > 0) {
      // Mostrar celebração
      showCelebration(newUnlocks);
      // Recarregar dados
      await loadData();
    }
  };

  const showCelebration = (newAchievements: Achievement[]) => {
    // TODO: Implementar modal de celebração animado
    console.log('Novas conquistas desbloqueadas!', newAchievements);
  };

  const filteredAchievements = achievements.filter(a => {
    if (showUnlocked && !a.unlocked) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    return true;
  });

  const categories = ['all', 'bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;

  const totalAchievements = ACHIEVEMENT_DEFINITIONS.length;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header redesenhado */}
        <div className="mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-1">Conquistas</h1>
                <p className="text-slate-400">Desbloqueie badges e ganhe XP</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Desbloqueadas</span>
                </div>
                <p className="text-4xl font-black text-white">
                  {unlockedCount}<span className="text-slate-600">/{totalAchievements}</span>
                </p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">XP Ganho</span>
                </div>
                <p className="text-4xl font-black text-white">{totalXP.toLocaleString()}</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Progresso</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-black text-xl">
                    {Math.round((unlockedCount / totalAchievements) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros redesenhados */}
        <div className="mb-6 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-lg scale-105'
                  : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'TODAS' : CATEGORY_NAMES[cat].toUpperCase()}
            </button>
          ))}

          <button
            onClick={() => setShowUnlocked(!showUnlocked)}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all ml-auto ${
              showUnlocked
                ? 'bg-green-500 text-white border-2 border-green-400'
                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            {showUnlocked ? '✓ DESBLOQUEADAS' : 'TODAS'}
          </button>
        </div>

        {/* Grid de Conquistas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const progressPercent = Math.min((achievement.progress / achievement.requirement) * 100, 100);

            return (
              <div
                key={achievement.id}
                className={`relative group ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br ' + CATEGORY_COLORS[achievement.category]
                    : 'bg-slate-900 border-slate-800'
                } rounded-2xl p-6 border-2 transition-all duration-300 ${
                  achievement.unlocked
                    ? 'border-transparent shadow-2xl hover:scale-105'
                    : 'hover:border-slate-700'
                }`}
              >
                {/* Badge Icon */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`text-6xl ${achievement.unlocked ? '' : 'grayscale opacity-30'}`}>
                    {achievement.unlocked ? achievement.icon : <Lock className="w-14 h-14 text-slate-700" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-black mb-1 ${achievement.unlocked ? 'text-white' : 'text-slate-500'}`}>
                      {achievement.name}
                    </h3>
                    <p className={`text-sm ${achievement.unlocked ? 'text-white/90' : 'text-slate-600'}`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {!achievement.unlocked && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 font-bold mb-2">
                      <span>PROGRESSO</span>
                      <span>
                        {achievement.progress}/{achievement.requirement}
                      </span>
                    </div>
                    <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <span className={`text-xs font-black uppercase tracking-wider ${achievement.unlocked ? 'text-white/80' : 'text-slate-600'}`}>
                    {CATEGORY_NAMES[achievement.category]}
                  </span>
                  <span className={`text-sm font-black ${achievement.unlocked ? 'text-yellow-300' : 'text-slate-600'}`}>
                    +{achievement.xpReward} XP
                  </span>
                </div>

                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white font-black border border-white/20">
                      ✓ Desbloqueada
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-20">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Nenhuma conquista encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
