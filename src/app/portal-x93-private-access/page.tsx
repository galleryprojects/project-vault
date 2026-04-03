'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdminBypass, checkAdminBypass, logoutAdminBypass } from '../actions/admin-bypass';
import { 
  getAdminVaultStats, 
  uploadVaultMedia, 
  getPendingDeposits, 
  approveDeposit, 
  rejectDeposit,
  getCollectionMedia,
  updateCollectionMetadata,
  setMediaAsCover,
  deleteMediaAsset,
  addMediaToCollection
} from '../actions/admin';

// Protocol Interface for the Pipeline
interface VaultEntry {
  id: string;
  cover: { file: File; preview: string };
  slug: string;
  tier: string;
  payload: { id: string; file: File; preview: string }[];
}

export default function InvisibleAdmin() {
  const router = useRouter();
  
  // AUTH STATES
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [error, setError] = useState('');

  // DEPOSIT STATES
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState<string | null>(null);

  // NEW STATES
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionAssets, setCollectionAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editName, setEditName] = useState('');
  const [editTier, setEditTier] = useState('1');

    // DASHBOARD STATES
  const [activeTab, setActiveTab] = useState<'MEDIA_METRICS' | 'MEDIA_INJECTION' | 'DEPOSIT_VERIFY'>('MEDIA_METRICS');
  const [vaultStats, setVaultStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch assets when a collection is selected
  useEffect(() => {
    if (selectedCollection) {
      getCollectionMedia(selectedCollection).then(setCollectionAssets);
      setEditName(selectedCollection);
      // Find tier from first asset
      const firstAsset = vaultStats.find(v => v.id === selectedCollection);
      if (firstAsset) setEditTier(String(firstAsset.tier || '1'));
    }
  }, [selectedCollection, vaultStats]);

  const handleUpdateCollection = async () => {
  if (!selectedCollection) return;
  const res = await updateCollectionMetadata(selectedCollection, editName, parseInt(editTier));
  if (res.success) {
    alert("COLLECTION_UPDATED");
    setVaultStats(await getAdminVaultStats());
    setSelectedCollection(editName);
  }
};
  const handleAddToCollection = async (files: FileList | null) => {
    if (!files || !selectedCollection) return;
    setIsUploading(true);
    const res = await addMediaToCollection(selectedCollection, parseInt(editTier), Array.from(files));
    if (res.success) {
      setCollectionAssets(await getCollectionMedia(selectedCollection));
    }
    setIsUploading(false);
};

  const handleSetCover = async (id: string) => {
  if (!selectedCollection) return;
  const res = await setMediaAsCover(selectedCollection, id);
  if (res.success) setCollectionAssets(await getCollectionMedia(selectedCollection));
};

  const handleDeleteAsset = async (id: string, url: string) => {
    if (!window.confirm("CONFIRM_DELETE?")) return;
    const res = await deleteMediaAsset(id, url);
    if (res.success) setCollectionAssets(prev => prev.filter(a => a.id !== id));
  };



  // PIPELINE STATES
  const [uploadMode, setUploadMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [vaultStack, setVaultStack] = useState<VaultEntry[]>([]);
  
  // ACTIVE FORM STATES
  const [activeCover, setActiveCover] = useState<{ file: File; preview: string } | null>(null);
  const [activeSlug, setActiveSlug] = useState('');
  const [activeTier, setActiveTier] = useState('1');
  const [activePayload, setActivePayload] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Initial Verification
  useEffect(() => {
    async function verify() {
      const ok = await checkAdminBypass();
      setIsAuthorized(ok);
      if (ok) {
        const stats = await getAdminVaultStats();
        setVaultStats(stats);
        setLoadingStats(false);
      }
    }
    verify();
  }, []);

  // 2. Load Deposits when tab switches
  useEffect(() => {
    if (activeTab === 'DEPOSIT_VERIFY') {
      loadDeposits();
    }
  }, [activeTab]);

  const loadDeposits = async () => {
    const data = await getPendingDeposits();
    setPendingDeposits(data);
  };

  // 3. Handlers for Money Injection
  const handleApprove = async (dep: any) => {
    const confirm = window.confirm(`// AUTHORIZE_CREDIT_SYNC\nUSER: ${dep.profiles?.username || 'UNKNOWN'}\nAMOUNT: +$${dep.amount}\n\nPROCEED?`);
    if (!confirm) return;

    setIsProcessingDeposit(dep.id);
    const res = await approveDeposit(dep.id, dep.user_id, dep.amount);
    if (res.success) {
      alert(`[ SYSTEM ] CREDITS_INJECTED: New Balance: $${res.newBalance}`);
      loadDeposits();
    } else {
      alert(`[ ERROR ] ${res.error}`);
    }
    setIsProcessingDeposit(null);
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("DENY_CLAIM: Are you sure?")) return;
    const res = await rejectDeposit(id);
    if (res.success) loadDeposits();
  };

  // 4. General Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('username', loginUser);
    fd.append('password', loginPass);

    const res = await loginAdminBypass(fd);
    if (res.success) {
      window.location.reload(); 
    } else {
      setError(res.error || 'Access Denied');
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActiveCover({ file, preview: URL.createObjectURL(file) });
    }
  };

  const handlePayloadSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
      }));
      setActivePayload(prev => [...prev, ...newFiles]);
    }
  };

  const removePayloadFile = (id: string) => {
    setActivePayload(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview); // Clean memory here
      return prev.filter(f => f.id !== id);
    });
  };

  const removeStackItem = (id: string) => {
    setVaultStack(prev => {
      const item = prev.find(v => v.id === id);
      if (item) {
        URL.revokeObjectURL(item.cover.preview); // Clean memory here
        item.payload.forEach(p => URL.revokeObjectURL(p.preview));
      }
      return prev.filter(v => v.id !== id);
    });
  };

  // --- PIPELINE LOGIC ---
  const handleAddNewProtocol = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeCover || !activeSlug || activePayload.length === 0) {
      return alert("MISSING_DATA: // ACTIVE_SECTION_INCOMPLETE");
    }

    const newEntry: VaultEntry = {
      id: Math.random().toString(36).substr(2, 9),
      cover: activeCover,
      slug: activeSlug.toLowerCase().trim(),
      tier: activeTier,
      payload: activePayload
    };

    setVaultStack(prev => [...prev, newEntry]);
    
    // RESET ACTIVE FORM FOR NEXT UPLOAD
    setActiveCover(null);
    setActiveSlug('');
    setActivePayload([]);
  };

  // --- EXPAND_PROTOCOL_LOGIC ---
  const handleEditStackItem = (id: string) => {
    const item = vaultStack.find(v => v.id === id);
    if (!item) return;

    if (activeCover || activeSlug || activePayload.length > 0) {
      handleAddNewProtocol(new MouseEvent('click') as any); 
    }

    setActiveCover(item.cover);
    setActiveSlug(item.slug);
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

    if (finalStack.length === 0) return alert("MISSING_DATA: // PIPELINE_EMPTY");

    setIsUploading(true);

    for (const entry of finalStack) {
      const formData = new FormData();
      formData.append('vaultId', entry.slug);
      formData.append('tier', entry.tier);
      
      formData.append('files', entry.cover.file);
      formData.append('slugs', entry.slug);
      
      entry.payload.forEach(pf => {
        formData.append('files', pf.file);
        formData.append('slugs', entry.slug);
      });

      const result = await uploadVaultMedia(formData);
      
      if (!result.success) {
        alert(`[ ERROR IN PIPELINE - ${entry.slug} ] ${result.error || 'Upload failed'}`);
        setIsUploading(false);
        return; 
      }
    }
    
    alert(`[ SYSTEM ] SEQUENCE_COMPLETE: All protocols synchronized.`);
    setVaultStack([]);
    setActiveCover(null);
    setActivePayload([]);
    setActiveSlug('');
    
    const stats = await getAdminVaultStats();
    setVaultStats(stats);
    setActiveTab('MEDIA_METRICS');
    setIsUploading(false);
  };

  // Calculate payload size for active view
  const totalWeight = activePayload.reduce((acc, curr) => acc + curr.file.size, 0) / (1024 * 1024);

  if (isAuthorized === null) return <div className="min-h-screen bg-[#0a0a0a]"></div>;

  // --- RENDER: LOGIN VIEW ---
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 font-mono">
        <div className="w-full max-w-sm border border-[#FF6600]/20 bg-black p-8 shadow-[0_0_40px_rgba(255,102,0,0.05)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6600]"></div>
          <div className="text-center mb-10">
            <h1 className="text-[#FF6600] font-black text-2xl tracking-[0.3em] uppercase">GHOST_TERMINAL</h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">// ENCRYPTED HANDSHAKE REQ</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="text" 
              placeholder="IDENTITY_SIGNATURE" 
              className="w-full bg-[#0a0a0a] border border-[#FF6600]/30 px-4 py-3 text-[#FF6600] text-xs focus:border-[#FF6600] focus:bg-[#FF6600]/5 outline-none transition-all placeholder:text-[#FF6600]/30 tracking-widest uppercase"
              onChange={e => setLoginUser(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="ACCESS_PASSPHRASE" 
              className="w-full bg-[#0a0a0a] border border-[#FF6600]/30 px-4 py-3 text-[#FF6600] text-xs focus:border-[#FF6600] focus:bg-[#FF6600]/5 outline-none transition-all placeholder:text-[#FF6600]/30 tracking-widest uppercase"
              onChange={e => setLoginPass(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center tracking-widest animate-pulse">ERR: {error}</p>}
            <button className="w-full bg-[#FF6600] text-black py-4 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white hover:text-black transition-all">
              [ EXECUTE_LOGIN ]
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: AUTHORIZED DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#FF6600] flex font-mono selection:bg-[#FF6600] selection:text-black">
      
      {/* CONTROL_PANEL SIDEBAR */}
      <aside className="w-[280px] bg-black border-r border-[#FF6600]/20 fixed h-full flex flex-col z-50">
        <div className="p-8 border-b border-[#FF6600]/20 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6600]"></div>
          <h1 className="text-[14px] font-black tracking-[0.2em] uppercase text-white">Master Control</h1>
          <p className="text-[#FF6600] text-[9px] font-bold uppercase tracking-widest mt-2 animate-pulse">// ZERO_TRACE_ACTIVE</p>
        </div>
        
        <nav className="flex-1 p-6 flex flex-col gap-3 mt-2 text-[10px] font-bold uppercase tracking-[0.15em]">
          <button 
            onClick={() => setActiveTab('MEDIA_METRICS')}
            className={`text-left px-4 py-3 border border-transparent transition-all ${activeTab === 'MEDIA_METRICS' ? 'border-[#FF6600]/50 bg-[#FF6600]/10 text-[#FF6600]' : 'text-gray-500 hover:text-[#FF6600] hover:border-[#FF6600]/20'}`}
          >
            [ MEDIA_METRICS ]
          </button>
          <button 
            onClick={() => setActiveTab('MEDIA_INJECTION')}
            className={`text-left px-4 py-3 border border-transparent transition-all ${activeTab === 'MEDIA_INJECTION' ? 'border-[#FF6600]/50 bg-[#FF6600]/10 text-[#FF6600]' : 'text-gray-500 hover:text-[#FF6600] hover:border-[#FF6600]/20'}`}
          >
            [ MEDIA_INJECTION ]
          </button>

          <button 
            onClick={() => setActiveTab('MEDIA_MANAGER' as any)} 
            className={`text-left px-4 py-3 border ${activeTab === ('MEDIA_MANAGER' as any) ? 'border-[#FF6600] bg-[#FF6600]/10' : 'border-transparent text-gray-500'}`}
          >
            [ MEDIA_MANAGER ]
          </button>
          <button 
            onClick={() => setActiveTab('DEPOSIT_VERIFY')}
            className={`text-left px-4 py-3 border border-transparent transition-all ${activeTab === 'DEPOSIT_VERIFY' ? 'border-[#FF6600]/50 bg-[#FF6600]/10 text-[#FF6600]' : 'text-gray-500 hover:text-[#FF6600] hover:border-[#FF6600]/20'}`}
          >


            [ DEPOSIT_VERIFY ]
          </button>
          <button className="text-left px-4 py-3 text-gray-700 opacity-50 cursor-not-allowed">[ GHOST_REGISTRY ]</button>
          <button className="text-left px-4 py-3 text-gray-700 opacity-50 cursor-not-allowed">[ REVENUE_STREAM ]</button>
        </nav>

        <div className="p-6 border-t border-[#FF6600]/20">
          <button 
            onClick={async () => { await logoutAdminBypass(); router.push('/'); }} 
            className="w-full text-center px-4 py-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black text-[10px] font-black uppercase tracking-widest transition-all"
          >
            [ KILL_SESSION ]
          </button>
        </div>
      </aside>

      {/* COMMAND VIEW */}
      <main className="ml-[280px] flex-1 p-12 bg-[#0a0a0a]">
        
        {/* --- TAB: METRICS --- */}
        {activeTab === 'MEDIA_METRICS' && (
          <div className="max-w-6xl animate-in fade-in duration-500">
            <header className="mb-10 border-b border-[#FF6600]/20 pb-6 flex justify-between items-end">
              <div>
                <h2 className="text-[24px] font-black uppercase tracking-widest text-white">Archive Stats</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">// LIVE_STORAGE_METRICS</p>
              </div>
              <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-[0.2em] animate-pulse">STATUS: ONLINE</span>
            </header>

            <div className="border border-[#FF6600]/20 bg-black/50 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#FF6600]/20 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 bg-black">
                    <th className="p-5">MEDIA_SLUG</th>
                    <th className="p-5 text-center">TIER_01</th>
                    <th className="p-5 text-center">TIER_02</th>
                    <th className="p-5 text-center">TIER_03</th>
                    <th className="p-5 text-right">ASSET_TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {vaultStats.map((vault) => (
                    <tr key={vault.id} className="border-b border-[#FF6600]/10 hover:bg-[#FF6600]/5 transition-colors">
                      <td className="p-5">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white">{vault.id}</span>
                      </td>
                      <td className="p-5 text-center text-gray-400 text-[11px]">{vault.tier1}</td>
                      <td className="p-5 text-center text-gray-400 text-[11px]">{vault.tier2}</td>
                      <td className="p-5 text-center text-gray-400 text-[11px]">{vault.tier3}</td>
                      <td className="p-5 text-right font-black text-[#FF6600] text-[12px]">{vault.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB: DEPOSIT VERIFY --- */}
        {activeTab === 'DEPOSIT_VERIFY' && (
          <div className="max-w-6xl animate-in fade-in duration-500">
            <header className="mb-10 border-b border-[#FF6600]/20 pb-6 flex justify-between items-end">
              <div>
                <h2 className="text-[24px] font-black uppercase tracking-widest text-white">Inbound Credit Monitor</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">// PENDING_GIFT_CARD_CLAIMS</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[#FF6600] uppercase tracking-[0.2em]">QUEUE_COUNT: {pendingDeposits.length}</p>
              </div>
            </header>

            <div className="border border-[#FF6600]/20 bg-black/50 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#FF6600]/20 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 bg-black">
                    <th className="p-5">TIMESTAMP</th>
                    <th className="p-5">GHOST_ID</th>
                    <th className="p-5">PLATFORM</th>
                    <th className="p-5">CODE_REFERENCE</th>
                    <th className="p-5 text-center">AMOUNT</th>
                    <th className="p-5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeposits.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-gray-700 text-[10px] tracking-widest uppercase">// NO_PENDING_CLAIMS_IN_MAIN_FRAME</td></tr>
                  ) : (
                    pendingDeposits.map((dep) => (
                      <tr key={dep.id} className="border-b border-[#FF6600]/10 hover:bg-[#FF6600]/5 transition-colors">
                        <td className="p-5 text-gray-400 text-[10px]">{new Date(dep.created_at).toLocaleString()}</td>
                        <td className="p-5 font-bold uppercase">
                          {/* Priority 1: Custom Display ID | Priority 2: Username | Fallback: Raw ID */}
                          {dep.profiles?.user_id_display || dep.profiles?.username || (
                            <span className="text-red-500 opacity-50">
                              {dep.user_id.slice(0, 8)}... (NO_PROFILE)
                            </span>
                          )}
                         </td>

                        <td className="p-5 text-white font-bold uppercase text-[11px]">{dep.profiles?.username || 'UNKNOWN'}</td>

                        <td className="p-5"><span className="bg-[#FF6600]/10 border border-[#FF6600]/20 px-2 py-1 text-[9px] text-[#FF6600]">{dep.platform}</span></td>
                        <td className="p-5 text-[#FF6600] font-mono text-[11px] tracking-tighter">{dep.code}</td>
                        <td className="p-5 text-center text-white font-black text-[12px]">${dep.amount}</td>
                        <td className="p-5 text-right space-x-3">
                          <button 
                            disabled={isProcessingDeposit === dep.id}
                            onClick={() => handleApprove(dep)}
                            className="bg-[#FF6600] text-black px-4 py-2 text-[9px] font-black uppercase hover:bg-white transition-all disabled:opacity-50"
                          >
                            [ APPROVE ]
                          </button>
                          <button 
                            onClick={() => handleReject(dep.id)}
                            className="border border-red-500 text-red-500 px-4 py-2 text-[9px] font-black uppercase hover:bg-red-500 hover:text-black transition-all"
                          >
                            [ DENY ]
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


{activeTab === ('MEDIA_MANAGER' as any) && (
  <div className="flex h-[calc(100vh-100px)] gap-8 animate-in fade-in duration-500">
    
    {/* LEFT SIDEBAR: COLLECTION_LIST */}
    <div className="w-1/4 flex flex-col gap-4">
      <input 
        type="text" 
        placeholder="SEARCH_COLLECTIONS..." 
        className="bg-black border border-[#FF6600]/20 p-3 text-[10px] text-white outline-none focus:border-[#FF6600]"
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="flex-1 overflow-y-auto border border-[#FF6600]/10 space-y-1">
        {vaultStats.filter(v => v.id.includes(searchQuery.toLowerCase())).map(v => (
          <button 
            key={v.id}
            onClick={() => setSelectedCollection(v.id)}
            className={`w-full text-left p-4 text-[11px] font-black uppercase transition-all ${selectedCollection === v.id ? 'bg-[#FF6600] text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            {v.id} <span className="float-right opacity-50">[{v.total}]</span>
          </button>
        ))}
      </div>
    </div>

    {/* Updated Gallery Grid */}
<div className="flex-1 overflow-y-auto grid grid-cols-4 gap-6 scrollbar-hide">
  {/* THE [+ ADD] BOX */}
  {selectedCollection && (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square border-2 border-dashed border-[#FF6600]/20 hover:border-[#FF6600]/50 hover:bg-[#FF6600]/5 transition-all flex items-center justify-center cursor-pointer">
        <input 
          type="file" multiple 
          onChange={(e) => handleAddToCollection(e.target.files)} 
          className="absolute inset-0 opacity-0 cursor-pointer" 
        />
        <span className="text-[10px] font-black text-[#FF6600]/40">+ ADD_ASSETS</span>
      </div>
      <div className="h-4" /> {/* Spacer to match the others */}
    </div>
  )}

  {/* MAIN ZONE: MEDIA_GALLERY_GRID */}
<div className="flex-1 flex flex-col gap-6">
  <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-6 p-1 scrollbar-hide">
    {!selectedCollection ? (
      <div className="col-span-4 flex items-center justify-center text-gray-700 uppercase font-black text-[10px]">
        {/* CORRECT COMMENT WRAPPING TO PREVENT REGEXP ERROR */}
        {/* SELECT_COLLECTION_TO_VIEW_ASSETS */}
        SELECT A COLLECTION FROM THE LEFT TO BEGIN
      </div>
    ) : (
      <>
        {/* THE [+ ADD] BOX */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square border-2 border-dashed border-[#FF6600]/20 hover:border-[#FF6600]/50 hover:bg-[#FF6600]/5 transition-all flex items-center justify-center cursor-pointer">
            <input 
              type="file" multiple 
              onChange={(e) => handleAddToCollection(e.target.files)} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            <span className="text-[10px] font-black text-[#FF6600]/40">+ ADD_ASSETS</span>
          </div>
          <div className="h-10" /> {/* SPACER TO ALIGN WITH BUTTONS */}
        </div>

        {collectionAssets.map((asset) => (
          <div key={asset.id} className="flex flex-col gap-3 animate-in fade-in duration-500">
            {/* 1. THE IMAGE CONTAINER */}
            <div className={`aspect-square border ${asset.display_order === 0 ? 'border-[#FF6600] shadow-[0_0_15px_rgba(255,102,0,0.2)]' : 'border-[#FF6600]/10'} bg-black`}>
              <img src={asset.file_url} className="w-full h-full object-cover" />
            </div>

            {/* 2. BUTTONS (ALWAYS VISIBLE) */}
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => handleSetCover(asset.id)} 
                className={`py-2 text-[8px] font-black uppercase transition-all ${asset.display_order === 0 ? 'bg-[#FF6600] text-black cursor-default' : 'bg-white text-black hover:bg-[#FF6600]'}`}
              >
                {asset.display_order === 0 ? 'ACTIVE_COVER' : 'SET_AS_COVER'}
              </button>
              
              <button 
                onClick={() => { document.getElementById('edit-name-input')?.focus(); }} 
                className="py-2 border border-[#FF6600] text-[#FF6600] text-[8px] font-black uppercase hover:bg-[#FF6600] hover:text-black transition-all"
              >
                EDIT_NAME
              </button>
              
              <button 
                onClick={() => handleDeleteAsset(asset.id, asset.file_url)} 
                className="py-2 border border-red-500 text-red-500 text-[8px] font-black uppercase hover:bg-red-500 hover:text-black transition-all"
              >
                DELETE_ASSET
              </button>
            </div>

            {/* 3. TIER TAGS (BELOW BUTTONS) */}
            <div className="flex justify-between items-center px-1 border-t border-[#FF6600]/10 pt-2">
              <span className="text-[9px] font-black text-gray-500 uppercase">TIER_0{asset.tier}</span>
              {asset.display_order === 0 && (
                <span className="text-[8px] font-black text-[#FF6600] uppercase tracking-tighter">PRIMARY</span>
              )}
            </div>
          </div>
        ))}
      </>
    )}
  </div>
</div>

      {/* FOOTER: SETTINGS_PANEL */}
      {selectedCollection && (
        <div className="bg-black border border-[#FF6600]/20 p-6 flex items-end gap-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-gray-500 uppercase">EDIT_COLLECTION_NAME</label>
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#FF6600]/30 p-3 text-white text-xs font-bold outline-none"
            />
          </div>
          <div className="w-48 space-y-2">
            <label className="text-[9px] font-black text-gray-500 uppercase">ACCESS_TIER</label>
            <select 
              value={editTier} 
              onChange={(e) => setEditTier(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#FF6600]/30 p-3 text-white text-xs font-bold outline-none"
            >
              <option value="1">TIER_01</option>
              <option value="2">TIER_02</option>
              <option value="3">TIER_03</option>
            </select>
          </div>
          <button onClick={handleUpdateCollection} className="bg-[#FF6600] text-black px-8 py-3 font-black uppercase text-[11px] hover:bg-white transition-all">
            UPDATE_COLLECTION
          </button>
        </div>
      )}
    </div>
  </div>
)}

        {/* --- TAB: MEDIA INJECTION --- */}
        {activeTab === 'MEDIA_INJECTION' && (
          <div className="max-w-4xl animate-in fade-in duration-500 pb-32">
            <header className="mb-10 border-b border-[#FF6600]/20 pb-6">
              <h2 className="text-[24px] font-black uppercase tracking-widest text-white">Media Factory</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">// INJECT_ASSETS_TO_ENCRYPTED_BUCKET</p>
            </header>

            <form onSubmit={executeSynchronization} className="space-y-10">
              
              {/* MODE SELECTOR */}
              <div className="flex gap-4 mb-10">
                <button 
                  type="button"
                  onClick={() => { 
                    setUploadMode('SINGLE');
                    setActiveCover(null);
                    setActiveSlug('');
                    setActivePayload([]);
                    setActiveTier('1');
                  }} 
                  className={`flex-1 py-4 text-[10px] font-black uppercase transition-all ${uploadMode === 'SINGLE' ? 'bg-[#FF6600] text-black shadow-[0_0_20px_rgba(255,102,0,0.3)]' : 'border border-[#FF6600]/30 text-gray-500'}`}
                >
                  [ SINGLE_DROP_MODE ]
                </button>

                <button 
                  type="button"
                  onClick={() => { 
                    setUploadMode('MULTI');
                    setActiveCover(null);
                    setActiveSlug('');
                    setActivePayload([]);
                    setActiveTier('1');
                  }} 
                  className={`flex-1 py-4 text-[10px] font-black uppercase transition-all ${uploadMode === 'MULTI' ? 'bg-[#FF6600] text-black shadow-[0_0_20px_rgba(255,102,0,0.3)]' : 'border border-[#FF6600]/30 text-gray-500'}`}
                >
                  [ MULTIPLE_UPLOAD_MODE ]
                </button>
              </div>

              {/* THE PIPELINE STACK (COLLAPSED VIEWS) */}
              {uploadMode === 'MULTI' && vaultStack.length > 0 && (
                <div className="space-y-3 mb-10">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">// STACKED_PIPELINE</p>
                  {vaultStack.map((v) => (
                    <div 
                      key={v.id} 
                      onClick={() => handleEditStackItem(v.id)}
                      className="bg-black border border-[#FF6600]/40 p-4 flex items-center justify-between group cursor-pointer hover:bg-[#FF6600]/5 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <img src={v.cover.preview} className="w-12 h-12 object-cover border border-[#FF6600]/20" />
                        <div>
                          <p className="text-[12px] font-black text-white uppercase">{v.slug}</p>
                          <p className="text-[9px] font-bold text-[#FF6600] uppercase mt-1">TIER_0{v.tier} | {v.payload.length} ASSETS</p>
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

              {/* ACTIVE INGESTION POINT */}
              <div className="border border-[#FF6600]/20 bg-black/40 p-10 space-y-8 relative">
                {uploadMode === 'MULTI' && (
                  <div className="absolute top-4 right-6 text-[9px] font-black text-[#FF6600] uppercase tracking-widest animate-pulse">// ACTIVE_FORM</div>
                )}
                
                {/* DISPLAY_0 COVER */}
                <div className="bg-black border border-[#FF6600]/20 p-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white mb-4 block flex justify-between">
                    <span>// PRIMARY_COVER_ASSET (DISPLAY_0)</span>
                    <span className="text-gray-500 text-[8px]">*REQUIRED FOR HOMEPAGE</span>
                  </label>
                  
                  {activeCover ? (
                    <div className="relative w-48 h-48 border border-[#FF6600] group">
                      <img src={activeCover.preview} alt="Cover Preview" className="w-full h-full object-cover opacity-80" />
                      <button 
                        type="button"
                        onClick={() => setActiveCover(null)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black border border-[#FF6600] text-[#FF6600] flex items-center justify-center text-[10px] font-black hover:bg-[#FF6600] hover:text-black transition-colors"
                      >
                        X
                      </button>
                      <div className="absolute bottom-0 left-0 w-full bg-[#FF6600] text-black text-[8px] font-black text-center py-1 uppercase tracking-widest">
                        COVER_LOCKED
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-48 h-48 border-2 border-dashed border-[#FF6600]/40 flex flex-col items-center justify-center hover:border-[#FF6600] transition-colors cursor-pointer bg-[#FF6600]/5">
                      <input type="file" onChange={handleCoverSelect} accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="text-[20px] mb-2 text-[#FF6600]">+</span>
                      <span className="text-[9px] font-bold text-[#FF6600] tracking-widest">STAGE_COVER</span>
                    </div>
                  )}
                </div>

                {/* MEDIA_METADATA */}
                <div className="grid grid-cols-2 gap-6 bg-black border border-[#FF6600]/20 p-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white mb-3 block">MEDIA_COLLECTION_NAME</label>
                    <input 
                      type="text" 
                      placeholder="e.g. archive-alpha-01"
                      value={activeSlug}
                      onChange={(e) => setActiveSlug(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#FF6600]/30 px-4 py-3 text-white text-xs font-bold outline-none focus:border-[#FF6600]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white mb-3 block">ACCESS_TIER</label>
                    <select 
                      value={activeTier}
                      onChange={(e) => setActiveTier(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#FF6600]/30 px-4 py-3 text-white text-xs font-bold outline-none focus:border-[#FF6600] appearance-none"
                    >
                      <option value="1">TIER_01 ($6.00)</option>
                      <option value="2">TIER_02 ($4.00)</option>
                      <option value="3">TIER_03 ($4.00)</option>
                    </select>
                  </div>
                </div>

                {/* MEDIA_PAYLOAD_ZONE */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white mb-3 block">// MEDIA_PAYLOAD_ZONE</label>
                  <div className="relative border-2 border-dashed border-[#FF6600]/40 hover:border-[#FF6600] bg-[#FF6600]/5 transition-all text-center p-16">
                    <input 
                      type="file" 
                      multiple 
                      onChange={handlePayloadSelect}
                      accept="image/*,video/*"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    />
                    <div className="pointer-events-none">
                      <p className="text-[12px] font-black text-[#FF6600] uppercase tracking-[0.2em] mb-2">DRAG & DROP ASSETS HERE</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">BULK INGESTION SUPPORTED</p>
                    </div>
                  </div>
                </div>

                {/* PREVIEW_BUFFER */}
                {activePayload.length > 0 && (
                  <div className="border border-[#FF6600]/20 bg-black p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-[#FF6600]/20 pb-4">
                      <span className="text-[10px] font-black text-white tracking-widest uppercase">// PREVIEW_BUFFER</span>
                      <span className="text-[9px] font-bold text-[#FF6600] tracking-widest uppercase">
                        STAGED: {activePayload.length} ASSETS | WEIGHT: {totalWeight.toFixed(2)} MB
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                      {activePayload.map((fileObj) => (
                        <div key={fileObj.id} className="relative group flex flex-col gap-2">
                          <div className="relative aspect-square border border-[#FF6600]/30 bg-[#0a0a0a]">
                            <img src={fileObj.preview} alt="staged" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <button 
                              type="button"
                              onClick={() => removePayloadFile(fileObj.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/80 border border-[#FF6600] text-[#FF6600] flex items-center justify-center text-[8px] font-black hover:bg-[#FF6600] hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                            >
                              X
                            </button>
                          </div>
                        </div>
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
                    className="flex-1 bg-transparent border border-[#FF6600] text-[#FF6600] py-6 font-black uppercase text-[12px] tracking-[0.2em] hover:bg-[#FF6600]/10 transition-all"
                  >
                    [ + ADD_NEW_VAULT_PROTOCOL ]
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isUploading || (!activeCover && vaultStack.length === 0)}
                  className={`flex-[2] bg-[#FF6600] text-black py-6 font-black uppercase text-[12px] tracking-[0.3em] hover:bg-white transition-all disabled:opacity-20 disabled:hover:bg-[#FF6600] ${isUploading ? 'animate-pulse' : ''}`}
                >
                  {isUploading ? '[ SYNCHRONIZING_TO_BUCKET... ]' : '[ EXECUTE_UPLOAD_SEQUENCE ]'}
                </button>
              </div>

            </form>
          </div>
        )}
      </main>
    </div>
  );
}