'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logoutUser, getVaultCovers, unlockVault } from './actions/auth'; 

// [1] SUB-COMPONENT: VaultCard (With Dynamic Slider Blurring)
function VaultCard({ item, onClick, isProcessing, unlockedTiers }: { item: any, onClick: () => void, isProcessing: boolean, unlockedTiers: number[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUnlocked = unlockedTiers.length > 0; // True if they bought at least initial access

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
          {item.images.map((imgObj: any, idx: number) => {
            // THE MAGIC BLUR LOGIC:
            // 1. If they own NOTHING (locked), ONLY image 0 is clear.
            // 2. If they own something, ONLY images in the unlocked tiers are clear.
            const isImageVisible = (unlockedTiers.length === 0 && idx === 0) || unlockedTiers.includes(imgObj.tier);

            return (
              <div key={idx} className="min-w-full h-full flex items-center justify-center relative bg-black">
                <img 
                  src={isImageVisible ? imgObj.file_url : `${imgObj.file_url}?width=200&quality=20`}
                  alt="Vault asset" 
                  loading="lazy"
                  className={`object-cover w-full h-full transition-all duration-700 ${
                    isImageVisible 
                      ? 'opacity-80 group-hover:opacity-100' 
                      : 'blur-lg opacity-50 scale-105' // Reduced blur for a better teaser effect
                  }`} 
                />
                
                {/* REPLACED "ENCRYPTED" TEXT WITH PADLOCK SVG */}
                {!isImageVisible && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/30 backdrop-blur-xl p-4 rounded-full border border-white/10 shadow-2xl">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* SLIDER CONTROLS */}
        {item.images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
            <button onClick={prevSlide} className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-white transition-all">←</button>
            <button onClick={nextSlide} className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-white transition-all">→</button>
          </div>
        )}

        {/* PROGRESS DOTS (Adjusted for 30 items) */}
        {item.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-[2px] z-30 w-[90%] justify-center flex-wrap">
            {item.images.map((_: any, idx: number) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-3 bg-[#FF6600]' : 'w-1 bg-white/50'}`}
              ></div>
            ))}
          </div>
        )}

        <div className="absolute inset-0 border-[3px] border-[#FF6600] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"></div>
      </div>
      
      {/* CARD FOOTER */}
      <div className="p-4 bg-white relative z-10">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-tight truncate mb-2">
          {item.title}
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex flex-col leading-none">
            <span className={`text-[14px] font-black ${isUnlocked ? 'text-[#00FF00]' : 'text-[#FF6600]'}`}>
              {isUnlocked ? 'OWNED' : `$${item.price}`}
            </span>
          </div>
          <button className={`text-white text-[9px] font-black px-4 py-2 rounded-lg transition-colors uppercase tracking-widest flex items-center gap-1.5 ${isUnlocked ? 'bg-black hover:bg-gray-800' : 'bg-black hover:bg-[#FF6600]'}`}>
            {isProcessing ? '...' : isUnlocked ? '🔓 OPEN' : '🔒 DECRYPT'}
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
  
  // TRACK WHICH TIERS ARE OWNED: e.g., { 'mary': [1, 2], 'test': [1] }
  const [unlockedVaultTiers, setUnlockedVaultTiers] = useState<Record<string, number[]>>({});

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

  const handleVaultPurchase = async (vaultId: string) => {
    const ownedTiers = unlockedVaultTiers[vaultId] || [];
    
    // If they already own Tier 1, just open it! No confirmation needed to open.
    if (ownedTiers.includes(1)) {
      window.open(`/vault/${vaultId}`, '_blank');
      return; 
    }

    // [SECURITY FIX] Ask for confirmation before charging $6.00
    const confirmPurchase = window.confirm(`Authorize initial decryption of ${vaultId.replace(/-/g, ' ').toUpperCase()} for $6.00?`);
    
    // If they click "Cancel", stop the function immediately
    if (!confirmPurchase) {
      return; 
    }

    setIsVaultLoading(vaultId);
    const result = await unlockVault(vaultId, 6.00, 1);

    if (result.success) {
      // Add Tier 1 to their owned list immediately
      setUnlockedVaultTiers(prev => ({
        ...prev,
        [vaultId]: [...(prev[vaultId] || []), 1]
      }));
      window.open(`/vault/${vaultId}`, '_blank');
      const updated = await getProfile();
      if (updated) setUserProfile(updated);
    } else if (result.error === "Insufficient Credits.") {
      alert("Decryption failed: Insufficient Credits. Redirecting to deposit.");
      router.push('/deposit');
    } else {
      alert(result.error || "Decryption failed.");
    }
    setIsVaultLoading(null);
  };
  
  useEffect(() => {
    async function loadData() {
      const [profile, covers, history] = await Promise.all([
        getProfile(), 
        getVaultCovers(),
        import('./actions/auth').then(m => m.getLedger()) 
      ]);

      if (profile) {
        setUserProfile(profile);
        if (profile.is_unlocked) setIsLocked(false); 
      }
      
      if (history) {
        const unlockedMap: Record<string, number[]> = {};
        history.filter(item => item.type === 'MEDIA').forEach(item => {
          if (!unlockedMap[item.mediaUrl]) unlockedMap[item.mediaUrl] = [];
          if (item.tier) unlockedMap[item.mediaUrl].push(item.tier);
        });
        setUnlockedVaultTiers(unlockedMap);
      }

      // --- [FIX: Marketing Teaser Padded to 30 Images] ---
      if (covers) {
        setVaultItems(covers.map((c: any) => {
          let mediaArray = c.media || [];
          const currentCount = mediaArray.length;
          
          if (currentCount > 0 && currentCount < 30) {
            const fakesNeeded = 30 - currentCount;
            // Create an array of fake images to pad the total to 30
            const fakeMedia = Array.from({ length: fakesNeeded }).map((_, index) => ({
              // [FIX] Uses your specific Supabase bucket URL and the new image you uploaded!
              file_url: "https://ltxdyydmerdqfvsvomwx.supabase.co/storage/v1/object/public/vault-assets/fake/fake.jpg", 
              tier: 99, // High tier so it NEVER gets unblurred on the home page
              display_order: 999 + index
            }));
            mediaArray = [...mediaArray, ...fakeMedia];
          }
          // -----------------------------------------------

          return {
            id: c.vault_id,
            title: c.vault_id.replace(/-/g, ' '),
            price: "6.00", 
            images: mediaArray 
          };
        }));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em]">Syncing Mainframe...</div>;

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
            <h1 className="text-sm font-black tracking-[0.3em] uppercase italic whitespace-nowrap">PROJECT-VAULT</h1>
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
                unlockedTiers={unlockedVaultTiers[item.id] || []} // Passes exactly which batches they own
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