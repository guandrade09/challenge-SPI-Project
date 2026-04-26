import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../components/ui/NotificationToast';

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });

  const { mostrarToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    const { password, confirmPassword } = formData;

    if (password.length < 8) {
      mostrarToast("A senha deve conter mais que 8 caracteres.", "vermelho", 3);
      return;
    }

    if (password !== confirmPassword) {
      mostrarToast('As senhas não coincidem!', 'vermelho', 3);
      return;
    }

    console.log('Register:', formData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-projeto-main flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="auth-card-dark">
          <div className="text-center mb-8">
            <h1 className="font-label-auth">Criar Conta</h1>
            <p className="text-neutral-400">Registre-se para acessar o projeto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-300">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-neutral-500"
                  placeholder="Nome do Usuário"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-neutral-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-300">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-10 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-neutral-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-emerald-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-300">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-neutral-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 mt-2 active:scale-95"
            >
              Finalizar Cadastro
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-emerald-500 font-medium hover:underline">
              Já possui acesso? Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;