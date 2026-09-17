import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../components/ui/NotificationToast';
import { useAuthStore } from '../../../store/useAuthStore';

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const registerAction = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.loading);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (password.length < 8) {
      mostrarToast("A senha deve conter pelo menos 8 caracteres.", "vermelho", 3);
      return;
    }
    if (password !== confirmPassword) {
      mostrarToast('As senhas não coincidem!', 'vermelho', 3);
      return;
    }

    const result = await registerAction(name, email, password);
    if (result.success) {
      mostrarToast("Conta criada com sucesso! Faça login.", "verde", 3);
      navigate('/login');
    } else {
      mostrarToast(result.message, "vermelho", 3);
    }
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
                  className="form-input-icon"
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
                  className="form-input-icon"
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
                    className="form-input-icon pr-12"
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

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-300">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input-icon"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary mt-2 active:scale-95"
            >
              {isLoading ? "Criando conta..." : "Finalizar Cadastro"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="link-emerald hover:underline">
              Já possui acesso? Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
