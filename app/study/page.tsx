'use client';

import { useState, useEffect } from 'react';
import { Brain, Plus, BookOpen, TrendingUp, Clock, Trash2, Edit2, Play, Home } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { FlashcardDeck, Flashcard, StudySession } from '@/lib/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { useRouter } from 'next/navigation';

export default function StudyPage() {
  const router = useRouter();
  const { user, addXP } = useAppStore();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  
  // Forms
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardTags, setCardTags] = useState('');

  useEffect(() => {
    loadDecks();
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      loadCards(selectedDeck.id);
    }
  }, [selectedDeck]);

  const loadDecks = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const allDecks = await db.getAll<FlashcardDeck>('flashcardDecks');
      setDecks(allDecks);
    } catch (error) {
      console.error('Erro ao carregar baralhos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async (deckId: string) => {
    const allCards = await db.getAll<Flashcard>('flashcards');
    const deckCards = allCards.filter(card => card.deckId === deckId);
    setCards(deckCards);
  };

  const createDeck = async () => {
    if (!deckName.trim() || !user) return;

    const newDeck: FlashcardDeck = {
      id: generateId(),
      userId: user.id,
      name: deckName,
      description: deckDescription,
      cardCount: 0,
      createdAt: new Date(),
      lastStudied: null
    };

    await db.add('flashcardDecks', newDeck);
    await loadDecks();
    setDeckName('');
    setDeckDescription('');
    setShowCreateDeck(false);
  };

  const createCard = async () => {
    if (!cardFront.trim() || !cardBack.trim() || !selectedDeck || !user) return;

    const newCard: Flashcard = {
      id: generateId(),
      userId: user.id,
      deckId: selectedDeck.id,
      front: cardFront,
      back: cardBack,
      tags: cardTags.split(',').map(t => t.trim()).filter(t => t),
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date(),
      lastReviewed: null,
      createdAt: new Date()
    };

    await db.add('flashcards', newCard);
    
    const updatedDeck = { ...selectedDeck, cardCount: selectedDeck.cardCount + 1 };
    await db.update('flashcardDecks', updatedDeck);
    
    await loadCards(selectedDeck.id);
    await loadDecks();
    setCardFront('');
    setCardBack('');
    setCardTags('');
    setShowCreateCard(false);
  };

  const updateCard = async () => {
    if (!editingCard || !cardFront.trim() || !cardBack.trim()) return;

    const updatedCard: Flashcard = {
      ...editingCard,
      front: cardFront,
      back: cardBack,
      tags: cardTags.split(',').map(t => t.trim()).filter(t => t)
    };

    await db.update('flashcards', updatedCard);
    await loadCards(editingCard.deckId);
    setEditingCard(null);
    setCardFront('');
    setCardBack('');
    setCardTags('');
  };

  const deleteCard = async (cardId: string) => {
    if (!selectedDeck) return;
    
    await db.delete('flashcards', cardId);
    
    const updatedDeck = { ...selectedDeck, cardCount: selectedDeck.cardCount - 1 };
    await db.update('flashcardDecks', updatedDeck);
    
    await loadCards(selectedDeck.id);
    await loadDecks();
  };

  const deleteDeck = async (deckId: string) => {
    const allCards = await db.getAll<Flashcard>('flashcards');
    const deckCards = allCards.filter(card => card.deckId === deckId);
    for (const card of deckCards) {
      await db.delete('flashcards', card.id);
    }
    
    await db.delete('flashcardDecks', deckId);
    await loadDecks();
    
    if (selectedDeck?.id === deckId) {
      setSelectedDeck(null);
      setCards([]);
    }
  };

  const startStudySession = () => {
    if (cards.length === 0) return;
    
    const sortedCards = [...cards].sort((a, b) => {
      return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
    });
    
    setCards(sortedCards);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setStudyMode(true);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
  };

  const endStudySession = async () => {
    if (!selectedDeck || !user) return;

    const session: StudySession = {
      id: generateId(),
      userId: user.id,
      subject: selectedDeck.name,
      topic: selectedDeck.description || undefined,
      duration: 0,
      technique: 'spaced-repetition',
      date: new Date(),
      notes: `${sessionStats.correct} acertos de ${sessionStats.total} cards`,
      rating: sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 5) : 3
    };

    await db.add('studySessions', session);

    const updatedDeck = { ...selectedDeck, lastStudied: new Date() };
    await db.update('flashcardDecks', updatedDeck);
    await loadDecks();

    const xpEarned = sessionStats.correct * 5;
    addXP(xpEarned);

    setStudyMode(false);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const rateCard = async (quality: number) => {
    const card = cards[currentCardIndex];
    let { easeFactor, interval, repetitions } = card;

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      repetitions = 0;
      interval = 1;
      setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1, total: prev.total + 1 }));
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const updatedCard: Flashcard = {
      ...card,
      easeFactor,
      interval,
      repetitions,
      nextReview,
      lastReviewed: new Date()
    };

    await db.update('flashcards', updatedCard);

    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      endStudySession();
    }
  };

  const getDueCards = () => {
    const now = new Date();
    return cards.filter(card => new Date(card.nextReview) <= now);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase">Carregando...</p>
        </div>
      </div>
    );
  }

  if (studyMode && cards.length > 0) {
    const currentCard = cards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / cards.length) * 100;

    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-black text-white uppercase">
                {selectedDeck?.name}
              </h1>
              <button
                onClick={endStudySession}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black uppercase shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
              >
                Finalizar
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-slate-400 font-bold uppercase">
                <span>Card {currentCardIndex + 1}/{cards.length}</span>
                <span>✓ {sessionStats.correct} | ✗ {sessionStats.incorrect}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 border-2 border-slate-700">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-full rounded-full transition-all shadow-lg shadow-purple-500/30"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl p-10 min-h-[450px] flex flex-col justify-center items-center hover:border-purple-500/50 transition-all">
            <div className="text-center w-full">
              <div className="mb-10">
                <p className="text-sm text-purple-400 mb-4 font-black uppercase tracking-wider">
                  {showAnswer ? 'Resposta' : 'Pergunta'}
                </p>
                <h2 className="text-3xl font-black text-white whitespace-pre-wrap leading-relaxed">
                  {showAnswer ? currentCard.back : currentCard.front}
                </h2>
              </div>

              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-black uppercase shadow-xl shadow-purple-500/30 hover:scale-105 transition-all"
                >
                  Mostrar Resposta
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 mb-6 font-bold uppercase">
                    Como você avalia sua resposta?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => rateCard(1)}
                      className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black uppercase shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                    >
                      ✗ Errei
                    </button>
                    <button
                      onClick={() => rateCard(3)}
                      className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-xl font-black uppercase shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all"
                    >
                      ~ Difícil
                    </button>
                    <button
                      onClick={() => rateCard(4)}
                      className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-black uppercase shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                    >
                      ✓ Bom
                    </button>
                    <button
                      onClick={() => rateCard(5)}
                      className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-black uppercase shadow-lg shadow-green-500/20 hover:scale-105 transition-all"
                    >
                      ✓✓ Fácil
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {currentCard.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {currentCard.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-slate-800 border-2 border-slate-700 text-purple-400 rounded-xl text-sm font-bold uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b-2 border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase"
            >
              <Home className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              SISTEMA DE ESTUDOS
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <p className="text-slate-400 font-bold uppercase text-sm">
            Flashcards com Spaced Repetition (SM-2 Algorithm)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg shadow-purple-500/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{decks.length}</p>
                <p className="text-xs text-slate-400 font-bold uppercase">Baralhos</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{cards.length}</p>
                <p className="text-xs text-slate-400 font-bold uppercase">Cards Totais</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-3 rounded-xl shadow-lg shadow-orange-500/20">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{getDueCards().length}</p>
                <p className="text-xs text-slate-400 font-bold uppercase">Para Revisar</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg shadow-green-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{sessionStats.correct}</p>
                <p className="text-xs text-slate-400 font-bold uppercase">Acertos Hoje</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white uppercase">
                  Baralhos
                </h2>
                <button
                  onClick={() => setShowCreateDeck(true)}
                  className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/20 hover:scale-110 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {decks.map(deck => (
                  <div
                    key={deck.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedDeck?.id === deck.id
                        ? 'bg-purple-500/20 border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-800 border-2 border-slate-700 hover:border-purple-500/50'
                    }`}
                    onClick={() => setSelectedDeck(deck)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-white uppercase text-sm">
                        {deck.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Deletar este baralho e todos os seus cards?')) {
                            deleteDeck(deck.id);
                          }
                        }}
                        className="p-1 text-red-400 hover:text-red-300 hover:scale-110 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-2 font-medium">
                      {deck.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span>{deck.cardCount} cards</span>
                      {deck.lastStudied && (
                        <span>
                          {new Date(deck.lastStudied).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {decks.length === 0 && (
                  <p className="text-center text-slate-500 py-8 font-medium">
                    Nenhum baralho criado ainda
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedDeck ? (
              <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase">
                      {selectedDeck.name}
                    </h2>
                    <p className="text-sm text-slate-400 font-bold">
                      {cards.length} cards • {getDueCards().length} para revisar
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={startStudySession}
                      disabled={cards.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-black uppercase shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Estudar
                    </button>
                    <button
                      onClick={() => setShowCreateCard(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 flex items-center gap-2 font-black uppercase shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Novo
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {cards.map(card => {
                    const isDue = new Date(card.nextReview) <= new Date();
                    return (
                      <div
                        key={card.id}
                        className={`p-4 rounded-xl border-2 ${
                          isDue
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-white mb-1 text-sm">
                              {card.front}
                            </p>
                            <p className="text-xs text-slate-400">
                              {card.back}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCard(card);
                                setCardFront(card.front);
                                setCardBack(card.back);
                                setCardTags(card.tags.join(', '));
                              }}
                              className="p-1 text-blue-400 hover:text-blue-300 hover:scale-110 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Deletar este card?')) {
                                  deleteCard(card.id);
                                }
                              }}
                              className="p-1 text-red-400 hover:text-red-300 hover:scale-110 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                          <div className="flex gap-2">
                            {card.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-slate-700 border border-slate-600 text-purple-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <span>Rep: {card.repetitions}</span>
                            <span>
                              {new Date(card.nextReview).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {cards.length === 0 && (
                    <p className="text-center text-slate-500 py-12 font-medium">
                      Nenhum card neste baralho ainda
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-12 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/30">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <p className="text-slate-400 font-bold uppercase">
                  Selecione um baralho para ver os cards
                </p>
              </div>
            )}
          </div>
        </div>

        {showCreateDeck && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-6 uppercase text-center">
                ➕ Novo Baralho
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white font-medium transition-all"
                    placeholder="Ex: Inglês - Verbos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase">
                    Descrição
                  </label>
                  <textarea
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white font-medium transition-all resize-none"
                    rows={3}
                    placeholder="Descrição opcional"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateDeck(false)}
                    className="flex-1 px-4 py-3 bg-slate-800 border-2 border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all font-bold uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createDeck}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all font-black uppercase shadow-lg shadow-purple-500/20 hover:scale-105"
                  >
                    Criar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(showCreateCard || editingCard) && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-6 uppercase text-center">
                {editingCard ? 'Editar Card' : 'Novo Card'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase">
                    Frente (Pergunta)
                  </label>
                  <textarea
                    value={cardFront}
                    onChange={(e) => setCardFront(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white font-medium transition-all resize-none"
                    rows={3}
                    placeholder="O que você quer aprender?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase">
                    Verso (Resposta)
                  </label>
                  <textarea
                    value={cardBack}
                    onChange={(e) => setCardBack(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white font-medium transition-all resize-none"
                    rows={3}
                    placeholder="A resposta"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 uppercase">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={cardTags}
                    onChange={(e) => setCardTags(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white font-medium transition-all"
                    placeholder="Ex: verbo, presente, irregular"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateCard(false);
                      setEditingCard(null);
                      setCardFront('');
                      setCardBack('');
                      setCardTags('');
                    }}
                    className="flex-1 px-4 py-3 bg-slate-800 border-2 border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all font-bold uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingCard ? updateCard : createCard}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all font-black uppercase shadow-lg shadow-purple-500/20 hover:scale-105"
                  >
                    {editingCard ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Made with Bob
