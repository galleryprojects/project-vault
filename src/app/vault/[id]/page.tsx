'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProfile, unlockVault, getVaultMedia, getUnlockedTiers } from '../../actions/auth'; 

export default function VaultInside() {
  const router = useRouter();
  const params = useParams();
  const vaultId = params.id as string;
  
  const [balance, setBalance] = useState<number>(0);
  const [unlockedTiers, setUnlockedTiers] = useState<number[]>([]);
  const [media, setMedia] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // NEW STATES: For expanding tiers and the full-screen image popup
  const [expandedTiers, setExpandedTiers] = useState<number[]>([1]); 
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- [1] DATA SYNC ---
  useEffect(() => {
    async function syncVault() {
      try {
        const [profile, mediaData, tiers] = await Promise.all([
          getProfile(),
          getVaultMedia(vaultId),
          getUnlockedTiers(vaultId)
        ]);

        if (profile) setBalance(profile.balance || 0);
        if (mediaData) setMedia(mediaData);
        if (tiers) setUnlockedTiers(tiers);
      } catch (err) {
        console.error("Sync Error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (vaultId) syncVault();
  }, [vaultId]);

  // --- [2] LOGIC BLOCK (Outside the return) ---
  const uniqueTiers = Array.from(new Set(media.map(m => m.tier || 1))).sort((a, b) => a - b);

  // --- [3] HANDLERS ---
  const handleTierUnlock = async (tierNum: number, price: number) => {
    setIsProcessing(true);
    const result = await unlockVault(vaultId, price, tierNum);
    
    if (result.success) {
      const [newTiers, updatedProfile] = await Promise.all([
        getUnlockedTiers(vaultId),
        getProfile()
      ]);
      if (newTiers) setUnlockedTiers(newTiers);
      if (updatedProfile) setBalance(updatedProfile.balance);
      
      // Auto-expand the tier if they just bought it
      if (!expandedTiers.includes(tierNum)) {
        setExpandedTiers(prev => [...prev, tierNum]);
      }
    }
    setIsProcessing(false);
  };

  const toggleTier = (tierNum: number) => {
    setExpandedTiers(prev => 
      prev.includes(tierNum) ? prev.filter(t => t !== tierNum) : [...prev, tierNum]
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em]">
      Decrypting Archive...
    </div>
  );

  // --- [4] RENDER BLOCK ---
  return (
    <main className="min-h-screen bg-[#F7F7F5] pb-20 font-sans">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 z-[100] flex items-center px-4">
        <div className="flex w-full max-w-7xl mx-auto items-center justify-between">
          <button 
            onClick={() => router.push('/')} 
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-gray-200 rounded-full hover:bg-black hover:text-white transition-all"
          >
            ← Back
          </button>
          
          <div className="flex flex-col items-end leading-none">
            <span className="text-[14px] font-black text-black">${balance.toFixed(2)}</span>
            <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Available Credits</span>
          </div>
        </div>
      </nav>

      <div className="pt-28 px-4 max-w-7xl mx-auto space-y-20">
        {uniqueTiers.length === 0 ? (
           <div className="text-center py-20 opacity-30 text-[10px] font-black uppercase tracking-widest">
             No Content Found for ID: {vaultId}
           </div>
        ) : (
          uniqueTiers.map((tierNum) => {
            const tierMedia = media.filter(m => m.tier === tierNum);
            const isUnlocked = unlockedTiers.includes(tierNum);
            const price = tierNum === 1 ? 6.00 : 4.00;

            return (
              <section key={tierNum} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* TIER HEADER (NOW CLICKABLE) */}
                <div 
                  onClick={() => toggleTier(tierNum)}
                  className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4 cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="flex flex-col">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Protocol Level 0{tierNum}</h2>
                    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isUnlocked ? 'text-green-500' : 'text-gray-300'}`}>
                      {isUnlocked ? '// ACCESS_GRANTED' : '// DATA_ENCRYPTED'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-gray-300">
                    {expandedTiers.includes(tierNum) ? '[-]' : '[+]'}
                  </span>
                </div>

                {/* ONLY SHOW CONTENT IF EXPANDED */}
                {expandedTiers.includes(tierNum) && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    
                    {/* MEDIA GRID (NOW CLICKABLE) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {tierMedia.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => isUnlocked && setSelectedImage(item.file_url)}
                          className={`aspect-[3/4] bg-black rounded-2xl relative overflow-hidden border border-black/5 shadow-sm ${isUnlocked ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                        >
                          <img 
                            src={item.file_url} 
                            alt="Vault Content"
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${!isUnlocked ? 'blur-3xl opacity-30 scale-110' : 'blur-0 opacity-100 scale-100'}`}
                          />
                          {!isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                              <span className="text-[8px] font-black text-white uppercase tracking-[0.5em] -rotate-12">Locked</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* PAYWALL BLOCK */}
                    {!isUnlocked && (
                      <div className="mt-8 p-10 bg-black/95 rounded-[32px] border border-white/10 text-center shadow-2xl relative overflow-hidden">
                        {/* Subtle orange glow effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FF6600]/10 blur-[60px] rounded-full -z-10"></div>
                        
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6">Authorize Decryption</h3>
                        
                        <button 
                          onClick={() => handleTierUnlock(tierNum, price)}
                          disabled={isProcessing}
                          className="bg-[#FF6600] text-white px-12 py-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_10px_30px_rgba(255,102,0,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isProcessing ? 'Connecting...' : `Unlock Level 0${tierNum} ($${price.toFixed(2)})`}
                        </button>
                        
                        <p className="text-[8px] font-bold text-gray-500 mt-6 uppercase tracking-widest italic">
                          Fee will be deducted from your total credits
                        </p>
                      </div>
                    )}

                  </div>
                )}
              </section>
            );
          })
        )}
      </div>

      {/* FULL SCREEN LIGHTBOX OVERLAY */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white font-black text-[10px] tracking-widest uppercase bg-white/10 px-6 py-3 rounded-full hover:bg-white/20 transition-colors">
            Close [X]
          </button>
          <img 
            src={selectedImage} 
            alt="Expanded view" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
          />
        </div>
      )}

    </main>
  );
}