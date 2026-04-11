'use client';

import React, { useState, useEffect } from 'react';
import { getProfile, getMyTickets, submitSupportTicket } from '../actions/auth';

export default function SupportDashboard() {
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // REAL DATA STATE (Replaces MOCK_TICKETS)
  const [tickets, setTickets] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // UI States
  const [activeTab, setActiveTab] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [isComposing, setIsComposing] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [newCategory, setNewCategory] = useState('DEPOSIT');
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    async function init() {
      const profile = await getProfile();
      setUserProfile(profile);
       const userTickets = await getMyTickets(); 
       setTickets(userTickets);
      setLoading(false);
    }
    init();
  }, []);

  // --- FILTER & PAGINATION LOGIC ---
  const filteredTickets = tickets.filter(t => {
    // 1. Status Filter
    if (activeTab !== 'ALL' && t.status !== activeTab) return false;
    
    // 2. Date Filter (Assuming 'created_at' comes from Supabase)
    if (timeFilter !== 'All Time' && t.created_at) {
      const ticketDate = new Date(t.created_at).getTime();
      const now = new Date().getTime();
      const diffDays = (now - ticketDate) / (1000 * 3600 * 24);
      
      if (timeFilter === '7 Days' && diffDays > 7) return false;
      if (timeFilter === '30 Days' && diffDays > 30) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Auto-reset to page 1 if they change filters
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, timeFilter]);

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s === 'OPENED') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (s === 'PENDING') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-gray-100 text-gray-500 border-gray-200'; // CLOSED
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('category', newCategory);
    formData.append('message', newMessage);
    if (imageFile) formData.append('image', imageFile);
    
    const result = await submitSupportTicket(formData);

    if (result?.error) {
      // 🚨 SILENT LOG: This prints to your browser console / terminal for you to debug
      console.error("[SYSTEM FAULT] Ticket Creation Failed:", result.error);
      
      // USER UI: Polite and generic
      alert("⚠️ We encountered an issue submitting your ticket. Please try again later.");
      return; 
    }

    alert("✅ Ticket generated successfully!");
    setIsComposing(false);
    setNewMessage('');
    setImageFile(null);
    
    const freshTickets = await getMyTickets();
    setTickets(freshTickets);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-black uppercase text-[10px] tracking-[0.5em] text-primary animate-pulse">
        Loading Inbox...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] font-sans text-gray-900 pb-20">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full h-[64px] bg-white border-b border-gray-200 z-[100] flex items-center px-4 shadow-sm">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-[14px] sm:text-[18px] text-primary font-black tracking-[0.3em] uppercase italic leading-none">
            Support Center
          </h1>
          <div className="text-right">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active User</p>
            <p className="text-[12px] font-black uppercase tracking-widest">{userProfile?.username || 'GHOST'}</p>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      <div className="max-w-5xl mx-auto pt-32 px-4">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Inbox & Tickets</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Manage your support inquiries and communications.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Date Dropdown */}
            <div className="bg-white border border-gray-200 px-5 py-3 rounded-full flex items-center shadow-sm w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase text-gray-400 mr-3">Date:</span>
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-xs font-black uppercase bg-transparent outline-none cursor-pointer text-primary"
              >
                <option value="All Time">All Time</option>
                <option value="7 Days">7 Days</option>
                <option value="30 Days">30 Days</option>
              </select>
            </div>

            <button 
              onClick={() => setIsComposing(true)}
              className="bg-black text-white px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Ticket
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-4 overflow-x-auto">
          {['ALL', 'OPENED', 'PENDING', 'CLOSED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white border-2 border-black shadow-sm text-black' 
                  : 'text-gray-400 hover:text-black border-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Ticket List (Email Rows) */}
        <div className="flex flex-col gap-3">
          {paginatedTickets.map((ticket) => {
             const formattedDate = new Date(ticket.created_at).toLocaleDateString();

             return (
              <div 
                key={ticket.id}
                className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">#{ticket.display_id || ticket.id.slice(0,8)}</span>
                      <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded uppercase tracking-widest">{ticket.category}</span>
                    </div>
                    <h3 className="text-[14px] font-bold text-gray-900 truncate max-w-md">{ticket.message}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formattedDate}</span>
                </div>
              </div>
             );
          })}

          {paginatedTickets.length === 0 && (
            <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">No Tickets Found</p>
            </div>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-10">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:text-primary hover:border-primary transition-all disabled:opacity-30 bg-white"
            >
              ← Previous
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:text-primary hover:border-primary transition-all disabled:opacity-30 bg-white"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Compose Modal (New Ticket) */}
      {isComposing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight">Compose Ticket</h3>
              <button onClick={() => setIsComposing(false)} className="text-gray-400 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="DEPOSIT">Deposit Issue</option>
                  <option value="VAULT">Vault / Media Access</option>
                  <option value="CRYPTO">Crypto Wallet</option>
                  <option value="ACCOUNT">Account / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Message</label>
                <textarea 
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[150px] resize-none"
                ></textarea>
              </div>

              {/* Image Upload Option */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Attach Screenshot (Optional)</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer group bg-white">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {imageFile ? (
                    <div className="text-center pointer-events-none">
                      <p className="text-[11px] font-bold text-primary">{imageFile.name}</p>
                      <p className="text-[9px] text-gray-400 uppercase mt-1 tracking-widest">Click to change file</p>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-primary mb-2 transition-colors"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upload Image</span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all mt-2"
              >
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}