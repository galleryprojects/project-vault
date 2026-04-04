// src/app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono text-[#FF6600]">
      <div className="flex flex-col items-center gap-6">
        {/* GLITCHY SPINNER */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-[#FF6600]/20 rounded-full"></div>
          <div className="absolute inset-0 border-t-2 border-[#FF6600] rounded-full animate-spin"></div>
        </div>
        
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] animate-pulse block">
            // SYNCHRONIZING_MAIN_NODE
          </span>
          <span className="text-[8px] text-gray-600 uppercase tracking-widest block">
            ESTABLISHING_ENCRYPTED_TUNNEL...
          </span>
        </div>
      </div>
    </div>
  );
}