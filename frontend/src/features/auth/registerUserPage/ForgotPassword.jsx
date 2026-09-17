import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-projeto-main flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="auth-card-dark text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="font-label-auth">Email Enviado!</h1>
            <p className="text-neutral-400 mb-8">
              Enviamos um link de recuperação para <strong className="text-white">{email}</strong>.
              Verifique sua caixa de entrada.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 link-emerald">
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-projeto-main flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="auth-card-dark">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Esqueceu a Senha?</h1>
            <p className="text-neutral-400">
              Digite seu email cadastrado para receber as instruções de recuperação.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-neutral-300">
                Email de Recuperação
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-icon"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary active:scale-95">
              Enviar Link
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-emerald-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
