'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkIsFirstTimer } from '@/app/actions/auth';

export default function DepositInterceptor() {
  const router = useRouter();
  const pathname = usePathname();
  const [isFirstTimer, setIsFirstTimer] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // 🚨 PATCH 1: THE KILL SWITCH
  // If the user is ALREADY on the deposit page, never show the overlay
  useEffect(() => {
    if (pathname === '/deposit') {
      setShowOverlay(false);
    }
  }, [pathname]);

  useEffect(() => {
    const verifyUser = async () => {
      const isNew = await checkIsFirstTimer();
      setIsFirstTimer(isNew);
    };
    verifyUser();
  }, []);

  useEffect(() => {
    // Rules: Don't start timer if already on deposit/auth pages or if not a first timer
    if (!isFirstTimer || pathname === '/deposit' || pathname === '/login' || pathname === '/signup') return;

    const interceptTimer = setTimeout(() => {
      setShowOverlay(true);

      setTimeout(() => {
        router.push('/deposit');
      }, 3000);

    }, 59000); 

    return () => clearTimeout(interceptTimer);
  }, [isFirstTimer, pathname, router]);

  // 🚨 PATCH 2: RENDER PROTECTION
  // If showOverlay is true BUT we are already on /deposit, don't render!
  if (!showOverlay || pathname === '/deposit') return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-8 max-w-xs w-full text-center">
        
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center animate-pulse">
           <div className="w-10 h-10 bg-primary rounded-2xl rotate-45" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Top Up Wallet To Continue</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
            Redirecting To Deposit Page...<br/>one moment please.
          </p>
        </div>

        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-[loading_3s_ease-in-out]" style={{ width: '100%' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}