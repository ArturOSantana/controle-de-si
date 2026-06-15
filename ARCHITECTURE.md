# Arquitetura do LifeOS

## 📐 Visão Geral

```
lifeos/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard principal
│   ├── layout.tsx         # Layout global
│   ├── pomodoro/          # Timer Pomodoro
│   ├── habits/            # Gerenciador de hábitos (TODO)
│   ├── tasks/             # Sistema GTD (TODO)
│   ├── addictions/        # Anti-vícios (TODO)
│   └── study/             # Sistema de estudos (TODO)
│
├── components/            # Componentes React reutilizáveis
│   ├── dashboard/        # Componentes do dashboard
│   ├── habits/           # Componentes de hábitos
│   ├── pomodoro/         # Componentes do timer
│   ├── tasks/            # Componentes de tarefas
│   └── ui/               # Componentes UI genéricos
│
├── lib/                   # Bibliotecas e utilitários
│   ├── db/               # Gerenciador IndexedDB
│   │   ├── index.ts      # CRUD operations
│   │   └── schema.ts     # Tipos e estruturas
│   └── utils/            # Funções auxiliares
│
├── stores/               # Estado global (Zustand)
│   └── useAppStore.ts   # Store principal
│
├── hooks/                # Custom React Hooks
│   ├── useHabits.ts     # Hook para hábitos (TODO)
│   ├── useTasks.ts      # Hook para tarefas (TODO)
│   └── usePomodoro.ts   # Hook para pomodoro (TODO)
│
└── public/               # Arquivos estáticos
    ├── manifest.json     # PWA manifest
    └── icons/            # Ícones do app
```

## 🗄️ Banco de Dados (IndexedDB)

### Por que IndexedDB?

1. **Offline First**: Funciona sem internet
2. **Gratuito**: Sem custos de servidor
3. **Privado**: Dados no dispositivo do usuário
4. **Rápido**: Acesso local instantâneo
5. **Mobile**: Funciona em PWA

### Estrutura de Dados

```typescript
// Exemplo de fluxo de dados
User → UserStats → Achievements
  ↓
Habits → HabitLogs → Streaks
  ↓
Tasks → Categories → Priorities
  ↓
PomodoroSessions → FocusTime → XP
```

### Sincronização (Futuro)

```
IndexedDB (Local) ←→ Supabase (Cloud - Opcional)
     ↓
  Offline First
     ↓
  Sync quando online
```

## 🎨 Design System

### Cores

```css
/* Light Mode */
--primary: #4F46E5 (Indigo)
--success: #10B981 (Green)
--warning: #F59E0B (Amber)
--danger: #EF4444 (Red)
--background: #F9FAFB (Gray-50)

/* Dark Mode */
--primary: #6366F1 (Indigo-400)
--background: #111827 (Gray-900)
```

### Componentes Base

- Cards com shadow
- Botões com hover effects
- Inputs com focus states
- Modals responsivos
- Toast notifications

## 🔄 Fluxo de Dados

### 1. Inicialização do App

```
App Load
  ↓
IndexedDB.init()
  ↓
Load User Data
  ↓
Load User Stats
  ↓
Render Dashboard
```

### 2. Completar Hábito

```
User clicks checkbox
  ↓
Create HabitLog
  ↓
Update Habit.streak
  ↓
Add XP (+10)
  ↓
Check for level up
  ↓
Update UI
```

### 3. Pomodoro Session

```
Start Timer
  ↓
Create PomodoroSession
  ↓
Timer runs (25min)
  ↓
Complete Session
  ↓
Add XP (+25)
  ↓
Update totalFocusTime
  ↓
Show notification
```

## 🎮 Sistema de Gamificação

### XP e Níveis

```typescript
// Fórmula de XP por nível
xpForNextLevel = currentLevel * 100

// Exemplo:
Nível 1 → 2: 100 XP
Nível 2 → 3: 200 XP
Nível 3 → 4: 300 XP
```

### Conquistas

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: () => boolean;
  xp: number;
  icon: string;
}

// Exemplos:
- "Primeiro Passo": Complete 1 hábito (10 XP)
- "Semana Forte": 7 dias de streak (100 XP)
- "Mestre do Foco": 100 pomodoros (500 XP)
- "Vencedor": 30 dias sem vício (1000 XP)
```

## 📱 PWA (Progressive Web App)

### Características

- ✅ Instalável (Add to Home Screen)
- ✅ Funciona offline
- ✅ Notificações push
- ✅ Ícone na tela inicial
- ✅ Splash screen
- ✅ Modo standalone

### Service Worker (Futuro)

```javascript
// Cache strategies
- Cache First: Assets estáticos
- Network First: Dados dinâmicos
- Stale While Revalidate: Imagens
```

## 🔐 Segurança e Privacidade

### Dados Locais

- Todos os dados em IndexedDB
- Nenhum envio para servidor
- Usuário controla seus dados
- Export/Import disponível

### Sincronização Opcional (V3)

```
Local (IndexedDB) → Encrypt → Supabase
                      ↓
                  User owns key
```

## 🚀 Performance

### Otimizações

1. **Code Splitting**: Lazy load de rotas
2. **Memoization**: React.memo em componentes
3. **Virtual Lists**: Para listas grandes
4. **Debounce**: Em inputs de busca
5. **IndexedDB Indexes**: Queries rápidas

### Métricas Alvo

- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Lighthouse Score: > 90

## 🧪 Testes (Futuro)

```
Unit Tests → Jest + React Testing Library
E2E Tests → Playwright
Performance → Lighthouse CI
```

## 📦 Build e Deploy

### Desenvolvimento

```bash
npm run dev     # Servidor local
npm run build   # Build de produção
npm run start   # Servidor de produção
```

### Deploy Options

1. **Vercel** (Recomendado)
   - Deploy automático
   - Edge functions
   - Analytics grátis

2. **Netlify**
   - Deploy simples
   - Forms grátis

3. **GitHub Pages**
   - Totalmente grátis
   - Static export

## 🔮 Roadmap Técnico

### Fase 1 (MVP) - ✅ Em Progresso

- [x] Setup Next.js + TypeScript
- [x] IndexedDB setup
- [x] Dashboard básico
- [x] Timer Pomodoro
- [ ] Sistema de hábitos
- [ ] Sistema GTD

### Fase 2 (V2)

- [ ] Sistema anti-vícios
- [ ] Flashcards + Spaced Repetition
- [ ] Gráficos e relatórios
- [ ] Export de dados
- [ ] Dark mode completo

### Fase 3 (V3)

- [ ] IA Coach (OpenAI API gratuita)
- [ ] Sincronização cloud (opcional)
- [ ] Comunidade
- [ ] Integração wearables
- [ ] App nativo (React Native)

## 🤝 Contribuindo

### Setup do Ambiente

```bash
# Clone
git clone <repo>

# Instale
npm install

# Rode
npm run dev

# Teste
npm run test (futuro)
```

### Padrões de Código

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Component-driven development

### Estrutura de Commits

```
feat: adiciona sistema de hábitos
fix: corrige bug no timer
docs: atualiza README
style: formata código
refactor: reorganiza stores
test: adiciona testes do pomodoro
```

## 📚 Recursos

### Documentação

- [Next.js Docs](https://nextjs.org/docs)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Zustand](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Inspirações

- Habitica (gamificação)
- Notion (organização)
- Forest (foco)
- Anki (memorização)
- Todoist (tarefas)

---

**Última atualização**: 2026-06-14