'use client';

import React, { useState, useRef, useEffect } from 'react';
import { uploadVaultMedia, getAdminVaultStats } from '../../actions/admin';


// --- SUB-COMPONENT: PRECISION VIDEO CARD ---
function VideoPrecisionCard({ fileObj, onUpdate, onRemove, isCover = false }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localStart, setLocalStart] = useState(fileObj.startTime || 0);
  const [localPrice, setLocalPrice] = useState(fileObj.price || "2.00");
  const [duration, setDuration] = useState(fileObj.duration || 0);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  useEffect(() => {
    onUpdate(fileObj.id, { startTime: localStart, price: localPrice, duration: duration });
  }, [localStart, localPrice, duration]);

  return (
    <div className={`bg-[#0a0a0a] border border-[#3B82F6]/30 p-4 rounded-xl flex flex-col items-center gap-4 ${isCover ? 'w-64' : 'col-span-2 shadow-lg animate-in fade-in zoom-in-95'}`}>
      {isCover && <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">// COVER_ASSET</span>}
      
      {/* ROUNDED THUMBNAIL */}
      <div className="w-20 h-20 rounded-full overflow-hidden bg-black border-2 border-[#3B82F6] relative shadow-[0_0_15px_rgba(59,130,246,0.3)]">
        <video 
          ref={videoRef}
          src={`${fileObj.preview}#t=${localStart},${localStart + 3}`}
          className="w-full h-full object-cover"
          autoPlay muted loop playsInline
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
      </div>

      {/* RESTORED: DURATION BADGE BELOW THUMBNAIL */}
      <div className="text-center">
        <p className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">
          [ {formatDuration(duration)} TOTAL ]
        </p>
      </div>
      
      {/* RESTORED: SELECTION LABELS NEXT TO SCRUBBER */}
      <div className="w-full">
        <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase mb-1">
          <span>START: {Math.floor(localStart)}s</span>
          <span>END: {Math.floor(localStart) + 3}s</span>
        </div>
        <input 
          type="range" min="0" max={Math.max(0, duration - 3)} value={localStart}
          onChange={(e) => setLocalStart(parseInt(e.target.value))}
          className="w-full h-1 bg-[#3B82F6]/20 appearance-none cursor-pointer accent-[#3B82F6] rounded-full" 
        />
      </div>

      {/* [STRICT_WARNING_PATCH]: The border turns RED if localPrice is empty or 0 */}
      <div className={`w-full flex items-center bg-black border ${(!localPrice || localPrice === "0.00" || localPrice === "") ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-[#3B82F6]/30'} px-2 py-1 mt-2 rounded transition-all`}>
        <span className={`${(!localPrice || localPrice === "0.00" || localPrice === "") ? 'text-red-500' : 'text-[#3B82F6]'} font-black text-[10px] mr-1`}>$</span>
        <input 
          type="number" 
          step="0.01" 
          value={localPrice} 
          placeholder="0.00"
          onChange={(e) => setLocalPrice(e.target.value)}
          className="bg-transparent text-white text-[10px] font-bold outline-none w-full" 
        />
      </div>

      <button type="button" onClick={() => onRemove(fileObj.id)} className="text-[8px] font-black text-red-500 hover:text-white uppercase mt-2 transition-colors">
        [ REMOVE ]
      </button>
    </div>
  );
}

// Protocol Interface for the Pipeline
interface VaultEntry {
  id: string;
  cover: { id: string; file: File; preview: string; type: string; startTime: number; price: string };
  slug: string;
  tier: string;
  payload: { id: string; file: File; preview: string; type: string; startTime: number; price: string }[];
}

interface MediaInjectionProps {
  setVaultStats: (stats: any[]) => void;
  setActiveTab: (tab: any) => void;
}



// INFINITY_RANDOMIZER: Generates 5 alphanumerics + 1 letter
const generateRandomPrefix = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += letters.charAt(Math.floor(Math.random() * letters.length));
  return result;
};

