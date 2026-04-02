'use client';

import React, { useState } from 'react';

// --- TYPES ---
interface VaultEntry {
  id: string;
  type: 'MEDIA' | 'DEPOSIT';
  title: string;
  amount: number;
  status: string;
  date: string;
  fileName?: string;
}

export default function OrderHistory() {
  // --- STATE (Ready for Backend) ---
  const [data, setData] = useState<VaultEntry[]>([]); // This will hold your Supabase data later
  const [timeFilter, setTimeFilter] = useState('7 Days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activeMedia, setActiveMedia] = useState<VaultEntry | null>(null);

  // --- DERIVED UI LOGIC ---
  const filteredData = data.filter((item) => {
    if (typeFilter === 'ALL') return true;
    return item.type === typeFilter;
  });

  const totalSpent = filteredData
    .filter(item => item.type === 'MEDIA')
    .reduce((sum, item) => sum + item.amount, 0)
    .toFixed(2);

  return (
    <main className="min-h-screen bg-[#F7F7F5] pt-24 px-4 font-sans text-black">
      <div className="max-w-3xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-col items-end justify-between items-end mb-8 border-b-2 border-gray-200 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">
              [ PROJECT-VAULT ]
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Encrypted Activity Ledger // 2026_PROTOCOL
            </p>
          </div>
          <div className="bg-black text-white p-4 rounded-2xl text-right min-w-[180px]">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Total Spent ({timeFilter})
            </p>
            <p className="text-2xl font-black text-[#FF6600] tracking-tighter">
              ${totalSpent}
            </p>
          </div>
        </div>

        {/* 1. THE DROPDOWN & PROTOCOL FILTERS */}
        <div className="flex flex-col md:flex-col items-end gap-4 mb-10">
          <div className="flex-1 bg-white border border-gray-100 p-2 rounded-xl flex items-center justify-between px-4">
            <span className="text-[10px] font-black uppercase text-gray-400">Time:</span>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-xs font-black uppercase bg-transparent outline-none cursor-pointer"
            >
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="1 Year">1 Year</option>
            </select>
          </div>

          <div className="flex-1 bg-white border border-gray-100 p-2 rounded-xl flex items-center justify-around">
            {['ALL', 'MEDIA', 'DEPOSIT'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`text-[10px] font-black px-4 py-2 rounded-lg transition-all uppercase ${
                  typeFilter === type 
                    ? 'bg-black text-white' 
                    : 'text-gray-400 hover:text-black'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 2. THE ACTIVITY LOG */}
        <div className="flex flex-col gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      {item.type === 'MEDIA' ? 'VAULT' : 'INTAKE'} // {item.id}
                    </p>
                    <h3 className="text-md font-black uppercase tracking-tight">{item.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#FF6600] tracking-tighter">
                      ${item.amount.toFixed(2)}
                    </p>
                    <span className="text-[8px] font-black bg-green-100 text-green-600 px-2 py-1 rounded-md uppercase">
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{item.date}</p>
                  {item.type === 'MEDIA' && (
                    <button 
                      onClick={() => setActiveMedia(item)}
                      className="text-[10px] font-black bg-gray-100 hover:bg-black hover:text-white px-4 py-2 rounded-lg transition-all uppercase tracking-widest"
                    >
                      [ View Media ]
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                System Offline // No Transactions Found
              </p>
            </div>
          )}
        </div>

        <button className="mt-10 text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-all">
          ← Back to Vaults
        </button>
      </div>

      {/* 3. THE CONTENT VIEWER (Slide-up Modal) */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl transition-all transform animate-in slide-in-from-bottom duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Media Decrypted: {activeMedia.title}
                </h2>
                <button 
                  onClick={() => setActiveMedia(null)}
                  className="font-black text-xs bg-gray-100 px-3 py-1 rounded-full hover:bg-red-100 hover:text-red-600"
                >
                  CLOSE [X]
                </button>
              </div>

              {/* Encrypted Player Placeholder */}
              <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200 mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 animate-pulse">
                  Initializing Secure Stream...
                </p>
              </div>

              <div className="flex justify-between items-center bg-[#F7F7F5] p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase">
                  File: <span className="text-black ml-2">{activeMedia.fileName}</span>
                </p>
                <button className="bg-[#FF6600] text-white text-[10px] font-black px-6 py-3 rounded-xl hover:scale-105 transition-transform uppercase tracking-widest">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}