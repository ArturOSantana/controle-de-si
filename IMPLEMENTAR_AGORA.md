# 🚀 Implementações Finais - Código Completo

## ✅ Schema Atualizado

**Arquivo:** `lib/db/schema.ts` - ✅ JÁ IMPLEMENTADO

Novos campos adicionados:
- `Habit`: `weeklyResetDay`, `monthlyResetDay`, `lastReset`
- `UserSettings`: `journalReminderTime`, `journalReminderEnabled`, `weeklyPlanningDay`, `weeklyPlanningTime`, `weeklyPlanningEnabled`

---

## 1. 🔴 CRÍTICO: Corrigir Reset de Hábitos

### Arquivo: `app/habits/page.tsx`

### Adicionar após os imports (linha ~25):

```typescript
import { startOfDay, startOfWeek, startOfMonth, isAfter, isSameDay } from 'date-fns';
```

### Adicionar função antes do return (linha ~200):

```typescript
const checkAndResetHabits = async () => {
  if (!user) return;
  
  const now = new Date();
  const today = startOfDay(now);
  
  for (const habit of habits) {
    let shouldReset = false;
    let resetDate = today;
    
    // Verificar se precisa resetar baseado na frequência
    if (habit.frequency === 'daily') {
      // Hábitos diários resetam todo dia
      const lastReset = habit.lastReset ? startOfDay(new Date(habit.lastReset)) : null;
      shouldReset = !lastReset || !isSameDay(lastReset, today);
      
    } else if (habit.frequency === 'weekly') {
      // Hábitos semanais resetam no dia escolhido pelo usuário
      const resetDay = habit.weeklyResetDay ?? 1; // Padrão: segunda-feira
      const currentDay = now.getDay();
      
      if (currentDay === resetDay) {
        const lastReset = habit.lastReset ? new Date(habit.lastReset) : null;
        const weekStart = startOfWeek(now, { weekStartsOn: resetDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
        shouldReset = !lastReset || isAfter(weekStart, lastReset);
      }
      
    } else if (habit.frequency === 'monthly') {
      // Hábitos mensais resetam no dia escolhido do mês
      const resetDay = habit.monthlyResetDay ?? 1; // Padrão: dia 1
      const currentDate = now.getDate();
      
      if (currentDate === resetDay) {
        const lastReset = habit.lastReset ? new Date(habit.lastReset) : null;
        const monthStart = startOfMonth(now);
        shouldReset = !lastReset || isAfter(monthStart, lastReset);
      }
    }
    
    if (shouldReset) {
      // Verificar se já existe log para o período atual
      const existingLogs = await db.getByIndex<HabitLog>(
        STORES.habitLogs,
        'habitId',
        habit.id
      );
      
      const hasLogForPeriod = existingLogs.some(log => {
        const logDate = startOfDay(new Date(log.date));
        if (habit.frequency === 'daily') {
          return isSameDay(logDate, today);
        } else if (habit.frequency === 'weekly') {
          const weekStart = startOfWeek(today, { weekStartsOn: habit.weeklyResetDay as any ?? 1 });
          return isAfter(logDate, weekStart) || isSameDay(logDate, weekStart);
        } else {
          const monthStart = startOfMonth(today);
          return isAfter(logDate, monthStart) || isSameDay(logDate, monthStart);
        }
      });
      
      if (!hasLogForPeriod) {
        // Criar novo log
        const newLog: HabitLog = {
          id: generateId(),
          habitId: habit.id,
          userId: user.id,
          completed: false,
          date: resetDate
        };
        await db.add(STORES.habitLogs, newLog);
        
        // Atualizar lastReset do hábito
        habit.lastReset = resetDate;
        await db.update(STORES.habits, habit);
      }
    }
  }
  
  // Verificar hábitos próximos do vencimento e enviar notificações
  checkHabitDeadlines();
};

const checkHabitDeadlines = async () => {
  if (!user || !user.settings.notifications) return;
  if ('Notification' in window && Notification.permission !== 'granted') return;
  
  const now = new Date();
  
  for (const habit of habits) {
    const logs = await db.getByIndex<HabitLog>(STORES.habitLogs, 'habitId', habit.id);
    const currentPeriodLog = logs.find(log => {
      const logDate = new Date(log.date);
      if (habit.frequency === 'daily') {
        return isSameDay(logDate, now);
      } else if (habit.frequency === 'weekly') {
        const weekStart = startOfWeek(now, { weekStartsOn: habit.weeklyResetDay as any ?? 1 });
        return isAfter(logDate, weekStart) || isSameDay(logDate, weekStart);
      } else {
        const monthStart = startOfMonth(now);
        return isAfter(logDate, monthStart) || isSameDay(logDate, monthStart);
      }
    });
    
    if (currentPeriodLog && !currentPeriodLog.completed) {
      let hoursLeft = 0;
      
      if (habit.frequency === 'daily') {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59);
        hoursLeft = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
      } else if (habit.frequency === 'weekly') {
        const resetDay = habit.weeklyResetDay ?? 1;
        const daysUntilReset = (resetDay - now.getDay() + 7) % 7;
        hoursLeft = daysUntilReset * 24;
      } else {
        const resetDay = habit.monthlyResetDay ?? 1;
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        const daysUntilReset = resetDay > currentDay ? resetDay - currentDay : daysInMonth - currentDay + resetDay;
        hoursLeft = daysUntilReset * 24;
      }
      
      // Notificar se faltam menos de 3 horas (diário) ou 24 horas (semanal/mensal)
      const threshold = habit.frequency === 'daily' ? 3 : 24;
      
      if (hoursLeft <= threshold && hoursLeft > 0) {
        new Notification('Controle de Si - Hábito Pendente', {
          body: `Faltam ${Math.round(hoursLeft)}h para completar: ${habit.name}`,
          icon: '/icon-192x192.png',
          tag: `habit-deadline-${habit.id}`
        });
      }
    }
  }
};
```

