'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logoutUser, getVaultCovers, unlockVault } from './actions/auth'; 
import OnboardingFlow from '@/components/OnboardingFlow';
import Loading from './loading';
import OptimizedMedia from '@/components/OptimizedMedia';

// [1] SUB-COMPONENT: VaultCard (With Diagonal Mirror Watermark)
function VaultCard({ item, index, onClick, isProcessing, unlockedTiers }: { item: any, index: number, onClick: () => void, isProcessing: boolean, unlockedTiers: number[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUnlocked = unlockedTiers.length > 0;

  // Helper to format duration (e.g., 150 seconds -> 2MINS+)
  const formatDuration = (seconds: number) => {
    if (!seconds) return "VIDEO CONTENT";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0 && secs > 0) return `${mins} min ${secs} secs`;
    if (mins > 0) return `${mins} min`;
    return `${secs} secs`;
  };

  const isVideo = (url: string) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

  const handleNav = (direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => {
      if (direction === 'next') return prev === item.images.length - 1 ? 0 : prev + 1;
      return prev === 0 ? item.images.length - 1 : prev - 1;
    });
  };

  return (
    <div onClick={onClick} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md hover:-translate-y-1">
      <div className="relative aspect-square w-full bg-black overflow-hidden">
        
        {/* Global Processing Overlay (For Unlocks) */}
        {isProcessing && (
          <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
            <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}

        <div className="flex h-full transition-transform duration-500 ease-out z-10" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {item.images.map((imgObj: any, idx: number) => {

            const isImageVisible = idx === 0 || imgObj.display_order === 0 || unlockedTiers.includes(imgObj.tier);
            const showWatermark = !unlockedTiers.includes(imgObj.tier) && (idx === 0 || imgObj.display_order === 0);

            // Show padlock on EVERYTHING that is locked.
            const isLocked = !unlockedTiers.includes(imgObj.tier);

            const isPriority = index < 15 && idx === 0;
            
            return (
              <div key={idx} className="min-w-full h-full flex items-center justify-center relative bg-black">
                
                {/* LAYER 1: THE MEDIA */}
                <OptimizedMedia 
                  src={imgObj.file_url} 
                  type={isVideo(imgObj.file_url) ? 'video' : 'image'} 
                  className={`w-full h-full object-cover transition-all duration-700 ${
                    isImageVisible 
                      ? "opacity-100 blur-0 group-hover:scale-105" 
                      : "blur-[18px] opacity-40 scale-110 pointer-events-none"
                  }`} 
                  priority={isPriority} 
                />
                
                {/* LAYER 2: THE DYNAMIC WATERMARK (Cover Only) */}
                {showWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 mix-blend-normal overflow-hidden">
                    <div className="rotate-45 scale-[1.5] w-[200%] text-center">
                      <span className="text-white font-black text-[12px] sm:text-[16px] uppercase tracking-[1em] whitespace-nowrap drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        SY EXCLUSIVE • SY EXCLUSIVE • SY EXCLUSIVE • SY EXCLUSIVE
                      </span>
                    </div>
                  </div>
                )}

                {/* LAYER 3: THE CENTER PADLOCK (Everything Locked) */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <div className="bg-black/20 backdrop-blur-2xl p-4 rounded-full border border-white/20 shadow-2xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

        {/* [THE FIX]: VIDEO DURATION TEXT (Under the Circles) */}
        {isVideo(item.images[currentIndex]?.file_url) && (
          <div className="absolute bottom-1 left-0 w-full flex justify-center z-40 pointer-events-none">
            <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] animate-in fade-in slide-in-from-bottom-1">
              {formatDuration(item.images[currentIndex]?.duration)}
            </p>
          </div>
        )}

        {/* ... SLIDER CONTROLS (Keep exact same as before) ... */}
        {item.images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">
            <button onClick={(e) => handleNav('prev', e)} className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[12px] shadow-lg hover:bg-primary hover:text-white transition-all text-black font-black pointer-events-auto">←</button>
            <button onClick={(e) => handleNav('next', e)} className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[12px] shadow-lg hover:bg-primary hover:text-white transition-all text-black font-black pointer-events-auto">→</button>
          </div>
        )}

        {/* ... PROGRESS DOTS (Keep exact same as before) ... */}
        {item.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-[2px] z-40 w-[90%] justify-center flex-wrap pointer-events-none">
            {item.images.map((_: any, idx: number) => (
              <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-3 bg-primary' : 'w-1 bg-white/50'}`}></div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 border-[3px] border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"></div>
      </div>
      
      {/* ... CARD FOOTER (Keep exact same as before) ... */}
      <div className="p-4 bg-white relative z-10">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-tight truncate mb-2">{item.title}</h3>
        <div className="flex justify-between items-center">
          <span className={`text-[14px] font-black ${isUnlocked ? 'text-[#00FF00]' : 'text-primary'}`}>{isUnlocked ? 'OWNED' : `$${item.price}`}</span>
          <button className={`text-white text-[9px] font-black px-4 py-2 rounded-lg transition-colors uppercase tracking-widest ${isUnlocked ? 'bg-black hover:bg-gray-800' : 'bg-black hover:bg-primary'}`}>
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
  const [isLocked, setIsLocked] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false); // [NEW]
  const [vaultItems, setVaultItems] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isVaultLoading, setIsVaultLoading] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Detects if user is within 50px of the bottom
      const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      setIsAtBottom(bottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- NEW: Home Page Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const ITEMS_PER_PAGE = 8; // 4 rows on mobile (2 columns)
  const FAKE_ITEMS_COUNT = 16;

  // [UPDATED]: Adds the delay and loading state
  const handlePageChange = (newPage: number) => {
    if (isPageLoading) return; // Prevent spam-clicking

    setIsPageLoading(true);
    
    // Scroll to top immediately so they see the loading spinner
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 600ms delay to show the professional "loading next page" spinner
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsPageLoading(false);
    }, 600);
  };
  
  // TRACK WHICH TIERS ARE OWNED: e.g., { 'mary': [1, 2], 'test': [1] }
  const [unlockedVaultTiers, setUnlockedVaultTiers] = useState<Record<string, number[]>>({});


  const handleVaultPurchase = async (vaultId: string) => {
    const ownedTiers = unlockedVaultTiers[vaultId] || [];
    
    // If they already own Tier 1, just open it! No confirmation needed to open.
    if (ownedTiers.includes(1)) {
      window.open(`/vault/${encodeURIComponent(vaultId)}`, '_blank');
      return; 
    }

    // [SECURITY FIX] Ask for confirmation before charging $2.00
    const confirmPurchase = window.confirm(`Do You Want To Unlock ${vaultId.replace(/-/g, ' ').toUpperCase()} for $5.00?`);
    
    // If they click "Cancel", stop the function immediately
    if (!confirmPurchase) {
      return; 
    }

    setIsVaultLoading(vaultId);
    const result = await unlockVault(vaultId, 5.00, 1);

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

      if (profile && !profile.has_onboarded) {
        setShowOnboarding(true);
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
          // [FIX]: Sort by Tier (1, 2, 3) then by Order (0, 1, 2) 
          // This ensures Tier 1, Display Order 0 is ALWAYS the first image (Index 0)
          let mediaArray = (c.media || []).sort((a: any, b: any) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return a.display_order - b.display_order;
          });

          const currentCount = mediaArray.length;
          
          // Add fake placeholders only AFTER sorting the real ones
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
            price: "5.00", 
            images: mediaArray 
          };
        });

        // THE PRIORITY SORT ENGINE (Keep this exactly as you have it)
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

  // --- NEW: INTEGRATED PAGINATION LOGIC ---
  // 1. Calculate totals based on REAL + FAKE items
  const totalVirtualItems = vaultItems.length + FAKE_ITEMS_COUNT;
  const totalPages = Math.ceil(totalVirtualItems / ITEMS_PER_PAGE);

  // 2. Determine indices for the CURRENT page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  // const endIndex = startIndex + ITEMS_PER_PAGE; // not strictly needed for logic below

  // 3. Generate exactly 8 slots for the current page
  const currentSlots = Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => {
    const globalIndex = startIndex + index;

    // If the index points to a real item, return it
    if (globalIndex < vaultItems.length) {
      return { type: 'real', data: vaultItems[globalIndex] };
    } 
    // If the index is within the "fake" range, return a placeholder marker
    else if (globalIndex < totalVirtualItems) {
      return { type: 'fake', id: `fake-${globalIndex}` };
    }
    // Otherwise (if we go beyond 24 total slots), return null
    return null;
  }).filter(Boolean); // Cleans up any undefined slots

  if (loading) {
    return <Loading />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111] font-sans pb-24">
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
            
            <h1 className="text-[12px] sm:text-[16px] text-primary font-black tracking-[0.4em] uppercase italic whitespace-nowrap leading-none">
              Sy Exclusives
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
                <a 
                href="/support" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="border-b-4 border-black w-fit"
              >
                Support
              </a>

              <button onClick={async () => { await logoutUser(); window.location.href = '/login'; }} className="mt-12 text-xs font-black text-red-500 uppercase tracking-widest text-left pt-6 border-t border-gray-100">Terminate Session</button>
            </nav>
          </div>
        </aside>
      </div>

      {/* BLUR WRAPPER */}
      <div className="transition-all duration-1000 blur-0">
        <div className="pt-28 px-4 pb-12 max-w-7xl mx-auto">
          {/* THE FIX 2: Added "Hello Username" above the title */}
          <div className="mb-8 border-b-2 border-gray-100 pb-4 flex flex-col gap-2">
            <h1 className="text-[20px] font-black uppercase tracking-widest text-red-400">
              Hello 💋 {userProfile?.username || 'GHOST'}!
            </h1>
            <h2 className="text-[28px] font-black italic uppercase tracking-tighter leading-none">Active Vaults</h2>
          </div>

            {/* THE VAULT GRID WRAPPER (With Pagination Loading) */}
            <div className="relative max-w-7xl mx-auto mt-24 min-h-[600px]">
            
            {/* [PAGINATION SPINNER]: This only shows when isPageLoading is true */}
            {isPageLoading && (
              <div className="absolute inset-0 z-[100] bg-[#F7F7F5]/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300 rounded-[32px]">
                <div className="w-12 h-12 border-[4px] border-[#FF6600]/20 border-t-[#FF6600] rounded-full animate-spin shadow-[0_0_20px_rgba(255,102,0,0.3)] mb-4"></div>
                <div className="text-[#FF6600] text-[11px] font-black uppercase tracking-[0.4em] animate-pulse">
                  Accessing Archives...
                </div>
              </div>
            )}

            {/* THE ACTUAL GRID - We keep your map logic exactly the same inside here */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4">
              {currentSlots.map((slot: any) => (
                slot.type === 'real' ? (
                  /* REAL ITEM BOX */
                  <VaultCard 
                    key={slot.data.id}
                    item={slot.data}
                    index={vaultItems.indexOf(slot.data)}
                    onClick={() => handleVaultPurchase(slot.data.id)}
                    isProcessing={isVaultLoading === slot.data.id}
                    unlockedTiers={unlockedVaultTiers[slot.data.id] || []}
                  />
                ) : (
                  /* FAKE SKELETON BOX (Placeholders) */
                  <div key={slot.id} className="animate-stalled pointer-events-none">
                    <div className="aspect-[3/4] bg-gray-200/60 rounded-2xl overflow-hidden relative border border-gray-100/50">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-200/30" />
                      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-gray-300/50 border border-white/20" />
                    </div>
                    <div className="mt-3 px-1 space-y-2">
                      <div className="h-3 w-3/4 bg-gray-200/80 rounded-full" />
                      <div className="h-2 w-1/2 bg-gray-200/50 rounded-full" />
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
            {/* FINE SLIDER NAVIGATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 py-12 border-t border-gray-200/50 mt-12">
                  
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

      {/* --- DYNAMIC EXPANDING FOOTER --- */}
      <footer className={`fixed bottom-0 left-0 w-full z-[150] border-t border-gray-200/60 bg-white/95 backdrop-blur-xl transition-all duration-500 ease-in-out shadow-[0_-5px_20px_rgba(0,0,0,0.05)] ${
        isAtBottom ? 'h-[160px] py-8' : 'h-[60px] py-2'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center px-4">
          
          {/* 1. RATING STARS - Grow slightly when expanded */}
          <div className={`flex gap-1 transition-all duration-500 ${isAtBottom ? 'mb-4 scale-125' : 'mb-1 scale-100'}`}>
            {[...Array(5)].map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            ))}
          </div>

          {/* 2. MAIN CONTENT - Switches from horizontal to vertical stack */}
          <div className={`flex transition-all duration-500 ${isAtBottom ? 'flex-col gap-2' : 'flex-row items-center gap-3'}`}>
            <p className={`font-black uppercase italic tracking-tighter text-gray-900 transition-all ${
              isAtBottom ? 'text-[16px]' : 'text-[10px]'
            }`}>
              Trusted by 20,000 Persons Since 2025
            </p>
            
            {!isAtBottom && <span className="text-gray-300 text-[8px]">|</span>}
            
            <p className={`font-bold uppercase tracking-widest text-gray-500 transition-all ${
              isAtBottom ? 'text-[11px] mt-2' : 'text-[9px]'
            }`}>
              © 2026 SY EXCLUSIVES • ALL RIGHTS RESERVED
            </p>
          </div>

          {/* 3. HIDDEN TAGLINE - Only shows when fully open */}
          <div className={`overflow-hidden transition-all duration-700 ${isAtBottom ? 'max-h-10 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
             <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">
                Premium Archive Access
             </p>
          </div>

        </div>
      </footer>
    </main>
  );
}