'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('SYSTEM_CRASH_LOG:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-mono text-red-500">
      <div className="w-full max-w-md border border-red-500/20 bg-black p-10 text-center shadow-[0_0_50px_rgba(255,0,0,0.05)] relative overflow-hidden">
        
        {/* CRITICAL ALARM DECORATION */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
        
        <h1 className="text-[60px] font-black tracking-tighter leading-none mb-4 opacity-80">CRITICAL</h1>
        
        <div className="space-y-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.3em] text-white">
            // UNEXPECTED_SYSTEM_FAILURE
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
            A core protocol has malfunctioned. The current session has been interrupted to prevent data corruption.
          </p>
          
          {/* ERROR HASH DISPLAY */}
          <div className="bg-red-500/5 border border-red-500/10 p-3 mt-4">
            <p className="text-[8px] font-mono text-red-400/60 break-all uppercase">
              ERR_ID: {error.digest || 'UNKNOWN_INSTANCE'}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-red-600 text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg"
          >
            [ ATTEMPT_REBOOT ]
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full border border-gray-800 text-gray-500 px-8 py-3 text-[9px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all"
          >
            [ DISCONNECT_TO_HOME ]
          </button>
        </div>

        {/* SYSTEM STATUS FOOTER */}
        <div className="mt-12 pt-6 border-t border-red-500/10">
          <span className="text-[8px] text-gray-700 uppercase font-bold tracking-widest animate-pulse">
            SYSTEM_INTEGRITY: COMPROMISED | KERNEL_PANIC
          </span>
        </div>
      </div>
    </div>
  );
}