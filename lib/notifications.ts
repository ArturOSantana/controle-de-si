// Sistema de Notificações do Navegador
// Usa a Notification API nativa - 100% gratuito

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

class NotificationManager {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Solicitar permissão para notificações
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  }

  // Enviar notificação
  async send(config: NotificationConfig): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return null;
    }

    try {
      const notification = new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: config.tag,
        requireInteraction: config.requireInteraction || false,
        data: config.data,
      });

      // Auto-fechar após 10 segundos se não for requireInteraction
      if (!config.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      return notification;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return null;
    }
  }

  // Notificação de lembrete de hábito
  async notifyHabitReminder(habitName: string, time: string) {
    return this.send({
      title: '⏰ Lembrete de Hábito',
      body: `Hora de: ${habitName}`,
      tag: `habit-${habitName}`,
      requireInteraction: true,
      data: { type: 'habit', name: habitName, time }
    });
  }

  // Notificação de tarefa urgente
  async notifyUrgentTask(taskTitle: string) {
    return this.send({
      title: '🚨 Tarefa Urgente',
      body: taskTitle,
      tag: `task-${taskTitle}`,
      requireInteraction: true,
      data: { type: 'task', title: taskTitle }
    });
  }

  // Notificação de Pomodoro concluído
  async notifyPomodoroComplete(sessionNumber: number) {
    return this.send({
      title: '✅ Pomodoro Concluído!',
      body: `Sessão ${sessionNumber} finalizada. Hora de uma pausa!`,
      tag: 'pomodoro-complete',
      data: { type: 'pomodoro', session: sessionNumber }
    });
  }

  // Notificação de pausa terminada
  async notifyBreakComplete() {
    return this.send({
      title: '🔥 Pausa Terminada',
      body: 'Hora de voltar ao foco!',
      tag: 'break-complete',
      data: { type: 'break' }
    });
  }

  // Notificação de conquista desbloqueada
  async notifyAchievement(achievementName: string, description: string) {
    return this.send({
      title: '🏆 Conquista Desbloqueada!',
      body: `${achievementName}: ${description}`,
      tag: `achievement-${achievementName}`,
      requireInteraction: true,
      data: { type: 'achievement', name: achievementName }
    });
  }

  // Notificação de nível subido
  async notifyLevelUp(newLevel: number) {
    return this.send({
      title: '🎉 Level Up!',
      body: `Parabéns! Você alcançou o nível ${newLevel}!`,
      tag: 'level-up',
      requireInteraction: true,
      data: { type: 'level-up', level: newLevel }
    });
  }

  // Notificação de streak mantido
  async notifyStreakMilestone(days: number) {
    return this.send({
      title: '🔥 Sequência Mantida!',
      body: `${days} dias consecutivos! Continue assim!`,
      tag: 'streak-milestone',
      data: { type: 'streak', days }
    });
  }

  // Notificação de revisão de flashcards
  async notifyFlashcardReview(count: number) {
    return this.send({
      title: '📚 Hora de Revisar',
      body: `Você tem ${count} flashcard${count > 1 ? 's' : ''} para revisar`,
      tag: 'flashcard-review',
      requireInteraction: true,
      data: { type: 'flashcard', count }
    });
  }

  // Notificação de meta diária atingida
  async notifyDailyGoalReached() {
    return this.send({
      title: '🎯 Meta Diária Atingida!',
      body: 'Você completou sua meta de foco do dia!',
      tag: 'daily-goal',
      data: { type: 'daily-goal' }
    });
  }

  // Verificar se notificações estão habilitadas
  isEnabled(): boolean {
    return this.permission === 'granted';
  }

  // Obter status da permissão
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
  // Notificação diária de check-in
  async notifyDailyCheckIn() {
    return this.send({
      title: '📅 Hora de Atualizar!',
      body: 'Que tal dar uma olhada no seu progresso e atualizar suas metas?',
      tag: 'daily-checkin',
      requireInteraction: true,
      data: { type: 'daily-checkin' }
    });
  }
}

// Exportar instância singleton
export const notificationManager = new NotificationManager();

// Função helper para agendar notificações recorrentes
export function scheduleHabitReminders(habits: Array<{ name: string; time?: string }>) {
  habits.forEach(habit => {
    if (!habit.time) return;

    const [hours, minutes] = habit.time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Se o horário já passou hoje, agendar para amanhã
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      notificationManager.notifyHabitReminder(habit.name, habit.time!);
      // Reagendar para o próximo dia
      scheduleHabitReminders([habit]);
    }, timeUntilNotification);
  });
}

// Função para agendar notificação diária de check-in
export function scheduleDailyCheckIn(hour: number = 20, minute: number = 0) {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // Se o horário já passou hoje, agendar para amanhã
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  setTimeout(() => {
    notificationManager.notifyDailyCheckIn();
    // Reagendar para o próximo dia (24 horas)
    scheduleDailyCheckIn(hour, minute);
  }, timeUntilNotification);

  console.log(`Notificação diária agendada para ${scheduledTime.toLocaleString('pt-BR')}`);
}

// Função para agendar notificações a cada 6 horas
export function scheduleEvery6Hours() {
  const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 horas em milissegundos
  
  const sendNotification = () => {
    notificationManager.send({
      title: '⏰ Lembrete de 6h',
      body: 'Hora de revisar seu progresso e manter o foco!',
      tag: 'six-hour-reminder'
    });
  };

  // Enviar primeira notificação após 6 horas
  setTimeout(() => {
    sendNotification();
    // Continuar enviando a cada 6 horas
    setInterval(sendNotification, SIX_HOURS);
  }, SIX_HOURS);

  console.log('Notificações a cada 6 horas ativadas');
}

// Função para agendar notificações a cada 12 horas
export function scheduleEvery12Hours() {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 horas em milissegundos
  
  const sendNotification = () => {
    notificationManager.send({
      title: '🌟 Check-in de 12h',
      body: 'Metade do dia! Como está seu progresso?',
      tag: 'twelve-hour-reminder'
    });
  };

  // Enviar primeira notificação após 12 horas
  setTimeout(() => {
    sendNotification();
    // Continuar enviando a cada 12 horas
    setInterval(sendNotification, TWELVE_HOURS);
  }, TWELVE_HOURS);

  console.log('Notificações a cada 12 horas ativadas');
}

// Made with Bob
