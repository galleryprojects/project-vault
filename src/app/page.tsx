'use client';

import { useState, useEffect } from 'react'; // Added useEffect
import { getProfile , logoutUser} from './actions/auth'; // Import the function we wrote earlier

// [1] SUB-COMPONENT: This handles the sliding logic for each individual card
function VaultCard({ item }: { item: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents clicking the card when clicking the arrow
    setCurrentIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md">
      
      {/* IMAGE SLIDER CONTAINER */}
      <div className="relative aspect-square w-full bg-[#EBEBE9] overflow-hidden">
        
        {/* The Images */}
        <div 
          className="flex h-full transition-transform duration-500 ease-out" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {item.images.map((img: string, idx: number) => (
            <div key={idx} className="min-w-full h-full flex items-center justify-center relative">
               {/* Placeholder text for now since we don't have real images yet */}
               <span className="text-[10px] font-black text-black/10 tracking-[0.4em] uppercase -rotate-12 select-none">
                 {item.title} // 0{idx + 1}
               </span>
               {/* You would replace the span above with: <img src={img} className="object-cover w-full h-full" /> */}
            </div>
          ))}
        </div>

        {/* [2] SLIDER CONTROLS (Arrows) - Only visible on hover */}
        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={prevSlide} className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-white">
            ←
          </button>
          <button onClick={nextSlide} className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-white">
            →
          </button>
        </div>

        {/* [3] PROGRESS DOTS */}
        <div className="absolute bottom-3 left-1/3 -translate-x-1/2 flex gap-1.5">
          {item.images.map((_: any, idx: number) => (
            <div 
              key={idx} 
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-[#FF6600]' : 'w-1 bg-black/10'}`}
            ></div>
          ))}
        </div>

        {/* The Orange Hover Border from your original design */}
        <div className="absolute inset-0 border-[3px] border-[#FF6600] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>
      
      {/* TEXT & FOOTER */}
      <div className="p-4 bg-white">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-tight truncate mb-2">
          {item.title}
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex flex-col leading-none">
            <span className="text-[14px] font-black text-[#FF6600]">${item.price}</span>
            <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest mt-1">Credits</span>
          </div>
          <button className="bg-black text-white text-[9px] font-black px-4 py-2 rounded-lg hover:bg-[#FF6600] transition-colors uppercase">
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  
  // [NEW] Real Data State
  const [userProfile, setUserProfile] = useState<any>(null);

  // [NEW] Fetch the user from the database when the page loads
  useEffect(() => {
    async function loadData() {
      const profile = await getProfile();
      if (profile) {
        setUserProfile(profile);
        // If they already paid, unlock the vault automatically!
        if (profile.is_unlocked) setIsLocked(false); 
      }
    }
    loadData();
  }, []);


  // [4] UPDATED DATA: Added dummy image arrays to each item
  const vaultItems = [
    { id: 1, title: "CYBER SET 01", price: "6.00", images: ["img1", "img2", "img3"] },
    { id: 2, title: "CYBER SET 02", price: "6.00", images: ["img1", "img2"] },
    { id: 3, title: "CYBER SET 03", price: "6.00", images: ["img1", "img2", "img3", "img4"] },
    { id: 4, title: "CYBER SET 04", price: "6.00", images: ["img1", "img2", "img3"] },
    { id: 5, title: "CYBER SET 05", price: "6.00", images: ["img1", "img2"] },
    { id: 6, title: "CYBER SET 06", price: "6.00", images: ["img1", "img2", "img3"] },
  ];

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111] font-sans">

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full h-[64px] bg-white border-b border-gray-200 z-[100] flex items-center px-4">
        <div className="flex w-full max-w-7xl mx-auto items-center justify-between relative">
          <button onClick={() => setIsMenuOpen(true)} className="flex flex-col justify-center gap-1.5 pr-5 border-r border-gray-200 h-8">
            <div className="w-6 h-[2px] bg-black"></div>
            <div className="w-6 h-[2px] bg-black"></div>
            <div className="w-6 h-[2px] bg-black"></div>
          </button>
          <div className="absolute left-1/3 -translate-x-1/3">
            <h1 className="text-sm font-black tracking-[0.3em] uppercase italic whitespace-nowrap">PROJECT-VAULT</h1>
          </div>
          <div className="flex items-center gap-3 z-10">
            <div className="flex flex-col items-end leading-none mt-0.5">
              <span className="text-[14px] font-black text-[#111] tracking-tight">
                ${userProfile?.balance?.toFixed(2) || "0.00"}
              </span>
              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">Credits</span>
            </div>
            <button className="bg-[#FF6600] text-white text-[10px] font-black px-5 py-2.5 rounded-full shadow-[0_4px_12px_rgba(255,102,0,0.3)] hover:scale-105 transition-all uppercase tracking-widest">Deposit</button>
          </div>
        </div>
      </nav>

      {/* --- SIDEBAR --- */}
<div className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
  <aside className={`absolute top-0 left-0 w-[280px] h-full bg-white transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="p-8">
      <button onClick={() => setIsMenuOpen(false)} className="text-[10px] font-black text-gray-400 mb-10 uppercase tracking-widest">✕ CLOSE</button>
      
      <nav className="flex flex-col gap-6 text-[22px] font-bold">
        <a href="/" className="border-b-4 border-black w-fit pb-1">Main</a>
        <a href="#" className="text-gray-400">Popular</a>
        <a href="/orders" className="text-gray-400">Order History</a>
        
        {/* THE WORKING LOGOUT BUTTON */}
        <button 
          onClick={async () => {
            await logoutUser();
            window.location.href = '/login'; // Sends them back to login after clearing the session
          }}
          className="mt-12 text-sm font-black text-red-500 uppercase tracking-widest text-left"
        >
          Logout
        </button>
      </nav>
    </div>
  </aside>
</div>

      {/* [5] BLUR WRAPPER & GRID */}
      <div className={`transition-all duration-700 ${isLocked ? 'blur-[6px] brightness-[0.6] pointer-events-none select-none' : 'blur-0 brightness-100'}`}>
        <div className="pt-28 px-4 pb-12 max-w-7xl mx-auto">
          <div className="mb-8 border-b-2 border-gray-100 pb-4">
            <h2 className="text-[28px] font-black italic uppercase tracking-tighter leading-none">Vaults</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {vaultItems.map((item) => (
              <VaultCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* [6] THE MICRO LOCK POPUP */}
      {isLocked && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-[210px] bg-black/95 backdrop-blur-2xl border border-white/10 rounded-[20px] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] text-center animate-in fade-in zoom-in duration-500">
            <div className="w-10 h-10 bg-[#FF6600]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#FF6600]/20">
              <span className="text-base">🔒</span>
            </div>
            <h2 className="text-xs font-[900] text-white uppercase tracking-[0.2em] mb-0.5">Initialize Access</h2>
            <p className="text-[6px] font-bold text-gray-500 uppercase tracking-widest mb-4">One-Time Lifetime Fee</p>
            <div className="bg-white/5 border border-white/10 rounded-xl py-3 mb-4">
              <span className="text-xl font-[900] text-[#FF6600] tracking-tighter">$6.00</span>
              <p className="text-[6px] font-bold text-white/40 uppercase tracking-[0.3em] mt-0.5">Credits Required</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setIsLocked(false)} className="w-full bg-[#FF6600] text-white py-2.5 rounded-full font-[900] uppercase tracking-widest text-[8px] shadow-[0_4px_15px_rgba(255,102,0,0.4)]">Pay & Unlock</button>
              <p className="text-[6px] font-bold text-gray-600 uppercase tracking-widest">
                Balance: <span className="text-gray-400">${userProfile?.balance?.toFixed(2) || "0.00"}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}