'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  getCollectionMedia, 
  updateCollectionMetadata, 
  setMediaAsCover, 
  deleteMediaAsset, 
  addMediaToCollection,
  getAdminVaultStats,
  swapMediaFile,
  updateAssetMetadata // Assuming this exists or we'll loop in sync
} from '../../actions/admin';

const isVideo = (url: string) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

export default function ArchiveManager({ vaultStats, setVaultStats }: any) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionAssets, setCollectionAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editName, setEditName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Track changes made to video prices and start times locally
  const [pendingChanges, setPendingChanges] = useState<Record<string, { price: string, start_time: number }>>({});

  useEffect(() => {
    if (selectedCollection && vaultStats.length > 0) {
      getCollectionMedia(selectedCollection).then(setCollectionAssets);
      setEditName(selectedCollection);
      setPendingChanges({}); // Clear changes when switching vaults
    }
  }, [selectedCollection, vaultStats]);

  const handleUpdateAssetLocal = (id: string, updates: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { price: "2.00", start_time: 0 }), ...updates }
    }));
  };

  const handleGlobalSync = async () => {
    if (!selectedCollection || Object.keys(pendingChanges).length === 0) {
      return alert("NO_CHANGES_STAGED");
    }

    setIsUploading(true);
    
    try {
      // Loop through every video you tweaked and update them in parallel
      const syncPromises = Object.entries(pendingChanges).map(([id, data]) => 
        updateAssetMetadata(id, data.price, data.start_time)
      );

      await Promise.all(syncPromises);
      
      alert(`[ SYSTEM ] SYNC_COMPLETE: ${Object.keys(pendingChanges).length} assets updated.`);
      
      // Refresh the gallery to show the saved data
      const refreshedAssets = await getCollectionMedia(selectedCollection);
      setCollectionAssets(refreshedAssets);
      setPendingChanges({}); // Clear the staging area
      
    } catch (err) {
      alert("SYNC_FAILED: Check terminal for logs.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuickAdd = async (files: FileList | null, tier: number) => {
    if (!files || !selectedCollection) return;
    setIsUploading(true);
    const res = await addMediaToCollection(selectedCollection, tier, Array.from(files));
    if (res.success) {
      setCollectionAssets(await getCollectionMedia(selectedCollection));
      const stats = await getAdminVaultStats();
      setVaultStats(stats);
    }
    setIsUploading(false);
  };

  // --- REUSABLE GATES ---
  const AddGate = ({ tier, label, isVideoGate = false }: any) => (
    <div className={`relative aspect-square border-2 border-dashed ${isVideoGate ? 'border-[#FF6600] bg-[#FF6600]/5' : 'border-[#FF6600]/20 bg-black'} flex flex-col items-center justify-center transition-all hover:border-[#FF6600] group`}>
      <input type="file" multiple accept={isVideoGate ? "video/*" : "image/*"} onChange={(e) => handleQuickAdd(e.target.files, tier)} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={isUploading} />
      <span className={`text-[14px] font-black ${isVideoGate ? 'text-[#FF6600]' : 'text-gray-700'} group-hover:scale-125 transition-transform`}>+</span>
      <span className={`text-[8px] font-black uppercase mt-1 ${isVideoGate ? 'text-[#FF6600]' : 'text-gray-500'}`}>{isUploading ? 'SYNCING...' : label}</span>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-8 animate-in fade-in duration-500">
      
      {/* 1. LEFT RAIL: [XX items] FIX */}
      <div className="w-1/4 flex flex-col gap-4">
        <input type="text" placeholder="SEARCH_VAULTS..." className="bg-black border border-[#FF6600]/20 p-3 text-[10px] text-white outline-none focus:border-[#FF6600] uppercase font-black" onChange={(e) => setSearchQuery(e.target.value)} />
        <div className="flex-1 overflow-y-auto border border-[#FF6600]/10 space-y-1 scrollbar-hide">
          {vaultStats.filter((v: any) => v.id.includes(searchQuery.toLowerCase())).map((v: any) => (
            <button key={v.id} onClick={() => setSelectedCollection(v.id)} className={`w-full text-left p-4 text-[11px] font-black uppercase transition-all ${selectedCollection === v.id ? 'bg-[#FF6600] text-black shadow-[0_0_15px_rgba(255,102,0,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              {v.id} <span className="float-right opacity-50 font-bold">[{v.total} items]</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. MAIN GALLERY: THE 4 GATES + INTEGRATED EDITORS */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-6 p-1 scrollbar-hide pb-24">
          {!selectedCollection ? (
            <div className="col-span-4 h-full flex items-center justify-center text-gray-800 font-black text-[10px] tracking-[0.4em] uppercase">SELECT_VAULT_TO_MONITOR</div>
          ) : (
            <>
              <AddGate tier={1} label="ADD_TIER_01" />
              <AddGate tier={2} label="ADD_TIER_02" />
              <AddGate tier={3} label="ADD_TIER_03" />
              <AddGate tier={99} label="ADD_VIDEO" isVideoGate={true} />

              {collectionAssets.map((asset) => {
                const isVid = isVideo(asset.file_url);
                const changes = pendingChanges[asset.id] || {};
                const currentStart = changes.start_time ?? (asset.start_time || 0);
                const currentPrice = changes.price ?? (asset.price || "2.00");

                return (
                  <div key={asset.id} className="flex flex-col gap-3 group animate-in fade-in duration-500">
                    {/* MEDIA BOX */}
                    <div className={`aspect-square border transition-all ${asset.display_order === 0 ? 'border-[#FF6600] shadow-[0_0_20px_rgba(255,102,0,0.3)]' : 'border-[#FF6600]/10'} bg-black relative overflow-hidden`}>
                      {isVid ? (
                        <video src={`${asset.file_url}#t=${currentStart},${currentStart + 3}`} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                      ) : (
                        <img src={asset.file_url} className="w-full h-full object-cover" alt="asset" />
                      )}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 border border-[#FF6600]/30 text-[7px] font-black text-[#FF6600] uppercase">
                        Tier_{asset.tier < 10 ? `0${asset.tier}` : asset.tier}
                      </div>
                    </div>

                    {/* INTEGRATED CONTROLS */}
                    <div className="flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      
                      {isVid && (
                        <div className="space-y-2 mb-2 bg-[#FF6600]/5 p-2 border border-[#FF6600]/10 rounded">
                          <div className="flex justify-between text-[7px] font-black text-[#FF6600] uppercase">
                            <span>Scrub: {currentStart}s</span>
                            <span>${currentPrice}</span>
                          </div>
                          <input 
                            type="range" min="0" max="60" value={currentStart} 
                            onChange={(e) => handleUpdateAssetLocal(asset.id, { start_time: parseInt(e.target.value) })}
                            className="w-full h-1 bg-[#FF6600]/20 appearance-none cursor-pointer accent-[#FF6600]"
                          />
                          <div className="flex items-center bg-black border border-[#FF6600]/20 px-1 py-0.5">
                            <span className="text-[8px] text-[#FF6600] mr-1">$</span>
                            <input 
                              type="number" step="0.01" value={currentPrice} 
                              onChange={(e) => handleUpdateAssetLocal(asset.id, { price: e.target.value })}
                              className="bg-transparent text-white text-[9px] font-bold outline-none w-full"
                            />
                          </div>
                        </div>
                      )}

                      {!isVid && (
                        <button 
                          onClick={() => setMediaAsCover(selectedCollection, asset.id).then(() => getCollectionMedia(selectedCollection).then(setCollectionAssets))} 
                          className={`py-2 text-[8px] font-black uppercase transition-all ${asset.display_order === 0 ? 'bg-[#FF6600] text-black' : 'bg-white/5 text-gray-400 hover:bg-white hover:text-black'}`}
                        >
                          {asset.display_order === 0 ? 'PRIMARY_LOCKED' : 'SET_AS_COVER'}
                        </button>
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
            </>
          )}
        </div>

        {/* 3. SETTINGS FOOTER: READ-ONLY METADATA */}
        {selectedCollection && (
          <div className="bg-black border border-[#FF6600]/20 p-6 flex items-end gap-6 shadow-2xl relative">
            <div className="absolute -top-3 left-6 px-3 bg-black text-[#FF6600] text-[8px] font-black uppercase tracking-widest border border-[#FF6600]/20">// MEDIA_IDENTIFIER</div>
            <div className="flex-1">
              <label className="text-[8px] text-gray-600 block mb-2 uppercase font-black tracking-tighter">READ_ONLY_COLLECTION_ID</label>
              <input readOnly type="text" value={editName} className="w-full bg-[#0a0a0a] border border-[#FF6600]/10 p-3 text-gray-500 text-xs font-bold outline-none cursor-not-allowed uppercase" />
            </div>
            <button 
              onClick={handleGlobalSync}
              className={`bg-[#FF6600] text-black px-12 py-3 text-[10px] font-black uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(255,102,0,0.3)] ${isUploading ? 'animate-pulse' : ''}`}
            >
              [ SAVE_CHANGES ]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}