'use client';

import { useEffect, useState } from 'react';
import { getProfile, logoutUser } from '@/app/actions/auth';

export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null);
  const [copyStatus, setCopyStatus] = useState("CLICK TO COPY");

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  const handleCopy = () => {
    if (!profile?.user_id_display) return;
    navigator.clipboard.writeText(profile.user_id_display);
    setCopyStatus("COPIED TO CLIPBOARD");
    setTimeout(() => setCopyStatus("CLICK TO COPY"), 2000);
  };

  if (!profile) return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-black uppercase text-[10px] tracking-[0.4em]">
      DECRYPTING_IDENTITY...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F7F7F5] relative overflow-hidden font-sans pb-12">
      <div className="relative z-10 max-w-md mx-auto pt-24 px-6">
        
        <div className="mb-8 border-b-2 border-gray-100 pb-4">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Security Profile</h1>
        </div>

        {/* [USER ID CARD] Displays real USR- format ID from DB */}
        <div className="bg-black rounded-[32px] p-8 mb-6 shadow-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-10">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">👤</div>
            <span className="text-[8px] font-black bg-[#FF6600]/20 text-[#FF6600] px-3 py-1 rounded-full tracking-widest">
              ${profile.balance?.toFixed(2) || "0.00"} CREDITS
            </span>
          </div>

          <div className="cursor-pointer group" onClick={handleCopy}>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Unique Access ID</p>
            <h2 className="text-2xl font-mono font-bold text-white tracking-widest mb-1 group-hover:text-[#FF6600] transition-colors">
              {profile.user_id_display || "ID_GENERATING"}
            </h2>
            <p className="text-[7px] font-bold text-[#FF6600] uppercase tracking-widest animate-pulse">
              [ {copyStatus} ]
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-6 shadow-sm mb-6">
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</span>
            <span className="text-sm font-black uppercase">{profile.username}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Status</span>
            <span className="text-sm font-black uppercase text-[#FF6600]">
              {profile.is_unlocked ? 'LIFETIME_UNLOCKED' : 'LIMITED_ACCESS'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Linked to Auth update sequence */}
          <button className="w-full bg-white border border-gray-200 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 flex items-center justify-center gap-3">
            <span>🔑</span> Change Access Passphrase
          </button>
          
          <button onClick={() => logoutUser().then(() => window.location.href='/')} className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-100 transition-all">
            Terminate Session // Logout
          </button>
        </div>

      </div>
    </main>
  );
}