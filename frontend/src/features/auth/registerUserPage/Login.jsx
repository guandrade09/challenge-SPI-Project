import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../components/ui/NotificationToast';
import { useAuthStore } from '../../../store/useAuthStore';

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.loading)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
        mostrarToast("A senha deve ter pelo menos 8 caracteres", "vermelho", 3);
        return;
    }

    const result = await loginAction(email, password);

    if (result.success){
      mostrarToast("Login realizado com sucesso!", "verde", 2);
      navigate('/');
    } else {
      mostrarToast(result.message, "vermelho", 3);
    }

  };

  return (
    <div className="bg-projeto-main flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="auth-card-dark">
          <div className="text-center mb-8">
            <h1 className="font-label-auth">Bem-vindo</h1>
            <p className="text-neutral-400">Acesse o projeto do NOME_GRUPO</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-neutral-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-neutral-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-neutral-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-10 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-neutral-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-emerald-600 bg-neutral-800 border-neutral-700 rounded focus:ring-emerald-500 accent-emerald-600" />
                <span className="ml-2 text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors">Lembrar-me</span>
              </label>
              <Link to="/forgot-password" size="sm" className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}  //Desabilita enquanto carrega
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transform hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-900/20"
            >
              {isLoading ? "Carregando..." : "Entrar no Sistema"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              Novo usuário?{' '}
              <Link to="/register" className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;