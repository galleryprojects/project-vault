'use client';

import React, { useEffect, useState } from 'react';
import OptimizedMedia from '@/components/OptimizedMedia';
import { 
  getCollectionMedia, 
  setMediaAsCover, 
  deleteMediaAsset, 
  addMediaToCollection,
  getAdminVaultStats,
  swapMediaFile,
  updateAssetMetadata ,
  deleteEntireVault
} from '../../actions/admin';

const isVideo = (url: string) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

export default function ArchiveManager({ vaultStats, setVaultStats }: any) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionAssets, setCollectionAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingTier, setUploadingTier] = useState<number | null>(null);
  
  // Tracking collapsible states (Tiers 1 and 99 open by default)
  const [openTiers, setOpenTiers] = useState<number[]>([1, 99]);
  const [pendingChanges, setPendingChanges] = useState<Record<string, { price: string, start_time: number }>>({});
  const [stagedAdditions, setStagedAdditions] = useState<any[]>([]);
  const [stagedSwaps, setStagedSwaps] = useState<Record<string, { file: File, preview: string, duration: number }>>({});

// --- NEW FORMATTER ---
  const formatDuration = (s: number) => {
    if (!s) return "0 secs";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    if (mins > 0 && secs > 0) return `${mins} min ${secs} secs`;
    if (mins > 0) return `${mins} min`;
    return `${secs} secs`;
  };

  // --- NEW METADATA READER (WITH ANTI-HANG FAILSAFE) ---
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('video/')) return resolve(0);
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      // [THE FIX]: If the browser gets stuck reading the video for more than 2 seconds, force the upload to proceed!
      const failsafe = setTimeout(() => {
         resolve(0); 
      }, 2000);

      video.onloadedmetadata = () => {
        clearTimeout(failsafe);
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      // Fallback if the video format is completely unsupported by the local browser
      video.onerror = () => {
        clearTimeout(failsafe);
        resolve(0);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    if (selectedCollection) {
      getCollectionMedia(selectedCollection).then(setCollectionAssets);
      setPendingChanges({});
      setStagedAdditions([]);
      setStagedSwaps({});
    }
  }, [selectedCollection]);

  const toggleTier = (tier: number) => {
    setOpenTiers(prev => prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]);
  };

    // [FIXED]: We now pass the current asset values as fallbacks to prevent "2.00" overwrites
    const handleUpdateAssetLocal = (id: string, updates: any, currentAsset: any) => {
      setPendingChanges(prev => ({
        ...prev,
        [id]: { 
          price: prev[id]?.price ?? currentAsset.price ?? "2.00", 
          start_time: prev[id]?.start_time ?? currentAsset.start_time ?? 0,
          ...updates 
        }
      }));
    };

  const handleGlobalSync = async () => {
    const hasChanges = Object.keys(pendingChanges).length > 0 || stagedAdditions.length > 0 || Object.keys(stagedSwaps).length > 0;
    if (!selectedCollection || !hasChanges) return alert("NO_CHANGES_STAGED");
    
    if (!window.confirm(`Confirm Changes: Upload all staged files and apply updates?`)) return;

    setUploadingTier(0);
    try {
      // 1. Upload New Additions
      const tiers = Array.from(new Set(stagedAdditions.map(a => a.tier)));
      for (const t of tiers) {
        const adds = stagedAdditions.filter(a => a.tier === t);
        await addMediaToCollection(selectedCollection, t, adds.map(a => a.rawFile), adds.map(a => a.duration));
      }

      // 2. Upload Swaps
      const swapPromises = Object.entries(stagedSwaps).map(async ([id, data]) => {
        const original = collectionAssets.find(a => a.id === id);
        if (original) await swapMediaFile(id, original.file_url, data.file, data.duration);
      });
      await Promise.all(swapPromises);

      // 3. Update Metadata (Prices/Scrub)
      const syncPromises = Object.entries(pendingChanges).map(([id, data]) => {
        if (id.startsWith('temp-')) return Promise.resolve(); // Skip metadata for new files (they use defaults until saved once)
        return updateAssetMetadata(id, data.price, data.start_time);
      });
      await Promise.all(syncPromises);

      // Cleanup & Refresh
      setCollectionAssets(await getCollectionMedia(selectedCollection));
      setVaultStats(await getAdminVaultStats());
      setPendingChanges({});
      setStagedAdditions([]);
      setStagedSwaps({});
      alert("Vault Updated Successfully!");
      setSelectedCollection(null);
    } catch (e) {
       alert("Upload Error. Please check your connection and try again.");
    } finally {
      setUploadingTier(null);
    }
  };

 const handleQuickAdd = async (files: FileList | null, tier: number) => {
    if (!files || !selectedCollection) return;
    const fileArray = Array.from(files);
    
    // Create Local Previews ONLY - No Backend Call
    const newStaged = await Promise.all(fileArray.map(async (file, index) => {
       const dur = await getVideoDuration(file);
       return {
          id: `temp-${Date.now()}-${index}`,
          vault_id: selectedCollection,
          file_url: URL.createObjectURL(file), 
          media_type: file.type.startsWith('video/') ? 'video' : 'image',
          tier: tier,
          price: "2.00",
          start_time: 0,
          duration: dur,
          display_order: 1,
          isStagedNew: true, // Flags it as a new staging file
          rawFile: file
       };
    }));
    
    setStagedAdditions(prev => [...prev, ...newStaged]);
  };

  // --- THE VAULT NUKE PROTOCOL ---
  const handleDeleteVault = async () => {
    if (!selectedCollection) return;
    
    // Safety Lock 1: Standard Warning
    const confirm1 = window.confirm(`CRITICAL WARNING: You are about to delete the ENTIRE vault "${selectedCollection}".\n\nThis will wipe all database records and erase all files from Cloudflare R2. This CANNOT be undone.\n\nProceed?`);
    if (!confirm1) return;
    
    // Safety Lock 2: Manual Type Confirmation
    const confirm2 = window.prompt(`To confirm absolute deletion, type the vault ID exactly as shown: ${selectedCollection}`);
    if (confirm2 !== selectedCollection) {
      alert("ABORTED: Vault ID did not match.");
      return;
    }

    setUploadingTier(0); // Using this state to trigger the loading pulse
    const res = await deleteEntireVault(selectedCollection);
    
    if (res.success) {
      alert(`VAULT ${selectedCollection} COMPLETELY ANNIHILATED.`);
      setVaultStats(await getAdminVaultStats()); // Refresh sidebar
      setSelectedCollection(null); // Kick user back to search
    } else {
      alert(`FAILED TO DELETE VAULT: ${res.error}`);
    }
    setUploadingTier(null);
  };

  const AddGate = ({ tier, label, isVideoGate = false }: any) => (
    <div className={`relative aspect-square border-2 border-dashed ${isVideoGate ? 'border-[#FF6600] bg-[#FF6600]/5' : 'border-[#FF6600]/20 bg-black'} flex flex-col items-center justify-center transition-all hover:border-[#FF6600] group`}>
      <input type="file" multiple accept={isVideoGate ? "video/*" : "image/*"} onChange={(e) => handleQuickAdd(e.target.files, tier)} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={uploadingTier !== null} />
      <span className={`text-[14px] font-black ${isVideoGate ? 'text-[#FF6600]' : 'text-gray-700'} group-hover:scale-125 transition-transform`}>+</span>
      <span className={`text-[8px] font-black uppercase mt-1 ${isVideoGate ? 'text-[#FF6600]' : 'text-gray-500'}`}>
        {uploadingTier === tier ? 'Updating...' : label}
      </span>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-8 animate-in fade-in duration-500">
      
      {/* 1. LEFT RAIL */}
      {!selectedCollection && (
      <div className="w-1/4 flex flex-col gap-4 animate-in slide-in-from-left duration-300">
        <input type="text" placeholder="SEARCH_VAULTS..." className="bg-black border border-[#FF6600]/20 p-3 text-[10px] text-white outline-none focus:border-[#FF6600] uppercase font-black" onChange={(e) => setSearchQuery(e.target.value)} />
        <div className="flex-1 overflow-y-auto border border-[#FF6600]/10 space-y-1 scrollbar-hide">
          {vaultStats.filter((v: any) => v.id.includes(searchQuery.toLowerCase())).map((v: any) => {
            const sequenceMatch = v.id.match(/\d+$/);
            const displayLabel = sequenceMatch ? `Vault ${sequenceMatch[0]}` : v.id;
            return (
              <button key={v.id} onClick={() => setSelectedCollection(v.id)} className={`w-full text-left p-4 text-[11px] font-black uppercase transition-all ${selectedCollection === v.id ? 'bg-[#FF6600] text-black shadow-[0_0_15px_rgba(255,102,0,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                {displayLabel} <span className="float-right opacity-50 font-bold">[{v.total} items]</span>
              </button>
            );
          })}
          
        </div>
      </div>
      )}

      {/* 2. MAIN GALLERY (TIERED) */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 overflow-y-auto space-y-6 p-1 scrollbar-hide pb-24">
          {!selectedCollection ? (
            <div className="h-full flex items-center justify-center text-gray-800 font-black text-[10px] tracking-[0.4em] uppercase">SELECT_VAULT_TO_MONITOR</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 bg-black/40 p-4 border border-[#3B82F6]/20">
                
                {/* Left Side: Back Button & Title */}
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setSelectedCollection(null)} 
                    className="text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    ← BACK_TO_SEARCH
                  </button>
                  <div className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">
                    Editing_Vault: <span className="text-white">{selectedCollection}</span>
                  </div>
                </div>

                {/* Right Side: The Kill Switch */}
                <button 
                  onClick={handleDeleteVault}
                  className="bg-red-900/10 border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.1)]"
                >
                  DELETE THIS VAULT?
                </button>
                
              </div>

              {[1, 2, 3, 99].map((tierNum) => {
                const isOpen = openTiers.includes(tierNum);                
                const combinedAssets = [
                  // 1. Real assets (with swapped previews if applicable)
                  ...collectionAssets.filter(a => a.tier === tierNum).map(a => {
                     const swap = stagedSwaps[a.id];
                     return swap ? { 
                        ...a, 
                        file_url: swap.preview, 
                        duration: swap.duration, 
                        media_type: swap.file.type.startsWith('video/') ? 'video' : 'image',
                        isStagedSwap: true,
                        rawFile: swap.file
                     } : a;
                  }),
                  // 2. Brand new staged additions
                  ...stagedAdditions.filter(a => a.tier === tierNum)
                ];

                const tierName = tierNum === 99 ? "VIDEO_GALLERY" : `IMAGE_TIER_0${tierNum}`;

                return (
                  <div key={tierNum} className="border border-[#FF6600]/10 bg-black/10 overflow-hidden">
                    <button 
                      onClick={() => toggleTier(tierNum)}
                      className="w-full flex justify-between items-center p-4 bg-black/60 hover:bg-[#FF6600]/10 transition-colors border-b border-[#FF6600]/5"
                    >
                      <span className="text-[10px] font-black text-white tracking-[0.2em]">
                         {tierName} <span className="text-[#FF6600] ml-2">[{combinedAssets.length} ASSETS]</span>
                      </span>
                      <span className="text-[#FF6600] font-black">{isOpen ? '−' : '+'}</span>
                    </button>

                    {isOpen && (
                      <div className="p-6 grid grid-cols-4 gap-6 animate-in slide-in-from-top-1 duration-300">
                        <AddGate tier={tierNum} label={`ADD_${tierNum === 99 ? 'VIDEO' : 'IMAGE'}`} isVideoGate={tierNum === 99} />
                        
                        {/* [SMART FIX]: Updated for Local Staging & Blobs */}
                        {combinedAssets.map((asset, index) => {
                          
                          // 1. SMART VIDEO CHECK: If it's a local stage, trust the media_type. If it's from the DB, check the URL.
                          const isVid = (asset.isStagedNew || asset.isStagedSwap) 
                            ? asset.media_type === 'video' 
                            : isVideo(asset.file_url);
                            
                          const changes = pendingChanges[asset.id] || {};
                          const currentStart = changes.start_time ?? (asset.start_time || 0);
                          const currentPrice = changes.price ?? (asset.price || "2.00");

                          return (
                            <div key={asset.id} className="flex flex-col gap-3 group animate-in fade-in duration-500">
                              <div className={`media-grid-item aspect-square border transition-all ${asset.display_order === 0 ? 'border-[#FF6600] shadow-[0_0_20px_rgba(255,102,0,0.3)]' : 'border-[#FF6600]/10'} bg-black relative overflow-hidden`}>

                                 {/* --- NEW: BACKGROUND SYNC OVERLAY --- */}
                                {asset.isUploading && (
                                  <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 border-[3px] border-[#FF6600]/20 border-t-[#FF6600] rounded-full animate-spin mb-3"></div>
                                    <span className="text-[8px] font-black text-[#FF6600] uppercase tracking-widest animate-pulse text-center leading-relaxed">
                                      Uploading to<br/>Database
                                    </span>
                                  </div>
                                )}

                                {/* --- THE STAGED BADGE (FIXED: NO DARK BLANKET) --- */}
                                {(asset.isStagedNew || asset.isStagedSwap) && (
                                  <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest border border-[#FF6600] px-3 py-1 bg-black/90 shadow-[0_0_15px_rgba(255,102,0,0.5)]">
                                      STAGED FOR SAVE
                                    </span>
                                  </div>
                                )}
                                {/* ------------------------ */}

                                <OptimizedMedia 
                                  src={isVid ? `${asset.file_url}#t=${currentStart},${currentStart + 3}` : asset.file_url} 
                                  type={isVid ? 'video' : 'image'} 
                                  className={(isVid && asset.display_order !== 0) ? "grayscale group-hover:grayscale-0 transition-all" : ""}
                                  priority={index < 3}
                                />

                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 border border-[#FF6600]/30 text-[7px] font-black text-[#FF6600] z-10 uppercase">
                                  {isVid ? 'SNEAK_PEEK' : `T_0${asset.tier}`}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                {isVid && (
                                  <div className="space-y-2 mb-2 bg-[#FF6600]/5 p-2 border border-[#FF6600]/10 rounded">
                                    <div className="flex justify-between text-[7px] font-black text-[#FF6600] uppercase">
                                      <span>Start: {currentStart} s</span>
                                      <span>${currentPrice}</span>
                                    </div>
                                    
                                    <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest text-center mt-1 border-t border-[#FF6600]/10 pt-1">
                                      TOTAL LENGTH: {formatDuration(asset.duration)}
                                    </div>
                                    
                                    {/* --- [THE FIX]: DYNAMIC MAX LIMIT --- */}
                                    <input 
                                      type="range" 
                                      min="0" 
                                      // If duration exists, max is duration - 3. If it's an old video (0), fallback to 60.
                                      max={asset.duration ? Math.max(0, Math.floor(asset.duration) - 3) : 60} 
                                      value={currentStart} 
                                      onChange={(e) => handleUpdateAssetLocal(asset.id, { start_time: parseInt(e.target.value) }, asset)} 
                                      className="w-full h-1 bg-[#FF6600]/20 appearance-none cursor-pointer accent-[#FF6600]" 
                                    />
                                    
                                    <div className="flex items-center bg-black border border-[#FF6600]/20 px-1 py-0.5">
                                      <span className="text-[8px] text-[#FF6600] mr-1">$</span>
                                      <input type="number" step="0.01" value={currentPrice} onChange={(e) => handleUpdateAssetLocal(asset.id, { price: e.target.value }, asset)} className="bg-transparent text-white text-[9px] font-bold outline-none w-full" />
                                    </div>
                                  </div>
                                )}

                                {!isVid && (
                                  <button onClick={() => setMediaAsCover(selectedCollection, asset.id).then(() => getCollectionMedia(selectedCollection).then(setCollectionAssets))} className={`py-2 text-[8px] font-black uppercase transition-all ${asset.display_order === 0 ? 'bg-[#FF6600] text-black' : 'bg-white/5 text-gray-400 hover:bg-white hover:text-black'}`}>{asset.display_order === 0 ? 'PRIMARY_LOCKED' : 'SET_AS_COVER'}</button>
                                )}

                                <div className="relative">
                                  <button className="w-full py-2 border border-[#FF6600]/30 text-[#FF6600] text-[8px] font-black uppercase hover:border-[#FF6600]">SWAP_FILE</button>
                                  <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={async (e) => {
                                      const file = e.target.files![0];
                                      if (!file) return;
                                      const dur = await getVideoDuration(file);
                                      // Stage it locally instead of uploading
                                      setStagedSwaps(prev => ({
                                        ...prev,
                                        [asset.id]: { file, preview: URL.createObjectURL(file), duration: dur }
                                      }));
                                    }} 
                                  />

                                </div>

                                <button onClick={() => deleteMediaAsset(asset.id, asset.file_url).then(() => getCollectionMedia(selectedCollection).then(setCollectionAssets))} className="py-2 border border-red-900 text-red-900 text-[8px] font-black uppercase hover:bg-red-500 hover:text-black transition-all">DELETE</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* 3. FOOTER */}
        {selectedCollection && (
          <div className="bg-black border border-[#FF6600]/20 p-6 flex items-end gap-6 shadow-2xl relative">
            <div className="flex-1">
              <label className="text-[8px] text-gray-600 block mb-2 uppercase font-black tracking-tighter tracking-widest">Click Below to save changes</label>
              <input readOnly type="text" value={selectedCollection} className="w-full bg-[#0a0a0a] border border-[#FF6600]/10 p-3 text-gray-500 text-xs font-bold outline-none cursor-not-allowed uppercase" />
            </div>

            <div className="flex gap-4">
              {(Object.keys(pendingChanges).length > 0 || stagedAdditions.length > 0 || Object.keys(stagedSwaps).length > 0) && (
                <button 
                  onClick={() => {
                    if (window.confirm("Discard all staged changes?")) {
                      setPendingChanges({});
                      setStagedAdditions([]);
                      setStagedSwaps({});
                    }
                  }} 
                  className="bg-transparent border border-red-900 text-red-900 px-8 py-3 text-[10px] font-black uppercase hover:bg-red-500 hover:text-black transition-all"
                >
                  CANCEL CHANGES
                </button>
              )}

              <button onClick={handleGlobalSync} className={`bg-[#FF6600] text-black px-12 py-3 text-[10px] font-black uppercase hover:bg-white transition-all ${uploadingTier === 0 ? 'animate-pulse' : ''}`}>{uploadingTier === 0 ? 'Updating...' : 'Save Changes'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}