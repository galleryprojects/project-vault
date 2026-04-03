'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdminBypass, checkAdminBypass, logoutAdminBypass } from '../actions/admin-bypass';
import { getAdminVaultStats, uploadVaultMedia } from '../actions/admin';

export default function InvisibleAdmin() {
  const router = useRouter();
  
  // AUTH STATES
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [error, setError] = useState('');

  // DASHBOARD STATES
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'UPLOAD'>('REGISTRY');
  const [vaultStats, setVaultStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // UPLOAD FORM STATE
  const [vaultId, setVaultId] = useState('');
  const [tier, setTier] = useState('1');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
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

  // 2. Handlers
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || !vaultId) return alert("Missing Info");

    setIsUploading(true);
    const formData = new FormData();
    formData.append('vaultId', vaultId.toLowerCase().trim());
    formData.append('tier', tier);
    Array.from(selectedFiles).forEach(file => formData.append('files', file));

    const result = await uploadVaultMedia(formData);
    if (result.success) {
      alert(result.message);
      setVaultId('');
      setSelectedFiles(null);
      const stats = await getAdminVaultStats();
      setVaultStats(stats);
      setActiveTab('REGISTRY');
    }
    setIsUploading(false);
  };

  if (isAuthorized === null) return null;

  // --- RENDER: LOGIN VIEW ---
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-12">
            <h1 className="text-white font-black text-2xl tracking-[0.4em] uppercase italic">Terminal Login</h1>
            <p className="text-orange-600 text-[9px] font-bold uppercase tracking-widest mt-2">// Bypass Protocol Active</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Identity" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white text-sm focus:border-orange-600 outline-none transition-all"
              onChange={e => setLoginUser(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Security Key" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white text-sm focus:border-orange-600 outline-none transition-all"
              onChange={e => setLoginPass(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-[9px] font-bold uppercase text-center tracking-widest animate-pulse">{error}</p>}
            <button className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all">
              Execute Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: AUTHORIZED DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#111] text-white fixed h-full flex flex-col z-50">
        <div className="p-8 border-b border-white/10">
          <h1 className="text-[14px] font-black tracking-[0.3em] uppercase italic">Master Control</h1>
          <p className="text-orange-600 text-[8px] font-bold uppercase tracking-widest mt-2">Zero-Trace Session</p>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 mt-4 text-[11px] font-black uppercase tracking-widest">
          <button 
            onClick={() => setActiveTab('REGISTRY')}
            className={`text-left px-6 py-4 rounded-xl transition-all ${activeTab === 'REGISTRY' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            Vault Registry
          </button>
          <button 
            onClick={() => setActiveTab('UPLOAD')}
            className={`text-left px-6 py-4 rounded-xl transition-all ${activeTab === 'UPLOAD' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            Upload Media
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={async () => { await logoutAdminBypass(); router.push('/'); }} 
            className="w-full text-center px-6 py-4 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            [ KILL_SESSION ]
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-[260px] flex-1 p-12">
        {activeTab === 'REGISTRY' ? (
          <>
            <header className="mb-12 border-b border-gray-200 pb-6 flex justify-between items-end">
              <div>
                <h2 className="text-[32px] font-black italic uppercase tracking-tighter text-[#111]">Registry</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Live Storage Statistics</p>
              </div>
              <span className="text-[9px] font-bold text-green-600 uppercase tracking-[0.3em] mb-2 animate-pulse font-mono">// System Online</span>
            </header>

            <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <th className="p-6">Vault ID</th>
                    <th className="p-6 text-center">Tier 1</th>
                    <th className="p-6 text-center">Tier 2</th>
                    <th className="p-6 text-center">Tier 3</th>
                    <th className="p-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vaultStats.map((vault) => (
                    <tr key={vault.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-6"><span className="text-[12px] font-black uppercase tracking-widest text-[#111] bg-gray-100 px-3 py-1 rounded-md">{vault.id}</span></td>
                      <td className="p-6 text-center font-bold text-gray-600">{vault.tier1}</td>
                      <td className="p-6 text-center font-bold text-gray-600">{vault.tier2}</td>
                      <td className="p-6 text-center font-bold text-gray-600">{vault.tier3}</td>
                      <td className="p-6 text-right font-black text-orange-600">{vault.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="max-w-2xl">
            <header className="mb-12 border-b border-gray-200 pb-6">
              <h2 className="text-[32px] font-black italic uppercase tracking-tighter text-[#111]">Upload</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Inject assets into the encrypted bucket</p>
            </header>

            <form onSubmit={handleUpload} className="bg-white p-10 rounded-[32px] border border-gray-200 shadow-sm space-y-8">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Vault Identifier</label>
                <input 
                  type="text" 
                  placeholder="e.g. summer-batch-01"
                  value={vaultId}
                  onChange={(e) => setVaultId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Protocol Tier</label>
                <select 
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 text-sm font-bold outline-none"
                >
                  <option value="1">Tier 1 ($6.00)</option>
                  <option value="2">Tier 2 ($4.00)</option>
                  <option value="3">Tier 3 ($4.00)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Select Files (Batch)</label>
                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl px-6 py-12 text-center cursor-pointer hover:bg-gray-100 transition-all text-xs font-bold text-gray-400"
                />
                {selectedFiles && <p className="mt-2 text-[10px] font-black text-orange-600 uppercase tracking-widest">{selectedFiles.length} files staged</p>}
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full bg-[#111] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {isUploading ? 'SYNCHRONIZING...' : 'START UPLOAD SEQUENCE'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}