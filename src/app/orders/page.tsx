'use client';

import React, { useState, useEffect } from 'react';
import { getLedger } from '../actions/auth'; 

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
  // --- STATE ---
  const [data, setData] = useState<VaultEntry[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [timeFilter, setTimeFilter] = useState('7 Days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activeMedia, setActiveMedia] = useState<VaultEntry | null>(null);

  // --- FETCH REAL DATA ---
  useEffect(() => {
    async function syncLedger() {
      const history = await getLedger(); 
      setData(history as VaultEntry[]);
      setLoading(false);
    }
    syncLedger();
  }, []);

  // --- DERIVED UI LOGIC ---
  const filteredData = data.filter((item) => {
    if (typeFilter === 'ALL') return true;
    return item.type === typeFilter;
  });

  const totalSpent = filteredData
    .filter(item => item.type === 'MEDIA')
    .reduce((sum, item) => sum + item.amount, 0)
    .toFixed(2);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em] text-primary animate-pulse">
        Opening Collection...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-24 px-4 font-sans text-gray-900 relative overflow-hidden">
      
      {/* Background Pink Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-3xl mx-auto z-10 relative">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 border-b border-gray-100 pb-8 gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-primary">
              FINE MEDIA
            </h1>
            
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              View Past Purchases
            </p>
          </div>
          
          <div className="bg-primary text-white p-6 rounded-[24px] text-right min-w-[200px] shadow-xl shadow-primary/20 self-end md:self-auto">
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">
              Total Spent ({timeFilter})
            </p>
            <p className="text-3xl font-black tracking-tighter">
              ${totalSpent}
            </p>
          </div>
        </div>

        {/* 1. FILTERS */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-12">
          <div className="flex-1 w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl flex items-center justify-between px-6">
            <span className="text-[10px] font-black uppercase text-gray-400">Timeframe:</span>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-xs font-black uppercase bg-transparent outline-none cursor-pointer text-primary"
            >
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="1 Year">1 Year</option>
            </select>
          </div>

          <div className="flex-1 w-full bg-gray-50 border border-gray-100 p-2 rounded-2xl flex items-center justify-around">
            {['ALL', 'MEDIA', 'DEPOSIT'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`text-[10px] font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest ${
                  typeFilter === type 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 2. ACTIVITY LOG */}
        <div className="flex flex-col gap-6">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {item.type === 'MEDIA' ? 'COLLECTION' : 'MEMBER INTAKE'} // #{item.id.slice(-6)}
                    </p>
                    <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">{item.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary tracking-tighter">
                      ${item.amount.toFixed(2)}
                    </p>
                    <span className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1.5 rounded-full uppercase tracking-widest">
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{item.date}</p>
                  {item.type === 'MEDIA' && (
                    <button 
                      onClick={() => setActiveMedia(item)}
                      className="text-[10px] font-black bg-gray-50 text-gray-500 hover:bg-primary hover:text-white px-6 py-3 rounded-xl transition-all uppercase tracking-widest shadow-sm"
                    >
                      View Gallery
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-[40px] border border-gray-100">
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">
                No Transactions Found
              </p>
            </div>
          )}
        </div>

        <button 
          onClick={() => window.location.href = '/'}
          className="mt-12 text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest transition-all block mx-auto"
        >
          ← Return to Gallery
        </button>
      </div>

      {/* 3. MEDIA VIEWER MODAL */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-[40px] md:rounded-[40px] overflow-hidden shadow-2xl transition-all transform animate-in slide-in-from-bottom duration-500 border border-white">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-black uppercase tracking-widest text-primary">
                  Premium Access: {activeMedia.title}
                </h2>
                <button 
                  onClick={() => setActiveMedia(null)}
                  className="font-black text-[10px] uppercase bg-gray-50 text-gray-400 px-4 py-2 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                >
                  Close [X]
                </button>
              </div>

              {/* Placeholder */}
              <div className="aspect-video bg-gray-50 rounded-[32px] flex items-center justify-center border border-gray-100 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 relative z-10">
                  Opening Media...
                </p>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-6 rounded-[24px] gap-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  File: <span className="text-gray-900 ml-2">{activeMedia.fileName}</span>
                </p>
                <button className="w-full md:w-auto bg-primary text-white text-[10px] font-black px-10 py-4 rounded-full hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all uppercase tracking-widest">
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