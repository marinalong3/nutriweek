const express = require('express');
const router = express.Router();
const { supabase } = require('../middleware/auth');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, referral_code } = req.body;

  if (!name || !email || !password) 
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

  // Cria usuário no Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name }
  });

  if (error) return res.status(400).json({ error: error.message });

  // Busca quem indicou
  let referred_by = null;
  if (referral_code) {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referral_code.toUpperCase())
      .single();
    if (referrer) referred_by = referrer.id;
  }

  // Cria perfil
  await supabase.from('profiles').insert({
    id: data.user.id,
    name,
    email,
    plan: 'trial',
    plan_status: 'active',
    referred_by
  });

  // Cria preferências padrão
  await supabase.from('user_preferences').insert({
    user_id: data.user.id
  });

  // Registra indicação se houver
  if (referred_by) {
    await supabase.from('referrals').insert({
      referrer_id: referred_by,
      referred_id: data.user.id,
      status: 'pending'
    });
  }

  // Faz login automático
  const { data: session, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) return res.status(400).json({ error: loginError.message });

  res.json({ 
    message: 'Conta criada com sucesso!',
    session: session.session,
    user: { id: data.user.id, name, email, plan: 'trial' }
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  res.json({ session: data.session, user: profile });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/nova-senha`
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Email de recuperação enviado!' });
});

// POST /api/auth/reset-password
router.post('/reset-password', requireAuth, async (req, res) => {
  const { password } = req.body;
  const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Senha atualizada com sucesso!' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user.profile });
});

module.exports = router;
