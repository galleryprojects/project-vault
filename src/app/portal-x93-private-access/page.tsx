'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdminBypass, logoutAdminBypass } from '../actions/admin-bypass';
import { getAdminVaultStats } from '../actions/admin';

// --- COMPONENTS ---
import AdminLogin from './components/AdminLogin';
import MetricsView from './components/MetricsTab';
import ArchiveManager from './components/ArchiveManager';
import DepositMonitor from './components/DepositMonitor';
import MediaInjection from './components/MediaInjection';

export default function InvisibleAdmin() {
  const router = useRouter();
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'MEDIA_TOTAL' | 'UPLOAD_MEDIA' | 'EDIT_MEDIA' | 'DEPOSIT_VERIFY'>('MEDIA_TOTAL');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Controls the slide-out menu
  
  const [vaultStats, setVaultStats] = useState<any[]>([]);

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

  if (isAuthorized === null) return <div className="min-h-screen bg-[#0a0a0a]" />;
  if (!isAuthorized) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#3B82F6] flex flex-col font-mono selection:bg-[#3B82F6] selection:text-black">
      
      {/* --- TOP HEADER BAR --- */}
      <header className="h-16 bg-black border-b border-[#3B82F6]/20 flex items-center px-6 sticky top-0 z-[60]">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-[#3B82F6]/10 transition-colors rounded-lg group"
        >
          {/* Hamburger Icon */}
          <div className="space-y-1.5">
            <div className={`w-6 h-0.5 bg-[#3B82F6] transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <div className={`w-6 h-0.5 bg-[#3B82F6] ${isMenuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-6 h-0.5 bg-[#3B82F6] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
        
        <div className="ml-6 flex items-center gap-4">
          <h1 className="text-[12px] font-black tracking-[0.2em] uppercase text-white hidden sm:block">Master Control</h1>
          <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest hidden md:block">{activeTab}</span>
        </div>
      </header>

      {/* --- SLIDE-OUT SIDEBAR (MOBILE OVERLAY STYLE) --- */}
      <>
        {/* Backdrop: Closes menu when you click outside */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        <aside className={`fixed top-0 left-0 h-full bg-black border-r border-[#3B82F6]/20 flex flex-col z-50 transition-transform duration-500 ease-in-out w-[280px] ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 border-b border-[#3B82F6]/20 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#3B82F6]" />
            <h1 className="text-[14px] font-black tracking-[0.2em] uppercase text-white">Ghost Terminal</h1>
          </div>
          
          <nav className="flex-1 p-6 flex flex-col gap-3 mt-2 text-[10px] font-bold uppercase tracking-[0.15em]">
            {[
              { id: 'MEDIA_TOTAL', label: 'MEDIA_TOTAL' },
              { id: 'UPLOAD_MEDIA', label: 'UPLOAD_MEDIA' },
              { id: 'EDIT_MEDIA', label: 'EDIT_MEDIA' },
              { id: 'DEPOSIT_VERIFY', label: 'DEPOSIT_VERIFY' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setIsMenuOpen(false); }}
                className={`text-left px-4 py-3 border transition-all ${
                  activeTab === item.id 
                  ? 'border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#3B82F6]' 
                  : 'border-transparent text-gray-500 hover:text-[#3B82F6] hover:border-[#3B82F6]/20'
                }`}
              >
                [ {item.label} ]
              </button>
            ))}
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
      </>

      {/* --- MAIN COMMAND VIEW --- */}
      <main className="flex-1 p-6 md:p-12 bg-[#0a0a0a]">
        {activeTab === 'MEDIA_TOTAL' && <MetricsView vaultStats={vaultStats} />}
        {activeTab === 'DEPOSIT_VERIFY' && <DepositMonitor />}
        {activeTab === 'EDIT_MEDIA' && <ArchiveManager vaultStats={vaultStats} setVaultStats={setVaultStats} />}
        {activeTab === 'UPLOAD_MEDIA' && <MediaInjection setVaultStats={setVaultStats} setActiveTab={setActiveTab} />}
      </main>

    </div>
  );
}