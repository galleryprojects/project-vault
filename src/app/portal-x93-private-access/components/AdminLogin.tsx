'use client';

import React, { useState } from 'react';
import { loginAdminBypass } from '../../actions/admin-bypass';

export default function AdminLogin() {
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('username', loginUser);
    fd.append('password', loginPass);

    const res = await loginAdminBypass(fd);
    if (res.success) {
      window.location.reload(); 
    } else {
      setError(res.error || 'Access Denied');
    }
  };

  return (
    // [1] Switched background to pure white and changed font to Inter/Sans for elegance
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-sans">
      
      {/* [2] Box is now white with a soft pink shadow and border */}
      <div className="w-full max-w-sm border border-[#FF69B4]/20 bg-white p-10 shadow-[0_20px_50px_rgba(255,105,180,0.1)] relative overflow-hidden rounded-3xl">
        
        {/* [3] Accent top bar is now Pink */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FF69B4]"></div>
        
        <div className="text-center mb-10">
          <h1 className="text-[#FF69B4] font-black text-2xl tracking-[0.3em] uppercase">GHOST_TERMINAL</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">// ENCRYPTED HANDSHAKE REQ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* [4] Inputs now have pink borders and pink text focus */}
          <input 
            type="text" 
            placeholder="IDENTITY_SIGNATURE" 
            className="w-full bg-gray-50 border border-[#FF69B4]/30 rounded-xl px-4 py-4 text-[#FF69B4] text-xs focus:border-[#FF69B4] focus:ring-1 focus:ring-[#FF69B4] outline-none transition-all placeholder:text-[#FF69B4]/30 tracking-widest uppercase"
            onChange={e => setLoginUser(e.target.value)}
            value={loginUser}
            required
          />
          
          <input 
            type="password" 
            placeholder="ACCESS_PASSPHRASE" 
            className="w-full bg-gray-50 border border-[#FF69B4]/30 rounded-xl px-4 py-4 text-[#FF69B4] text-xs focus:border-[#FF69B4] focus:ring-1 focus:ring-[#FF69B4] outline-none transition-all placeholder:text-[#FF69B4]/30 tracking-widest uppercase"
            onChange={e => setLoginPass(e.target.value)}
            value={loginPass}
            required
          />

          {error && <p className="text-red-400 text-[10px] font-bold uppercase text-center tracking-widest animate-pulse">ERR: {error}</p>}
          
          {/* [5] The Main Button is now Pink with a soft glow */}
          <button className="w-full bg-[#FF69B4] text-white py-4 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_10px_20px_rgba(255,105,180,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
            [ EXECUTE_LOGIN ]
          </button>
        </form>
      </div>
    </div>
  );
}