'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Loading() {
  const pathname = usePathname();
  const isAdmin = pathname?.includes('portal-x93');
  
  // Dynamic colors based on route
  const primaryColor = isAdmin ? '#3B82F6' : '#FF69B4'; // Blue vs Pink
  const bgColor = isAdmin ? 'bg-[#0a0a0a]' : 'bg-white';
  const textColor = isAdmin ? 'text-[#3B82F6]' : 'text-gray-900';

  return (
    <div className={`fixed inset-0 z-[9999] ${bgColor} flex items-center justify-center font-sans`}>
      
      {/* Pink accents only for users */}
      {!isAdmin && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        </>
      )}

      <div className="flex flex-col items-center gap-8 relative z-10">
        <div className="relative">
          <div className="w-16 h-16 border-4 rounded-full opacity-10" style={{ borderColor: primaryColor }}></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }}></div>
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }}></span>
            <span className={`text-[12px] uppercase tracking-[0.4em] font-black ${textColor}`}>
              {isAdmin ? 'System_Sync' : 'Fine Media'}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            {isAdmin ? 'Session in Progress' : 'Please Wait...'}
          </p>
        </div>
      </div>
    </div>
  );
}