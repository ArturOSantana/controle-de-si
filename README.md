# Controle de Si - Domine Vícios, Hábitos e Produtividade

![Controle de Si](https://img.shields.io/badge/Controle_de_Si-v1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)

## 🎯 Sobre o Projeto

**Controle de Si** é um sistema completo de transformação pessoal que integra:

- 🚫 **Combate a Vícios** - Rastreie e supere dependências (redes sociais, pornografia, procrastinação)
- 🔥 **Hábitos Atômicos** - Crie e mantenha hábitos com habit stacking
- 📚 **Técnicas de Estudo** - Pomodoro, Active Recall, Spaced Repetition, Feynman
- ⏰ **Timer Pomodoro** - Foco profundo com pausas ativas
- ✅ **GTD (Getting Things Done)** - Organize sua vida com método comprovado
- 🎮 **Gamificação** - XP, níveis, streaks e conquistas
- 📊 **Analytics** - Entenda seus padrões e evolua
- 🤖 **IA Coach** - Assistente inteligente (futuro)

## 💡 Filosofia

> "Você não precisa de mais força de vontade. Você precisa de um sistema."

Baseado em:
- **James Clear** (Hábitos Atômicos)
- **David Allen** (GTD)
- **Cal Newport** (Deep Work)
- **Neurociência Comportamental**
- **Psicologia Cognitiva**

## 🚀 Tecnologias

- **Frontend**: Next.js 15 + React + TypeScript
- **Estilização**: Tailwind CSS
- **Estado**: Zustand
- **Banco de Dados**: IndexedDB (funciona offline!)
- **PWA**: Instalável como app mobile
- **Ícones**: Lucide React

## 💾 Banco de Dados Local

O app usa **IndexedDB** para armazenar todos os dados localmente:

✅ **Funciona 100% offline**  
✅ **Não gasta dinheiro com servidor**  
✅ **Dados privados no seu dispositivo**  
✅ **Rápido e responsivo**  
✅ **Funciona em mobile (PWA)**  

### Estrutura do Banco

```
controle_de_si_db
├── users              # Dados do usuário
├── habits             # Hábitos cadastrados
├── habitLogs          # Registro diário de hábitos
├── tasks              # Tarefas GTD
├── pomodoroSessions   # Sessões de foco
├── addictions         # Vícios a combater
├── addictionLogs      # Registro de recaídas/vitórias
├── studySessions      # Sessões de estudo
├── flashcards         # Cartões de memorização
├── dailyLogs          # Diário pessoal
├── achievements       # Conquistas desbloqueadas
└── userStats          # Estatísticas e XP
```

## 🛠️ Instalação

```bash
# Clone o repositório
git clone <seu-repo>

# Entre na pasta
cd controle-de-si

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

## 📱 Instalar como App Mobile

### Android/iOS:

1. Abra o site no navegador
2. **Chrome**: Menu → "Adicionar à tela inicial"
3. **Safari**: Compartilhar → "Adicionar à Tela de Início"
4. Pronto! Agora funciona como app nativo offline

## 🎨 Funcionalidades

### ✅ MVP (Versão 1.0) - Em Desenvolvimento

#### Dashboard Principal
- [x] Estatísticas do dia (streak, foco, tarefas, XP)
- [x] Sistema de níveis e XP
- [x] Visão geral de hábitos e tarefas
- [x] Ações rápidas

#### Timer Pomodoro
- [x] Timer configurável (25/5/15 min)
- [x] Pausas ativas com sugestões
- [x] Registro automático de sessões
- [x] Estatísticas de foco
- [x] Notificações

#### Sistema de Hábitos (TODO)
- [ ] Criar hábitos com habit stacking
- [ ] Rastreamento diário
- [ ] Sistema de streaks
- [ ] Perdão semanal (1 falha permitida)
- [ ] Visualização de progresso

#### Sistema GTD (TODO)
- [ ] Caixa de entrada rápida
- [ ] Classificação automática
- [ ] Método Eisenhower
- [ ] Metas SMART
- [ ] Revisão semanal

### 🔄 V2 (Próximas Features)

#### Modo Anti-Vícios
- [ ] Cadastro de vícios
- [ ] Rastreamento de gatilhos
- [ ] Contador de sobriedade
- [ ] Modo SOS (emergência)
- [ ] Mapa de padrões

#### Sistema de Estudos
- [ ] Flashcards com spaced repetition
- [ ] Active Recall guiado
- [ ] Método Feynman
- [ ] Trilhas de aprendizado
- [ ] Estatísticas de estudo

#### Analytics
- [ ] Gráficos de progresso
- [ ] Relatórios semanais/mensais
- [ ] Heatmap de atividades
- [ ] Insights de padrões

### 🚀 V3 (Futuro)

- [ ] IA Coach (usando APIs gratuitas)
- [ ] Sincronização na nuvem (opcional)
- [ ] Comunidade e desafios
- [ ] Integração com wearables
- [ ] Export de dados (CSV/JSON)

## 📊 Sistema de Gamificação

### Como Ganhar XP

| Ação | XP |
|------|-----|
| Pomodoro completo | +25 XP |
| Hábito concluído | +10 XP |
| Tarefa concluída | +15 XP |
| Dia sem vício | +50 XP |
| Streak de 7 dias | +100 XP |
| Streak de 30 dias | +500 XP |

### Níveis

```
Nível 1: 0-100 XP
Nível 2: 100-200 XP
Nível 3: 200-300 XP
...
Nível N: (N-1)*100 - N*100 XP
```

### Conquistas (Futuro)

- 🎯 **Primeiro Passo**: Complete 1 hábito
- 🔥 **Semana Forte**: 7 dias de streak
- 💪 **Mestre do Foco**: 100 pomodoros
- 🏆 **Vencedor**: 30 dias sem vício
- 📚 **Estudioso**: 100 horas de estudo

## 🎯 Casos de Uso

### 1. Estudante

```
Manhã:
- Pomodoro de 2h (matemática)
- Flashcards de revisão
- Active Recall

Tarde:
- Hábito: Exercício físico
- Pomodoro de 1h (inglês)

Noite:
- Diário de aprendizado
- Revisão do dia
```

### 2. Profissional

```
Manhã:
- Hábitos matinais (meditação, exercício)
- Deep Work (3 pomodoros)
- GTD: Processar inbox

Tarde:
- Tarefas prioritárias
- Blocos de tempo

Noite:
- Planejamento do próximo dia
- Reflexão
```

### 3. Combate a Vícios

```
Diário:
- Rastrear gatilhos
- Registrar emoções
- Modo SOS quando necessário
- Substituir comportamento

Semanal:
- Analisar padrões
- Ajustar estratégias
- Celebrar vitórias
```

## 🔒 Privacidade

- ✅ Todos os dados ficam no seu dispositivo
- ✅ Nenhum dado é enviado para servidores
- ✅ Você é dono dos seus dados
- ✅ Pode exportar tudo em JSON/CSV
- ✅ Sem rastreamento ou analytics externos

## 🤝 Contribuindo

Este é um projeto open source! Contribuições são bem-vindas:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

MIT License - sinta-se livre para usar em seus projetos!

## 🎓 Créditos e Inspirações

### Livros e Métodos
- **Hábitos Atômicos** - James Clear
- **Getting Things Done** - David Allen
- **Deep Work** - Cal Newport
- **O Poder do Hábito** - Charles Duhigg
- **Técnica Pomodoro** - Francesco Cirillo

### Apps de Referência
- Habitica (gamificação)
- Notion (organização)
- Forest (foco)
- Anki (memorização)
- Todoist (tarefas)

### Pesquisas Científicas
- Neurociência comportamental
- Psicologia cognitiva
- Técnicas de estudo comprovadas
- Terapia cognitivo-comportamental

## 📞 Suporte

Encontrou um bug? Tem uma sugestão?  
Abra uma issue no GitHub!

## 🗺️ Roadmap

### Fase 1 (MVP) - Dezembro 2026
- [x] Setup do projeto
- [x] Dashboard básico
- [x] Timer Pomodoro
- [ ] Sistema de hábitos
- [ ] Sistema GTD

### Fase 2 (V2) - Janeiro 2027
- [ ] Modo anti-vícios
- [ ] Sistema de estudos
- [ ] Gráficos e relatórios

### Fase 3 (V3) - Fevereiro 2027
- [ ] IA Coach
- [ ] Sincronização cloud
- [ ] Comunidade

---

**Feito com ❤️ para ajudar pessoas a dominarem suas vidas**

*"O controle de si mesmo é a maior forma de poder."* - Sêneca
