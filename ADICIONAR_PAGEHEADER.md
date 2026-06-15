# Guia Rápido: Adicionar PageHeader em Todas as Páginas

## ✅ Páginas Concluídas
1. **Pomodoro** - ✅ Implementado

## 📋 Páginas Restantes (11 páginas)

### 1. Habits (/habits/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Rastreie Seus Hábitos",
    description: "Crie hábitos personalizados ou escolha da biblioteca com 52 hábitos prontos em 5 categorias: Saúde, Produtividade, Mindfulness, Social e Aprendizado."
  },
  {
    title: "Marque Diariamente",
    description: "Clique no checkbox para marcar o hábito como concluído hoje. Cada dia você ganha uma nova chance de manter sua sequência!"
  },
  {
    title: "Sequências e Conquistas",
    description: "Mantenha sequências longas para ganhar XP e desbloquear conquistas. Quanto mais consistente, mais recompensas!"
  },
  {
    title: "Editar e Gerenciar",
    description: "Use o botão de editar para modificar nome, categoria ou cor do hábito. Você também pode arquivar hábitos que não usa mais."
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Hábitos"
  description="Construa rotinas poderosas com consistência"
  gradient="from-green-400 to-emerald-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 2. Tasks (/tasks/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "GTD - Getting Things Done",
    description: "Organize suas tarefas usando o método GTD. Capture tudo que precisa fazer e processe em categorias específicas."
  },
  {
    title: "Caixa de Entrada",
    description: "Adicione rapidamente qualquer tarefa na Inbox. Depois, processe-as movendo para as categorias corretas: Próximas Ações, Aguardando, Algum Dia ou Projetos."
  },
  {
    title: "Priorize com Contextos",
    description: "Use contextos (@casa, @trabalho, @computador) para filtrar tarefas por local ou ferramenta necessária."
  },
  {
    title: "Complete e Ganhe XP",
    description: "Marque tarefas como concluídas para ganhar XP e manter seu progresso organizado!"
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Tarefas GTD"
  description="Organize tudo com o método Getting Things Done"
  gradient="from-blue-400 to-cyan-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 3. Addictions (/addictions/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Combata Vícios",
    description: "Identifique comportamentos que você quer reduzir ou eliminar. Pode ser redes sociais, jogos, doces, ou qualquer hábito negativo."
  },
  {
    title: "Registre Recaídas",
    description: "Quando ceder ao vício, registre a recaída. Isso ajuda a identificar padrões e gatilhos."
  },
  {
    title: "Acompanhe Progresso",
    description: "Veja quantos dias você está limpo e sua taxa de sucesso. Cada dia sem recaída é uma vitória!"
  },
  {
    title: "Estratégias de Prevenção",
    description: "Use as notas para registrar o que funcionou ou não. Identifique gatilhos e crie estratégias de prevenção."
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Combate a Vícios"
  description="Supere comportamentos negativos com consciência"
  gradient="from-red-400 to-rose-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 4. Study (/study/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Flashcards Inteligentes",
    description: "Crie flashcards para memorizar qualquer conteúdo. O sistema usa Spaced Repetition para otimizar sua revisão."
  },
  {
    title: "Spaced Repetition",
    description: "Cartões que você acerta aparecem menos frequentemente. Cartões difíceis aparecem mais vezes até você dominar."
  },
  {
    title: "Categorias e Decks",
    description: "Organize seus flashcards em categorias (Idiomas, Programação, etc.) para estudar de forma focada."
  },
  {
    title: "Revise Regularmente",
    description: "O sistema calcula automaticamente quando você deve revisar cada cartão para máxima retenção!"
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Flashcards"
  description="Memorize com Spaced Repetition inteligente"
  gradient="from-purple-400 to-indigo-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 5. Schedule (/schedule/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Cronograma de Estudos",
    description: "Organize seus estudos criando matérias, tópicos e agendando sessões de estudo ao longo da semana."
  },
  {
    title: "Passo 1: Adicione Matérias",
    description: "Clique em 'Nova Matéria' na aba Matérias. Defina nome, cor e prioridade para cada disciplina que você estuda."
  },
  {
    title: "Passo 2: Crie Tópicos",
    description: "Na aba Tópicos, adicione os assuntos específicos de cada matéria. Defina dificuldade e horas estimadas."
  },
  {
    title: "Passo 3: Agende Estudos",
    description: "Na aba Cronograma, crie sessões de estudo escolhendo matéria, tópico, data e horário. Você pode criar estudos recorrentes!"
  },
  {
    title: "Metas de Estudo",
    description: "Na aba Metas, crie objetivos diários, semanais ou mensais de horas de estudo para manter-se motivado!"
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Cronograma"
  description="Planeje e organize seus estudos com eficiência"
  gradient="from-violet-400 to-purple-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 6. Journal (/journal/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Diário de Aprendizado",
    description: "Registre insights, aprendizados e reflexões após cada sessão de Pomodoro ou estudo."
  },
  {
    title: "Capture Insights",
    description: "Anote o que funcionou, o que aprendeu, dificuldades encontradas e ideias para melhorar."
  },
  {
    title: "Revise Seu Progresso",
    description: "Volte e leia suas anotações antigas para ver quanto você evoluiu e relembrar lições importantes."
  },
  {
    title: "Tags e Categorias",
    description: "Use tags para organizar entradas por tema, projeto ou tipo de aprendizado."
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Diário"
  description="Registre aprendizados e reflexões diárias"
  gradient="from-amber-400 to-orange-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 7. Analytics (/analytics/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Análises Detalhadas",
    description: "Visualize gráficos e estatísticas sobre todos os aspectos do seu progresso: hábitos, tarefas, estudos e mais."
  },
  {
    title: "Heatmap de Atividade",
    description: "Veja um mapa de calor mostrando seus dias mais produtivos. Identifique padrões e otimize sua rotina."
  },
  {
    title: "Gráficos de Tendência",
    description: "Acompanhe a evolução do seu Score de Consistência, tempo de foco e conclusão de tarefas ao longo do tempo."
  },
  {
    title: "Filtros Personalizados",
    description: "Filtre dados por período (semana, mês, ano) e por categoria para análises específicas."
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Análises"
  description="Visualize seu progresso com gráficos e estatísticas"
  gradient="from-cyan-400 to-blue-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 8. Reports (/reports/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Relatórios Automáticos",
    description: "Receba relatórios semanais automáticos com resumo do seu desempenho em todas as áreas."
  },
  {
    title: "Métricas Principais",
    description: "Veja hábitos completados, tarefas concluídas, tempo de foco, sequências mantidas e XP ganho."
  },
  {
    title: "Comparação Semanal",
    description: "Compare seu desempenho com semanas anteriores para identificar melhorias ou quedas."
  },
  {
    title: "Insights Personalizados",
    description: "Receba sugestões baseadas nos seus dados para melhorar consistência e produtividade."
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Relatórios"
  description="Resumos semanais do seu progresso"
  gradient="from-teal-400 to-green-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 9. Achievements (/achievements/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Sistema de Conquistas",
    description: "Desbloqueie conquistas ao atingir marcos importantes em hábitos, tarefas, estudos e mais!"
  },
  {
    title: "Níveis de Dificuldade",
    description: "Conquistas variam de Bronze a Diamante. Quanto mais difícil, mais XP você ganha ao desbloquear!"
  },
  {
    title: "Progresso em Tempo Real",
    description: "Veja quanto falta para desbloquear cada conquista e foque nas que estão mais próximas."
  },
  {
    title: "Colecione Todas",
    description: "Existem dezenas de conquistas para desbloquear. Você consegue pegar todas?"
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Conquistas"
  description="Desbloqueie badges e marcos de progresso"
  gradient="from-yellow-400 to-amber-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 10. Rewards (/rewards/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Sistema de Recompensas",
    description: "Crie recompensas personalizadas e use seus pontos de XP para resgatá-las!"
  },
  {
    title: "Defina Seus Prêmios",
    description: "Adicione recompensas como 'Assistir um episódio', 'Comer sobremesa', 'Comprar algo' com custos em XP."
  },
  {
    title: "Ganhe XP",
    description: "Complete hábitos, tarefas, pomodoros e conquistas para acumular XP e poder resgatar recompensas."
  },
  {
    title: "Motivação Extra",
    description: "Use recompensas como motivação para manter consistência e atingir suas metas!"
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Recompensas"
  description="Resgate prêmios com seus pontos de XP"
  gradient="from-pink-400 to-rose-500"
  tutorialSteps={tutorialSteps}
/>
```

---

### 11. Time Blocking (/timeblock/page.tsx)
**Import:** `import PageHeader from '@/components/PageHeader';`

**Tutorial Steps:**
```typescript
const tutorialSteps = [
  {
    title: "Blocos de Tempo Visuais",
    description: "Organize seu dia dividindo-o em blocos de tempo dedicados a atividades específicas."
  },
  {
    title: "Crie Blocos",
    description: "Clique em 'Novo Bloco' e defina horário de início, duração, atividade e categoria (Trabalho, Estudo, Lazer, etc.)."
  },
  {
    title: "Visualização do Dia",
    description: "Veja todos os seus blocos em uma linha do tempo visual. Identifique gaps e otimize seu tempo."
  },
  {
    title: "Blocos Recorrentes",
    description: "Crie blocos que se repetem diariamente ou em dias específicos da semana para rotinas fixas."
  }
];
```

**PageHeader:**
```tsx
<PageHeader
  title="Time Blocking"
  description="Organize seu dia em blocos de tempo produtivos"
  gradient="from-indigo-400 to-purple-500"
  tutorialSteps={tutorialSteps}
/>
```

---

## 🚀 Implementação Rápida

Para cada página:
1. Adicione o import no topo do arquivo
2. Adicione o array `tutorialSteps` antes do return
3. Substitua o header existente pelo componente `<PageHeader />`
4. Teste a página e o tutorial

## ✅ Checklist Final
- [ ] Habits
- [ ] Tasks
- [ ] Addictions
- [ ] Study
- [ ] Schedule (já tem estrutura, só adicionar tutorial)
- [ ] Journal
- [ ] Analytics
- [ ] Reports
- [ ] Achievements
- [ ] Rewards
- [ ] Time Blocking

**Tempo estimado:** ~5 minutos por página = ~55 minutos total