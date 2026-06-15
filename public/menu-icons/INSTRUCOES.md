# 📸 Instruções para Adicionar Ícones Personalizados

## Como Adicionar Suas Imagens

1. **Prepare suas imagens:**
   - Formato: PNG ou SVG (PNG recomendado para melhor compatibilidade)
   - Tamanho: 64x64 pixels (ou múltiplos, como 128x128)
   - Fundo: Transparente
   - Estilo: Consistente entre todos os ícones

2. **Nomeie os arquivos exatamente como:**
   - `home.png` - Ícone de Início
   - `habits.png` - Ícone de Hábitos
   - `pomodoro.png` - Ícone de Pomodoro
   - `tasks.png` - Ícone de Tarefas
   - `addictions.png` - Ícone de Vícios
   - `study.png` - Ícone de Estudos
   - `timeblock.png` - Ícone de Agenda
   - `journal.png` - Ícone de Diário
   - `analytics.png` - Ícone de Análises
   - `reports.png` - Ícone de Relatórios
   - `achievements.png` - Ícone de Conquistas
   - `rewards.png` - Ícone de Recompensas

3. **Coloque os arquivos nesta pasta** (`/public/menu-icons/`)

4. **Ative o modo de imagens:**
   - Clique no botão no canto superior direito da tela
   - O botão alterna entre "Ícones Sistema" e "Ícones Imagem"

## 🎨 Dicas de Design

- Use cores vibrantes que combinem com o tema roxo/rosa do app
- Mantenha um estilo consistente (flat, outline, filled, etc.)
- Teste em diferentes tamanhos para garantir legibilidade
- Considere usar ícones com brilho ou efeitos para destacar

## 🔄 Fallback Automático

Se uma imagem não for encontrada, o sistema automaticamente volta a usar os ícones do sistema (Lucide Icons), então não se preocupe se não tiver todas as imagens prontas de uma vez.

## 📦 Onde Encontrar Ícones

Sugestões de sites para baixar ícones gratuitos:
- [Flaticon](https://www.flaticon.com/)
- [Icons8](https://icons8.com/)
- [Iconscout](https://iconscout.com/)
- [Noun Project](https://thenounproject.com/)

## 🚀 Exemplo de Uso

```bash
# Estrutura de arquivos esperada:
/public/menu-icons/
  ├── home.png
  ├── habits.png
  ├── pomodoro.png
  ├── tasks.png
  ├── addictions.png
  ├── study.png
  ├── timeblock.png
  ├── journal.png
  ├── analytics.png
  ├── reports.png
  ├── achievements.png
  └── rewards.png
```

---

**Nota:** O sistema está configurado para funcionar perfeitamente mesmo sem as imagens. Adicione-as quando estiver pronto! 🎉