'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center font-mono text-[#FF6600]">
      <div className="flex flex-col items-center gap-8">
        {/* THE ANIMATED CIRCLE */}
        <div className="relative">
          {/* Static outer ring */}
          <div className="w-20 h-20 border-4 border-[#FF6600]/10 rounded-full"></div>
          {/* Spinning inner ring */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-[#FF6600] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-[#FF6600] rounded-full animate-ping"></span>
            <span className="text-[11px] uppercase tracking-[0.5em] font-black">
               Hey ya, just a sec...
            </span>
          </div>
          <span className="text-[9px] text-gray-600 uppercase tracking-widest block opacity-70">
             Hey ya, just a sec...
          </span>
        </div>
      </div>
    </div>
  );
}