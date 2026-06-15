# 🔍 Análise e Melhorias Solicitadas

## 📋 Solicitações do Usuário

### 1. ✅ Notificações para Diário
- Usuário deve poder marcar horário para ser lembrado de escrever no diário
- Notificação do navegador no horário escolhido

### 2. ✅ Organização Semanal de Tarefas
- Forma de organizar tarefas da semana
- Lembrete para fazer essa organização

### 3. ✅ Verificar Lógica de Vícios
- Conferir se está cadastrando corretamente
- Como é acompanhada a sobriedade
- Como são calculadas e registradas as recaídas

### 4. ✅ Verificar Lógica de Hábitos
- Hábitos resetam a cada 24h?
- Existem hábitos semanais que resetam após uma semana?
- Hábitos têm validade?

---

## 🔴 ANÁLISE: Sistema de Vícios

### Status Atual (IMPLEMENTADO CORRETAMENTE ✅)

**Schema (lib/db/schema.ts):**
```typescript
interface Addiction {
  id: string;
  userId: string;
  name: string;
  type: 'digital' | 'substance' | 'behavior';
  description?: string;
  startDate: Date;
  sobrietyDate?: Date; // última vez que ficou limpo
  active: boolean;
}

interface AddictionLog {
  id: string;
  addictionId: string;
  userId: string;
  date: Date;
  relapsed: boolean; // true = recaída, false = vitória
  trigger?: string;
  emotion?: 'bored' | 'anxious' | 'lonely' | 'tired' | 'stressed';
  location?: 'home' | 'work' | 'social' | 'other';
  notes?: string;
}
```

**Lógica Implementada (app/addictions/page.tsx):**

1. **Cadastro de Vício:** ✅ Funciona
   - Cria novo Addiction com startDate e sobrietyDate = hoje
   - Salva no IndexedDB

2. **Cálculo de Sobriedade:** ✅ Correto
   ```typescript
   const getSobrietyDays = (addiction: Addiction): number => {
     if (!addiction.sobrietyDate) return 0;
     return differenceInDays(new Date(), new Date(addiction.sobrietyDate));
   };
   ```
   - Calcula diferença entre hoje e sobrietyDate
   - Retorna número de dias limpo

3. **Registro de Recaída:** ✅ Funciona
   ```typescript
   const handleRelapse = async (addiction: Addiction, trigger?, emotion?) => {
     // Cria log de recaída
     const log: AddictionLog = {
       id: generateId(),
       addictionId: addiction.id,
       userId: user.id,
       date: new Date(),
       relapsed: true, // MARCA COMO RECAÍDA
       trigger,
       emotion,
       notes: ''
     };
     await db.add(STORES.addictionLogs, log);
     
     // RESETA data de sobriedade para HOJE
     addiction.sobrietyDate = new Date();
     await db.update(STORES.addictions, addiction);
   };
   ```

4. **Contagem de Recaídas:** ✅ Correto
   ```typescript
   const getRelapseCount = (addictionId: string): number => {
     return logs.filter(l => l.addictionId === addictionId && l.relapsed).length;
   };
   ```

5. **Registro de Vitória:** ✅ Implementado
   - Cria log com `relapsed: false`
   - Não reseta sobrietyDate
   - Adiciona XP ao usuário

### ✅ CONCLUSÃO: Sistema de Vícios está CORRETO

---

## 🟢 ANÁLISE: Sistema de Hábitos

### Status Atual

**Schema (lib/db/schema.ts):**
```typescript
interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly'; // ✅ TEM FREQUÊNCIAS
  anchor?: string; // Habit stacking
  duration: number;
  time?: string;
  streak: number;
  lastCompleted?: Date;
  createdAt: Date;
  active: boolean;
}

interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  completed: boolean;
  date: Date;
  emotion?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'tired';
  notes?: string;
}
```

### ⚠️ PROBLEMAS IDENTIFICADOS:

1. **Reset Diário:** ❌ NÃO IMPLEMENTADO
   - Hábitos não resetam automaticamente a cada 24h
   - Cada dia deveria criar um novo HabitLog
   - Atualmente: marca no mesmo registro

2. **Hábitos Semanais:** ⚠️ PARCIALMENTE
   - Schema tem `frequency: 'weekly'`
   - Mas lógica de reset semanal não está clara
   - Não há verificação de "semana completa"

3. **Validade de Hábitos:** ❌ NÃO TEM
   - Não existe campo de data de expiração
   - Hábitos ficam ativos indefinidamente
   - Apenas podem ser arquivados manualmente

### 📊 Como DEVERIA Funcionar (baseado em ideias.txt):

