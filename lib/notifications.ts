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

// Made with Bob
