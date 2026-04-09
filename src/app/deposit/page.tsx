'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitDeposit, getProfile, syncCryptoDeposit } from '../actions/auth';
import { QRCodeSVG } from 'qrcode.react';

export default function DepositPage() {
  const router = useRouter();

  // --- UI STATES ---
  const [method, setMethod] = useState<'GIFTCARD' | 'CRYPTO' | null>(null);
  const [activeCoin, setActiveCoin] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  const cryptoOptions = ['BTC', 'LTC'];

  const coinIcons: Record<string, React.ReactNode> = {
    BTC: (
      <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="#F7931A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.16-17.962"/>
      </svg>
    ),
    LTC: (
      <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 19h9"/><path d="M10 19l2.5-14"/><path d="M7 12l6-2"/>
      </svg>
    )
  };

  // --- DATA SYNC ---
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const profile = await getProfile();
    if (profile) setUserProfile(profile);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  // --- ACTIONS ---
  const handleManualSync = async () => {
    if (!depositAddress || !activeCoin) return;
    setIsSyncing(true);
    const result = await syncCryptoDeposit(depositAddress, activeCoin);
    if (result.success) {
      alert("CREDITS_INJECTED: Success! Returning home.");
      router.push('/');
    } else {
      alert(result.error || "No transaction detected yet.");
    }
    setIsSyncing(false);
  };

  async function handleCryptoSelect(coin: string) {
    setLoading(true);
    const formData = new FormData();
    formData.append('method', 'CRYPTO');
    formData.append('platform', coin);
    formData.append('status', 'GENERATED');

    const result = await submitDeposit(formData);
    if (result.success && result.address) {
      setActiveCoin(coin);
      setDepositAddress(result.address);
      setMethod(null);
    } else {
      alert(result.error || "Failed to generate address.");
    }
    setLoading(false);
  }

  async function handleGiftCardSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);

    if (amount < 10) {
      setGiftCardError("BELOW MINIMUM IS 10");
      return;
    }

    setGiftCardError(null);
    setLoading(true);
    formData.append('method', 'GIFTCARD');
    
    const result = await submitDeposit(formData);
    if (result.success) setSubmitted(true);
    else alert(result.error);
    setLoading(false);
  }

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("ADDRESS COPIED TO CLIPBOARD.");
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans flex flex-col items-center relative overflow-hidden">
      
      {/* Pink Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* --- HEADER --- */}
      <div className="z-10 w-full max-w-2xl px-6 py-12 border-b border-gray-100 mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-primary leading-none">Sy Exclusive</h1>
          <div className="mt-4 space-y-1">
            <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">Minimum Deposit Is: $10.00</p>
            <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">Lesser value will not be processed!!!</p>
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available Balance</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black text-gray-900 leading-none">${userProfile?.balance?.toFixed(2) || "0.00"}</p>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="z-10 w-full max-w-md px-6 space-y-6 pb-20">
        {!submitted ? (
          <>
            {/* --- ACTIVE CRYPTO WALLET --- */}
            {activeCoin && depositAddress && (
              <div className="bg-primary/5 border-2 border-primary p-6 rounded-[32px] animate-in zoom-in duration-500 shadow-xl shadow-primary/10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[10px] font-black uppercase tracking-widest italic text-red-900">
                    Minimum Deposit For {activeCoin}: $10.00 USD
                  </h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-center bg-white p-4 rounded-3xl border border-primary/20 mx-auto w-fit shadow-sm">
                    <QRCodeSVG 
                      value={activeCoin === 'BTC' ? `bitcoin:${depositAddress}` : `litecoin:${depositAddress}`} 
                      size={140} 
                      level="M" 
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-black uppercase tracking-[0.3em]">Deposit Address:</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white border border-primary/20 p-4 rounded-2xl text-[10px] font-bold text-black break-all leading-tight">
                        {depositAddress}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(depositAddress)}
                        className="bg-primary text-white px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-primary-hover transition-all"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* REFRESH/SYNC BUTTON */}
                  <button 
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3"
                  >
                    {isSyncing ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        CHECKING BLOCKCHAIN...
                      </>
                    ) : (
                      "⚡ DETECT DEPOSIT NOW"
                    )}
                  </button>

                  <div className="flex justify-between items-center pt-4 border-t border-primary/10">
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter italic">Instant detection usually takes 1-2 mins</p>
                    <button 
                      onClick={() => { setActiveCoin(null); setDepositAddress(null); }}
                      className="text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/30 pb-0.5"
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
              className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer ${method === 'GIFTCARD' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-black uppercase italic text-gray-800">💳 Gift Card</h2>
                {method === 'GIFTCARD' && (
                  <button onClick={(e) => { e.stopPropagation(); setMethod(null); }} className="text-[9px] font-black text-primary uppercase">Close</button>
                )}
              </div>
              
              {method === 'GIFTCARD' ? (
                <form onSubmit={handleGiftCardSubmit} className="mt-6 space-y-4 animate-in slide-in-from-top-4">
                  <input name="platform" placeholder="Brand (e.g. Apple, Steam)" required className="w-full bg-transparent border-b border-gray-200 py-3 text-sm font-bold text-primary outline-none focus:border-primary" />
                  <div>
                    <input name="amount" type="number" step="0.01" placeholder="Amount ($)" required onChange={() => setGiftCardError(null)} className="w-full bg-transparent border-b border-gray-200 py-3 text-sm font-bold text-primary outline-none" />
                    {giftCardError && <p className="text-red-500 text-[9px] font-black mt-1 uppercase animate-pulse">{giftCardError}</p>}
                  </div>
                  <input name="code" placeholder="Redemption Code" required className="w-full bg-transparent border-b border-primary/30 py-3 text-sm font-bold text-primary outline-none" />
                  <button disabled={loading} className="w-full bg-primary py-5 rounded-full font-black text-[11px] text-white uppercase tracking-widest shadow-xl shadow-primary/20 transition-all">
                    {loading ? "PROCESSING..." : "CONFIRM DEPOSIT"}
                  </button>
                </form>
              ) : (
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Seamless Verification</p>
              )}
            </div>

            {/* --- CRYPTO SELECTION --- */}
            {!activeCoin && (
              <div 
                onClick={() => { if(method !== 'CRYPTO') setMethod('CRYPTO'); }}
                className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer ${method === 'CRYPTO' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-black uppercase italic text-gray-800">⚡ Cryptocurrency</h2>
                  {method === 'CRYPTO' && (
                    <button onClick={(e) => { e.stopPropagation(); setMethod(null); }} className="text-[9px] font-black text-primary uppercase">Close</button>
                  )}
                </div>

                {method === 'CRYPTO' ? (
                  <div className="mt-6 grid grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                    {cryptoOptions.map(opt => (
                      <button key={opt} onClick={(e) => { e.stopPropagation(); handleCryptoSelect(opt); }} className="py-6 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl font-black text-[10px] text-gray-600 uppercase tracking-widest hover:border-primary transition-all active:scale-95">
                        {coinIcons[opt]}
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Instant Blockchain Confirmation</p>
                )}
              </div>
            )}

            {/* --- NEW HOME BUTTON AT BOTTOM --- */}
            <button 
              onClick={() => router.push('/')}
              className="w-full mt-10 py-5 rounded-full border-2 border-gray-100 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:bg-gray-50 hover:text-black transition-all active:scale-95"
            >
              ← Return To Collection
            </button>
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
            <button onClick={() => router.push('/')} className="mt-12 w-full bg-primary hover:bg-primary-hover text-white py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all">
              Return to Collection
            </button>
          </div>
        )}
      </div>
    </main>
  );
}