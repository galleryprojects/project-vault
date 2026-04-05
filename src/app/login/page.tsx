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
      router.push('/'); // Success: Redirect to home
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans relative overflow-hidden flex flex-col items-center justify-center px-6">
      
      {/* Pink Aesthetic Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 text-center mb-10">
        <h1 className="text-3xl font-black italic tracking-[0.4em] uppercase text-primary">
          FINE MEDIA
        </h1>
        <p className="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase mt-4">
          PREMIUM ACCESS // MEMBER LOGIN
        </p>
      </div>

      <div className="z-10 w-full max-w-[400px] bg-white border border-gray-100 rounded-[32px] p-8 shadow-2xl shadow-primary/10">
        <h2 className="text-xl font-black uppercase tracking-widest text-center mb-8 text-gray-800">
          Sign In
        </h2>

        <form action={handleSubmit} className="flex flex-col gap-5">
          
          <div className="relative">
            <input 
              name="username"
              type="text"
              placeholder="Username"
              required
              className="w-full bg-gray-50 border border-primary/20 rounded-2xl px-4 py-4 text-sm text-primary placeholder:text-gray-300 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="relative flex items-center">
            <input 
              name="password"
              type={showPassword ? "text" : "password"} 
              placeholder="Passphrase"
              required
              className="w-full bg-gray-50 border border-primary/20 rounded-2xl px-4 py-4 text-sm text-primary placeholder:text-gray-300 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-primary hover:opacity-70 transition-opacity text-[10px] font-black tracking-widest"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`mt-4 bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-full shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Authenticating...' : 'Enter Collection'}
          </button>

          <div className="mt-8 text-center">
            <a href="/signup" className="text-[10px] font-bold text-gray-400 hover:text-primary uppercase tracking-widest transition-colors border-b border-gray-100 pb-1">
              Not a member yet? Register
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}