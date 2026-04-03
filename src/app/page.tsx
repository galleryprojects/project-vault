'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logoutUser, getVaultCovers , unlockVault} from './actions/auth'; 

// [1] SUB-COMPONENT: Handles sliding logic and renders real images
function VaultCard({ item, onClick }: { item: any, onClick: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents clicking the card when clicking the arrow
    setCurrentIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
  };

  return (
    <div onClick={onClick} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md">
      
      {/* IMAGE SLIDER CONTAINER */}
      <div className="relative aspect-square w-full bg-black overflow-hidden">
        
        {/* The Real Images */}
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

        {/* [2] SLIDER CONTROLS - Only show if there's more than 1 image */}
        {item.images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={prevSlide} className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-white">
              ←
            </button>
            <button onClick={nextSlide} className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-white">
              →
            </button>
          </div>
        )}

        {/* [3] PROGRESS DOTS - Only show if there's more than 1 image */}
        {item.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {item.images.map((_: any, idx: number) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-[#FF6600]' : 'w-1 bg-white/50'}`}
              ></div>
            ))}
          </div>
        )}

        {/* The Orange Hover Border */}
        <div className="absolute inset-0 border-[3px] border-[#FF6600] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"></div>
      </div>
      
      {/* TEXT & FOOTER */}
      <div className="p-4 bg-white relative z-10">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-tight truncate mb-2">
          {item.title}
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex flex-col leading-none">
            <span className="text-[14px] font-black text-[#FF6600]">${item.price}</span>
            <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest mt-1">Credits</span>
          </div>
          <button className="bg-black text-white text-[9px] font-black px-4 py-2 rounded-lg group-hover:bg-[#FF6600] transition-colors uppercase">
            Open
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
  const [vaultItems, setVaultItems] = useState<any[]>([]); // REPLACES DUMMY DATA
  const [loading, setLoading] = useState(true);

  // --- [NEW] REAL MASTER UNLOCK FUNCTION ---
  const handleInitializeAccess = async () => {
    // 1. Attempt to unlock the site for $3.00
    const result = await unlockVault("INITIAL_ENTRY", 3.00);

    if (result.success) {
      // 2. Success: Remove the blur and update the balance
      setIsLocked(false);
      const updated = await getProfile();
      if (updated) setUserProfile(updated);
    } else {
      // 3. Fail (Insufficient Credits): Redirect straight to deposit
      router.push('/deposit');
    }
  };


  // [4] Fetch Profile AND Real Database Vaults
  useEffect(() => {
    async function loadData() {
      const [profile, covers] = await Promise.all([
        getProfile(),
        getVaultCovers() // Fetches your real database covers
      ]);

      if (profile) {
        setUserProfile(profile);
        if (profile.is_unlocked) setIsLocked(false); 
      }

      if (covers) {
        // Transform the DB data into the exact format your VaultCard expects!
        const formattedVaults = covers.map((cover) => ({
          id: cover.vault_id,
          title: cover.vault_id.replace(/-/g, ' '), // Cleans up "cyber-set-01" to "cyber set 01"
          price: "6.00", 
          images: [cover.cover_url] // For now, passing the cover as an array so the slider logic doesn't break
        }));
        setVaultItems(formattedVaults);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em]">
        Accessing Mainframe...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111] font-sans">

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full h-[64px] bg-white border-b border-gray-200 z-[100] flex items-center px-4">
        <div className="flex w-full max-w-7xl mx-auto items-center justify-between relative">
          <button onClick={() => setIsMenuOpen(true)} className="flex flex-col justify-center gap-1.5 pr-5 border-r border-gray-200 h-8">
            <div className="w-6 h-[2px] bg-black"></div>
            <div className="w-6 h-[2px] bg-black"></div>
            <div className="w-6 h-[2px] bg-black"></div>
          </button>
          <div className="absolute left-1/3 -translate-x-1/3">
            <h1 className="text-sm font-black tracking-[0.3em] uppercase italic whitespace-nowrap">PROJECT-VAULT</h1>
          </div>
          <div className="flex items-center gap-3 z-10">
            <div className="flex flex-col items-end leading-none mt-0.5">
              <span className="text-[14px] font-black text-[#111] tracking-tight">
                ${userProfile?.balance?.toFixed(2) || "0.00"}
              </span>
              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">Credits</span>
            </div>
            <button 
              onClick={() => router.push('/deposit')}
              className="bg-[#FF6600] text-white text-[10px] font-black px-5 py-2.5 rounded-full shadow-[0_4px_12px_rgba(255,102,0,0.3)] hover:scale-105 transition-all uppercase tracking-widest"
            >
              Deposit
            </button>
          </div>
        </div>
      </nav>

      {/* --- SIDEBAR --- */}
      <div className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <aside className={`absolute top-0 left-0 w-[280px] h-full bg-white transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8">
            <button onClick={() => setIsMenuOpen(false)} className="text-[10px] font-black text-gray-400 mb-10 uppercase tracking-widest">✕ CLOSE</button>
            
            <nav className="flex flex-col gap-6 text-[22px] font-bold">
              <a href="/" className="border-b-4 border-black w-fit pb-1">Main</a>
              <a href="#" className="text-gray-400">Popular</a>
              <a href="/orders" className="text-gray-400">Order History</a>
              
              {/* THE WORKING LOGOUT BUTTON */}
              <button 
                onClick={async () => {
                  await logoutUser();
                  window.location.href = '/login';
                }}
                className="mt-12 text-sm font-black text-red-500 uppercase tracking-widest text-left"
              >
                Logout
              </button>
            </nav>
          </div>
        </aside>
      </div>

      {/* [5] BLUR WRAPPER & GRID */}
      <div className={`transition-all duration-700 ${isLocked ? 'blur-[6px] brightness-[0.6] pointer-events-none select-none' : 'blur-0 brightness-100'}`}>
        <div className="pt-28 px-4 pb-12 max-w-7xl mx-auto">
          <div className="mb-8 border-b-2 border-gray-100 pb-4">
            <h2 className="text-[28px] font-black italic uppercase tracking-tighter leading-none">Vaults</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            
            {vaultItems.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Active Vaults Found</span>
              </div>
            ) : (
              vaultItems.map((item) => (
                <VaultCard 
                  key={item.id} 
                  item={item} 
                  onClick={() => router.push(`/vault/${item.id}`)} // Routes correctly to the Vault Inner Page
                />
              ))
            )}

          </div>
        </div>
      </div>


      {/* [6] THE MICRO LOCK POPUP */}
      {isLocked && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-[210px] bg-black/95 backdrop-blur-2xl border border-white/10 rounded-[20px] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] text-center animate-in fade-in zoom-in duration-500">
            <div className="w-10 h-10 bg-[#FF6600]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#FF6600]/20">
              <span className="text-base">🔒</span>
            </div>
            <h2 className="text-xs font-[900] text-white uppercase tracking-[0.2em] mb-0.5">Initialize Access</h2>
            <p className="text-[6px] font-bold text-gray-500 uppercase tracking-widest mb-4">One-Time Lifetime Fee</p>
            <div className="bg-white/5 border border-white/10 rounded-xl py-3 mb-4">
              <span className="text-xl font-[900] text-[#FF6600] tracking-tighter">$3.00</span>
              <p className="text-[6px] font-bold text-white/40 uppercase tracking-[0.3em] mt-0.5">Credits Required</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleInitializeAccess} className="w-full bg-[#FF6600] text-white py-2.5 rounded-full font-[900] uppercase tracking-widest text-[8px] shadow-[0_4px_15px_rgba(255,102,0,0.4)]">Pay & Unlock</button>
              <p className="text-[6px] font-bold text-gray-600 uppercase tracking-widest">
                Balance: <span className="text-gray-400">${userProfile?.balance?.toFixed(2) || "0.00"}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}