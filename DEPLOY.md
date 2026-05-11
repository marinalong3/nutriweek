# 🚀 Guia de Deploy no Replit — NutriWeek

## Passo 1 — Importar no Replit

1. Acesse [replit.com](https://replit.com)
2. Clique em **Create Repl** → **Import from GitHub** (ou faça upload do ZIP)
3. Escolha **Node.js** como linguagem

---

## Passo 2 — Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** e execute o conteúdo de `server/models/schema.sql`
3. Em **Settings → API**, copie:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY`
4. Em **Storage**, crie um bucket chamado `nutrition-photos` com acesso público

---

## Passo 3 — Configurar o Stripe

1. Acesse [stripe.com](https://stripe.com) e crie uma conta
2. No dashboard, vá em **Products** e crie 2 produtos:
   - **NutriWeek Pro** — R$ 24,90/mês → copie o `Price ID` → `STRIPE_PRO_PRICE_ID`
   - **NutriWeek Família** — R$ 34,90/mês → copie o `Price ID` → `STRIPE_FAMILY_PRICE_ID`
3. Em **Developers → API keys**, copie a `Secret key` → `STRIPE_SECRET_KEY`
4. Em **Developers → Webhooks**, adicione o endpoint:
   `https://seu-repl.replit.app/api/webhooks/stripe`
   Eventos: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`, `invoice.payment_succeeded`
   Copie o `Signing secret` → `STRIPE_WEBHOOK_SECRET`

---

## Passo 4 — Configurar o Mercado Pago (PIX)

1. Acesse [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Copie o `Access Token` → `MP_ACCESS_TOKEN`

---

## Passo 5 — Configurar o Resend (emails)

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta e adicione seu domínio
3. Gere uma API Key → `RESEND_API_KEY`

---

## Passo 6 — Configurar variáveis de ambiente no Replit

No painel do Replit, clique em **Secrets** (🔒) e adicione:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
MP_ACCESS_TOKEN=APP_USR-...
RESEND_API_KEY=re_...
FRONTEND_URL=https://seu-repl.replit.app
JWT_SECRET=uma_string_aleatoria_longa_aqui
PORT=3000
NODE_ENV=production
```

---

## Passo 7 — Instalar dependências e iniciar

No Shell do Replit:

```bash
bash setup.sh
npm run dev
```

Ou em produção (apenas o servidor):
```bash
cd server && npm install
cd ../client && npm install && npm run build
cd ..
node server/index.js
```

---

## Passo 8 — Checklist final

- [ ] Schema SQL executado no Supabase
- [ ] Bucket `nutrition-photos` criado no Supabase Storage
- [ ] Produtos Pro e Família criados no Stripe
- [ ] Webhook do Stripe configurado com os 4 eventos
- [ ] Todos os Secrets configurados no Replit
- [ ] `npm run dev` rodando sem erros
- [ ] Testar cadastro + onboarding + gerar cardápio

---

## 💡 Dicas

- Use o modo **Test** do Stripe enquanto desenvolve (cartão teste: `4242 4242 4242 4242`)
- Para testar PIX, use o ambiente de sandbox do Mercado Pago
- Os primeiros cupons já estão pré-cadastrados: `LANCAMENTO30`, `BEMVINDO`, `PRO50`, `FAMILIA10`
- Para criar um usuário admin, adicione `is_admin: true` diretamente no Supabase