export default function MediaInjection({ setVaultStats, setActiveTab }: any) {
  const [uploadMode, setUploadMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [vaultStack, setVaultStack] = useState<any[]>([]); // VaultEntry[]
  
  const [activeCover, setActiveCover] = useState<any | null>(null);
  const [activeSlug, setActiveSlug] = useState('');
  const [activeTier, setActiveTier] = useState('1');
  const [activePayload, setActivePayload] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // --- INFINITY ENGINE STATE ---
  const [sessionPrefix] = useState(() => generateRandomPrefix());
  const [dbVaultCount, setDbVaultCount] = useState(0);

  // [1] INITIAL SCAN: Checks the DB once when you open the tab
  useEffect(() => {
    // Assuming getAdminVaultStats is available in this scope
    getAdminVaultStats().then((stats: any) => {
      const count = stats.length;
      setDbVaultCount(count);
      const nextNum = (count + 1).toString().padStart(2, '0');
      setActiveSlug(`##${sessionPrefix}${nextNum}`);
    });
  }, [sessionPrefix]);

  // Helper to calculate the next slug without mutating state immediately
  const getNextSlug = (currentStackLength: number) => {
    const nextNum = (dbVaultCount + currentStackLength + 1).toString().padStart(2, '0');
    return `##${sessionPrefix}${nextNum}`;
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActiveCover({ 
        id: 'cover',
        file, 
        preview: URL.createObjectURL(file),
        type: file.type.includes('video') ? 'video' : 'image', // Basic check for isVideo
        startTime: 0,
        price: "",
        duration: 0
      });
    }
  };

  const handlePayloadSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        type: file.type.includes('video') ? 'video' : 'image', 
        startTime: 0,                                         
        price: "",
        duration: 0
      }));
      setActivePayload(prev => [...prev, ...newFiles]);
    }
  };

  const removePayloadFile = (id: string) => {
    setActivePayload(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const updatePayloadFile = (id: string, updates: any) => {
    setActivePayload(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const updateCoverFile = (id: string, updates: any) => {
    setActiveCover((prev: any) => ({ ...prev, ...updates }));
  };

  const removeStackItem = (id: string) => {
    setVaultStack(prev => {
      const item = prev.find(v => v.id === id);
      if (item) {
        URL.revokeObjectURL(item.cover.preview);
        item.payload.forEach((p: any) => URL.revokeObjectURL(p.preview));
      }
      const updatedStack = prev.filter(v => v.id !== id);
      
      // Update the active slug to reflect the removed item
      setActiveSlug(getNextSlug(updatedStack.length));
      return updatedStack;
    });
  };

  const handleAddNewProtocol = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeCover || !activeSlug || activePayload.length === 0) {
      return alert("MISSING DATA: Complete The Form");
    }

    const stagedEntry = {
      id: Math.random().toString(36).substr(2, 9),
      cover: activeCover,
      slug: activeSlug.toLowerCase().trim(),
      tier: activeTier,
      payload: activePayload
    };

    const updatedStack = [...vaultStack, stagedEntry];
    setVaultStack(updatedStack);
    
    // Reset and advance the sequence
    setActiveCover(null);
    setActivePayload([]);
    setActiveSlug(getNextSlug(updatedStack.length));
  };

  const handleEditStackItem = (id: string) => {
    const item = vaultStack.find(v => v.id === id);
    if (!item) return;

    if (activeCover || activePayload.length > 0) {
      handleAddNewProtocol(new MouseEvent('click') as any); 
    }

    setActiveCover(item.cover);
    setActiveSlug(item.slug); // Pulls the original slug back
    setActiveTier(item.tier);
    setActivePayload(item.payload);

    setVaultStack(prev => prev.filter(v => v.id !== id));
  };

  const executeSynchronization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalStack = [...vaultStack];
    if (activeCover && activeSlug && activePayload.length > 0) {
      finalStack.push({
        id: 'final',
        cover: activeCover,
        slug: activeSlug.toLowerCase().trim(),
        tier: activeTier,
        payload: activePayload
      });
    }

    if (finalStack.length === 0) return alert("PIPELINE_EMPTY");
    setIsUploading(true);

    for (const entry of finalStack) {
      const formData = new FormData();
      formData.append('vaultId', entry.slug);
      formData.append('tier', entry.tier);
      

      formData.append('files', entry.cover.file);
      formData.append('slugs', entry.slug);
      formData.append('prices', entry.cover.price);
      formData.append('startTimes', entry.cover.startTime?.toString() || "0");
      formData.append('durations', entry.cover.duration?.toString() || "0"); // [GOD_MODE_PATCH 4]
      formData.append('tiers', entry.cover.type === 'video' ? "99" : "0");
      
      entry.payload.forEach((pf: any) => {
        formData.append('files', pf.file);
        formData.append('slugs', entry.slug);
        formData.append('prices', pf.price);
        formData.append('startTimes', pf.startTime?.toString() || "0");
        formData.append('durations', pf.duration?.toString() || "0"); // [GOD_MODE_PATCH 5]
        formData.append('tiers', pf.type === 'video' ? "99" : entry.tier); 
      });

      const result = await uploadVaultMedia(formData); 
      if (!result.success) {
        alert(`[ ERROR IN PIPELINE - ${entry.slug} ] ${result.error || 'Upload failed'}`);
        setIsUploading(false);
        return; 
      }
    }
    
    alert(`All Completed.`);
    
    // Clean up and reset for the next batch
    setVaultStack([]);
    setActiveCover(null);
    setActivePayload([]);
    
    // Re-fetch stats to get the new true baseline, then reset slug
    const stats = await getAdminVaultStats();
    setVaultStats(stats);
    setDbVaultCount(stats.length);
    setActiveSlug(`##${sessionPrefix}${(stats.length + 1).toString().padStart(2, '0')}`);
    
    setActiveTab('MEDIA_TOTAL');
    setIsUploading(false);
  };

  const totalWeight = activePayload.reduce((acc, curr) => acc + curr.file.size, 0) / (1024 * 1024);

  return (
    <div className="max-w-4xl animate-in fade-in duration-500 pb-32">
      <header className="mb-10 border-b border-[#3B82F6]/20 pb-6">
        <h2 className="text-[24px] font-black uppercase tracking-widest text-white">Media Factory</h2>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Upload Media</p>
      </header>

      <form onSubmit={executeSynchronization} className="space-y-10">
        
        {/* MODE SELECTOR */}
        <div className="flex gap-4 mb-10">
          <button 
            type="button"
            onClick={() => { 
              setUploadMode('SINGLE');
              setActiveCover(null);
              setActivePayload([]);
              setActiveTier('1');
              setActiveSlug(getNextSlug(vaultStack.length)); // Smart Reset
            }} 
            className={`flex-1 py-4 text-[10px] font-black uppercase transition-all ${uploadMode === 'SINGLE' ? 'bg-[#3B82F6] text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border border-[#3B82F6]/30 text-gray-500'}`}
          >
            SINGLE UPLOAD MODE 
          </button>

          <button 
            type="button"
            onClick={() => { 
              setUploadMode('MULTI');
              setActiveCover(null);
              setActivePayload([]);
              setActiveTier('1');
              setActiveSlug(getNextSlug(vaultStack.length)); // Smart Reset
            }} 
            className={`flex-1 py-4 text-[10px] font-black uppercase transition-all ${uploadMode === 'MULTI' ? 'bg-[#3B82F6] text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border border-[#3B82F6]/30 text-gray-500'}`}
          >
            MULTIPLE UPLOAD MODE 
          </button>
        </div>

        {/* THE PIPELINE STACK */}
        {uploadMode === 'MULTI' && vaultStack.length > 0 && (
          <div className="space-y-3 mb-10">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">// STACKED_PIPELINE</p>
            {vaultStack.map((v) => (
              <div 
                key={v.id} 
                onClick={() => handleEditStackItem(v.id)}
                className="bg-black border border-[#3B82F6]/40 p-4 flex items-center justify-between group cursor-pointer hover:bg-[#3B82F6]/5 transition-all"
              >
                <div className="flex items-center gap-6">
                  {v.cover.type === 'video' ? (
                    <video src={v.cover.preview} className="w-12 h-12 object-cover border border-[#3B82F6]/20" muted />
                  ) : (
                    <img src={v.cover.preview} className="w-12 h-12 object-cover border border-[#3B82F6]/20" alt="cover" />
                  )}
                  <div>
                    <p className="text-[12px] font-black text-white uppercase">{v.slug}</p>
                    <p className="text-[9px] font-bold text-[#3B82F6] uppercase mt-1">TIER_0{v.tier} | {v.payload.length} ASSETS</p>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeStackItem(v.id); }} 
                  className="text-red-500 text-[10px] font-black hover:bg-red-500 hover:text-black px-4 py-2 transition-all border border-transparent hover:border-red-500"
                >
                  [ DELETE ]
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border border-[#3B82F6]/20 bg-black/40 p-10 space-y-8 relative">
          {uploadMode === 'MULTI' && (
            <div className="absolute top-4 right-6 text-[9px] font-black text-[#3B82F6] uppercase tracking-widest animate-pulse">ACTIVE FORM</div>
          )}
          
          {/* PRIMARY_COVER_ASSET */}
          <div className="bg-black border border-[#3B82F6]/20 p-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-white mb-4 block flex justify-between">
              <span>Primary Cover Photo</span>
              <span className="text-gray-500 text-[8px]">*REQUIRED FOR HOMEPAGE</span>
            </label>
            
            {activeCover ? (
              <div className="relative group flex justify-center">
                {activeCover.type === 'video' ? (
                  // Assuming VideoPrecisionCard is imported and working
                  <VideoPrecisionCard 
                    fileObj={activeCover} 
                    onUpdate={updateCoverFile} 
                    onRemove={() => setActiveCover(null)} 
                    isCover={true} 
                  />
                ) : (
                  <div className="relative w-48 h-48 border border-[#3B82F6]">
                    <img src={activeCover.preview} alt="Cover Preview" className="w-full h-full object-cover opacity-80" />
                    <button 
                      type="button" 
                      onClick={() => setActiveCover(null)} 
                      className="absolute top-2 right-2 w-6 h-6 bg-black border border-[#3B82F6] text-[#3B82F6] flex items-center justify-center text-[10px] font-black hover:bg-[#3B82F6] hover:text-black transition-colors"
                    >X</button>
                    <div className="absolute bottom-0 left-0 w-full bg-[#3B82F6] text-black text-[8px] font-black text-center py-1 uppercase tracking-widest">COVER_LOCKED</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-48 h-48 border-2 border-dashed border-[#3B82F6]/40 flex flex-col items-center justify-center hover:border-[#3B82F6] transition-colors cursor-pointer bg-[#3B82F6]/5">
                <input type="file" onChange={handleCoverSelect} accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-[20px] mb-2 text-[#3B82F6]">+</span>
                <span className="text-[9px] font-bold text-[#3B82F6] tracking-widest">STAGE_COVER</span>
              </div>
            )}
          </div>

          {/* MEDIA_METADATA */}
          <div className="grid grid-cols-2 gap-6 bg-black border border-[#3B82F6]/20 p-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white mb-3 block">GENERATED ORDER ID</label>
              <input 
                type="text" 
                readOnly
                value={activeSlug}
                className="w-full bg-[#0a0a0a] border border-[#3B82F6]/30 px-4 py-3 text-white text-xs font-bold outline-none cursor-not-allowed uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white mb-3 block">IMAGE_ACCESS_TIER</label>
              <select 
                value={activeTier}
                onChange={(e) => setActiveTier(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#3B82F6]/30 px-4 py-3 text-white text-xs font-bold outline-none focus:border-[#3B82F6] appearance-none"
              >
                <option value="1">TIER_01 ($2.00)</option>
                <option value="2">TIER_02 ($4.00)</option>
                <option value="3">TIER_03 ($4.00)</option>
              </select>
            </div>
          </div>

          {/* THE SPLIT ZONES */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white mb-3 block">ZONE A: IMAGES (STANDARD TIERS)</label>
              <div className="relative border-2 border-dashed border-gray-600 hover:border-[#3B82F6] bg-white/5 transition-all text-center p-16 rounded-2xl">
                <input type="file" multiple onChange={handlePayloadSelect} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="pointer-events-none">
                  <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">DRAG IMAGES HERE</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest">USES SELECTED TIER</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3B82F6] mb-3 block">ZONE B: VIDEOS (SNEAK PEEKS)</label>
              <div className="relative border-2 border-dashed border-[#3B82F6]/50 hover:border-[#3B82F6] bg-[#3B82F6]/10 transition-all text-center p-16 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <input type="file" multiple onChange={handlePayloadSelect} accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="pointer-events-none">
                  <p className="text-[12px] font-black text-[#3B82F6] uppercase tracking-[0.2em] mb-2">DRAG VIDEOS HERE</p>
                  <p className="text-[9px] text-[#3B82F6]/70 uppercase tracking-widest">AUTO-SET TO TIER 99 PPV</p>
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW_BUFFER */}
          {activePayload.length > 0 && (
            <div className="border border-[#3B82F6]/20 bg-black p-6">
              <div className="flex justify-between items-center mb-6 border-b border-[#3B82F6]/20 pb-4">
                <span className="text-[10px] font-black text-white tracking-widest uppercase">PREVIEW BUFFER</span>
                <span className="text-[9px] font-bold text-[#3B82F6] tracking-widest uppercase">
                  STAGED: {activePayload.length} ASSETS | WEIGHT: {totalWeight.toFixed(2)} MB
                </span>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                {activePayload.map((fileObj) => (
                  <React.Fragment key={fileObj.id}>
                    {fileObj.type === 'video' ? (
                      // Assuming VideoPrecisionCard is imported and working
                      <VideoPrecisionCard 
                        fileObj={fileObj} 
                        onUpdate={updatePayloadFile} 
                        onRemove={removePayloadFile} 
                      />
                    ) : (
                      <div className="relative group flex flex-col gap-2">
                        <div className="relative aspect-square border border-[#3B82F6]/30 bg-[#0a0a0a]">
                          <img src={fileObj.preview} alt="staged" className="w-full h-full object-cover opacity-60" />
                          <button 
                            type="button" 
                            onClick={() => removePayloadFile(fileObj.id)} 
                            className="absolute top-1 right-1 w-5 h-5 bg-black/80 border border-[#3B82F6] text-[#3B82F6] flex items-center justify-center text-[8px] font-black hover:bg-[#3B82F6] hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                          >X</button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EXECUTION CONTROLS */}
        <div className="flex gap-4">
          {uploadMode === 'MULTI' && (
            <button 
              type="button"
              onClick={handleAddNewProtocol}
              className="flex-1 bg-transparent border border-[#3B82F6] text-[#3B82F6] py-6 font-black uppercase text-[12px] tracking-[0.2em] hover:bg-[#3B82F6]/10 transition-all"
            >
              ADD NEW 
            </button>
          )}
          <button 
            type="submit" 
            disabled={isUploading || (!activeCover && vaultStack.length === 0)}
            className={`flex-[2] bg-[#3B82F6] text-black py-6 font-black uppercase text-[12px] tracking-[0.3em] hover:bg-white transition-all disabled:opacity-20 disabled:hover:bg-[#3B82F6] ${isUploading ? 'animate-pulse' : ''}`}
          >
            {isUploading ? '[Uploading]' : 'Upload'}
          </button>
        </div>

      </form>
    </div>
  );
}