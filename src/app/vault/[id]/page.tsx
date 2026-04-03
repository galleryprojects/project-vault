'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProfile, unlockVault, getVaultMedia, checkVaultAccess } from '../../actions/auth'; 

export default function VaultInside() {
  const router = useRouter();
  const params = useParams();
  const vaultId = params.id as string; // Grabs 'mary' or 'cyber-set' from the URL
  
  // --- [1] STATE MANAGEMENT ---
  const [balance, setBalance] = useState<number>(0);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [media, setMedia] = useState<any[]>([]); // NEW: Stores your real pictures
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- [2] SYNC PROTOCOL (Fetch real data on load) ---
  useEffect(() => {
    // Change this line in your useEffect
    async function syncVault() {
      const [profile, mediaData, hasAccess] = await Promise.all([
        getProfile(),
        getVaultMedia(vaultId),
        checkVaultAccess(vaultId) // NEW: Check if they bought THIS vault
      ]);

      if (profile) setBalance(profile.balance || 0);
      if (mediaData) setMedia(mediaData);
      
      // This is the fix: isUnlocked now refers to the CONTENT, not the whole site
      setIsUnlocked(hasAccess); 
      
      setLoading(false);
    }
    
    if (vaultId) syncVault();
  }, [vaultId]);

  // --- [3] UNLOCK HANDLER ---
  const handleUnlock = async () => {
  setIsProcessing(true);
  setError(null);

  // Pass the actual ID (mary) and the price (6.00)
  const result = await unlockVault(vaultId, 6.00); 

  if (result.error) {
    setError(result.error);
    setIsProcessing(false);
  } else {
    setIsUnlocked(true);
    // Refresh balance
    const updatedProfile = await getProfile();
    if (updatedProfile) setBalance(updatedProfile.balance);
    setIsProcessing(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em]">
        Decrypting Vault Protocol...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] relative overflow-hidden font-sans">
      
      {/* [NAV BAR] */}
      <nav className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 z-[100] flex items-center px-4">
        <div className="flex w-full max-w-7xl mx-auto items-center justify-between relative">
          <div className="flex items-center">
            <div className="flex flex-col gap-1 pr-4 border-r border-gray-100 py-1">
              <div className="w-6 h-0.5 bg-black"></div>
              <div className="w-6 h-0.5 bg-black"></div>
              <div className="w-6 h-0.5 bg-black"></div>
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-[14px] font-[900] tracking-[0.3em] uppercase italic">PROJECT-VAULT</h1>
            {/* Show the actual Vault ID being viewed */}
            <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">ID: {vaultId}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[13px] font-black text-[#111]">${balance.toFixed(2)}</span>
              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Credits</span>
            </div>
            <button 
              onClick={() => router.push('/deposit')}
              className="bg-[#FF6600] text-white text-[10px] font-[900] px-5 py-2.5 rounded-full shadow-lg uppercase tracking-widest"
            >
              Deposit
            </button>
          </div>
        </div>
      </nav>

      {/* [DYNAMIC GRID] - Maps over your real database rows */}
      <div className={`pt-24 px-4 pb-12 transition-all duration-1000 ${!isUnlocked ? 'pointer-events-none' : ''}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          
          {media.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
                <span className="text-4xl mb-4">📂</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Assets found for Vault: {vaultId}</span>
            </div>
          ) : (
            media.map((item) => (
              <div key={item.id} className="aspect-square bg-black rounded-lg relative overflow-hidden border border-black/5 flex items-center justify-center group cursor-pointer hover:border-[#FF6600] transition-colors">
                  
                  {/* The Real Image */}
                  <img 
                    src={item.file_url} 
                    alt={`Vault Asset ${item.id}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${!isUnlocked ? 'blur-xl scale-110 opacity-40' : 'blur-0 scale-100 opacity-100'}`}
                  />

                  {/* The Hover Button */}
                  <span className="relative z-10 text-[8px] font-black opacity-30 group-hover:opacity-100 group-hover:text-[#FF6600] uppercase tracking-[0.5em] transition-all bg-black/60 px-3 py-2 rounded border border-white/10 backdrop-blur-md">
                    {isUnlocked ? '[ VIEW MEDIA ]' : 'Locked Content'}
                  </span>
              </div>
            ))
          )}

        </div>
      </div>

      {/* [UNLOCK POPUP] */}
      {!isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-[400px] bg-black/95 border border-white/10 rounded-[32px] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FF6600]/20 blur-[60px] rounded-full -z-10"></div>

            <span className="inline-block text-4xl mb-6">🔒</span>
            
            <h2 className="text-xl font-[900] text-white uppercase tracking-widest mb-2">Unlock Access</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">
              One-Time Decryption Fee Required
            </p>

            <div className="bg-white/5 border border-white/5 rounded-2xl py-6 mb-8">
              <div className="flex flex-col gap-1">
                <span className="text-[28px] font-[900] text-[#FF6600] tracking-tighter leading-none">$3.00</span>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Vault Credits</span>
              </div>
              <div className="mt-4 h-[1px] w-12 bg-white/10 mx-auto"></div>
              <p className="text-[9px] font-bold text-gray-400 mt-4 uppercase tracking-widest">
                  Your Balance: <span className="text-white">${balance.toFixed(2)}</span>
              </p>
            </div>

            {error && (
              <p className="text-[#FF0000] text-[8px] font-black uppercase mb-4 tracking-widest">
                !! ERROR: {error} !!
              </p>
            )}

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleUnlock}
                disabled={isProcessing}
                className="w-full bg-[#FF6600] text-white py-4 rounded-full font-[900] uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(255,102,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isProcessing ? 'INITIALIZING...' : 'Unlock Vault ($3.00)'}
              </button>
              
              <button 
                onClick={() => router.push('/deposit')}
                className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Deposit Credits
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}