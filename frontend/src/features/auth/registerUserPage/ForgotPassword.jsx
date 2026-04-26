import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Reset password for:', email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-projeto-main p-4">
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
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-emerald-500 font-semibold hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-projeto-main p-4">
      <div className="w-full max-w-md">
        <div className="auth-card-dark">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold !text-white mb-2">Esqueceu a Senha?</h1>
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
                  className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-neutral-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
              Enviar Link
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-emerald-500 transition-colors"
            >
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