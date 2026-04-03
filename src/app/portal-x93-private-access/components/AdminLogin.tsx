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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 font-mono">
      <div className="w-full max-w-sm border border-[#FF6600]/20 bg-black p-8 shadow-[0_0_40px_rgba(255,102,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6600]"></div>
        <div className="text-center mb-10">
          <h1 className="text-[#FF6600] font-black text-2xl tracking-[0.3em] uppercase">GHOST_TERMINAL</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">// ENCRYPTED HANDSHAKE REQ</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="text" 
            placeholder="IDENTITY_SIGNATURE" 
            className="w-full bg-[#0a0a0a] border border-[#FF6600]/30 px-4 py-3 text-[#FF6600] text-xs focus:border-[#FF6600] focus:bg-[#FF6600]/5 outline-none transition-all placeholder:text-[#FF6600]/30 tracking-widest uppercase"
            onChange={e => setLoginUser(e.target.value)}
            value={loginUser}
            required
          />
          <input 
            type="password" 
            placeholder="ACCESS_PASSPHRASE" 
            className="w-full bg-[#0a0a0a] border border-[#FF6600]/30 px-4 py-3 text-[#FF6600] text-xs focus:border-[#FF6600] focus:bg-[#FF6600]/5 outline-none transition-all placeholder:text-[#FF6600]/30 tracking-widest uppercase"
            onChange={e => setLoginPass(e.target.value)}
            value={loginPass}
            required
          />
          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center tracking-widest animate-pulse">ERR: {error}</p>}
          <button className="w-full bg-[#FF6600] text-black py-4 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white hover:text-black transition-all">
            [ EXECUTE_LOGIN ]
          </button>
        </form>
      </div>
    </div>
  );
}