### Adicionar useEffect após loadHabits (linha ~60):

```typescript
useEffect(() => {
  if (user) {
    checkAndResetHabits();
    // Verificar a cada hora
    const interval = setInterval(checkHabitDeadlines, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [user, habits]);
```

### Atualizar modal de criar/editar hábito para incluir campos de reset:

Adicionar após o campo "frequency" no modal:

```typescript
{frequency === 'weekly' && (
  <div>
    <label className="block text-sm font-bold text-slate-400 mb-2">
      Dia de Reset Semanal
    </label>
    <select
      value={weeklyResetDay ?? 1}
      onChange={(e) => setWeeklyResetDay(parseInt(e.target.value))}
      className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
    >
      <option value={0}>Domingo</option>
      <option value={1}>Segunda-feira</option>
      <option value={2}>Terça-feira</option>
      <option value={3}>Quarta-feira</option>
      <option value={4}>Quinta-feira</option>
      <option value={5}>Sexta-feira</option>
      <option value={6}>Sábado</option>
    </select>
  </div>
)}

{frequency === 'monthly' && (
  <div>
    <label className="block text-sm font-bold text-slate-400 mb-2">
      Dia de Reset Mensal
    </label>
    <input
      type="number"
      min="1"
      max="31"
      value={monthlyResetDay ?? 1}
      onChange={(e) => setMonthlyResetDay(parseInt(e.target.value))}
      className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
      placeholder="Dia do mês (1-31)"
    />
  </div>
)}
```

---

## 2. 📝 Notificações para Diário

### Arquivo: `app/journal/page.tsx`

### Adicionar estados no início do componente:

```typescript
const [showReminderModal, setShowReminderModal] = useState(false);
const [reminderTime, setReminderTime] = useState(user?.settings.journalReminderTime || '20:00');
const [reminderEnabled, setReminderEnabled] = useState(user?.settings.journalReminderEnabled || false);
```

### Adicionar função de agendamento:

```typescript
const scheduleJournalReminder = useCallback(() => {
  if (!reminderEnabled || !reminderTime || !user) return;
  
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  // Se o horário já passou hoje, agendar para amanhã
  if (scheduledTime < now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const timeUntilReminder = scheduledTime.getTime() - now.getTime();
  
  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Controle de Si - Diário', {
        body: 'Hora de refletir sobre seu dia! Escreva no seu diário.',
        icon: '/icon-192x192.png',
        tag: 'journal-reminder'
      });
    }
    // Reagendar para amanhã
    scheduleJournalReminder();
  }, timeUntilReminder);
}, [reminderEnabled, reminderTime, user]);

const saveReminderSettings = async () => {
  if (!user) return;
  
  user.settings.journalReminderTime = reminderTime;
  user.settings.journalReminderEnabled = reminderEnabled;
  
  await db.update(STORES.users, user);
  setShowReminderModal(false);
  
  if (reminderEnabled) {
    scheduleJournalReminder();
  }
};
```

### Adicionar useEffect para iniciar agendamento:

```typescript
useEffect(() => {
  if (user?.settings.journalReminderEnabled) {
    scheduleJournalReminder();
  }
}, [user, scheduleJournalReminder]);
```

### Adicionar botão de configuração no header:

```typescript
<button
  onClick={() => setShowReminderModal(true)}
  className="p-3 bg-amber-600 hover:bg-amber-700 rounded-xl transition-all hover:scale-105"
  title="Configurar Lembrete"
>
  <Bell className="w-5 h-5 text-white" />
</button>
```

### Adicionar modal de configuração antes do fechamento do componente:

```typescript
{showReminderModal && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border-2 border-amber-500/30">
      <h2 className="text-2xl font-black mb-4">Lembrete do Diário</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold">Ativar Lembrete</span>
          <button
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={`w-14 h-8 rounded-full transition-colors ${
              reminderEnabled ? 'bg-amber-600' : 'bg-slate-700'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
              reminderEnabled ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
        
        {reminderEnabled && (
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">
              Horário do Lembrete
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-amber-500 outline-none"
            />
          </div>
        )}
      </div>
      
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setShowReminderModal(false)}
          className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={saveReminderSettings}
          className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-bold transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 3. 📅 Planejamento Semanal de Tarefas

