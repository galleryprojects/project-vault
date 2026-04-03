'use client';

import React, { useEffect, useState } from 'react';
import { 
  getCollectionMedia, 
  updateCollectionMetadata, 
  setMediaAsCover, 
  deleteMediaAsset, 
  addMediaToCollection,
  getAdminVaultStats,
  swapMediaFile // Ensure this is in your admin.ts actions
} from '../../actions/admin';

interface ArchiveManagerProps {
  vaultStats: any[];
  setVaultStats: (stats: any[]) => void;
}

export default function ArchiveManager({ vaultStats, setVaultStats }: ArchiveManagerProps) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionAssets, setCollectionAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editName, setEditName] = useState('');
  const [editTier, setEditTier] = useState('1');
  const [isUploading, setIsUploading] = useState(false);
  
  // New state for the "Add Assets" tier
  const [addTier, setAddTier] = useState('1');

  useEffect(() => {
    if (selectedCollection && vaultStats.length > 0) {
      getCollectionMedia(selectedCollection).then(setCollectionAssets);
      setEditName(selectedCollection);
      const stats = vaultStats.find((v: any) => v.id === selectedCollection);
      if (stats) setEditTier(String(stats.tier || '1'));
    }
  }, [selectedCollection, vaultStats]);

  const handleUpdateCollection = async () => {
    if (!selectedCollection) return;
    const res = await updateCollectionMetadata(selectedCollection, editName, parseInt(editTier));
    if (res.success) {
      alert("COLLECTION_UPDATED");
      const updatedStats = await getAdminVaultStats();
      setVaultStats(updatedStats);
      setSelectedCollection(editName);
    }
  };

  const handleAddToCollection = async (files: FileList | null) => {
    if (!files || !selectedCollection) return;
    setIsUploading(true);
    // Uses the 'addTier' selected in the add box
    const res = await addMediaToCollection(selectedCollection, parseInt(addTier), Array.from(files));
    if (res.success) {
      setCollectionAssets(await getCollectionMedia(selectedCollection));
      setVaultStats(await getAdminVaultStats());
    }
    setIsUploading(false);
  };

  const handleSwapImage = async (mediaId: string, oldUrl: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploading(true);
    const res = await swapMediaFile(mediaId, oldUrl, e.target.files[0]);
    if (res.success) {
      setCollectionAssets(prev => prev.map(a => a.id === mediaId ? { ...a, file_url: res.newUrl } : a));
    }
    setIsUploading(false);
  };

  const handleSetCover = async (id: string) => {
    if (!selectedCollection) return;
    const res = await setMediaAsCover(selectedCollection, id);
    if (res.success) {
      setCollectionAssets(await getCollectionMedia(selectedCollection));
    }
  };

  const handleDeleteAsset = async (id: string, url: string) => {
    if (!window.confirm("CONFIRM_DELETE?")) return;
    const res = await deleteMediaAsset(id, url);
    if (res.success) {
      setCollectionAssets(prev => prev.filter(a => a.id !== id));
      setVaultStats(await getAdminVaultStats());
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-8 animate-in fade-in duration-500">
      
      {/* LEFT RAIL */}
      <div className="w-1/4 flex flex-col gap-4">
        <input 
          type="text" placeholder="SEARCH_COLLECTIONS..." 
          className="bg-black border border-[#FF6600]/20 p-3 text-[10px] text-white outline-none focus:border-[#FF6600]"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex-1 overflow-y-auto border border-[#FF6600]/10 space-y-1 scrollbar-hide">
          {vaultStats.filter((v: any) => v.id.includes(searchQuery.toLowerCase())).map((v: any) => (
            <button 
              key={v.id} onClick={() => setSelectedCollection(v.id)}
              className={`w-full text-left p-4 text-[11px] font-black uppercase transition-all ${selectedCollection === v.id ? 'bg-[#FF6600] text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              {v.id} <span className="float-right opacity-50">[{v.total}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GALLERY */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-6 p-1 scrollbar-hide">
          {!selectedCollection ? (
            <div className="col-span-4 flex items-center justify-center text-gray-700 uppercase font-black text-[10px]">
              SELECT A COLLECTION FROM THE LEFT TO BEGIN
            </div>
          ) : (
            <>
              {/* THE [+ ADD] BOX WITH TIER SELECTOR */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-square border-2 border-dashed border-[#FF6600]/20 bg-black flex flex-col items-center justify-center transition-all hover:border-[#FF6600]/50">
                  <input 
                    type="file" multiple 
                    onChange={(e) => handleAddToCollection(e.target.files)} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    disabled={isUploading}
                  />
                  <span className="text-[12px] font-black text-[#FF6600] mb-1">+</span>
                  <span className="text-[8px] font-black text-[#FF6600]/40 uppercase">
                    {isUploading ? 'UPLOADING...' : 'ADD_ASSETS'}
                  </span>
                  
                  <div className="absolute bottom-2 left-2 right-2 z-20">
                    <select 
                      value={addTier} 
                      onChange={(e) => setAddTier(e.target.value)}
                      className="w-full bg-black border border-[#FF6600]/20 text-[8px] font-black text-[#FF6600] p-1 outline-none uppercase"
                    >
                      <option value="1">TO_TIER_01</option>
                      <option value="2">TO_TIER_02</option>
                      <option value="3">TO_TIER_03</option>
                    </select>
                  </div>
                </div>
                <div className="h-20" /> 
              </div>

              {collectionAssets.map((asset) => (
                <div key={asset.id} className="flex flex-col gap-3 animate-in fade-in duration-500">
                  <div className={`aspect-square border ${asset.display_order === 0 ? 'border-[#FF6600] shadow-[0_0_15px_rgba(255,102,0,0.2)]' : 'border-[#FF6600]/10'} bg-black relative`}>
                    <img src={asset.file_url} className="w-full h-full object-cover" alt="asset" />
                    {isUploading && <div className="absolute inset-0 bg-black/60 animate-pulse" />}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={() => handleSetCover(asset.id)} 
                      className={`py-2 text-[8px] font-black uppercase transition-all ${asset.display_order === 0 ? 'bg-[#FF6600] text-black cursor-default' : 'bg-white text-black hover:bg-[#FF6600]'}`}
                    >
                      {asset.display_order === 0 ? 'ACTIVE_COVER' : 'SET_AS_COVER'}
                    </button>
                    
                    <div className="relative">
                      <button className="w-full py-2 border border-[#FF6600] text-[#FF6600] text-[8px] font-black uppercase hover:bg-[#FF6600] hover:text-black transition-all">
                        SWAP_PICTURE
                      </button>
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleSwapImage(asset.id, asset.file_url, e)}
                      />
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteAsset(asset.id, asset.file_url)} 
                      className="py-2 border border-red-500 text-red-500 text-[8px] font-black uppercase hover:bg-red-500 hover:text-black transition-all"
                    >
                      DELETE_ASSET
                    </button>
                  </div>

                  <div className="flex justify-between items-center px-1 border-t border-[#FF6600]/10 pt-2">
                    <span className="text-[9px] font-black text-gray-500 uppercase">TIER_0{asset.tier}</span>
                    {asset.display_order === 0 && <span className="text-[8px] font-black text-[#FF6600] uppercase tracking-tighter">PRIMARY</span>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* SETTINGS FOOTER */}
        {selectedCollection && (
          <div className="bg-black border border-[#FF6600]/20 p-6 flex items-end gap-6 shadow-2xl">
            <div className="flex-1">
              <label className="text-[9px] text-gray-500 block mb-2 uppercase font-black">COLLECTION_NAME</label>
              <input id="edit-name-input" type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-black border border-[#FF6600]/30 p-3 text-white text-xs outline-none focus:border-[#FF6600]" />
            </div>
            <div className="w-32">
              <label className="text-[9px] text-gray-500 block mb-2 uppercase font-black">TIER</label>
              <select value={editTier} onChange={e => setEditTier(e.target.value)} className="w-full bg-black border border-[#FF6600]/30 p-3 text-white text-xs outline-none">
                <option value="1">TIER_01</option>
                <option value="2">TIER_02</option>
                <option value="3">TIER_03</option>
              </select>
            </div>
            <button onClick={handleUpdateCollection} className="bg-[#FF6600] text-black px-8 py-3 text-[10px] font-black uppercase hover:bg-white transition-all">UPDATE_ARCHIVE</button>
          </div>
        )}
      </div>
    </div>
  );
}