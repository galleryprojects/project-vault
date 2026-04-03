'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-mono text-[#FF6600]">
      <div className="w-full max-w-md border border-[#FF6600]/20 bg-black p-10 text-center shadow-[0_0_50px_rgba(255,102,0,0.1)] relative overflow-hidden">
        
        {/* GLITCH DECORATION */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6600] animate-pulse"></div>
        
        <h1 className="text-[80px] font-black tracking-tighter leading-none mb-4 opacity-80">404</h1>
        
        <div className="space-y-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.3em]">// ACCESS_DENIED_OR_NOT_FOUND</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
            The requested protocol address does not exist or has been terminated. 
            Redirecting to home node for security.
          </p>
        </div>

        <div className="mt-10">
          <Link 
            href="/" 
            className="inline-block border border-[#FF6600] text-[#FF6600] px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#FF6600] hover:text-black transition-all"
          >
            [ RETURN_TO_BASE ]
          </Link>
        </div>

        {/* SYSTEM STATUS FOOTER */}
        <div className="mt-12 pt-6 border-t border-[#FF6600]/10">
          <span className="text-[8px] text-gray-700 uppercase font-bold tracking-widest">
            NODE_STATUS: DISCONNECTED | ERROR_CODE: 0x93A4
          </span>
        </div>
      </div>
    </div>
  );
}