### Arquivo: `app/tasks/page.tsx`

### Adicionar estado para aba:

```typescript
const [activeTab, setActiveTab] = useState<'inbox' | 'week'>('inbox');
```

### Adicionar função para organizar por dia:

```typescript
const getTasksByDay = () => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const tasksByDay: Record<string, Task[]> = {};
  
  days.forEach((day, index) => {
    tasksByDay[day] = tasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      const taskDay = new Date(t.dueDate).getDay();
      return taskDay === index;
    });
  });
  
  return tasksByDay;
};

const scheduleWeeklyPlanning = useCallback(() => {
  if (!user?.settings.weeklyPlanningEnabled) return;
  
  const planningDay = user.settings.weeklyPlanningDay ?? 0; // Padrão: domingo
  const planningTime = user.settings.weeklyPlanningTime ?? '19:00';
  const [hours, minutes] = planningTime.split(':').map(Number);
  
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  // Calcular próximo dia de planejamento
  const daysUntilPlanning = (planningDay - now.getDay() + 7) % 7;
  scheduledTime.setDate(now.getDate() + daysUntilPlanning);
  
  if (scheduledTime < now) {
    scheduledTime.setDate(scheduledTime.getDate() + 7);
  }
  
  const timeUntilPlanning = scheduledTime.getTime() - now.getTime();
  
  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Controle de Si - Planejamento', {
        body: 'Hora de planejar sua semana! Organize suas tarefas.',
        icon: '/icon-192x192.png',
        tag: 'weekly-planning'
      });
    }
    scheduleWeeklyPlanning();
  }, timeUntilPlanning);
}, [user]);

useEffect(() => {
  if (user?.settings.weeklyPlanningEnabled) {
    scheduleWeeklyPlanning();
  }
}, [user, scheduleWeeklyPlanning]);
```

### Adicionar navegação de abas no JSX:

```typescript
<div className="flex gap-2 mb-6">
  <button
    onClick={() => setActiveTab('inbox')}
    className={`px-6 py-3 rounded-xl font-bold transition-all ${
      activeTab === 'inbox'
        ? 'bg-blue-600 text-white'
        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
    }`}
  >
    Caixa de Entrada
  </button>
  <button
    onClick={() => setActiveTab('week')}
    className={`px-6 py-3 rounded-xl font-bold transition-all ${
      activeTab === 'week'
        ? 'bg-blue-600 text-white'
        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
    }`}
  >
    Planejamento Semanal
  </button>
</div>
```

### Adicionar visualização semanal:

```typescript
{activeTab === 'week' && (
  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
    {Object.entries(getTasksByDay()).map(([day, dayTasks]) => (
      <div key={day} className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4">
        <h3 className="text-lg font-black text-white mb-3">{day}</h3>
        <div className="space-y-2">
          {dayTasks.map(task => (
            <div
              key={task.id}
              className="bg-slate-800 p-3 rounded-lg text-sm"
            >
              <p className="text-white font-bold">{task.title}</p>
              <span className={`text-xs ${
                task.priority === 'high' ? 'text-red-400' :
                task.priority === 'medium' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {task.priority === 'high' ? 'Alta' :
                 task.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
            </div>
          ))}
          {dayTasks.length === 0 && (
            <p className="text-slate-500 text-xs">Nenhuma tarefa</p>
          )}
        </div>
      </div>
    ))}
  </div>
)}
```

---

## ✅ Checklist de Implementação

- [ ] 1. Corrigir Reset de Hábitos (25 min)
  - [ ] Adicionar imports do date-fns
  - [ ] Adicionar função checkAndResetHabits
  - [ ] Adicionar função checkHabitDeadlines
  - [ ] Adicionar useEffect
  - [ ] Atualizar modal com campos de reset

- [ ] 2. Notificações para Diário (15 min)
  - [ ] Adicionar estados
  - [ ] Adicionar função scheduleJournalReminder
  - [ ] Adicionar função saveReminderSettings
  - [ ] Adicionar useEffect
  - [ ] Adicionar botão no header
  - [ ] Adicionar modal de configuração

- [ ] 3. Planejamento Semanal (20 min)
  - [ ] Adicionar estado activeTab
  - [ ] Adicionar função getTasksByDay
  - [ ] Adicionar função scheduleWeeklyPlanning
  - [ ] Adicionar useEffect
  - [ ] Adicionar navegação de abas
  - [ ] Adicionar visualização semanal

**Tempo total estimado:** ~60 minutos

---

## 🎯 Resultado Final

Após implementar tudo:

✅ **Hábitos:**
- Resetam automaticamente (diário/semanal/mensal)
- Usuário escolhe dia de reset para semanais/mensais
- Notificações quando está perto de vencer
- Sistema correto de logs por período

✅ **Diário:**
- Lembrete configurável pelo usuário
- Notificação no horário escolhido
- Reagenda automaticamente

✅ **Tarefas:**
- Visualização semanal organizada
- Lembrete para planejar a semana
- Fácil de ver o que fazer cada dia

**Sistema completo e funcional! 🚀**