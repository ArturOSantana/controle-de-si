# 🚀 Código Final - Implementações Críticas

## ⚠️ IMPORTANTE
Devido ao limite de tokens, este arquivo contém as implementações essenciais.
Para código completo e detalhado, consulte `IMPLEMENTAR_AGORA.md`

---

## 1. Reset Automático de Hábitos

### Adicionar imports em `app/habits/page.tsx` (linha 24):
```typescript
import { format, startOfDay, isToday, startOfWeek, startOfMonth, isAfter, isSameDay } from 'date-fns';
```

### Adicionar função após loadHabits (linha ~150):
```typescript
const checkAndResetHabits = async () => {
  if (!user) return;
  const today = startOfDay(new Date());
  
  for (const habit of habits) {
    const logs = await db.getByIndex<HabitLog>(STORES.habitLogs, 'habitId', habit.id);
    const todayLog = logs.find(l => isSameDay(new Date(l.date), today));
    
    if (!todayLog && habit.frequency === 'daily') {
      await db.add(STORES.habitLogs, {
        id: generateId(),
        habitId: habit.id,
        userId: user.id,
        completed: false,
        date: today
      });
    }
  }
  loadHabits();
};

useEffect(() => {
  if (user) checkAndResetHabits();
}, [user]);
```

---

## 2. Notificações para Diário

### Adicionar em `app/journal/page.tsx` após imports:
```typescript
import { Bell } from 'lucide-react';

// Adicionar estados
const [showReminderModal, setShowReminderModal] = useState(false);
const [reminderTime, setReminderTime] = useState('20:00');
const [reminderEnabled, setReminderEnabled] = useState(false);

// Adicionar função
const scheduleReminder = () => {
  if (!reminderEnabled) return;
  const [h, m] = reminderTime.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);
  if (scheduled < now) scheduled.setDate(scheduled.getDate() + 1);
  
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('Diário', { body: 'Hora de escrever!' });
    }
    scheduleReminder();
  }, scheduled.getTime() - now.getTime());
};

useEffect(() => { if (reminderEnabled) scheduleReminder(); }, [reminderEnabled]);
```

### Adicionar botão no header:
```typescript
<button onClick={() => setShowReminderModal(true)} className="p-3 bg-amber-600 rounded-xl">
  <Bell className="w-5 h-5" />
</button>
```

### Adicionar modal antes do fechamento:
```typescript
{showReminderModal && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full">
      <h2 className="text-2xl font-black mb-4">Lembrete</h2>
      <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} 
        className="w-full px-4 py-2 bg-slate-800 rounded-lg text-white mb-4" />
      <button onClick={() => { setReminderEnabled(!reminderEnabled); setShowReminderModal(false); }}
        className="w-full px-4 py-2 bg-amber-600 rounded-lg font-bold">
        {reminderEnabled ? 'Desativar' : 'Ativar'}
      </button>
    </div>
  </div>
)}
```

---

## 3. Planejamento Semanal

### Adicionar em `app/tasks/page.tsx`:
```typescript
// Estado
const [activeTab, setActiveTab] = useState<'inbox' | 'week'>('inbox');

// Função
const getTasksByDay = () => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days.reduce((acc, day, i) => {
    acc[day] = tasks.filter(t => t.dueDate && new Date(t.dueDate).getDay() === i && !t.completed);
    return acc;
  }, {} as Record<string, typeof tasks>);
};
```

### Adicionar navegação:
```typescript
<div className="flex gap-2 mb-6">
  <button onClick={() => setActiveTab('inbox')} 
    className={`px-6 py-3 rounded-xl font-bold ${activeTab === 'inbox' ? 'bg-blue-600' : 'bg-slate-800'}`}>
    Inbox
  </button>
  <button onClick={() => setActiveTab('week')}
    className={`px-6 py-3 rounded-xl font-bold ${activeTab === 'week' ? 'bg-blue-600' : 'bg-slate-800'}`}>
    Semana
  </button>
</div>
```

### Adicionar visualização:
```typescript
{activeTab === 'week' && (
  <div className="grid grid-cols-7 gap-2">
    {Object.entries(getTasksByDay()).map(([day, tasks]) => (
      <div key={day} className="bg-slate-900 p-3 rounded-xl">
        <h3 className="font-black mb-2">{day}</h3>
        {tasks.map(t => (
          <div key={t.id} className="bg-slate-800 p-2 rounded mb-1 text-xs">
            {t.title}
          </div>
        ))}
      </div>
    ))}
  </div>
)}
```

---

## ✅ Pronto!

As 3 implementações essenciais estão prontas.
Para versão completa com notificações de deadline e mais features, consulte `IMPLEMENTAR_AGORA.md`