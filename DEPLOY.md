# 🚀 Guia de Deploy - Controle de Si

## Deploy Gratuito na Vercel

### Pré-requisitos
- Conta no GitHub (gratuita)
- Conta na Vercel (gratuita)

### Passo a Passo

#### 1. Preparar o Repositório Git

```bash
# Inicializar repositório (se ainda não foi feito)
cd controle-de-si
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Initial commit - Controle de Si App"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU_USUARIO/controle-de-si.git
git branch -M main
git push -u origin main
```

#### 2. Deploy na Vercel

**Opção A: Via Interface Web (Mais Fácil)**

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New Project"
4. Selecione o repositório `controle-de-si`
5. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (padrão)
   - Build Command: `npm run build` (padrão)
   - Output Directory: `.next` (padrão)
6. Clique em "Deploy"
7. Aguarde 2-3 minutos
8. Pronto! Seu app estará no ar em `https://controle-de-si.vercel.app`

**Opção B: Via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
cd controle-de-si
vercel

# Seguir as instruções:
# - Set up and deploy? Yes
# - Which scope? Sua conta
# - Link to existing project? No
# - Project name? controle-de-si
# - Directory? ./
# - Override settings? No

# Deploy para produção
vercel --prod
```

#### 3. Configurar Domínio Personalizado (Opcional)

1. No dashboard da Vercel, vá em Settings > Domains
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções da Vercel

### Características do Deploy

✅ **100% Gratuito** - Plano Hobby da Vercel
✅ **HTTPS Automático** - SSL gratuito
✅ **CDN Global** - Deploy em múltiplas regiões
✅ **Builds Automáticos** - A cada push no GitHub
✅ **Preview Deployments** - Para cada Pull Request
✅ **Rollback Fácil** - Voltar para versões anteriores
✅ **Analytics** - Métricas de uso (opcional)

### Limites do Plano Gratuito

- ✅ Bandwidth: 100GB/mês (mais que suficiente)
- ✅ Builds: Ilimitados
- ✅ Deployments: Ilimitados
- ✅ Serverless Functions: 100GB-Hrs/mês
- ✅ Edge Functions: 100,000 invocações/dia

### Funcionalidades Offline

O app funciona 100% offline após o primeiro acesso:
- ✅ IndexedDB armazena todos os dados localmente
- ✅ Service Worker cacheia assets
- ✅ PWA instalável no celular/desktop
- ✅ Sem necessidade de backend
- ✅ Sem custos de servidor

### Atualizações

Para atualizar o app em produção:

```bash
# Fazer alterações no código
git add .
git commit -m "Descrição das mudanças"
git push origin main

# A Vercel fará deploy automático em ~2 minutos
```

### Monitoramento

Acesse o dashboard da Vercel para ver:
- 📊 Número de visitantes
- ⚡ Performance do site
- 🐛 Logs de erros
- 📈 Uso de recursos

### Troubleshooting

**Erro de Build:**
```bash
# Testar build localmente
npm run build

# Se funcionar local mas falhar na Vercel:
# - Verificar versão do Node.js no package.json
# - Verificar dependências no package.json
```

**App não carrega:**
- Limpar cache do navegador
- Verificar console do navegador (F12)
- Verificar logs na Vercel

**Dados não salvam:**
- Verificar se IndexedDB está habilitado no navegador
- Verificar se está em modo anônimo/privado (não funciona)

### Alternativas Gratuitas

Se preferir outras plataformas:

1. **Netlify** - Similar à Vercel
2. **GitHub Pages** - Requer configuração extra para Next.js
3. **Railway** - Boa para apps com backend
4. **Render** - Alternativa robusta

### Suporte

- 📧 Documentação Vercel: [vercel.com/docs](https://vercel.com/docs)
- 💬 Discord Vercel: [vercel.com/discord](https://vercel.com/discord)
- 🐛 Issues GitHub: Criar issue no repositório

---

**Desenvolvido com ❤️ por Bob**