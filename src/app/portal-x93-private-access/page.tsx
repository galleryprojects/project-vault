'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdminBypass, logoutAdminBypass } from '../actions/admin-bypass';
import { getAdminVaultStats } from '../actions/admin';

// --- IMPORTING OUR NEW MODULAR COMPONENTS ---
import AdminLogin from './components/AdminLogin';
import MetricsView from './components/MetricsTab';
import ArchiveManager from './components/ArchiveManager';
import DepositMonitor from './components/DepositMonitor';
import MediaInjection from './components/MediaInjection';

export default function InvisibleAdmin() {
  const router = useRouter();
  
  // CORE STATES
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'MEDIA_METRICS' | 'MEDIA_INJECTION' | 'MEDIA_MANAGER' | 'DEPOSIT_VERIFY'>('MEDIA_METRICS');
  
  // SHARED DATA (Passed down to components that need it)
  const [vaultStats, setVaultStats] = useState<any[]>([]);

  // 1. Initial Security Verification & Data Load
  useEffect(() => {
    async function verify() {
      const ok = await checkAdminBypass();
      setIsAuthorized(ok);
      if (ok) {
        const stats = await getAdminVaultStats();
        setVaultStats(stats);
      }
    }
    verify();
  }, []);

  // Prevent flash of unstyled content while verifying
  if (isAuthorized === null) return <div className="min-h-screen bg-[#0a0a0a]" />;

  // --- RENDER: LOGIN VIEW ---
  if (!isAuthorized) {
    return <AdminLogin />;
  }

  // --- RENDER: AUTHORIZED DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#3B82F6] flex font-mono selection:bg-[#3B82F6] selection:text-black">
      
      {/* CONTROL_PANEL SIDEBAR */}
      <aside className="w-[280px] bg-black border-r border-[#3B82F6]/20 fixed h-full flex flex-col z-50">
        <div className="p-8 border-b border-[#3B82F6]/20 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#3B82F6]" />
          <h1 className="text-[14px] font-black tracking-[0.2em] uppercase text-white">Master Control</h1>
          <p className="text-[#3B82F6] text-[9px] font-bold uppercase tracking-widest mt-2 animate-pulse">// ZERO_TRACE_ACTIVE</p>
        </div>
        
        <nav className="flex-1 p-6 flex flex-col gap-3 mt-2 text-[10px] font-bold uppercase tracking-[0.15em]">
          <button 
            onClick={() => setActiveTab('MEDIA_METRICS')}
            className={`text-left px-4 py-3 border transition-all ${activeTab === 'MEDIA_METRICS' ? 'border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-[#3B82F6] hover:border-[#3B82F6]/20'}`}
          >
            [ MEDIA_METRICS ]
          </button>
          
          <button 
            onClick={() => setActiveTab('MEDIA_INJECTION')}
            className={`text-left px-4 py-3 border transition-all ${activeTab === 'MEDIA_INJECTION' ? 'border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-[#3B82F6] hover:border-[#3B82F6]/20'}`}
          >
            [ MEDIA_INJECTION ]
          </button>

          <button 
            onClick={() => setActiveTab('MEDIA_MANAGER')} 
            className={`text-left px-4 py-3 border transition-all ${activeTab === 'MEDIA_MANAGER' ? 'border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-[#3B82F6] hover:border-[#3B82F6]/20'}`}
          >
            [ MEDIA_MANAGER ]
          </button>
          
          <button 
            onClick={() => setActiveTab('DEPOSIT_VERIFY')}
            className={`text-left px-4 py-3 border transition-all ${activeTab === 'DEPOSIT_VERIFY' ? 'border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-[#3B82F6] hover:border-[#3B82F6]/20'}`}
          >
            [ DEPOSIT_VERIFY ]
          </button>
          
          <button className="text-left px-4 py-3 border border-transparent text-gray-700 opacity-50 cursor-not-allowed">[ GHOST_REGISTRY ]</button>
          <button className="text-left px-4 py-3 border border-transparent text-gray-700 opacity-50 cursor-not-allowed">[ REVENUE_STREAM ]</button>
        </nav>

        <div className="p-6 border-t border-[#3B82F6]/20">
          <button 
            onClick={async () => { await logoutAdminBypass(); router.push('/'); }} 
            className="w-full text-center px-4 py-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black text-[10px] font-black uppercase tracking-widest transition-all"
          >
            [ KILL_SESSION ]
          </button>
        </div>
      </aside>

      {/* COMMAND VIEW (The dynamic area where components load) */}
      <main className="ml-[280px] flex-1 p-12 bg-[#0a0a0a]">
        {activeTab === 'MEDIA_METRICS' && <MetricsView vaultStats={vaultStats} />}
        {activeTab === 'DEPOSIT_VERIFY' && <DepositMonitor />}
        {activeTab === 'MEDIA_MANAGER' && <ArchiveManager vaultStats={vaultStats} setVaultStats={setVaultStats} />}
        {activeTab === 'MEDIA_INJECTION' && <MediaInjection setVaultStats={setVaultStats} setActiveTab={setActiveTab} />}
      </main>

    </div>
  );
}