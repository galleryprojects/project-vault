'use client';

import React, { useState, useEffect } from 'react';
import { getLedger } from '../actions/auth'; 

// --- TYPES ---
interface VaultEntry {
  id: string;
  displayId: string;
  type: 'MEDIA' | 'DEPOSIT';
  title: string;
  amount: number;
  status: string;
  date: string; // Now an ISO string
  fileName?: string;
  mediaUrl?: string;
}

export default function OrderHistory() {
  // --- STATE ---
  const [data, setData] = useState<VaultEntry[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [timeFilter, setTimeFilter] = useState('7 Days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  // NEW: Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- FETCH REAL DATA & HANDLE URL PARAMS ---
  useEffect(() => {
    // 1. Safely check the URL for a specific tab request
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get('tab');
    if (requestedTab === 'DEPOSIT' || requestedTab === 'MEDIA') {
      setTypeFilter(requestedTab);
    }

    // 2. Fetch the data
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

  // NEW: Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 if they change filters
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, timeFilter]);

  const totalSpent = filteredData
    .filter(item => item.type === 'MEDIA')
    .reduce((sum, item) => sum + item.amount, 0)
    .toFixed(2);

  // STATUS COLOR HELPER
  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('SUCCESS')) return 'bg-green-500/10 text-green-500';
    if (s.includes('FAILED') || s.includes('UNDERPAID')) return 'bg-red-500/10 text-red-500';
    return 'bg-primary/10 text-primary';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em] text-primary animate-pulse">
        Opening Ledger...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-24 px-4 font-sans text-gray-900 relative overflow-hidden pb-20">
      
      {/* Background Pink Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-3xl mx-auto z-10 relative">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 border-b border-gray-100 pb-8 gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-primary">
              Sy Exclusive
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
          {paginatedData.length > 0 ? (
            paginatedData.map((item) => {
              // Parse Date and Time
              const d = new Date(item.date);
              const formattedDate = d.toLocaleDateString();
              const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={item.id} 
                  className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        {item.type === 'MEDIA' ? 'COLLECTION' : 'Order Id'}  #{item.displayId}
                      </p>
                      <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">{item.title}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary tracking-tighter mb-2">
                        ${item.amount.toFixed(2)}
                      </p>
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                    {/* UPDATED: Displays Date and Time underneath */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-800 uppercase">{formattedDate}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{formattedTime}</p>
                    </div>

                    {item.type === 'MEDIA' && item.mediaUrl && (
                      <button 
                        onClick={() => window.open(`/vault/${encodeURIComponent(item.mediaUrl!)}`, '_blank')}
                        className="text-[10px] font-black bg-gray-50 text-gray-500 hover:bg-primary hover:text-white px-6 py-3 rounded-xl transition-all uppercase tracking-widest shadow-sm"
                      >
                        View Gallery
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-[40px] border border-gray-100">
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">
                No Transactions Found
              </p>
            </div>
          )}
        </div>

        {/* 3. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-10">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:text-primary hover:border-primary transition-all disabled:opacity-30"
            >
              ← Previous
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:text-primary hover:border-primary transition-all disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}

        <button 
          onClick={() => window.location.href = '/'}
          className="mt-12 text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest transition-all block mx-auto"
        >
          ← Return to Gallery
        </button>
      </div>
    </main>
  );
}