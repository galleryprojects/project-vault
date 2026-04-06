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
  updateAssetMetadata 
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

  useEffect(() => {
    if (selectedCollection) {
      getCollectionMedia(selectedCollection).then(setCollectionAssets);
      setPendingChanges({});
    }
  }, [selectedCollection]);

  const toggleTier = (tier: number) => {
    setOpenTiers(prev => prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]);
  };

  const handleUpdateAssetLocal = (id: string, updates: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { price: "2.00", start_time: 0 }), ...updates }
    }));
  };

  const handleGlobalSync = async () => {
    const changeCount = Object.keys(pendingChanges).length;
    if (!selectedCollection || changeCount === 0) return alert("NO_CHANGES_STAGED");
    if (!window.confirm(`Confirm Changes: Apply ${changeCount} updates to this vault?`)) return;

    setUploadingTier(0);
    try {
      const syncPromises = Object.entries(pendingChanges).map(([id, data]) => 
        updateAssetMetadata(id, data.price, data.start_time)
      );
      await Promise.all(syncPromises);
      setCollectionAssets(await getCollectionMedia(selectedCollection));
      setPendingChanges({});
      alert("VAULT_SYNCHRONIZED");
    } finally {
      setUploadingTier(null);
    }
  };

  const handleQuickAdd = async (files: FileList | null, tier: number) => {
    if (!files || !selectedCollection) return;
    setUploadingTier(tier);
    const res = await addMediaToCollection(selectedCollection, tier, Array.from(files));
    if (res.success) {
      setCollectionAssets(await getCollectionMedia(selectedCollection));
      setVaultStats(await getAdminVaultStats());
    }
    setUploadingTier(null);
  };

  const AddGate = ({ tier, label, isVideoGate = false }: any) => (
    <div className={`relative aspect-square border-2 border-dashed ${isVideoGate ? 'border-[#FF6600] bg-[#FF6600]/5' : 'border-[#FF6600]/20 bg-black'} flex flex-col items-center justify-center transition-all hover:border-[#FF6600] group`}>
      <input type="file" multiple accept={isVideoGate ? "video/*" : "image/*"} onChange={(e) => handleQuickAdd(e.target.files, tier)} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={uploadingTier !== null} />
      <span className={`text-[14px] font-black ${isVideoGate ? 'text-[#FF6600]' : 'text-gray-700'} group-hover:scale-125 transition-transform`}>+</span>
      <span className={`text-[8px] font-black uppercase mt-1 ${isVideoGate ? 'text-[#FF6600]' : 'text-gray-500'}`}>
        {uploadingTier === tier ? 'SYNCING...' : label}
      </span>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-8 animate-in fade-in duration-500">
      
      {/* 1. LEFT RAIL */}
      <div className="w-1/4 flex flex-col gap-4">
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

      {/* 2. MAIN GALLERY (TIERED) */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 overflow-y-auto space-y-6 p-1 scrollbar-hide pb-24">
          {!selectedCollection ? (
            <div className="h-full flex items-center justify-center text-gray-800 font-black text-[10px] tracking-[0.4em] uppercase">SELECT_VAULT_TO_MONITOR</div>
          ) : (
            <>
              {[1, 2, 3, 99].map((tierNum) => {
                const isOpen = openTiers.includes(tierNum);
                const assets = collectionAssets.filter(a => a.tier === tierNum);
                const tierName = tierNum === 99 ? "VIDEO_GALLERY" : `IMAGE_TIER_0${tierNum}`;

                return (
                  <div key={tierNum} className="border border-[#FF6600]/10 bg-black/10 overflow-hidden">
                    <button 
                      onClick={() => toggleTier(tierNum)}
                      className="w-full flex justify-between items-center p-4 bg-black/60 hover:bg-[#FF6600]/10 transition-colors border-b border-[#FF6600]/5"
                    >
                      <span className="text-[10px] font-black text-white tracking-[0.2em]">
                        // {tierName} <span className="text-[#FF6600] ml-2">[{assets.length} ASSETS]</span>
                      </span>
                      <span className="text-[#FF6600] font-black">{isOpen ? '−' : '+'}</span>
                    </button>

                    {isOpen && (
                      <div className="p-6 grid grid-cols-4 gap-6 animate-in slide-in-from-top-1 duration-300">
                        <AddGate tier={tierNum} label={`ADD_${tierNum === 99 ? 'VIDEO' : 'IMAGE'}`} isVideoGate={tierNum === 99} />
                        
                        {/* [SMART FIX]: Added 'index' to the map function for VIP loading */}
                        {assets.map((asset, index) => {
                          const isVid = isVideo(asset.file_url);
                          const changes = pendingChanges[asset.id] || {};
                          const currentStart = changes.start_time ?? (asset.start_time || 0);
                          const currentPrice = changes.price ?? (asset.price || "2.00");

                          return (
                            <div key={asset.id} className="flex flex-col gap-3 group animate-in fade-in duration-500">
                              <div className={`media-grid-item aspect-square border transition-all ${asset.display_order === 0 ? 'border-[#FF6600] shadow-[0_0_20px_rgba(255,102,0,0.3)]' : 'border-[#FF6600]/10'} bg-black relative overflow-hidden`}>
                                <OptimizedMedia 
                                  src={isVid ? `${asset.file_url}#t=${currentStart},${currentStart + 3}` : asset.file_url} 
                                  type={isVid ? 'video' : 'image'} 
                                  // [GOD_MODE_PATCH]: Don't apply grayscale if it is the primary asset (display_order === 0)
                                  className={(isVid && asset.display_order !== 0) ? "grayscale group-hover:grayscale-0 transition-all" : ""}
                                  // [SMART FIX]: Only the first 3 items in the grid get priority to kill LCP warnings
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
                                      <span>Scrub: {currentStart}s</span>
                                      <span>${currentPrice}</span>
                                    </div>
                                    <input type="range" min="0" max="60" value={currentStart} onChange={(e) => handleUpdateAssetLocal(asset.id, { start_time: parseInt(e.target.value) })} className="w-full h-1 bg-[#FF6600]/20 appearance-none cursor-pointer accent-[#FF6600]" />
                                    <div className="flex items-center bg-black border border-[#FF6600]/20 px-1 py-0.5">
                                      <span className="text-[8px] text-[#FF6600] mr-1">$</span>
                                      <input type="number" step="0.01" value={currentPrice} onChange={(e) => handleUpdateAssetLocal(asset.id, { price: e.target.value })} className="bg-transparent text-white text-[9px] font-bold outline-none w-full" />
                                    </div>
                                  </div>
                                )}
                                {!isVid && (
                                  <button onClick={() => setMediaAsCover(selectedCollection, asset.id).then(() => getCollectionMedia(selectedCollection).then(setCollectionAssets))} className={`py-2 text-[8px] font-black uppercase transition-all ${asset.display_order === 0 ? 'bg-[#FF6600] text-black' : 'bg-white/5 text-gray-400 hover:bg-white hover:text-black'}`}>{asset.display_order === 0 ? 'PRIMARY_LOCKED' : 'SET_AS_COVER'}</button>
                                )}
                                <div className="relative">
                                  <button className="w-full py-2 border border-[#FF6600]/30 text-[#FF6600] text-[8px] font-black uppercase hover:border-[#FF6600]">SWAP_FILE</button>
                                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => swapMediaFile(asset.id, asset.file_url, e.target.files![0])} />
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
              <label className="text-[8px] text-gray-600 block mb-2 uppercase font-black tracking-tighter tracking-widest">READ_ONLY_COLLECTION_ID</label>
              <input readOnly type="text" value={selectedCollection} className="w-full bg-[#0a0a0a] border border-[#FF6600]/10 p-3 text-gray-500 text-xs font-bold outline-none cursor-not-allowed uppercase" />
            </div>
            <div className="flex gap-4">
              {Object.keys(pendingChanges).length > 0 && (
                <button onClick={() => window.confirm("Discard all staged changes?") && setPendingChanges({})} className="bg-transparent border border-red-900 text-red-900 px-8 py-3 text-[10px] font-black uppercase hover:bg-red-500 hover:text-black transition-all">[ CANCEL_CHANGES ]</button>
              )}
              <button onClick={handleGlobalSync} className={`bg-[#FF6600] text-black px-12 py-3 text-[10px] font-black uppercase hover:bg-white transition-all ${uploadingTier === 0 ? 'animate-pulse' : ''}`}>{uploadingTier === 0 ? '[ SYNCING... ]' : '[ SAVE_CHANGES ]'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}