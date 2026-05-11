const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Token inválido' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  req.user = { ...user, profile };
  next();
};

const requirePlan = (plans) => (req, res, next) => {
  const userPlan = req.user?.profile?.plan;
  if (!plans.includes(userPlan)) {
    return res.status(403).json({ 
      error: 'Plano insuficiente', 
      required: plans,
      current: userPlan,
      upgrade_url: `${process.env.FRONTEND_URL}/planos`
    });
  }
  next();
};

const requireAdmin = async (req, res, next) => {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();
  if (!data?.is_admin) return res.status(403).json({ error: 'Acesso negado' });
  next();
};

module.exports = { requireAuth, requirePlan, requireAdmin, supabase };
