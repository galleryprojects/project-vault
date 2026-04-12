'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitDeposit, getProfile, syncCryptoDeposit } from '../actions/auth';
import { QRCodeSVG } from 'qrcode.react';

export default function DepositPage() {
  const router = useRouter();

  // --- UI STATES ---
  const [method, setMethod] = useState<'GIFTCARD' | 'CRYPTO' | null>(null);
  const [gcType, setGcType] = useState<'PHYSICAL' | 'ECODE' | null>(null);
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
      alert("Wallet Credited: Success! Returning home.");
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

    if (amount <0) {
      setGiftCardError("BELOW MINIMUM IS 20");
      return;
    }

    setGiftCardError(null);
    setLoading(true);
    formData.append('method', 'GIFTCARD');
    formData.append('gcType', gcType || 'ECODE');
    
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
          <div className="mt-4 space-y-2">
            {/* UPDATED $20 HARD DECK WARNING */}
            <div className="w-[60%] p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-[5px] font-bold text-red-500 uppercase tracking-[0.1em] flex items-center gap-2">
                <span>⚠️</span> Minimum Deposit Is: $10.00
              </p>
              <p className="text-[5px] font-semibold text-gray-500 uppercase tracking-widest mt-1">
                Any lesser value will be rejected by the network.
              </p>
            </div>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          {/* DEPOSIT HISTORY BUTTON (OPENS IN NEW TAB) */}
          <button 
            onClick={() => window.open('/orders?tab=DEPOSIT', '_blank')}
            className="mt-3 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/5 transition-colors"
          >
            Deposit History
          </button>
        </div>

      </div>

      <div className="z-10 w-full max-w-md px-6 space-y-6 pb-20">
        {!submitted ? (
          <>
            {/* --- ACTIVE CRYPTO WALLET --- */}
            {activeCoin && depositAddress && (
              <div className="bg-primary/5 border-2 border-primary p-6 rounded-[32px] animate-in zoom-in duration-500 shadow-xl shadow-primary/10">
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

                  <div className="flex justify-between items-end pt-4 border-t border-primary/10">
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-red-900 uppercase tracking-tighter italic">
                        Blockchain detection usually takes 5-10 mins
                      </p>
                      <p className="text-[9px] font-black text-red-900 uppercase tracking-tighter italic">
                        If it takes longer,hit detect button 👆 above
                      </p>
                    </div>
                    <button 
                      onClick={() => { setActiveCoin(null); setDepositAddress(null); }}
                      className="text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/30 pb-0.5 whitespace-nowrap ml-2"
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
                  <button onClick={(e) => { e.stopPropagation(); setMethod(null); setGcType(null); }} className="text-[9px] font-black text-primary uppercase">Close</button>
                )}
              </div>
              
              {method === 'GIFTCARD' ? (
                <div className="mt-4 animate-in slide-in-from-top-4">
                  {/* STEP 2: THE FORK (PHYSICAL OR E-CODE) */}
                  <div className="flex gap-2 mb-6">
                    <button 
                      type="button"
                      onClick={() => setGcType('PHYSICAL')}
                      className={`flex-1 py-3 rounded-xl border-2 font-black text-[11px] uppercase tracking-widest transition-all ${gcType === 'PHYSICAL' ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-400 hover:border-primary/50'}`}
                    >
                      Physical Card
                    </button>
                    <button 
                      type="button"
                      onClick={() => setGcType('ECODE')}
                      className={`flex-1 py-3 rounded-xl border-2 font-black text-[11px] uppercase tracking-widest transition-all ${gcType === 'ECODE' ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-400 hover:border-primary/50'}`}
                    >
                      E-Code
                    </button>
                  </div>

                  {/* STEP 3: THE FORM */}
                  {gcType && (
                    <form onSubmit={handleGiftCardSubmit} className="space-y-4 animate-in fade-in">
                      <input name="platform" placeholder="Brand (e.g. Apple, Steam)" required className="w-full bg-transparent border-b border-gray-200 py-3 text-sm font-bold text-primary outline-none focus:border-primary" />
                      
                      <div>
                        <input name="amount" type="number" step="0.01" placeholder="Amount ($)" required onChange={() => setGiftCardError(null)} className="w-full bg-transparent border-b border-gray-200 py-3 text-sm font-bold text-primary outline-none focus:border-primary" />
                        {giftCardError && <p className="text-red-500 text-[9px] font-black mt-1 uppercase animate-pulse">{giftCardError}</p>}
                      </div>

                      {/* CONDITIONAL RENDER BASED ON GC TYPE */}
                      {gcType === 'ECODE' ? (
                        <input name="code" placeholder="Redemption Code" required className="w-full bg-transparent border-b border-primary/30 py-3 text-sm font-bold text-primary outline-none focus:border-primary" />
                      ) : (
                        <div className="pt-2">
                          {/* Hidden input ensures the backend database doesn't crash from a missing code parameter */}
                          <input type="hidden" name="code" value="PHYSICAL_UPLOAD" />
                          
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Upload a clear picture of the card</p>
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-gray-50 relative group">
                            <input 
                              type="file" 
                              name="cardImage" 
                              accept="image/*" 
                              required 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const label = document.getElementById('file-upload-label');
                                  if (label) label.innerText = file.name;
                                }
                              }}
                            />
                            <div className="pointer-events-none flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <span id="file-upload-label" className="text-[11px] font-bold text-primary uppercase tracking-widest">
                                Tap to attach photo
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <button disabled={loading} className="w-full bg-primary py-5 rounded-full font-black text-[11px] text-white uppercase tracking-widest shadow-xl shadow-primary/20 transition-all mt-6">
                        {loading ? "PROCESSING..." : "CONFIRM DEPOSIT"}
                      </button>
                    </form>
                  )}
                </div>
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