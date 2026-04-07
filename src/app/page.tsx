'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logoutUser, getVaultCovers, unlockVault } from './actions/auth'; 
import Loading from './loading';
import OptimizedMedia from '@/components/OptimizedMedia';

// [1] SUB-COMPONENT: VaultCard (With Dynamic Slider Blurring)
function VaultCard({ item, index, onClick, isProcessing, unlockedTiers }: { item: any, index: number, onClick: () => void, isProcessing: boolean, unlockedTiers: number[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUnlocked = unlockedTiers.length > 0; // True if they bought at least initial access

  const isVideo = (url: string) => {
  return url?.match(/\.(mp4|webm|ogg|mov)$/i);
};

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
            // [GOD_MODE_PATCH]: The first image is always visible. Others only if unlocked.
            const isImageVisible = idx === 0 || unlockedTiers.includes(imgObj.tier);
            
            // The cover image (idx === 0) for the first 8 cards (index < 8) gets VIP status.
            const isPriority = index < 15 && idx === 0;

            return (
              <div key={idx} className="min-w-full h-full flex items-center justify-center relative bg-black">
                {isImageVisible ? (
                  <OptimizedMedia
                    src={imgObj.file_url}
                    type={isVideo(imgObj.file_url) ? 'video' : 'image'}
                    // [GOD_MODE_PATCH]: If it's the teaser (idx 0) OR they own it, it's clear.
                    className="opacity-100 blur-0 group-hover:scale-105 transition-all duration-700"
                    priority={isPriority} 
                  />
                ) : (
                  <OptimizedMedia
                  src="https://ltxdyydmerdqfvsvomwx.supabase.co/storage/v1/object/public/vault-assets/fake/fake.jpg"
                    type="image"
                    className="blur-lg opacity-50 scale-105 pointer-events-none"
                    priority={isPriority} 
                  />
                )}
                                
                {/* PADLOCK SVG - Shows if the specific item is NOT owned */}
                {!unlockedTiers.includes(imgObj.tier) && (
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
            {isProcessing ? '...' : isUnlocked ? '🔓 OPEN' : '🔒 UNLOCK'}
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

  // --- NEW: Home Page Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; // 4 rows on mobile (2 columns)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Smooth scroll back to the top of the vault grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
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
      window.open(`/vault/${encodeURIComponent(vaultId)}`, '_blank');
      return; 
    }

    // [SECURITY FIX] Ask for confirmation before charging $6.00
    const confirmPurchase = window.confirm(`Do You Want To Unlock ${vaultId.replace(/-/g, ' ').toUpperCase()} for $6.00?`);
    
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
      window.open(`/vault/${encodeURIComponent(vaultId)}`, '_blank');
      const updated = await getProfile();
      if (updated) setUserProfile(updated);
    } else if (result.error === "Insufficient Credits.") {
      alert("failed: Insufficient Credits. Redirecting to deposit.");
      router.push('/deposit');
    } else {
      alert(result.error || " failed.");
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

      // --- [CRITICAL AUTH CHECK] ---
      if (!profile) {
        // If no profile, they are a guest. Send to signup immediately.
        router.push('/signup');
        return;
      }

      // [1] SET INITIAL PROFILE DATA
      setUserProfile(profile);

      // [2] AUTO-UNLOCK ENGINE
      // If they aren't unlocked yet, but have $3.00 or more... UNLOCK AUTOMATICALLY.
      if (!profile.is_unlocked && (profile.balance >= 3.00)) {
        console.log("SYSTEM: AUTO_INITIALIZING_ACCESS...");
        const autoResult = await unlockVault("INITIAL_ENTRY", 3.00);
        
        if (autoResult.success) {
          setIsLocked(false);
          // Update the local state so the balance reflects the -$3.00 immediately
          setUserProfile({ 
            ...profile, 
            is_unlocked: true, 
            balance: profile.balance - 3.00 
          });
        }
      } 
      // If they were already unlocked from a previous session
      else if (profile.is_unlocked) {
        setIsLocked(false);
      }

      if (history) {
        const unlockedMap: Record<string, number[]> = {};
        history.filter(item => item.type === 'MEDIA').forEach(item => {
          if (!unlockedMap[item.mediaUrl]) unlockedMap[item.mediaUrl] = [];
          if (item.tier) unlockedMap[item.mediaUrl].push(item.tier);
        });
        setUnlockedVaultTiers(unlockedMap);
      }

      // 1. Create a local map so we can use it instantly for sorting
      let currentUnlockedMap: Record<string, number[]> = {};
      
      if (history) {
        history.filter(item => item.type === 'MEDIA').forEach(item => {
          if (!currentUnlockedMap[item.mediaUrl]) currentUnlockedMap[item.mediaUrl] = [];
          if (item.tier) currentUnlockedMap[item.mediaUrl].push(item.tier);
        });
        setUnlockedVaultTiers(currentUnlockedMap); // Save for later clicks
      }

      // 2. Map and Sort the Covers
      if (covers) {
        const mappedItems = covers.map((c: any) => {
          let mediaArray = c.media || [];
          const currentCount = mediaArray.length;
          
          if (currentCount > 0 && currentCount < 30) {
            const fakesNeeded = 30 - currentCount;
            const fakeMedia = Array.from({ length: fakesNeeded }).map((_, index) => ({
              file_url: "https://ltxdyydmerdqfvsvomwx.supabase.co/storage/v1/object/public/vault-assets/fake/fake.jpg", 
              tier: 99, 
              display_order: 999 + index
            }));
            mediaArray = [...mediaArray, ...fakeMedia];
          }

          return {
            id: c.vault_id,
            title: c.vault_id.replace(/-/g, ' '),
            price: "6.00", 
            images: mediaArray 
          };
        });

        // THE PRIORITY SORT ENGINE:
        // We look at the 'currentUnlockedMap' we just built.
        // If they own it, it gets a score of 1. If locked, score of 0.
        // Sorts descending so all 1s (Owned) jump to the very beginning.
        const sortedItems = mappedItems.sort((a, b) => {
          const aOwned = currentUnlockedMap[a.id] ? 1 : 0;
          const bOwned = currentUnlockedMap[b.id] ? 1 : 0;
          return bOwned - aOwned; 
        });

        setVaultItems(sortedItems);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  // NEW: Pagination Logic for the Render Block
  const totalPages = Math.ceil(vaultItems.length / ITEMS_PER_PAGE);
  const paginatedVaults = vaultItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


    if (loading) {
    return <Loading />;
  }
  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111] font-sans">
      {/* NAVBAR - Bold & Left-Aligned Branding */}
      <nav className="fixed top-0 left-0 w-full h-[64px] bg-white border-b border-gray-200 z-[100] flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          
          {/* LEFT GROUP: Menu + Branding */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)} 
              className="flex flex-col justify-center gap-1.5 pr-4 border-r border-gray-200 h-8 hover:opacity-70 transition-opacity"
            >
              <div className="w-6 h-[2.5px] bg-black"></div>
              <div className="w-6 h-[2.5px] bg-black"></div>
              <div className="w-6 h-[2.5px] bg-black"></div>
            </button>
            
            <h1 className="text-[12px] sm:text-[16px] font-black tracking-[0.4em] uppercase italic whitespace-nowrap leading-none">
              PROJECT-VAULT
            </h1>
          </div>

          {/* RIGHT GROUP: Balance & Deposit */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[14px] sm:text-[16px] font-black text-gray-900">
                ${userProfile?.balance?.toFixed(2) || "0.00"}
              </span>
              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                Credits
              </span>
            </div>
            
            <button 
              onClick={() => router.push('/deposit')} 
              className="bg-primary text-white text-[10px] font-black px-5 py-3 rounded-full uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95"
            >
              Deposit
            </button>
          </div>

        </div>
      </nav>

      {/* SIDEBAR */}
      <div className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <aside className={`absolute top-0 left-0 w-[280px] h-full bg-white transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8">
            <button onClick={() => setIsMenuOpen(false)} className="text-[10px] font-black text-gray-400 mb-10 uppercase tracking-widest">✕ CLOSE</button>
            <nav className="flex flex-col gap-6 text-[22px] font-bold uppercase italic">
              <a href="/" className="border-b-4 border-black w-fit">Home</a>
              <a href="/orders" className="text-gray-300">Order Records</a>
              <a href="/account" className="border-b-4 border-black w-fit">Profile</a>
              <button onClick={async () => { await logoutUser(); window.location.href = '/login'; }} className="mt-12 text-xs font-black text-red-500 uppercase tracking-widest text-left pt-6 border-t border-gray-100">Terminate Session</button>
            </nav>
          </div>
        </aside>
      </div>

      {/* BLUR WRAPPER */}
      <div className={`transition-all duration-1000 ${isLocked ? 'blur-[8px] brightness-[0.5] pointer-events-none' : 'blur-0'}`}>
        <div className="pt-28 px-4 pb-12 max-w-7xl mx-auto">
          {/* THE FIX 2: Added "Hello Username" above the title */}
          <div className="mb-8 border-b-2 border-gray-100 pb-4 flex flex-col gap-2">
            <h1 className="text-[20px] font-black uppercase tracking-widest text-red-400">
              Hello 💋 {userProfile?.username || 'GHOST'}!
            </h1>
            <h2 className="text-[28px] font-black italic uppercase tracking-tighter leading-none">Active Vaults</h2>
          </div>

          {/* PAGINATED VAULT GRID */}
          <div className="space-y-12">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {paginatedVaults.map((item, index) => (
                <VaultCard 
                  key={item.id} 
                  item={item} 
                  index={index}
                  isProcessing={isVaultLoading === item.id}
                  unlockedTiers={unlockedVaultTiers[item.id] || []}
                  onClick={() => handleVaultPurchase(item.id)}
                />
              ))}
            </div>

            {/* FINE SLIDER NAVIGATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 py-12 border-t border-gray-200/50">
                  
                  {/* PREVIOUS BUTTON */}
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-900 shadow-md hover:border-primary hover:text-primary disabled:opacity-20 transition-all active:scale-90 z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  {/* DOT INDICATOR SLIDER */}
                  <div className="flex gap-2 items-center px-4 py-2 bg-gray-100/50 rounded-full border border-gray-200/50">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handlePageChange(idx + 1)}
                        className={`cursor-pointer transition-all duration-500 rounded-full ${
                          currentPage === idx + 1 
                            ? 'w-6 h-1.5 bg-primary' 
                            : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                        }`}
                      ></div>
                    ))}
                  </div>

                  {/* NEXT BUTTON */}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-900 shadow-md hover:border-primary hover:text-primary disabled:opacity-20 transition-all active:scale-90 z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                  
                </div>
              )}


          </div>

        </div>
      </div>

      {/* SITE LOCK POPUP ($3.00) */}
      {isLocked && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-[220px] bg-black/95 border border-white/10 rounded-[24px] p-6 shadow-2xl text-center">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">Unlock Gallery</h2>
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