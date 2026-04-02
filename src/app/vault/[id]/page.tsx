'use client';

// [1] SETUP: Imports and Dummy Thumbnails for the background
import { useState } from 'react';

export default function VaultInside() {
  // We'll use 20 dummy blocks to simulate the "Tease" background
  const thumbnails = Array.from({ length: 20 }, (_, i) => i);

  return (
    <main className="min-h-screen bg-[#F7F7F5] relative overflow-hidden font-sans">
      
      {/* THE NUCLEAR BYPASS */}

      {/* [2] MATCHING HEADER: Exactly like your dashboard screenshot */}
      <nav className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 z-[100] flex items-center px-4">
        <div className="flex w-full max-w-7xl mx-auto items-center justify-between relative">
          <div className="flex items-center">
            <div className="flex flex-col gap-1 pr-4 border-r border-gray-100 py-1">
              <div className="w-6 h-0.5 bg-black"></div>
              <div className="w-6 h-0.5 bg-black"></div>
              <div className="w-6 h-0.5 bg-black"></div>
            </div>
          </div>
          <div className="absolute left-1/3 -translate-x-1/2">
            <h1 className="text-[14px] font-[900] tracking-[0.3em] uppercase italic">PROJECT-VAULT</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[13px] font-black text-[#111]">$3.00</span>
              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Credits</span>
            </div>
            <button className="bg-[#FF6600] text-white text-[10px] font-[900] px-5 py-2.5 rounded-full shadow-lg uppercase tracking-widest">Deposit</button>
          </div>
        </div>
      </nav>

      {/* [3] THE "TEASE" GRID: Blurry thumbnails in the background */}
      <div className="pt-24 px-4 pb-12 blur-[12px] pointer-events-none opacity-40">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {thumbnails.map((i) => (
            <div key={i} className="aspect-square bg-gray-300 rounded-lg relative overflow-hidden border border-black/5">
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] font-black opacity-20 uppercase tracking-[0.5em] -rotate-45">Locked Content</span>
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* [4] THE UNLOCK POPUP: Floating Glassmorphism Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
        <div className="w-full max-w-[400px] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
          
          {/* Subtle Glow behind the icon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FF6600]/20 blur-[60px] rounded-full -z-10"></div>

          <span className="inline-block text-4xl mb-6">🔒</span>
          
          <h2 className="text-xl font-[900] text-white uppercase tracking-widest mb-2">Unlock Access</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">
            One-Time Decryption Fee Required
          </p>

          {/* [5] PRICING & BALANCE BLOCK */}
          <div className="bg-white/5 border border-white/5 rounded-2xl py-6 mb-8">
            <div className="flex flex-col gap-1">
              <span className="text-[28px] font-[900] text-[#FF6600] tracking-tighter leading-none">$6.00</span>
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Vault Credits</span>
            </div>
            <div className="mt-4 h-[1px] w-12 bg-white/10 mx-auto"></div>
            <p className="text-[9px] font-bold text-gray-400 mt-4 uppercase tracking-widest">
                Your Balance: <span className="text-white">$3.00</span>
            </p>
          </div>

          {/* [6] THE ACTION BUTTONS */}
          <div className="flex flex-col gap-4">
            <button className="w-full bg-[#FF6600] text-white py-4 rounded-full font-[900] uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(255,102,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
              Unlock Vault ($6.00)
            </button>
            
            <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
              Deposit Credits
            </button>
          </div>

        </div>
      </div>

    </main>
  );
}