'use client';

import { useEffect, useState } from 'react';
import { Gift, Plus, Trash2, ShoppingBag, Coffee, Gamepad2, Film, Sparkles, X } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { STORES, Reward } from '@/lib/db/schema';
import { useAppStore } from '@/stores/useAppStore';

const CATEGORY_ICONS = {
  food: Coffee,
  entertainment: Film,
  rest: Sparkles,
  shopping: ShoppingBag,
  experience: Gamepad2,
  custom: Gift,
};

const CATEGORY_LABELS = {
  food: 'Comida',
  entertainment: 'Entretenimento',
  rest: 'Descanso',
  shopping: 'Compras',
  experience: 'Experiência',
  custom: 'Personalizado',
};

export default function RewardsPage() {
  const { user, userStats } = useAppStore();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🎁',
    cost: 100,
    category: 'custom' as Reward['category'],
  });

  useEffect(() => {
    loadRewards();
  }, [user]);

  const loadRewards = async () => {
    if (!user) return;
    try {
      const data = await db.getByIndex<Reward>(STORES.rewards, 'userId', user.id);
      setRewards(data.sort((a, b) => a.cost - b.cost));
    } catch (error) {
      console.error('Erro ao carregar recompensas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingReward) {
        const updated: Reward = {
          ...editingReward,
          ...formData,
        };
        await db.update(STORES.rewards, updated);
      } else {
        const newReward: Reward = {
          id: generateId(),
          userId: user.id,
          ...formData,
          redeemed: false,
          createdAt: new Date(),
        };
        await db.add(STORES.rewards, newReward);
      }

      await loadRewards();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar recompensa:', error);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    const currentXP = userStats?.xp || 0;
    if (!user || currentXP < reward.cost) return;

    const confirmed = confirm(
      `Resgatar "${reward.name}" por ${reward.cost} XP?\n\nVocê tem ${currentXP} XP disponível.`
    );

    if (confirmed) {
      try {
        // Atualizar recompensa
        const updated: Reward = {
          ...reward,
          redeemed: true,
          redeemedAt: new Date(),
        };
        await db.update(STORES.rewards, updated);

        // Deduzir XP do usuário
        useAppStore.getState().addXP(-reward.cost);

        await loadRewards();
        alert('Recompensa resgatada! Aproveite!');
      } catch (error) {
        console.error('Erro ao resgatar recompensa:', error);
      }
    }
  };

  const handleDelete = async (reward: Reward) => {
    const confirmed = confirm(`Deletar "${reward.name}"?`);
    if (confirmed) {
      try {
        await db.delete(STORES.rewards, reward.id);
        await loadRewards();
      } catch (error) {
        console.error('Erro ao deletar recompensa:', error);
      }
    }
  };

  const openModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        name: reward.name,
        description: reward.description,
        icon: reward.icon,
        cost: reward.cost,
        category: reward.category,
      });
    } else {
      setEditingReward(null);
      setFormData({
        name: '',
        description: '',
        icon: '🎁',
        cost: 100,
        category: 'custom',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReward(null);
  };

  const availableRewards = rewards.filter(r => !r.redeemed);
  const redeemedRewards = rewards.filter(r => r.redeemed);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header redesenhado */}
        <div className="mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/50">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white mb-1">Recompensas</h1>
                  <p className="text-slate-400">Troque XP por coisas que você ama</p>
                </div>
              </div>

              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-black hover:scale-105 transition-transform shadow-lg"
              >
                <Plus className="w-5 h-5" />
                CRIAR
              </button>
            </div>

            {/* XP Disponível */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">XP Disponível</p>
                  <p className="text-5xl font-black text-white">{(userStats?.xp || 0).toLocaleString()}</p>
                </div>
                <Sparkles className="w-14 h-14 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Recompensas Disponíveis */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white mb-4">DISPONÍVEIS</h2>
          {availableRewards.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <Gift className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 text-lg mb-4">Nenhuma recompensa ainda</p>
              <button
                onClick={() => openModal()}
                className="bg-pink-500 text-white px-6 py-3 rounded-xl font-black hover:bg-pink-600 transition-colors"
              >
                CRIAR PRIMEIRA
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRewards.map((reward) => {
                const Icon = CATEGORY_ICONS[reward.category];
                const currentXP = userStats?.xp || 0;
                const canAfford = currentXP >= reward.cost;

                return (
                  <div
                    key={reward.id}
                    className={`relative bg-slate-900 border-2 rounded-2xl p-6 transition-all ${
                      canAfford
                        ? 'border-green-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20'
                        : 'border-slate-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-6xl">{reward.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white mb-1">{reward.name}</h3>
                        <p className="text-sm text-slate-400">{reward.description}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(reward)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{CATEGORY_LABELS[reward.category]}</span>
                      </div>
                      <span className="text-xl font-black text-yellow-400">{reward.cost} XP</span>
                    </div>

                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canAfford}
                      className={`w-full mt-4 py-3 rounded-xl font-black transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? '✓ RESGATAR' : '✗ SEM XP'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recompensas Resgatadas */}
        {redeemedRewards.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Resgatadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {redeemedRewards.map((reward) => {
                const Icon = CATEGORY_ICONS[reward.category];

                return (
                  <div
                    key={reward.id}
                    className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-5xl grayscale">{reward.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-400 mb-1">{reward.name}</h3>
                        <p className="text-sm text-gray-500">{reward.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{CATEGORY_LABELS[reward.category]}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {reward.redeemedAt && new Date(reward.redeemedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-xl py-2 text-center">
                      <span className="text-green-400 font-bold">✓ Resgatada</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}
                </h2>
                <button onClick={closeModal} className="text-white hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="Ex: Pizza no fim de semana"
                    required
                  />
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-2">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                    placeholder="Descreva sua recompensa..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Emoji</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl focus:outline-none focus:border-purple-400"
                      maxLength={2}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Custo (XP)</label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-2">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Reward['category'] })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value} className="bg-purple-900">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    {editingReward ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
