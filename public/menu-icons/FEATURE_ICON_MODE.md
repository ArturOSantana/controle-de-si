# 🎨 Feature: Alternância de Modo de Ícones

## 📋 Resumo

Implementação de funcionalidade que permite alternar entre ícones do sistema (Lucide Icons) e imagens personalizadas no menu de navegação.

## ✨ Funcionalidades

### 1. **Dois Modos de Visualização**
   - **Modo Sistema**: Usa ícones vetoriais do Lucide Icons (padrão)
   - **Modo Imagem**: Usa imagens PNG personalizadas

### 2. **Botão de Alternância**
   - Localizado no canto superior direito
   - Design moderno com toggle switch animado
   - Indicadores visuais claros do modo ativo
   - Responsivo (oculta texto em telas pequenas)

### 3. **Persistência de Estado**
   - Preferência salva no localStorage via Zustand
   - Mantém a escolha entre sessões

### 4. **Fallback Automático**
   - Se uma imagem não existir, volta automaticamente para o ícone do sistema
   - Não quebra a interface se imagens estiverem faltando

## 🏗️ Arquitetura

### Arquivos Modificados

1. **`stores/useAppStore.ts`**
   - Adicionado estado `useImageIcons: boolean`
   - Adicionada ação `toggleImageIcons()`
   - Persistência configurada no localStorage

2. **`components/Navbar.tsx`**
   - Suporte para renderização condicional de ícones
   - Integração com Next.js Image para otimização
   - Fallback automático em caso de erro
   - Mapeamento de nomes de imagens para cada item do menu

3. **`app/layout.tsx`**
   - Adicionado componente `IconModeToggle`

### Arquivos Criados

1. **`components/IconModeToggle.tsx`**
   - Componente de botão de alternância
   - Design moderno com animações
   - Indicadores visuais do estado

2. **`public/menu-icons/`**
   - Pasta para armazenar imagens personalizadas
   - Estrutura organizada e documentada

3. **`public/menu-icons/INSTRUCOES.md`**
   - Guia completo de uso
   - Especificações técnicas
   - Dicas de design
   - Recursos para encontrar ícones

## 📦 Estrutura de Imagens

```
/public/menu-icons/
├── home.png          # Início
├── habits.png        # Hábitos
├── pomodoro.png      # Pomodoro
├── tasks.png         # Tarefas
├── addictions.png    # Vícios
├── study.png         # Estudos
├── timeblock.png     # Agenda
├── journal.png       # Diário
├── analytics.png     # Análises
├── reports.png       # Relatórios
├── achievements.png  # Conquistas
└── rewards.png       # Recompensas
```

## 🎯 Especificações Técnicas

### Imagens
- **Formato**: PNG (recomendado) ou SVG
- **Tamanho**: 64x64px (ou múltiplos)
- **Fundo**: Transparente
- **Otimização**: Next.js Image component

### Performance
- Lazy loading automático via Next.js
- Otimização de imagens em build time
- Cache eficiente

### Acessibilidade
- Alt text em todas as imagens
- Tooltips informativos
- Contraste adequado

## 🚀 Como Usar

### Para Usuários

1. **Ativar Modo Imagem:**
   - Clique no botão no canto superior direito
   - O toggle mudará de cor e posição
   - Os ícones do menu serão substituídos por imagens

2. **Voltar ao Modo Sistema:**
   - Clique novamente no botão
   - Os ícones vetoriais retornarão

### Para Desenvolvedores

1. **Adicionar Novas Imagens:**
   ```bash
   # Coloque as imagens na pasta
   cp seu-icone.png controle-de-si/public/menu-icons/home.png
   ```

2. **Adicionar Novo Item ao Menu:**
   ```typescript
   // Em components/Navbar.tsx
   const navItems = [
     // ...
     { 
       href: '/novo', 
       icon: NovoIcon, 
       label: 'Novo', 
       imageName: 'novo' // Nome do arquivo sem extensão
     },
   ];
   ```

3. **Customizar Botão:**
   ```typescript
   // Em components/IconModeToggle.tsx
   // Modifique estilos, posição, ou comportamento
   ```

## 🎨 Customização

### Cores do Botão
```typescript
// Modo Sistema (roxo)
className="text-violet-400"

// Modo Imagem (rosa)
className="text-fuchsia-400"
```

### Posição do Botão
```typescript
// Atual: canto superior direito
className="fixed top-4 right-4"

// Exemplo: canto inferior direito
className="fixed bottom-4 right-4"
```

### Tamanho dos Ícones
```typescript
// Desktop
<div className="relative w-6 h-6">

// Mobile
<div className="relative w-5 h-5">
```

## 🔧 Manutenção

### Adicionar Suporte a Novos Formatos
```typescript
// Modificar onError handler em Navbar.tsx
onError={(e) => {
  // Tentar SVG se PNG falhar
  const target = e.target as HTMLImageElement;
  target.src = `/menu-icons/${item.imageName}.svg`;
}}
```

### Debug
```typescript
// Adicionar logs no store
toggleImageIcons: () => {
  console.log('Toggling icon mode');
  set((state) => ({ 
    useImageIcons: !state.useImageIcons 
  }));
}
```

## 📊 Estado Atual

- ✅ Store configurado
- ✅ Navbar atualizado
- ✅ Botão de toggle criado
- ✅ Layout integrado
- ✅ Documentação completa
- ⏳ Aguardando imagens personalizadas

## 🎯 Próximos Passos

1. Adicionar imagens personalizadas na pasta `/public/menu-icons/`
2. Testar em diferentes dispositivos
3. Ajustar estilos se necessário
4. Considerar adicionar animações de transição entre modos

## 💡 Ideias Futuras

- [ ] Galeria de temas de ícones pré-definidos
- [ ] Upload de ícones personalizados via interface
- [ ] Animações de transição entre modos
- [ ] Preview de ícones antes de aplicar
- [ ] Exportar/importar configurações de ícones

---

**Desenvolvido com ❤️ por Bob**