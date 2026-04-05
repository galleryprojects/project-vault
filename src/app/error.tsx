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
    // Log the error silently for your records
    console.error('Application Error:', error);
  }, [error]);

  return (
    // Clean white background, elegant sans-serif font
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      
      {/* Soft rounded card with a light shadow */}
      <div className="w-full max-w-md border border-gray-100 bg-white p-10 text-center shadow-2xl shadow-primary/5 relative overflow-hidden rounded-[32px]">
        
        {/* Soft pink ambient glow in the background */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        {/* Main Title: Black as requested */}
        <h1 className="text-[50px] font-black tracking-tighter leading-none mb-4 text-black relative z-10">
          ERROR 404
        </h1>
        
        <div className="space-y-4 relative z-10">
          <h2 className="text-[14px] font-black uppercase tracking-widest text-gray-800">
            Unexpected Issue
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed font-bold px-4">
            We encountered a problem while loading this page. Our team has been notified.
          </p>
          
          {/* ERROR DISPLAY IN RED */}
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mt-4">
            <p className="text-[10px] font-bold text-red-500 break-all uppercase tracking-widest">
              {error.message || 'Unknown Error Occurred'}
            </p>
            {error.digest && (
              <p className="text-[8px] font-black text-red-400 mt-2 uppercase tracking-widest">
                Ref Code: {error.digest}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 relative z-10">
          {/* Primary Action Button */}
          <button
            onClick={() => reset()}
            className="w-full bg-primary text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            Try Again
          </button>
          
          {/* Secondary Action Button */}
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-50 text-gray-600 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 hover:text-black transition-all"
          >
            Return to Collection
          </button>
        </div>

      </div>
    </div>
  );
}