'use client';

import React, { useState } from 'react';
import { completeOnboardingAction } from '@/app/actions/auth';

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEnter = async () => {
    setIsProcessing(true);
    await completeOnboardingAction();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center overflow-hidden font-sans">
      
      {/* THE WELCOME CARD (80% HEIGHT) */}
      <div className="relative w-[90%] h-[80%] bg-white rounded-[40px] shadow-2xl shadow-black/5 flex flex-col items-center justify-center p-12 text-center border border-gray-50">
        
        {/* REDUCED PINK: 3% Opacity for maximum clean-luxury vibe */}
        <div className="absolute top-0 left-0 w-full h-full bg-primary/[0.03] blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-light uppercase tracking-[0.4em] text-gray-900 mb-6 leading-tight">
            Welcome <br /> 
            <span className="font-black italic text-primary drop-shadow-sm">To The Collection</span>
          </h1>
          
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em] mb-12">
            Elevated Access • Premium Media
          </p>

          {/* THE BOUNCING BUTTON */}
          <button 
            onClick={handleEnter}
            disabled={isProcessing}
            className={`group flex flex-col items-center gap-6 transition-all active:scale-95 ${!isProcessing ? 'animate-bounce' : ''}`}
          >
            <div className="w-16 h-16 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500 shadow-sm">
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              ) : (
                <span className="text-2xl text-primary group-hover:text-white transition-colors">→</span>
              )}
            </div>
            <span className="text-[8px] font-black text-primary/40 uppercase tracking-[0.3em] group-hover:text-primary transition-colors">
              {isProcessing ? 'Opening...' : 'Click arrow to Access'}
            </span>
          </button>
        </div>

        {/* Subtle Bottom Branding */}
        <div className="absolute bottom-10 text-[7px] font-black text-gray-300 uppercase tracking-[1em]">
          SY EXCLUSIVE • MEDIA FACTORY
        </div>
      </div>
    </div>
  );
}