**Do ideias.txt (linhas 98-120):**
- Hábitos diários: resetam todo dia às 00:00
- Hábitos semanais: resetam toda segunda-feira
- Hábitos mensais: resetam todo dia 1
- Cada dia = novo registro no HabitLog
- Streak aumenta apenas se completar no dia correto

---

## 🎯 MELHORIAS A IMPLEMENTAR

### 1. Sistema de Notificações para Diário
**Arquivo:** `lib/db/schema.ts` + `app/journal/page.tsx`

**Adicionar ao User Settings:**
```typescript
interface UserSettings {
  // ... existentes
  journalReminderTime?: string; // "20:00"
  journalReminderEnabled: boolean;
}
```

**Implementar:**
- Modal de configuração na página do diário
- Agendar notificação diária no horário escolhido
- Usar Notification API (já implementada)

---

### 2. Planejamento Semanal de Tarefas
**Arquivo:** `app/tasks/page.tsx`

**Adicionar:**
- Aba "Planejamento Semanal"
- Visualização de tarefas por dia da semana
- Drag & drop para organizar
- Notificação domingo à noite: "Hora de planejar sua semana!"

---

### 3. Corrigir Reset de Hábitos
**Arquivo:** `app/habits/page.tsx`

**Implementar:**
- Verificação diária: criar novo HabitLog para cada hábito ativo
- Lógica de reset baseada em frequency:
  - `daily`: novo log todo dia
  - `weekly`: novo log toda segunda
  - `monthly`: novo log todo dia 1
- Função `checkAndResetHabits()` executada ao abrir o app

---

### 4. Adicionar Validade aos Hábitos (Opcional)
**Arquivo:** `lib/db/schema.ts`

**Adicionar:**
```typescript
interface Habit {
  // ... existentes
  expiresAt?: Date; // Data de expiração
  archived: boolean; // Separar de active
}
```

---

## 📝 ORDEM DE IMPLEMENTAÇÃO

1. ✅ **Notificações para Diário** (15 min)
2. ✅ **Planejamento Semanal** (20 min)
3. ✅ **Corrigir Reset de Hábitos** (25 min)
4. ⏸️ **Validade de Hábitos** (opcional, 10 min)

**Tempo total estimado:** ~60 minutos

---

## 🔧 CÓDIGO PRONTO

### 1. Notificações para Diário

**Adicionar ao schema:**
```typescript
// lib/db/schema.ts - linha 18
journalReminderTime?: string;
journalReminderEnabled: boolean;
```

**Adicionar à página do diário:**
```typescript
// app/journal/page.tsx
const [reminderTime, setReminderTime] = useState('20:00');
const [reminderEnabled, setReminderEnabled] = useState(false);

const scheduleJournalReminder = () => {
  if (!reminderEnabled || !reminderTime) return;
  
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);
  
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
};
```

### 2. Planejamento Semanal

**Adicionar aba na página de tarefas:**
```typescript
// app/tasks/page.tsx
const [activeTab, setActiveTab] = useState<'inbox' | 'week'>('inbox');

// Função para organizar por dia da semana
const getTasksByDay = () => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const tasksByDay: Record<string, Task[]> = {};
  
  days.forEach(day => {
    tasksByDay[day] = tasks.filter(t => {
      if (!t.dueDate) return false;
      const taskDay = new Date(t.dueDate).getDay();
      return days[taskDay] === day;
    });
  });
  
  return tasksByDay;
};
```

### 3. Reset de Hábitos

**Adicionar função de verificação:**
```typescript
// app/habits/page.tsx
const checkAndResetHabits = async () => {
  if (!user) return;
  
  const today = startOfDay(new Date());
  
  for (const habit of habits) {
    // Verificar se já existe log para hoje
    const todayLog = await db.getByIndex<HabitLog>(
      STORES.habitLogs,
      'habitId-date',
      [habit.id, today]
    );
    
    if (todayLog.length === 0) {
      // Criar novo log para hoje
      const newLog: HabitLog = {
        id: generateId(),
        habitId: habit.id,
        userId: user.id,
        completed: false,
        date: today
      };
      await db.add(STORES.habitLogs, newLog);
    }
  }
  
  loadHabits();
};

// Executar ao montar componente
useEffect(() => {
  checkAndResetHabits();
}, [user]);
```

---

## ✅ PRÓXIMOS PASSOS

1. Implementar notificações para diário
2. Adicionar planejamento semanal de tarefas
3. Corrigir lógica de reset de hábitos
4. Testar todas as funcionalidades
5. Atualizar documentação