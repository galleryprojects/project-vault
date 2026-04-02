'use client';

export default function AccountPage() {
  // [1] DUMMY DATA: This will eventually come from your database
  const user = {
    id: "USR-9921-X4B", // Your requested User ID
    username: "CYBER_GHOST_01",
    joined: "Oct 2023",
    status: "ACTIVE MEMBER"
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] relative overflow-hidden font-sans pb-12">
      

      {/* [2] TECHNICAL BACKGROUND: Subtle grid for that "Pro" feel */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="relative z-10 max-w-md mx-auto pt-24 px-6">
        
        {/* HEADER */}
        <div className="mb-8 border-b-2 border-gray-100 pb-4">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Security Profile</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Manage your vault identity</p>
        </div>

        {/* [3] THE USER ID CARD: High-End Black Tech Style */}
        <div className="bg-black rounded-[32px] p-8 mb-6 shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF6600]/10 blur-[60px] rounded-full -mr-20 -mt-20"></div>
          
          <div className="flex justify-between items-start mb-10">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <span className="text-xl">👤</span>
            </div>
            <span className="text-[8px] font-black bg-[#FF6600]/20 text-[#FF6600] px-3 py-1 rounded-full tracking-widest uppercase">
              {user.status}
            </span>
          </div>

          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Unique Access ID</p>
            <h2 className="text-2xl font-mono font-bold text-white tracking-widest mb-1">{user.id}</h2>
            <p className="text-[8px] font-bold text-[#FF6600] uppercase tracking-widest">Encryption Level 4 Active</p>
          </div>
        </div>

        {/* [4] ACCOUNT DETAILS LIST */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-6 shadow-sm mb-6">
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</span>
            <span className="text-sm font-black uppercase">{user.username}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Member Since</span>
            <span className="text-sm font-black uppercase text-gray-400">{user.joined}</span>
          </div>
        </div>

        {/* [5] SECURITY ACTIONS */}
        <div className="space-y-3">
          <button className="w-full bg-white border border-gray-200 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
            <span>🔑</span> Change Access Passphrase
          </button>
          
          <button className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-100 transition-all">
            Delete Identity // Close Vault
          </button>
        </div>

        {/* BACK NAVIGATION */}
        <div className="mt-12 text-center">
          <button onClick={() => window.location.href='/'} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-[0.3em] transition-all">
            ← Return to Main Dashboard
          </button>
        </div>

      </div>
    </main>
  );
}