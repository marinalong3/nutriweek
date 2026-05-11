#!/bin/bash
# NutriWeek - Setup Script para Replit
echo "🥗 Instalando NutriWeek..."

# Instala dependências do servidor
echo "📦 Instalando dependências do servidor..."
cd server && npm install
cd ..

# Instala dependências do cliente
echo "📦 Instalando dependências do cliente..."
cd client && npm install
cd ..

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "⚙️  Configure as variáveis de ambiente nos Secrets do Replit:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - STRIPE_PRO_PRICE_ID"
echo "   - STRIPE_FAMILY_PRICE_ID"
echo "   - MP_ACCESS_TOKEN"
echo "   - RESEND_API_KEY"
echo "   - FRONTEND_URL"
echo "   - JWT_SECRET"
echo ""
echo "🗄️  Execute o schema.sql no Supabase SQL Editor antes de iniciar."
echo ""
echo "🚀 Para iniciar: npm run dev"
