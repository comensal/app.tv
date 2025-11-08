import { useState } from 'react';
import { Mail, Lock, User, AlertCircle, Loader, Play } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, error } = useAuth();

  const plans = [
    { id: 'free', name: 'Free', credits: 10, price: 'Grátis' },
    { id: 'basic', name: 'Basic', credits: 50, price: 'R$ 9,90' },
    { id: 'premium', name: 'Premium', credits: 200, price: 'R$ 29,90' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      await signUp(email, password, fullName, selectedPlan);
    } else {
      await signIn(email, password);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-black"></div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-2xl border border-blue-900/30 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-4 shadow-lg">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">StreamHub</h1>
            <p className="text-cyan-400 mt-2">Filmes, séries e canais em um só lugar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-cyan-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Escolha seu plano
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`p-3 rounded-lg border-2 transition ${
                          selectedPlan === plan.id
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">{plan.name}</div>
                        <div className="text-xs text-cyan-400 mt-1">{plan.price}</div>
                        <div className="text-xs text-gray-400">{plan.credits} créditos</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-cyan-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-cyan-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
            >
              {isLoading && <Loader className="w-5 h-5 animate-spin" />}
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setFullName('');
                }}
                className="ml-2 text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                {isSignUp ? 'Entrar' : 'Criar nova'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
