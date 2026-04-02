'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// [1] IMPORT: Pull in the backend logic we wrote
import { signUpUser } from '../actions/auth'; 

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // [2] THE HANDLER: This connects the "Pretty UI" to the "Database Brain"
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await signUpUser(formData);

    if (result?.error) {
      alert("Security Error: " + result.error);
      setLoading(false);
    } else {
      // It worked! Redirect to the main page
      router.push('/');
    }
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans relative overflow-hidden flex flex-col items-center justify-center px-6">

      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="z-10 text-center mb-10">
        <h1 className="text-3xl font-black italic tracking-[0.5em] uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          PROJECT-VAULT
        </h1>
        <p className="text-[10px] font-mono text-gray-500 tracking-[0.3em] uppercase mt-4">
          SECURE REGISTRATION // LEVEL 4 ENCRYPTION INITIALIZED
        </p>
      </div>

      <div className="z-10 w-full max-w-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-xl font-black uppercase tracking-widest text-center mb-8">
          Create Access
        </h2>

        {/* [3] THE FORM WRAPPER: This is the missing piece */}
        <form action={handleSubmit} className="flex flex-col gap-5">
          
          {/* USERNAME FIELD (Added 'name' attribute) */}
          <div className="relative">
            <input 
              name="username" // [CRUCIAL] This must match what the action expects
              type="text"
              placeholder="Enter a username"
              required
              className="w-full bg-black/50 border border-[#FF6600]/30 rounded-lg px-4 py-4 text-sm text-[#FF6600] placeholder:text-[#FF6600]/40 outline-none focus:border-[#FF6600] transition-all font-mono"
            />
          </div>

          {/* PASSWORD FIELD (Added 'name' attribute) */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-[#FF6600] text-lg">🔒</span>
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="ENTER PASSPHRASE"
              required
              className="w-full bg-black/50 border border-[#FF6600]/30 rounded-lg pl-12 pr-12 py-4 text-sm text-[#FF6600] placeholder:text-[#FF6600]/40 outline-none focus:border-[#FF6600] transition-all font-mono"
            />
            {/* Show/Hide button for the first box */}
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-[#FF6600]/60 hover:text-[#FF6600] transition-colors text-xs font-black tracking-tighter"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
          

          {/* [2] CONFIRM PASSWORD FIELD (Separate Div!) */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-[#FF6600] text-lg opacity-50">🔒</span>
            <input 
              name="confirmPassword" 
              type={showPassword ? "text" : "password"} 
              placeholder="RE-ENTER PASSPHRASE"
              required
              className="w-full bg-black/50 border border-[#FF6600]/30 rounded-lg pl-12 pr-12 py-4 text-sm text-[#FF6600] placeholder:text-[#FF6600]/40 outline-none focus:border-[#FF6600] transition-all font-mono"
            />
            {/* We don't need a second button here; the state from the first one toggles both! */}
          </div>

           {/* [INSTRUCTION TEXT] */}
            <p className="text-[9px] font-mono text-[#FF6600]/50 uppercase tracking-[0.2em] ml-2 mt-1">
              MINIMUM OF 7 CHARACTERS REQUIRED FOR PASSWORD
            </p>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit"
            disabled={loading}
            className={`mt-4 bg-[#FF6600] text-white font-black py-4 rounded-full shadow-[0_0_30px_rgba(255,102,0,0.4)] hover:shadow-[0_0_50px_rgba(255,102,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Initializing...' : 'Complete Registration'}
          </button>

          <div className="mt-8 text-center">
            <a href="/login" className="text-[10px] font-bold text-gray-500 hover:text-[#FF6600] uppercase tracking-widest transition-colors border-b border-gray-800 pb-1">
              Already have access? Login
            </a>
          </div>

        </form>
      </div>
    </main>
  );
}