'use client';

import { useState, useEffect } from 'react';
import { submitDeposit, getProfile } from '../actions/auth';

export default function DepositPage() {
  // --- UI STATES ---
  const [method, setMethod] = useState<'GIFTCARD' | 'CRYPTO' | null>(null);
  const [activeCoin, setActiveCoin] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cryptoOptions = ['BTC', 'ETH', 'LTC', 'USDT'];

  // --- INITIALIZE DATA ---
  useEffect(() => {
    async function load() {
      const profile = await getProfile();
      setUserProfile(profile);
    }
    load();
  }, []);

  // --- PROTOCOL ACTIONS ---
  async function handleCryptoSelect(coin: string) {
    setLoading(true);
    const formData = new FormData();
    formData.append('method', 'CRYPTO');
    formData.append('platform', coin);
    formData.append('status', 'GENERATED');

    const result = await submitDeposit(formData);
    if (result.success) {
      setActiveCoin(coin);
      setMethod(null); // Collapses the selection boxes
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  async function handleGiftCardSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('method', 'GIFTCARD');
    
    const result = await submitDeposit(formData);
    if (result.success) setSubmitted(true);
    else alert(result.error);
    setLoading(false);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("ADDRESS COPIED TO CLIPBOARD.");
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans flex flex-col items-center">
      
      {/* --- HEADER PROTOCOL --- */}
      <div className="w-full max-w-2xl px-6 py-8 border-b border-white/10 mb-10">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-xl font-black italic tracking-tighter uppercase">[ PROJECT-VAULT ]</h1>
          <div className="text-right">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Balance</p>
            <p className="text-xl font-black text-white">${userProfile?.balance?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
        <p className="text-[11px] font-mono text-[#FF6600] uppercase tracking-[0.2em] font-bold">
          MINIMUM DEPOSIT FOR: GIFT CARD IS $10.00 
        </p>

        <p className="text-[11px] font-mono text-[#FF6600] uppercase tracking-[0.2em] font-bold">
         MINIMUM DEPOSIT FOR: CRYPTO IS $6.00
        </p>
      </div>

      <div className="w-full max-w-md px-6 space-y-6 pb-20">
        
        {!submitted ? (
          <>
            {/* --- BOX 1: THE DYNAMIC VAULT (CRYPTO ACTIVE) --- */}
            {activeCoin && (
              <div className="bg-[#FF6600]/5 border-2 border-[#FF6600] p-8 rounded-3xl animate-in zoom-in duration-500">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest italic text-[#FF6600]">
                    [⚡] PROTOCOL ACTIVE: {activeCoin}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em]">Deposit Address:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black border border-white/10 p-4 rounded-xl text-[10px] font-mono break-all leading-tight">
                      bc1q_placeholder_static_address_777888999
                    </div>
                    <button 
                      onClick={() => copyToClipboard('bc1q_placeholder_static_address_777888999')}
                      className="bg-white text-black px-4 rounded-xl font-black text-[9px] uppercase hover:bg-[#FF6600] transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <p className="text-[8px] font-mono text-gray-600 uppercase">Status: Listening...</p>
                    <button 
                      onClick={() => setActiveCoin(null)}
                      className="text-[9px] font-black text-[#FF6600] uppercase tracking-widest border-b border-[#FF6600] pb-0.5"
                    >
                      Change Coin
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- BOX 2: GIFT CARD PROTOCOL --- */}
            <div 
              onClick={() => { if(method !== 'GIFTCARD') setMethod('GIFTCARD'); }}
              className={`p-8 rounded-3xl border-2 transition-all cursor-pointer ${method === 'GIFTCARD' ? 'border-[#FF6600] bg-[#FF6600]/5 cursor-default' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-black uppercase italic">💳 Gift Card</h2>
                {method === 'GIFTCARD' && (
                  <button onClick={(e) => { e.stopPropagation(); setMethod(null); }} className="text-[9px] font-black text-gray-500 uppercase">Collapse</button>
                )}
              </div>
              
              {method === 'GIFTCARD' ? (
                <form onSubmit={handleGiftCardSubmit} className="mt-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div>
                    <label className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Type</label>
                    <input name="platform" placeholder="e.g. Apple, Steam, Razer Gold" required className="w-full bg-transparent border-b border-white/20 py-3 text-sm font-mono outline-none focus:border-[#FF6600]" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Amount ($)</label>
                    <input name="amount" type="number" step="0.01" placeholder="0.00" required className="w-full bg-transparent border-b border-white/20 py-3 text-sm font-mono outline-none focus:border-[#FF6600]" />
                  </div>
                  <div className="py-2 px-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-[8px] font-black text-red-500 uppercase tracking-widest leading-tight text-center">
                      !! WARNING: VALID ENTRIES ONLY. FRAUD = PERMANENT BAR !!
                    </p>
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-[#FF6600] tracking-widest">Card Details</label>
                    <input name="code" placeholder="Redemption Code" required className="w-full bg-transparent border-b border-[#FF6600]/30 py-3 text-sm font-mono outline-none focus:border-[#FF6600]" />
                  </div>
                  <button disabled={loading} className="w-full bg-[#FF6600] py-4 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    {loading ? "INITIALIZING..." : "REDEEM ASSET"}
                  </button>
                </form>
              ) : (
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Secure Intake Path</p>
              )}
            </div>

            {/* --- BOX 3: CRYPTO PROTOCOL (HIDDEN WHEN WALLET ACTIVE) --- */}
            {!activeCoin && (
              <div 
                onClick={() => { if(method !== 'CRYPTO') setMethod('CRYPTO'); }}
                className={`p-8 rounded-3xl border-2 transition-all cursor-pointer ${method === 'CRYPTO' ? 'border-[#FF6600] bg-[#FF6600]/5 cursor-default' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-black uppercase italic">⚡ Cryptocurrency</h2>
                  {method === 'CRYPTO' && (
                    <button onClick={(e) => { e.stopPropagation(); setMethod(null); }} className="text-[9px] font-black text-gray-500 uppercase">Collapse</button>
                  )}
                </div>

                {method === 'CRYPTO' ? (
                  <div className="mt-8 grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 duration-300">
                    {cryptoOptions.map(opt => (
                      <button 
                        key={opt} 
                        onClick={(e) => { e.stopPropagation(); handleCryptoSelect(opt); }}
                        className="py-5 bg-black border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-[#FF6600] hover:text-[#FF6600] transition-all active:scale-95"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Direct Blockchain Transfer</p>
                )}
              </div>
            )}
          </>
        ) : (
          /* --- SUCCESS STATE --- */
          <div className="text-center p-12 bg-white/5 rounded-[40px] border border-[#FF6600]/30 animate-in zoom-in">
            <div className="w-20 h-20 bg-[#FF6600]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#FF6600]/20">
               <span className="text-3xl text-[#FF6600]">⏳</span>
            </div>
            <h2 className="text-2xl font-black uppercase italic mb-4">Under Review</h2>
            <p className="text-[11px] text-gray-500 font-mono uppercase tracking-widest leading-relaxed">
              Your assets have been logged. The Vault is auditing the transaction.
            </p>
            <button onClick={() => window.location.href = '/'} className="mt-12 w-full bg-white text-black py-4 rounded-full font-black text-[10px] uppercase tracking-widest">
              Return to Vault
            </button>
          </div>
        )}
      </div>
    </main>
  );
}