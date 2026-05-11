// RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const [params] = useSearchParams();
  const referralCode = params.get('ref') || '';
  const [form, setForm] = useState({ name: '', email: '', password: '', referral: referralCode });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Senha deve ter no mínimo 8 caracteres');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.referral);
      toast.success('Conta criada! Vamos configurar suas preferências 🎉');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center">
              <Leaf size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-brand-dark">nutri<span className="text-brand-green">week</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark">Criar conta grátis</h1>
          <p className="text-gray-500 mt-1">Comece com 1 cardápio gratuito</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Nome</label>
              <input className="input" type="text" placeholder="Seu nome completo" required
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email</label>
              <input className="input" type="email" placeholder="seu@email.com" required
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Senha</label>
              <div className="relative">
                <input className="input pr-12" type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" required
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {referralCode && (
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Código de indicação</label>
                <input className="input bg-green-50 border-green-200" type="text" readOnly value={form.referral} />
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem conta? <Link to="/login" className="text-brand-green font-semibold hover:underline">Entrar</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            Ao criar uma conta, você concorda com os <a href="#" className="underline">Termos de Uso</a> e a <a href="#" className="underline">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center">
              <Leaf size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-brand-dark">nutri<span className="text-brand-green">week</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark">Bem-vindo de volta!</h1>
          <p className="text-gray-500 mt-1">Entre na sua conta</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email</label>
              <input className="input" type="email" placeholder="seu@email.com" required
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Senha</label>
              <div className="relative">
                <input className="input pr-12" type={showPass ? 'text' : 'password'} placeholder="Sua senha" required
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Link to="/recuperar-senha" className="text-sm text-brand-green hover:underline">Esqueceu a senha?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Não tem conta? <Link to="/cadastro" className="text-brand-green font-semibold hover:underline">Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
