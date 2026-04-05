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

  // --- ACTIONS ---
  async function handleCryptoSelect(coin: string) {
    setLoading(true);
    const formData = new FormData();
    formData.append('method', 'CRYPTO');
    formData.append('platform', coin);
    formData.append('status', 'GENERATED');

    const result = await submitDeposit(formData);
    if (result.success) {
      setActiveCoin(coin);
      setMethod(null);
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
    <main className="min-h-screen bg-white text-gray-900 font-sans flex flex-col items-center relative overflow-hidden">
      
      {/* Elegant Pink Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* --- HEADER --- */}
      <div className="z-10 w-full max-w-2xl px-6 py-12 border-b border-gray-100 mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-primary">FINE MEDIA</h1>
          <div className="mt-4 space-y-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              Min Gift Card: $10.00 
            </p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              Min Crypto: $6.00
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Balance</p>
          <p className="text-3xl font-black text-gray-900">${userProfile?.balance?.toFixed(2) || "0.00"}</p>
        </div>
      </div>

      <div className="z-10 w-full max-w-md px-6 space-y-6 pb-20">
        
        {!submitted ? (
          <>
            {/* --- ACTIVE CRYPTO WALLET --- */}
            {activeCoin && (
              <div className="bg-primary/5 border-2 border-primary p-8 rounded-[32px] animate-in zoom-in duration-500 shadow-xl shadow-primary/10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-black uppercase tracking-widest italic text-primary">
                    Channel Access: {activeCoin}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Deposit Address:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white border border-primary/20 p-4 rounded-2xl text-[10px] font-bold text-primary break-all leading-tight">
                      bc1q_placeholder_static_address_777888999
                    </div>
                    <button 
                      onClick={() => copyToClipboard('bc1q_placeholder_static_address_777888999')}
                      className="bg-primary text-white px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-primary/10">
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Status: Verifying...</p>
                    <button 
                      onClick={() => setActiveCoin(null)}
                      className="text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/30 pb-0.5 hover:border-primary transition-all"
                    >
                      Change Method
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- GIFT CARD OPTION --- */}
            <div 
              onClick={() => { if(method !== 'GIFTCARD') setMethod('GIFTCARD'); }}
              className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer shadow-sm ${method === 'GIFTCARD' ? 'border-primary bg-primary/5 cursor-default shadow-primary/10' : 'border-gray-100 bg-gray-50 hover:border-primary/30'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-black uppercase italic text-gray-800">💳 Gift Card</h2>
                {method === 'GIFTCARD' && (
                  <button onClick={(e) => { e.stopPropagation(); setMethod(null); }} className="text-[9px] font-black text-primary uppercase">Close</button>
                )}
              </div>
              
              {method === 'GIFTCARD' ? (
                <form onSubmit={handleGiftCardSubmit} className="mt-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div>
                    <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Card Brand</label>
                    <input name="platform" placeholder="e.g. Apple, Steam, Razer Gold" required className="w-full bg-transparent border-b border-gray-200 py-3 text-sm font-bold text-primary outline-none focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Amount ($)</label>
                    <input name="amount" type="number" step="0.01" placeholder="0.00" required className="w-full bg-transparent border-b border-gray-200 py-3 text-sm font-bold text-primary outline-none focus:border-primary transition-all" />
                  </div>
                  <div className="py-3 px-4 bg-primary/5 border border-primary/20 rounded-2xl">
                    <p className="text-[8px] font-bold text-primary uppercase tracking-widest leading-tight text-center">
                      Notice: Verification usually takes 5-15 minutes
                    </p>
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-primary tracking-widest">Redemption Code</label>
                    <input name="code" placeholder="Enter code here" required className="w-full bg-transparent border-b border-primary/30 py-3 text-sm font-bold text-primary outline-none focus:border-primary transition-all" />
                  </div>
                  <button disabled={loading} className="w-full bg-primary hover:bg-primary-hover py-5 rounded-full font-black text-[11px] text-white uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                    {loading ? "PROCESSING..." : "CONFIRM DEPOSIT"}
                  </button>
                </form>
              ) : (
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Secure Member Intake</p>
              )}
            </div>

            {/* --- CRYPTO SELECTION --- */}
            {!activeCoin && (
              <div 
                onClick={() => { if(method !== 'CRYPTO') setMethod('CRYPTO'); }}
                className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer shadow-sm ${method === 'CRYPTO' ? 'border-primary bg-primary/5 cursor-default shadow-primary/10' : 'border-gray-100 bg-gray-50 hover:border-primary/30'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-black uppercase italic text-gray-800">⚡ Cryptocurrency</h2>
                  {method === 'CRYPTO' && (
                    <button onClick={(e) => { e.stopPropagation(); setMethod(null); }} className="text-[9px] font-black text-primary uppercase">Close</button>
                  )}
                </div>

                {method === 'CRYPTO' ? (
                  <div className="mt-8 grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 duration-300">
                    {cryptoOptions.map(opt => (
                      <button 
                        key={opt} 
                        onClick={(e) => { e.stopPropagation(); handleCryptoSelect(opt); }}
                        className="py-5 bg-white border border-gray-100 rounded-2xl font-black text-[10px] text-gray-600 uppercase tracking-widest hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-95"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Instant Blockchain Transfer</p>
                )}
              </div>
            )}
          </>
        ) : (
          /* --- SUCCESS STATE --- */
          <div className="text-center p-12 bg-white rounded-[40px] border border-primary/20 shadow-2xl shadow-primary/10 animate-in zoom-in">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20">
               <span className="text-3xl text-primary">✨</span>
            </div>
            <h2 className="text-2xl font-black uppercase italic mb-4 text-gray-900">Verification Pending</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Your deposit has been logged. Our team is confirming your membership access.
            </p>
            <button onClick={() => window.location.href = '/'} className="mt-12 w-full bg-primary hover:bg-primary-hover text-white py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all">
              Return to Collection
            </button>
          </div>
        )}
      </div>
    </main>
  );
}