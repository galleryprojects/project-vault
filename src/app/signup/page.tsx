'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpUser } from '../actions/auth'; 

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await signUpUser(formData);

    if (result?.error) {
      alert("Registration Error: " + result.error);
      setLoading(false);
    } else {
      router.push('/');
    }
  }

  return (
    // [1] bg-white replaces the dark background for the "Elegant" look
    <main className="min-h-screen bg-white text-gray-900 font-sans relative overflow-hidden flex flex-col items-center justify-center px-6">

      {/* [2] Soft Glow using your primary color with low opacity (primary/5) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 text-center mb-10">
        {/* [3] Title uses text-primary for the Pink accent */}
        <h1 className="text-3xl font-black italic tracking-[0.4em] uppercase text-primary">
          Sy Exclusive
        </h1>
        <p className="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase mt-4">
          Premium Buckets For Exclusive Collectors
        </p>
      </div>

      {/* [4] Card with soft primary shadow (shadow-primary/10) */}
      <div className="z-10 w-full max-w-[400px] bg-white border border-gray-100 rounded-[32px] p-8 shadow-2xl shadow-primary/10">
        <h2 className="text-xl font-black uppercase tracking-widest text-center mb-8 text-gray-800">
          Create Account
        </h2>

        <form action={handleSubmit} className="flex flex-col gap-5">
          
          {/* USERNAME FIELD (Focus rings and borders now use primary) */}
          <div className="relative">
            <input 
              name="username" 
              type="text"
              placeholder="Pick a username"
              required
              className="w-full bg-gray-50 border border-primary/20 rounded-2xl px-4 py-4 text-sm text-primary placeholder:text-gray-300 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* PASSWORD FIELD */}
          <div className="relative flex items-center">
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="CREATE PASSPHRASE"
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
          
          {/* CONFIRM PASSWORD FIELD */}
          <div className="relative flex items-center">
            <input 
              name="confirmPassword" 
              type={showPassword ? "text" : "password"} 
              placeholder="RE-ENTER PASSPHRASE"
              required
              className="w-full bg-gray-50 border border-primary/20 rounded-2xl px-4 py-4 text-sm text-primary placeholder:text-gray-300 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2 mt-1">
              Minimum of 7 characters required
            </p>

          {/* [5] THE MASTER BUTTON: Uses bg-primary and hover:bg-primary-hover */}
          <button 
            type="submit"
            disabled={loading}
            className={`mt-4 bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-full shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : 'Register Access'}
          </button>

          <div className="mt-8 text-center">
            <a href="/login" className="text-[10px] font-bold text-gray-400 hover:text-primary uppercase tracking-widest transition-colors border-b border-gray-100 pb-1">
              Already a member? Login
            </a>
          </div>

        </form>
      </div>
    </main>
  );
}