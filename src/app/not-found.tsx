'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    // Clean white background, elegant sans-serif font
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      
      {/* Soft rounded card with a light shadow */}
      <div className="w-full max-w-md border border-gray-100 bg-white p-10 text-center shadow-2xl shadow-primary/5 relative overflow-hidden rounded-[32px]">
        
        {/* Soft pink ambient glow in the background */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        {/* Main Title: Black as requested */}
        <h1 className="text-[80px] font-black tracking-tighter leading-none mb-4 text-black relative z-10">
          404
        </h1>
        
        <div className="space-y-4 relative z-10">
          <h2 className="text-[14px] font-black uppercase tracking-widest text-gray-800">
            Page Not Found
          </h2>
          <p className="text-[10px] text-red-400 uppercase tracking-widest leading-relaxed font-bold px-4">
            The page you are looking for does not exist or has been moved. 
          </p>
        </div>

        <div className="mt-10 relative z-10">
          <Link 
            href="/" 
            className="block w-full bg-primary text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            Return to Collection
          </Link>
        </div>

      </div>
    </div>
  );
}