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
    <div className="min-h-screen bg-white flex items-center justify-center font-black uppercase text-[10px] tracking-[0.4em] text-primary animate-pulse">
      Opening Profile...
    </div>
  );

  return (
    <main className="min-h-screen bg-white relative overflow-hidden font-sans pb-12 text-gray-900">
      
      {/* Elegant Pink Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-md mx-auto pt-24 px-6">
        
        <div className="mb-10 border-b border-gray-100 pb-6 text-center">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Profile</h1>
        </div>

        {/* [USER ID CARD] - Updated to Premium Pink Style */}
        <div className="bg-white rounded-[32px] p-8 mb-8 shadow-2xl shadow-primary/10 relative overflow-hidden border border-primary/10">
          <div className="absolute top-0 right-0 p-4">
             <span className="text-[9px] font-black bg-primary/10 text-primary px-4 py-2 rounded-full tracking-widest uppercase">
              ${profile.balance?.toFixed(2) || "0.00"} Balance
            </span>
          </div>

          <div className="mt-10 cursor-pointer group" onClick={handleCopy}>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-3">Membership ID</p>
            <h2 className="text-2xl font-mono font-bold text-gray-800 tracking-widest mb-2 group-hover:text-primary transition-colors">
              {profile.user_id_display || "ID_GENERATING"}
            </h2>
            <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">
              [ {copyStatus} ]
            </p>
          </div>
        </div>

        {/* Member Details */}
        <div className="bg-gray-50 rounded-[24px] border border-gray-100 p-8 space-y-6 shadow-sm mb-8">
          <div className="flex justify-between items-center border-b border-gray-200 pb-5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</span>
            <span className="text-sm font-black uppercase text-gray-700">{profile.username}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
            <span className="text-sm font-black uppercase text-primary">
              {profile.is_unlocked ? 'Premium Member' : 'Standard Member'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button className="w-full bg-white border border-gray-200 text-gray-600 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-3 shadow-sm">
            <span>🔐</span> Update Access Credentials
          </button>
          
          <button 
            onClick={() => logoutUser().then(() => window.location.href='/')}
            className="w-full bg-red-50 text-red-400 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-100 transition-all shadow-sm"
          >
            Sign Out of Sy Exclusive
          </button>
        </div>

        <button 
          onClick={() => window.location.href = '/'}
          className="mt-12 text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest transition-all block mx-auto"
        >
          ← Return to Collection
        </button>

      </div>
    </main>
  );
}