# 🔄 Lógica do Sistema - Controle de Si

## 📅 Reset Diário de Hábitos

### Como Funciona

**SIM, os hábitos resetam automaticamente a cada dia!**

### Implementação Atual

O sistema usa a tabela `habitLogs` para registrar cada dia:

```typescript
interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  completed: boolean;
  date: Date;  // ← Data específica do registro
  emotion?: string;
  notes?: string;
}
```

### Comportamento

1. **Cada dia é um registro novo**
   - Quando você marca um hábito como concluído, cria um `habitLog` para AQUELE dia
   - No dia seguinte, o hábito aparece desmarcado novamente
   - Histórico completo fica salvo no banco

2. **Verificação de Conclusão**
   ```typescript
   // O sistema verifica se existe um log para HOJE
   const today = new Date().toDateString();
   const todayLog = habitLogs.find(log => 
     log.habitId === habit.id && 
     new Date(log.date).toDateString() === today
   );
   const isCompletedToday = todayLog?.completed || false;
   ```

3. **Sequência (Streak)**
   - Calculada automaticamente
   - Conta dias consecutivos com hábito concluído
   - Se pular um dia, a sequência reseta

### Exemplo Prático

```
Segunda: ✅ Exercício (concluído)
Terça: ✅ Exercício (concluído) - Streak: 2 dias
Quarta: ❌ Exercício (não fez) - Streak: 0 dias
Quinta: ✅ Exercício (concluído) - Streak: 1 dia
```

---

## 🔔 Sistema de Notificações

### Status Atual: ✅ IMPLEMENTADO

### Como Funciona

O sistema usa a **Notification API nativa do navegador** (100% gratuito, sem servidor).

### Tipos de Notificações

1. **Lembretes de Hábitos**
   - Notifica no horário definido no hábito
   - Ex: "Hora de fazer exercício!" às 07:00

2. **Pomodoro**
   - Notifica quando o timer termina
   - Notifica quando a pausa termina

3. **Tarefas**
   - Notifica tarefas com prazo próximo
   - Notifica tarefas atrasadas

4. **Estudos**
   - Notifica flashcards para revisar
   - Notifica agendamentos de estudo

### Como Ativar

1. **No Dashboard:**
   - Clique no ícone de sino (🔔) no canto superior direito
   - Permita notificações quando o navegador pedir

2. **Permissões:**
   - Chrome/Edge: Configurações > Privacidade > Notificações
   - Firefox: Preferências > Privacidade > Permissões
   - Safari: Preferências > Sites > Notificações

### Código de Implementação

```typescript
// lib/notifications.ts
export const notificationManager = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async send(options: NotificationOptions): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction
      });
    }
  }
};
```

### Agendamento de Lembretes

```typescript
// Agendar lembrete de hábito
export function scheduleHabitReminders(habits: Array<{name: string, time: string}>) {
  habits.forEach(habit => {
    const [hours, minutes] = habit.time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    if (scheduledTime > now) {
      const delay = scheduledTime.getTime() - now.getTime();
      setTimeout(() => {
        notificationManager.send({
          title: 'Lembrete de Hábito',
          body: `Hora de: ${habit.name}`,
          tag: `habit-${habit.name}`,
          requireInteraction: true
        });
      }, delay);
    }
  });
}
```

### Limitações

- ❌ Não funciona em modo anônimo/privado
- ❌ Precisa de permissão do usuário
- ❌ Pode ser bloqueado por configurações do navegador
- ✅ Funciona offline (PWA)
- ✅ Funciona em segundo plano (se PWA instalado)

---

## 📊 Cálculo do Score de Consistência

### Fórmula

```
Score = (Hábitos × 30) + (Tarefas × 30) + (Foco × 25) + (Sobriedade × 15)
Máximo: 100 pontos
```

### Componentes

1. **Hábitos (30 pontos)**
   - Hábitos concluídos hoje / Total de hábitos ativos
   - Ex: 3/5 hábitos = 18 pontos

2. **Tarefas (30 pontos)**
   - Tarefas concluídas hoje / Total de tarefas do dia
   - Ex: 4/6 tarefas = 20 pontos

3. **Foco (25 pontos)**
   - Minutos de foco hoje / Meta diária (120min padrão)
   - Ex: 60/120 min = 12.5 pontos

4. **Sobriedade (15 pontos)**
   - Dias sem recaída / 30 dias
   - Ex: 15/30 dias = 7.5 pontos

### Mensagens

- **80-100**: "Você está dominando!"
- **60-79**: "Bom ritmo, continue!"
- **40-59**: "Melhorando aos poucos"
- **0-39**: "Todo começo é difícil"

---

## 💾 Armazenamento de Dados

### IndexedDB

Todos os dados ficam salvos **localmente no navegador**:

- ✅ Funciona offline
- ✅ Sem necessidade de servidor
- ✅ Privacidade total (dados não saem do seu computador)
- ✅ Capacidade: ~50MB+ por site
- ❌ Se limpar dados do navegador, perde tudo
- ❌ Não sincroniza entre dispositivos

### Backup Manual

Para fazer backup dos dados:

1. Abra o Console (F12)
2. Execute:
```javascript
// Exportar dados
const exportData = async () => {
  const db = await indexedDB.open('controle_de_si_db', 4);
  // ... código de exportação
};
```

3. Salve o JSON gerado

### Sincronização Futura

Para sincronizar entre dispositivos, seria necessário:
- Backend (Firebase, Supabase, etc.)
- Sistema de autenticação
- API de sincronização

**Isso geraria custos** e não está no escopo atual (100% gratuito).

---

## 🔄 Atualização de Dados

### Tempo Real

O sistema atualiza dados em tempo real:

- ✅ Marcar hábito → Atualiza score imediatamente
- ✅ Completar tarefa → Atualiza estatísticas
- ✅ Finalizar Pomodoro → Adiciona tempo de foco
- ✅ Marcar sobriedade → Atualiza contador

### Recarga de Página

Não é necessário recarregar a página, mas se fizer:
- ✅ Todos os dados são carregados do IndexedDB
- ✅ Estado é restaurado corretamente
- ✅ Nada é perdido

---

## 🎯 Próximas Melhorias

1. **Sistema de Metas** (em implementação)
2. **Exportar/Importar dados**
3. **Temas personalizados**
4. **Mais tipos de gráficos**
5. **Integração com calendário**

---

**Desenvolvido com ❤️ por Bob**