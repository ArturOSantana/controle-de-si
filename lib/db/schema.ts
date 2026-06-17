// Schema do banco de dados local (IndexedDB)
// Funciona offline em web e mobile (PWA)

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
  pomodoroTime: number; // minutos
  shortBreak: number;
  longBreak: number;
  dailyGoal: number; // minutos de foco por dia
  journalReminderTime?: string; // "20:00"
  journalReminderEnabled: boolean;
  weeklyPlanningDay?: number; // 0-6 (domingo-sábado)
  weeklyPlanningTime?: string; // "19:00"
  weeklyPlanningEnabled: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  weeklyResetDay?: number; // 0-6 (domingo-sábado) para hábitos semanais
  monthlyResetDay?: number; // 1-31 para hábitos mensais
  anchor?: string; // Habit stacking - após qual hábito
  duration: number; // minutos
  time?: string; // horário sugerido
  streak: number;
  lastCompleted?: Date;
  lastReset?: Date; // última vez que o hábito foi resetado
  createdAt: Date;
  active: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  completed: boolean;
  date: Date;
  emotion?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'tired';
  notes?: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'inbox' | 'today' | 'scheduled' | 'someday' | 'delegated' | 'archived';
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  scheduledDate?: Date; // data agendada para planejamento semanal
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  tags?: string[];
  estimatedTime?: number; // minutos
}

export interface PomodoroSession {
  id: string;
  userId: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutos planejados
  actualDuration?: number; // minutos reais
  completed: boolean;
  interrupted: boolean;
  type: 'focus' | 'short-break' | 'long-break';
  notes?: string;
}

export interface Addiction {
  id: string;
  userId: string;
  name: string;
  type: 'digital' | 'substance' | 'behavior';
  description?: string;
  startDate: Date;
  sobrietyDate?: Date; // última vez que ficou limpo
  active: boolean;
}

export interface AddictionLog {
  id: string;
  addictionId: string;
  userId: string;
  date: Date;
  relapsed: boolean;
  trigger?: string;
  emotion?: 'bored' | 'anxious' | 'lonely' | 'tired' | 'stressed';
  location?: 'home' | 'work' | 'social' | 'other';
  notes?: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  topic?: string;
  duration: number; // minutos
  technique: 'pomodoro' | 'active-recall' | 'feynman' | 'spaced-repetition' | 'other';
  date: Date;
  notes?: string;
  rating?: number; // 1-5 quão produtiva foi
}

export interface Flashcard {
  id: string;
  userId: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  nextReview: Date;
  interval: number; // dias até próxima revisão
  easeFactor: number; // SM-2 algorithm
  repetitions: number;
  lastReviewed: Date | null;
  createdAt: Date;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  name: string;
  subject?: string;
  description?: string;
  createdAt: Date;
  lastStudied: Date | null;
  cardCount: number;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: Date;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  energy: number; // 1-10
  gratitude?: string[];
  learned?: string;
  reflection?: string;
  wins?: string[];
}

export interface Achievement {
  id: string;
  userId: string;
  type: 'habit' | 'study' | 'addiction' | 'task' | 'streak' | 'special';
  name: string;
  description: string;
  icon: string;
  category: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirement: number; // valor necessário para desbloquear
  progress: number; // progresso atual
  unlocked: boolean;
  unlockedAt?: Date;
  xpReward: number;
}

export interface Reward {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  cost: number; // XP necessário para resgatar
  category: 'food' | 'entertainment' | 'rest' | 'shopping' | 'experience' | 'custom';
  redeemed: boolean;
  redeemedAt?: Date;
  createdAt: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  level: number;
  xp: number;
  totalFocusTime: number; // minutos
  totalStudyTime: number;
  habitsCompleted: number;
  tasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: Date;
}

export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'work' | 'study' | 'exercise' | 'personal' | 'social' | 'rest' | 'meal' | 'commute';
  date: Date; // data do bloco
  startTime: string; // formato "HH:mm"
  endTime: string; // formato "HH:mm"
  completed: boolean;
  taskId?: string; // vinculado a uma tarefa
  habitId?: string; // vinculado a um hábito
  recurring?: 'daily' | 'weekly' | 'weekdays' | 'weekends'; // se repete
  color?: string; // cor personalizada
  createdAt: Date;
}

export interface StudySubject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string; // cor para identificação visual
  icon?: string;
  totalHoursGoal?: number; // meta de horas totais
  weeklyHoursGoal?: number; // meta de horas semanais
  priority: 'high' | 'medium' | 'low';
  active: boolean;
  createdAt: Date;
}

