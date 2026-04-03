'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logoutUser, getVaultCovers, unlockVault } from './actions/auth'; 

// [1] SUB-COMPONENT: VaultCard (With Slider & Purchase Logic)
function VaultCard({ item, onClick, isProcessing }: { item: any, onClick: () => void, isProcessing: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
  };

  return (
    <div onClick={onClick} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md hover:-translate-y-1">
      
      {/* IMAGE SLIDER */}
      <div className="relative aspect-square w-full bg-black overflow-hidden">
        <div 
          className="flex h-full transition-transform duration-500 ease-out" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {item.images.map((img: string, idx: number) => (
            <div key={idx} className="min-w-full h-full flex items-center justify-center relative bg-black">
               <img 
                 src={img} 
                 alt={`${item.title} asset`} 
                 className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
               />
            </div>
          ))}
        </div>

        {/* SLIDER CONTROLS */}
        {item.images.length > 1 && (
          <>
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
              <button onClick={prevSlide} className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-white transition-all">←</button>
              <button onClick={nextSlide} className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-white transition-all">→</button>
            </div>
            {/* PROGRESS DOTS */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
              {item.images.map((_: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-[#FF6600]' : 'w-1 bg-white/50'}`}
                ></div>
              ))}
            </div>
          </>
        )}

        {/* HOVER BORDER */}
        <div className="absolute inset-0 border-[3px] border-[#FF6600] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"></div>
      </div>
      
      {/* CARD FOOTER */}
      <div className="p-4 bg-white relative z-10">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-tight truncate mb-2">
          {item.title}
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex flex-col leading-none">
            <span className="text-[14px] font-black text-[#FF6600]">${item.price}</span>
            <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest mt-1 italic">Tier 01 Open</span>
          </div>
          <button className="bg-black text-white text-[9px] font-black px-4 py-2 rounded-lg group-hover:bg-[#FF6600] transition-colors uppercase tracking-widest">
            {isProcessing ? 'Wait...' : 'Decrypt'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [vaultItems, setVaultItems] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isVaultLoading, setIsVaultLoading] = useState<string | null>(null);

  // --- [1] MASTER UNLOCK ($3.00) ---
  const handleInitializeAccess = async () => {
    const result = await unlockVault("INITIAL_ENTRY", 3.00);
    if (result.success) {
      setIsLocked(false);
      const updated = await getProfile();
      if (updated) setUserProfile(updated);
    } else {
      router.push('/deposit');
    }
  };

  // --- [2] VAULT PURCHASE & NEW TAB ($6.00) ---
  const handleVaultPurchase = async (vaultId: string) => {
    setIsVaultLoading(vaultId);
    // Charge $6.00 for Tier 1 immediately
    const result = await unlockVault(vaultId, 6.00, 1);

    if (result.success) {
      window.open(`/vault/${vaultId}`, '_blank');
      const updated = await getProfile();
      if (updated) setUserProfile(updated);
    } else if (result.error === "Insufficient Credits.") {
      router.push('/deposit');
    } else {
      // If already bought, just open it anyway
      window.open(`/vault/${vaultId}`, '_blank');
    }
    setIsVaultLoading(null);
  };

  useEffect(() => {
    async function loadData() {
      const [profile, covers] = await Promise.all([getProfile(), getVaultCovers()]);
      if (profile) {
        setUserProfile(profile);
        if (profile.is_unlocked) setIsLocked(false); 
      }
      if (covers) {
        setVaultItems(covers.map((c) => ({
          id: c.vault_id,
          title: c.vault_id.replace(/-/g, ' '),
          price: "6.00", 
          images: [c.cover_url] 
        })));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em]">
      Syncing Mainframe...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111] font-sans">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full h-[64px] bg-white border-b border-gray-200 z-[100] flex items-center px-4">
        <div className="flex w-full max-w-7xl mx-auto items-center justify-between relative">
          <button onClick={() => setIsMenuOpen(true)} className="flex flex-col justify-center gap-1.5 pr-5 border-r border-gray-200 h-8">
            <div className="w-6 h-[2px] bg-black"></div>
            <div className="w-6 h-[2px] bg-black"></div>
            <div className="w-6 h-[2px] bg-black"></div>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-sm font-black tracking-[0.3em] uppercase italic">PROJECT-VAULT</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[14px] font-black">${userProfile?.balance?.toFixed(2) || "0.00"}</span>
              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">Credits</span>
            </div>
            <button onClick={() => router.push('/deposit')} className="bg-[#FF6600] text-white text-[10px] font-black px-5 py-2.5 rounded-full uppercase tracking-widest shadow-lg">Deposit</button>
          </div>
        </div>
      </nav>

      {/* SIDEBAR */}
      <div className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <aside className={`absolute top-0 left-0 w-[280px] h-full bg-white transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8">
            <button onClick={() => setIsMenuOpen(false)} className="text-[10px] font-black text-gray-400 mb-10 uppercase tracking-widest">✕ CLOSE</button>
            <nav className="flex flex-col gap-6 text-[22px] font-bold uppercase italic">
              <a href="/" className="border-b-4 border-black w-fit">Main</a>
              <a href="/orders" className="text-gray-300">Archive</a>
              <button onClick={async () => { await logoutUser(); window.location.href = '/login'; }} className="mt-12 text-xs font-black text-red-500 uppercase tracking-widest text-left pt-6 border-t border-gray-100">Terminate Session</button>
            </nav>
          </div>
        </aside>
      </div>

      {/* BLUR WRAPPER */}
      <div className={`transition-all duration-1000 ${isLocked ? 'blur-[8px] brightness-[0.5] pointer-events-none' : 'blur-0'}`}>
        <div className="pt-28 px-4 pb-12 max-w-7xl mx-auto">
          <div className="mb-8 border-b-2 border-gray-100 pb-4">
            <h2 className="text-[28px] font-black italic uppercase tracking-tighter leading-none">Active Vaults</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {vaultItems.map((item) => (
              <VaultCard 
                key={item.id} 
                item={item} 
                isProcessing={isVaultLoading === item.id}
                onClick={() => handleVaultPurchase(item.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SITE LOCK POPUP ($3.00) */}
      {isLocked && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-[220px] bg-black/95 border border-white/10 rounded-[24px] p-6 shadow-2xl text-center">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">Initialize System</h2>
            <div className="bg-white/5 rounded-xl py-4 mb-6">
              <span className="text-2xl font-black text-[#FF6600]">$3.00</span>
              <p className="text-[6px] font-bold text-gray-500 uppercase mt-1">Lifetime Entry Fee</p>
            </div>
            <button onClick={handleInitializeAccess} className="w-full bg-[#FF6600] text-white py-3 rounded-full font-black uppercase text-[9px] tracking-widest">Pay & Unlock</button>
            <p className="text-[7px] font-bold text-gray-600 uppercase mt-4">Balance: <span className="text-gray-300">${userProfile?.balance?.toFixed(2) || "0.00"}</span></p>
          </div>
        </div>
      )}
    </main>
  );
}