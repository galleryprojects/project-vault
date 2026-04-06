'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProfile, unlockVault, getVaultMedia, getUnlockedTiers, unlockMediaAsset, getUnlockedAssets } from '../../actions/auth'; 
import OptimizedMedia from '@/components/OptimizedMedia';

// NEW: Checks BOTH the file extension AND your database 'media_type' column
  const isVideo = (item: any) => {
    const url = item.file_url;
    const type = item.media_type; // Uses your new column
    
    const extensionMatch = url?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i);
    return extensionMatch || type === 'video';
  };

// --- SUB-COMPONENT: The Sleek Locked Slider ---
function LockedTierSlider({ paddedMedia }: { paddedMedia: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === paddedMedia.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? paddedMedia.length - 1 : prev - 1));
  };

  return (
    <div className="relative w-[280px] mx-auto aspect-square bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 group mb-8">
      {/* SLIDING IMAGES */}
      <div 
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {paddedMedia.map((item, idx) => (
          <div key={item.id || `fake-${idx}`} className="min-w-full h-full relative flex items-center justify-center bg-black">
            <OptimizedMedia 
              src={item.file_url || ''} 
              type={item.file_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image'} 
              className={`absolute inset-0 scale-105 transition-all duration-700 ${idx === 0 ? 'opacity-100 blur-0' : 'blur-2xl opacity-40'}`}
              priority={idx < 2} 
            />

            {/* PADLOCK OVERLAY - Stays on as long as it's not purchased */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-full border border-white/10 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ARROW CONTROLS (Show on hover) */}
      {paddedMedia.length > 1 && (
        <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <button onClick={prevSlide} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all text-black font-black">←</button>
          <button onClick={nextSlide} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all text-black font-black">→</button>
        </div>
      )}

      {/* DOT INDICATORS */}
      {paddedMedia.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {paddedMedia.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-white/50'}`}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VaultInside() {
  const router = useRouter();
  const params = useParams();
  const vaultId = decodeURIComponent(params.id as string);
  
  const [balance, setBalance] = useState<number>(0);
  const [unlockedTiers, setUnlockedTiers] = useState<number[]>([]);
  const [media, setMedia] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [expandedTiers, setExpandedTiers] = useState<number[]>([1]); 
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // State for individual video unlocks and scroll refs
  const [unlockedAssetIds, setUnlockedAssetIds] = useState<string[]>([]);
  const videoRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // --- [1] DATA SYNC ---
  useEffect(() => {
    async function syncVault() {
      try {
        const [profile, mediaData, tiers, assets] = await Promise.all([
          getProfile(),
          getVaultMedia(vaultId),
          getUnlockedTiers(vaultId),
          getUnlockedAssets() 
        ]);

        if (profile) setBalance(profile.balance || 0);
        if (mediaData) setMedia(mediaData);
        if (tiers) setUnlockedTiers(tiers);
        if (assets) setUnlockedAssetIds(assets); 
      } catch (err) {
        console.error("Sync Error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (vaultId) syncVault();
  }, [vaultId]);

  // --- [2] LOGIC BLOCK ---
  // Separate videos for the Sneak Peek strip, and images for the Tiers
  // Now we pass the WHOLE item 'm' instead of just the URL
  const videoCollection = media.filter(m => isVideo(m));
  const imageCollection = media.filter(m => !isVideo(m));
  
  // Base unique tiers ONLY on images now
  const uniqueTiers = Array.from(new Set(imageCollection.map(m => m.tier || 1))).sort((a, b) => a - b);

  const padToSeven = (realMedia: any[]) => {
    const TOTAL_SLOTS = 7;
    if (realMedia.length >= TOTAL_SLOTS) return realMedia;
    
    const fakesNeeded = TOTAL_SLOTS - realMedia.length;
    const fakes = Array.from({ length: fakesNeeded }).map((_, i) => ({
      id: `fake-${i}`,
      file_url: "https://ltxdyydmerdqfvsvomwx.supabase.co/storage/v1/object/public/vault-assets/fake/fake.jpg", 
      tier: 99, 
      isFake: true
    }));
    
    return [...realMedia, ...fakes];
  };

  // [GOD_MODE_PATCH] Generate a peek experience (1 real clear teaser, 6 blurred fakes)
  const generatePeakMedia = (realMedia: any[]) => {
    const TOTAL_SLOTS = 7;
    // The hardcoded ghost url that keeps appearing
    const FAKE_IMG_URL = "https://ltxdyydmerdqfvsvomwx.supabase.co/storage/v1/object/public/vault-assets/fake/fake.jpg";

    if (realMedia.length === 0) return padToSeven([]); // Handle empty tier normally

    // Sort by display order to ensure we grab the designated teaser (0)
    const sortedRealMedia = [...realMedia].sort((a, b) => a.display_order - b.display_order);
    
    // Take ONLY the very first real image as teaser
    const teaser = sortedRealMedia[0]; 
    const fakesNeeded = TOTAL_SLOTS - 1; // Fill the rest with fakes

    const fakes = Array.from({ length: fakesNeeded }).map((_, i) => ({
      id: `fake-${i}`,
      file_url: FAKE_IMG_URL,
      tier: 99,
      isFake: true
    }));

    // Returns: [ Teaser ( idx 0 ), Fake 1, Fake 2, ... ]
    return [teaser, ...fakes];
  };

  // --- [3] HANDLERS ---
  const handleUnlockVideo = async (video: any) => {
    const price = 2.00; // Price per video
    const confirmed = window.confirm(`Reveal this selection for $${price.toFixed(2)}?`);
    
    if (!confirmed) return;

    setIsProcessing(true);
    const result = await unlockMediaAsset(video.id, price, `Video Unlock`);
    
    if (result.success) {
      setUnlockedAssetIds(prev => [...prev, video.id.toString()]);
      const updatedProfile = await getProfile();
      if (updatedProfile) setBalance(updatedProfile.balance);
      
      // Smooth scroll to the video
      setTimeout(() => {
        videoRefs.current[video.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    } else {
      alert(result.error || "Unlock failed. Please check your credits.");
    }
    setIsProcessing(false);
  };

  const handleTierUnlock = async (tierNum: number, price: number) => {
    const confirmUnlock = window.confirm(`Unlock Collection Level 0${tierNum} for $${price.toFixed(2)}?`);
    
    if (!confirmUnlock) return; 

    setIsProcessing(true);
    const result = await unlockVault(vaultId, price, tierNum);
    
    if (result.success) {
      const [newTiers, updatedProfile] = await Promise.all([
        getUnlockedTiers(vaultId),
        getProfile()
      ]);
      if (newTiers) setUnlockedTiers(newTiers);
      if (updatedProfile) setBalance(updatedProfile.balance);
      
      if (!expandedTiers.includes(tierNum)) {
        setExpandedTiers(prev => [...prev, tierNum]);
      }
    } else {
      alert(result.error || "Unlock failed. Please check your credits.");
    }
    setIsProcessing(false);
  };

  const toggleTier = (tierNum: number) => {
    setExpandedTiers(prev => 
      prev.includes(tierNum) ? prev.filter(t => t !== tierNum) : [...prev, tierNum]
    );
  };

  // UPDATED: Supports a custom filename and prevents the TS error
  const handleDownload = async (url: string, fileNameOrEvent?: string | React.MouseEvent) => {
    // If the second argument is a click event, stop it from bubbling
    if (typeof fileNameOrEvent !== 'string' && fileNameOrEvent?.stopPropagation) {
      fileNameOrEvent.stopPropagation();
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Use the provided filename or pull it from the URL
      const finalName = typeof fileNameOrEvent === 'string' 
        ? fileNameOrEvent 
        : (url.split('/').pop()?.split('?')[0] || 'vault-asset');
        
      link.download = finalName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em] text-primary">
      Securing Collection...
    </div>
  );

  // --- [4] RENDER BLOCK ---
  return (
    <main className="min-h-screen bg-white pb-20 font-sans relative overflow-hidden text-gray-900">
      
      {/* Elegant Pink Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 z-[100] flex items-center px-4">
        <div className="flex w-full max-w-7xl mx-auto items-center justify-between">
          <button 
            onClick={() => router.push('/')} 
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-gray-200 rounded-full hover:bg-primary hover:border-primary hover:text-white transition-all"
          >
            ← Back
          </button>
          
          <div className="flex flex-col items-end leading-none">
            <span className="text-[14px] font-black text-gray-900">${balance.toFixed(2)}</span>
            <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Available Credits</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* SNEAK PEEK STRIP (VIDEOS ONLY) */}
        {videoCollection.length > 0 && (
          <section className="pt-24 pb-6 bg-transparent border-b border-gray-100">
            <div className="px-6 mb-4 flex justify-between items-end">
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sneak Peeks</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar">
              {videoCollection.map((vid, idx) => {
                const isOwned = unlockedAssetIds.includes(vid.id.toString());
                return (
                  <div 
                    key={vid.id} 
                    onClick={() => isOwned ? videoRefs.current[vid.id]?.scrollIntoView({behavior: 'smooth'}) : handleUnlockVideo(vid)} 
                    // Patch 2: Strict size and perfect rounding
                    className="relative w-[80px] h-[80px] min-w-[80px] bg-black rounded-full overflow-hidden cursor-pointer flex-shrink-0 group shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Patch 3: Use optimized GIF simulation to save space */}
                     <video 
                      src={`${vid.file_url}#t=0,3`} 
                      // [GOD_MODE_PATCH] First video (index 0) is a clear teaser; others stay dark until owned
                      className={`w-full h-full object-cover transition-opacity duration-500 ${(isOwned || idx === 0) ? 'opacity-100' : 'opacity-40'}`}
                      autoPlay={!isOwned} 
                      loop={!isOwned} 
                      muted 
                      playsInline 
                      preload="metadata"
                      
                      // THE SUPER LOOP: This forces the reset if the 'loop' attribute fails
                      onTimeUpdate={(e) => {
                        if (!isOwned && e.currentTarget.currentTime >= 2.9) {
                          e.currentTarget.currentTime = 0;
                          e.currentTarget.play();
                        }
                      }}
                      onEnded={(e) => {
                        if (!isOwned) {
                          e.currentTarget.currentTime = 0;
                          e.currentTarget.play();
                        }
                      }}
                    />
                    
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[8px] font-black uppercase shadow-sm ${isOwned ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                      {isOwned ? 'OWNED' : '$2.00'}
                    </div>

                    {!isOwned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="pt-10 px-4 max-w-7xl mx-auto space-y-20">
          
          {/* --- [UPDATED] UNLOCKED VIDEOS GRID (With Center Play Icon) --- */}
          {videoCollection.filter(vid => unlockedAssetIds.includes(vid.id.toString())).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              {videoCollection.map((vid) => {
                if (!unlockedAssetIds.includes(vid.id.toString())) return null;
                return (
                  <div 
                    key={vid.id} 
                    ref={el => { videoRefs.current[vid.id] = el }} 
                    className="group aspect-[3/4] bg-black rounded-2xl relative overflow-hidden border border-black/5 shadow-sm cursor-pointer transition-all"
                  >
                    {/* The Video Thumbnail */}
                    <video 
                      src={vid.file_url} 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                    />

                    {/* --- CENTER PLAY ICON --- */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center z-20"
                      onClick={() => setSelectedImage(vid.file_url)}
                    >
                      <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* MINI DOWNLOAD ICON (Stays in corner) */}
                    <button 
                      onClick={(e) => handleDownload(vid.file_url, e)} 
                      className="absolute bottom-3 right-3 z-30 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 transition-all hover:bg-primary hover:scale-110"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* IMAGE TIERS */}
          {uniqueTiers.length === 0 ? (
             <div className="text-center py-20 opacity-30 text-[10px] font-black uppercase tracking-widest text-gray-500">
               No Content Found for ID: {vaultId}
             </div>
          ) : (
            uniqueTiers.map((tierNum) => {
              const tierMedia = imageCollection.filter(m => m.tier === tierNum);
              const isUnlocked = unlockedTiers.includes(tierNum);
              const price = tierNum === 1 ? 6.00 : 4.00;

              return (
                <section key={tierNum} className="animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
                  
                  {/* TIER HEADER */}
                  <div 
                    onClick={() => toggleTier(tierNum)}
                    className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4 cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    <div className="flex flex-col">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Collection Level 0{tierNum}</h2>
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isUnlocked ? 'text-green-500' : 'text-gray-300'}`}>
                        {isUnlocked ? '// FULL_ACCESS' : '// LOCKED'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-gray-300">
                      {expandedTiers.includes(tierNum) ? '[-]' : '[+]'}
                    </span>
                  </div>

                  {/* EXPANDED CONTENT */}
                  {expandedTiers.includes(tierNum) && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      
                      {!isUnlocked ? (
                        <>
                          <LockedTierSlider paddedMedia={generatePeakMedia(tierMedia)} />
                          {/* PAYWALL BLOCK (Light theme applied here) */}
                          <div className="p-10 bg-gray-50 rounded-[32px] border border-gray-100 text-center shadow-2xl shadow-primary/10 relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/10 blur-[60px] rounded-full -z-10"></div>
                            
                            <h3 className="text-gray-900 font-black uppercase text-[10px] tracking-[0.3em] mb-6">Unlock Selection</h3>
                            
                            <button 
                              onClick={() => handleTierUnlock(tierNum, price)}
                              disabled={isProcessing}
                              className="bg-primary text-white px-12 py-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                              {isProcessing ? 'Connecting...' : `Unlock Level 0${tierNum} ($${price.toFixed(2)})`}
                            </button>
                            
                            <p className="text-[8px] font-bold text-gray-500 mt-6 uppercase tracking-widest italic">
                              Fee will be deducted from your available credits
                            </p>
                          </div>
                        </>
                      ) : (
                        /* UNLOCKED STATE: FULL GRID */
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {tierMedia.map((item, index) => (
                            <div 
                              key={item.id} 
                              onClick={() => setSelectedImage(item.file_url)}
                              className="group aspect-[3/4] bg-black rounded-2xl relative overflow-hidden border border-black/5 shadow-sm cursor-pointer transition-all"
                            >
                              {/* MEDIA DISPLAY */}
                              <OptimizedMedia 
                                src={item.file_url} 
                                type={item.file_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image'}
                                className="absolute inset-0 group-hover:scale-105 transition-transform duration-500" 
                                priority={index < 12}
                              />

                              {/* DOWNLOAD ICON */}
                              <button 
                                onClick={(e) => handleDownload(item.file_url, e)}
                                className="absolute bottom-3 right-3 z-30 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 transition-all hover:bg-primary hover:scale-110" 
                                title="Download"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="white" 
                                  strokeWidth="2.5" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                              </button>

                              {/* OVERLAY TINT ON HOVER */}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                          ))}
                        </div>

                        )}

                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      </div>

      {/* FULL SCREEN LIGHTBOX OVERLAY */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          {/* CONTROLS CONTAINER */}
          <div className="absolute top-6 right-6 flex gap-3 z-[250]">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                // [FIX] Checking if selectedImage exists before splitting prevents the crash
                if (selectedImage) {
                  const rawUrl = selectedImage.split('?')[0];
                  handleDownload(rawUrl, `vault-media-${Date.now()}`);
                }
              }}
              className="text-white font-black text-[10px] tracking-widest uppercase bg-primary px-6 py-3 rounded-full hover:bg-white hover:text-black transition-all shadow-lg"
            >
              [ DOWNLOAD ]
            </button>

            <button 
              onClick={() => setSelectedImage(null)}
              className="text-white font-black text-[10px] tracking-widest uppercase bg-white/10 px-6 py-3 rounded-full hover:bg-white/20 transition-colors"
            >
              Close [X]
            </button>
          </div>

          {/* CONTENT DISPLAY */}
          <div className="max-w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {isVideo(selectedImage) ? (
              <video 
                src={selectedImage} 
                controls 
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              />
            ) : (
              <img 
                src={selectedImage} 
                alt="Expanded view" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              />
            )}
          </div>
        </div>
      )}

    </main>
  );
}