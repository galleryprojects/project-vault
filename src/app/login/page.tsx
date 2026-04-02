'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../actions/auth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await loginUser(formData);

    if (result?.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.push('/'); // Authorized. Enter the Vault.
    }
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* BACKGROUND GRID */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="z-10 text-center mb-10">
        <h1 className="text-3xl font-black italic tracking-[0.5em] uppercase text-white">
          PROJECT-VAULT
        </h1>
        <p className="text-[10px] font-mono text-gray-500 tracking-[0.3em] uppercase mt-4">
          SYSTEM ACCESS // AUTHORIZATION REQUIRED
        </p>
      </div>

      <div className="z-10 w-full max-w-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-xl font-black uppercase tracking-widest text-center mb-8">
          Identify
        </h2>

        <form action={handleSubmit} className="flex flex-col gap-5">
          <div className="relative">
            <input 
              name="username"
              type="text"
              placeholder="USERNAME"
              required
              className="w-full bg-black/50 border border-[#FF6600]/30 rounded-lg px-4 py-4 text-sm text-[#FF6600] placeholder:text-[#FF6600]/40 outline-none focus:border-[#FF6600] transition-all font-mono"
            />
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-4 text-[#FF6600] text-lg">🔒</span>
            <input 
              name="password"
              type={showPassword ? "text" : "password"} 
              placeholder="PASSPHRASE"
              required
              className="w-full bg-black/50 border border-[#FF6600]/30 rounded-lg pl-12 pr-12 py-4 text-sm text-[#FF6600] placeholder:text-[#FF6600]/40 outline-none focus:border-[#FF6600] transition-all font-mono"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-[#FF6600]/60 hover:text-[#FF6600] transition-colors text-xs font-black tracking-tighter"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 bg-[#FF6600] text-white font-black py-4 rounded-full shadow-[0_0_30px_rgba(255,102,0,0.4)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50"
          >
            {loading ? 'AUTHORIZING...' : 'ENTER VAULT'}
          </button>

          <div className="mt-8 text-center">
            <a href="/signup" className="text-[10px] font-bold text-gray-500 hover:text-[#FF6600] uppercase tracking-widest transition-colors border-b border-gray-800 pb-1">
              New identity? Register here
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}