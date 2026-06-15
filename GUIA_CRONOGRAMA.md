# 📚 Guia Rápido - Cronograma de Estudos

## Como Acessar

1. Abra o navegador em: **http://localhost:3000**
2. No Dashboard, clique no botão **"Cronograma"** (ícone de calendário roxo)
3. Ou acesse diretamente: **http://localhost:3000/schedule**

## Passo a Passo para Criar seu Cronograma

### 1️⃣ Adicionar uma Matéria

**No topo da página, clique em "+ Matéria"**

Preencha:
- **Nome da Matéria**: Ex: "Matemática", "Programação", "Inglês"
- **Descrição** (opcional): Detalhes sobre a matéria
- **Cor**: Escolha uma das 8 cores disponíveis para identificação visual
- **Prioridade**: Alta, Média ou Baixa

Clique em **"Salvar"**

### 2️⃣ Adicionar Tópicos (Assuntos)

**Vá na aba "Matérias" e clique em "Adicionar Tópico" na matéria desejada**

Ou clique em **"+ Matéria"** no topo e depois adicione tópicos.

Preencha:
- **Matéria**: Selecione a matéria que criou
- **Nome do Tópico**: Ex: "Derivadas", "Arrays em JavaScript", "Present Perfect"
- **Descrição** (opcional): Detalhes do tópico
- **Horas Estimadas**: Quantas horas você acha que vai precisar
- **Dificuldade**: Fácil, Médio ou Difícil
- **Prioridade**: De 1 a 5 (1 = baixa, 5 = alta)

Clique em **"Salvar"**

### 3️⃣ Criar Agendamentos (Cronograma)

**No topo da página, clique em "+ Agendar"**

Preencha:
- **Matéria**: Selecione a matéria
- **Tópico** (opcional): Selecione o tópico específico ou deixe em branco
- **Título**: Ex: "Estudar Derivadas"
- **Descrição** (opcional): Notas sobre o estudo
- **Data**: Escolha o dia
- **Início**: Horário de início (ex: 14:00)
- **Fim**: Horário de término (ex: 16:00)
- **Recorrência** (opcional): 
  - Não repetir (padrão)
  - Diariamente
  - Dias úteis (segunda a sexta)
  - Fins de semana
  - Semanalmente

Clique em **"Agendar"**

### 4️⃣ Visualizar e Gerenciar

**Aba "Cronograma":**
- Veja a semana completa com todos os agendamentos
- Navegue entre semanas com as setas ← →
- Cada dia mostra os agendamentos com:
  - Cor da matéria
  - Título do estudo
  - Horário (início - fim)
  - Nome da matéria
- Clique no ✓ para marcar como concluído

**Aba "Matérias":**
- Veja todas as suas matérias
- Cada card mostra:
  - Nome e descrição
  - Prioridade (Alta/Média/Baixa)
  - Número de tópicos
  - Total de horas estudadas
- Clique em "Adicionar Tópico" para adicionar mais assuntos

**Aba "Tópicos":**
- Veja todos os tópicos organizados por matéria
- Status de cada tópico:
  - Não Iniciado (cinza)
  - Em Progresso (amarelo)
  - Revisão (azul)
  - Dominado (verde)
- Progresso de horas: X h / Y h
- Dificuldade e prioridade

**Aba "Metas":**
- Em desenvolvimento (próxima atualização)

## Exemplo Prático

### Cenário: Estudar Programação

1. **Criar Matéria:**
   - Nome: "JavaScript"
   - Cor: Azul
   - Prioridade: Alta

2. **Adicionar Tópicos:**
   - "Arrays e Métodos" (Médio, 5h estimadas)
   - "Promises e Async/Await" (Difícil, 8h estimadas)
   - "DOM Manipulation" (Fácil, 3h estimadas)

3. **Criar Cronograma:**
   - Segunda 14:00-16:00: "Estudar Arrays"
   - Quarta 14:00-16:00: "Estudar Promises"
   - Sexta 14:00-16:00: "Praticar DOM"
   - Recorrência: Semanalmente

4. **Acompanhar:**
   - Marque como concluído após cada sessão
   - Veja o progresso na aba "Matérias"
   - Acompanhe as horas na aba "Tópicos"

## Estatísticas no Topo

- **Matérias Ativas**: Total de matérias cadastradas
- **Tópicos**: Total de assuntos para estudar
- **Horas Esta Semana**: Soma das horas de agendamentos concluídos
- **Agendamentos**: Total de estudos agendados

## Dicas

✅ **Comece simples**: Adicione 2-3 matérias primeiro
✅ **Seja realista**: Não agende mais de 3-4 horas por dia
✅ **Use cores**: Facilita identificar matérias no calendário
✅ **Priorize**: Foque nas matérias de alta prioridade
✅ **Revise**: Use a aba "Tópicos" para ver o que já dominou
✅ **Recorrência**: Use para criar rotina de estudos

## Integração com Outras Funcionalidades

- **Pomodoro**: Use o timer para estudar com foco
- **Diário**: Anote aprendizados após cada sessão
- **Time Blocking**: Bloqueie horários na agenda
- **Notificações**: Ative para receber lembretes

## Troubleshooting

**Não vejo meus agendamentos:**
- Verifique se está na semana correta (use as setas)
- Confirme que salvou o agendamento
- Recarregue a página (F5)

**Matéria não aparece:**
- Verifique se salvou corretamente
- Vá na aba "Matérias" para confirmar

**Dados sumiram:**
- Dados ficam salvos no navegador (IndexedDB)
- Não use modo anônimo/privado
- Não limpe dados do navegador

---

**Pronto! Agora você pode organizar seus estudos de forma profissional! 📚✨**