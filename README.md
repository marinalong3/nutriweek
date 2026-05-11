# 🥗 NutriWeek

> **Sua semana na mesa, sem esforço.**

Plataforma SaaS de planejamento de refeições semanais com lista de compras automática, informações nutricionais e personalização por IA.

---

## 🚀 Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Banco de dados:** Supabase (PostgreSQL)
- **IA:** Claude API (Anthropic)
- **Pagamentos:** Stripe (cartão) + Mercado Pago (PIX)
- **Email:** Resend
- **WhatsApp:** Z-API (plano Família)
- **Auth:** Supabase Auth

---

## 📁 Estrutura

```
nutriweek/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── lib/
├── server/          # Express backend
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── models/
├── .env.example
└── README.md
```

---

## ⚙️ Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_FAMILY_PRICE_ID=

# Mercado Pago (PIX)
MP_ACCESS_TOKEN=

# Resend (email)
RESEND_API_KEY=

# Z-API (WhatsApp - plano Família)
ZAPI_INSTANCE=
ZAPI_TOKEN=

# App
FRONTEND_URL=https://nutriweek.com.br
JWT_SECRET=
```

---

## 🗓️ Planos

| Plano | Preço | Cardápios | Recursos |
|-------|-------|-----------|---------|
| **Trial** | Grátis | 1 (único) | Lista básica + PDF |
| **Pro** | R$ 24,90/mês | 4/mês | Nutrição + lista completa + PDF + email semanal |
| **Família** | R$ 34,90/mês | 4/mês | Pro + 3 perfis + WhatsApp |

### Trial → conversão
- Usuário cria conta → entra automaticamente no Trial
- Após usar o 1 cardápio gratuito → prompt para assinar

---

## 💳 Pagamentos

- **Cartão de crédito:** Stripe (recorrência automática)
- **PIX:** Mercado Pago (recorrência manual com lembrete)
- **Cupons:** gerenciados no painel admin
- **Indicação:** ao indicar alguém que assinar, ganha 1 mês de desconto (30%) na próxima mensalidade
- **Garantia:** cancelamento com estorno em até 7 dias corridos (apenas 1ª assinatura)

---

## 🔧 Como rodar no Replit

1. Importe este repositório no Replit
2. Configure as variáveis de ambiente nos Secrets do Replit
3. No Shell: `npm install && npm run dev`