export interface StudyTopic {
  id: string;
  userId: string;
  subjectId: string;
  name: string;
  description?: string;
  estimatedHours?: number; // horas estimadas para dominar
  hoursSpent: number; // horas já estudadas
  status: 'not-started' | 'in-progress' | 'review' | 'mastered';
  difficulty: 'easy' | 'medium' | 'hard';
  priority: number; // 1-5
  dueDate?: Date;
  resources?: string[]; // links, livros, etc
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface StudySchedule {
  id: string;
  userId: string;
  subjectId: string;
  topicId?: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string; // formato "HH:mm"
  endTime: string; // formato "HH:mm"
  duration: number; // minutos calculados
  completed: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number;
  rating?: number; // 1-5 produtividade
  notes?: string;
  recurring?: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';
  recurringDays?: number[]; // 0-6 (domingo-sábado) para custom
  createdAt: Date;
}

export interface StudyGoal {
  id: string;
  userId: string;
  subjectId?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'total';
  targetHours: number;
  currentHours: number;
  startDate: Date;
  endDate?: Date;
  completed: boolean;
  createdAt: Date;
}

// Sistema M - Gestão de Múltiplos Interesses
export interface MProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  pillar: 'stability' | 'growth' | 'curiosity'; // Pilar do Sistema M
  
  // Respostas do questionário
  answers: {
    wantToMaster: boolean; // Quer dominar ou só experimentar?
    wantToMonetize: boolean | null; // Quer monetizar? (null = não aplicável)
    hasMarketDemand: boolean | null; // Tem demanda no mercado?
    isGoodAt: boolean | null; // É bom nisso?
    stillInterestedIn1Year: boolean | null; // Ainda estará interessado daqui 1 ano?
    complementsCareer: boolean | null; // Complementa carreira principal?
    wouldDoWithout10Hours: boolean | null; // Faria com 10h livres?
    alignsWithGoals: boolean | null; // Alinha com quem quer ser?
    canAbandonWithoutGuilt: boolean | null; // Pode abandonar sem culpa?
    feedsCreativity: boolean | null; // Alimenta criatividade?
    wouldDoWithoutPraise: boolean | null; // Faria sem elogios?
    regretNotTrying: boolean | null; // Se arrependeria de não tentar?
    isEscape: boolean | null; // Está usando para fugir de algo?
    requiresDepth: boolean | null; // Requer profundidade?
  };
  
  // Métricas
  hoursSpent: number; // horas dedicadas
  lastWorkedOn?: Date;
  startDate: Date;
  endDate?: Date; // para projetos com prazo
  
  // Status
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  priority: number; // 1-5
  
  // Notas e reflexões
  notes?: string;
  learnings?: string[]; // o que aprendeu
  challenges?: string[]; // desafios enfrentados
  
  // Relacionamentos
  relatedProjects?: string[]; // IDs de projetos relacionados
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Log de tempo dedicado a projetos do Sistema M
export interface MProjectLog {
  id: string;
  projectId: string;
  userId: string;
  date: Date;
  duration: number; // minutos
  activity: string; // o que fez
  progress?: string; // progresso alcançado
  mood?: 'motivated' | 'neutral' | 'frustrated' | 'excited';
  notes?: string;
}

// Revisão periódica dos projetos (recomendado mensalmente)
export interface MProjectReview {
  id: string;
  userId: string;
  date: Date;
  projects: {
    projectId: string;
    shouldContinue: boolean;
    shouldChangePillar: boolean;
    newPillar?: 'stability' | 'growth' | 'curiosity';
    reflections: string;
  }[];
  overallReflection?: string;
  nextReviewDate: Date;
}

// Estrutura do banco IndexedDB
export const DB_NAME = 'controle_de_si_db';
export const DB_VERSION = 5; // Incrementado para Sistema M

export const STORES = {
  users: 'users',
  habits: 'habits',
  habitLogs: 'habitLogs',
  tasks: 'tasks',
  pomodoroSessions: 'pomodoroSessions',
  addictions: 'addictions',
  addictionLogs: 'addictionLogs',
  studySessions: 'studySessions',
  flashcards: 'flashcards',
  flashcardDecks: 'flashcardDecks',
  dailyLogs: 'dailyLogs',
  achievements: 'achievements',
  rewards: 'rewards',
  userStats: 'userStats',
  timeBlocks: 'timeBlocks',
  studySubjects: 'studySubjects',
  studyTopics: 'studyTopics',
  studySchedules: 'studySchedules',
  studyGoals: 'studyGoals',
  mProjects: 'mProjects', // Sistema M
  mProjectLogs: 'mProjectLogs',
  mProjectReviews: 'mProjectReviews',
} as const;

// Made with Bob
