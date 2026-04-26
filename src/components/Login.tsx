import { useState } from 'react';
import { loginApi, registerApi, storeSession } from '../api/auth';
import AnimatedTrailCanvas from './AnimatedTrailCanvas';

interface LoginProps {
  onSuccess: (user: { id: string; userName: string; token: string }) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = mode === 'login'
        ? await loginApi(userName, password)
        : await registerApi(userName, password);

      storeSession(res.token, res.user);
      onSuccess({ ...res.user, token: res.token });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedTrailCanvas />

      {/* Warm humanistic blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-[40%] -translate-y-[60%] w-80 h-80 bg-rose-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container with Border & Radius */}
      <div className="relative w-full max-w-md z-20 bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-2xl shadow-slate-950/50">

        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-black/20 mb-4">
            <svg className="w-7 h-7 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CollabBoard</h1>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-8">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === m ? 'bg-white text-slate-950 shadow-sm' : 'text-white hover:text-slate-950'
                }`}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Floating Label Username */}
          <div className="relative group">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder=" "
              required
              className="peer w-full bg-transparent border border-white rounded-xl px-4 py-3.5 text-black focus:outline-none focus:ring-1 focus:ring-white focus:border-white focus:bg-white/5 transition-all"
            />
            <label className="absolute left-4 top-3.5 text-black text-sm transition-all pointer-events-none 
              peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:text-black peer-focus:bg-white peer-focus:px-1
              peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1">
              Username
            </label>
          </div>

          {/* Floating Label Password */}
          <div className="relative group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full bg-transparent border border-white rounded-xl px-4 py-3.5 text-black focus:outline-none focus:ring-1 focus:ring-white focus:border-white focus:bg-white/5 transition-all"
            />
            <label className="absolute left-4 top-3.5 text-black text-sm transition-all pointer-events-none 
              peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:text-black peer-focus:bg-white peer-focus:px-1
              peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1">
              Password
            </label>
          </div>

          {error && <p className="text-red-400 text-xs font-medium px-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-slate-200 text-slate-950 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? 'Wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}