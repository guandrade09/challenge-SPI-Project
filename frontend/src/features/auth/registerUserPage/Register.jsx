import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Adicionado useNavigate
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../components/ui/NotificationToast';
import { useAuthStore } from '../../../store/useAuthStore'; // Importe a Store

export function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '' 
    });

    const { mostrarToast } = useToast();
    const navigate = useNavigate();
    
    // Pegamos a ação e o estado de loading
    const registerAction = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.loading);

    const handleSubmit = async (e) => {
      e.preventDefault();
      const { name, email, password, confirmPassword } = formData;

      // Validações de Frontend
      if (password.length < 8) {
        mostrarToast("A senha deve conter pelo menos 8 caracteres.", "vermelho", 3);
        return;
      }

      if (password !== confirmPassword) {
        mostrarToast('As senhas não coincidem!', 'vermelho', 3);
        return;
      }

      // Chamada para a API
      const result = await registerAction(name, email, password);

      if (result.success) {
        mostrarToast("Conta criada com sucesso! Faça login.", "verde", 3);
        navigate('/login'); // Redireciona para o login após cadastrar
      } else {
        mostrarToast(result.message, "vermelho", 3);
      }
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
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 mt-2 active:scale-95"
            >
              {isLoading ? "Criando conta..." : "Finalizar Cadastro"}
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