'use client';

import React from 'react';

// Define what the stats data looks like so TypeScript is happy
interface VaultStat {
  id: string;
  tier1: number;
  tier2: number;
  tier3: number;
  total: number;
}

interface MetricsViewProps {
  vaultStats: VaultStat[] | any[];
}

export default function MetricsView({ vaultStats }: MetricsViewProps) {
  return (
    <div className="max-w-6xl animate-in fade-in duration-500">
      <header className="mb-10 border-b border-[#FF6600]/20 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-[24px] font-black uppercase tracking-widest text-white">Archive Stats</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">// LIVE_STORAGE_METRICS</p>
        </div>
        <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-[0.2em] animate-pulse">STATUS: ONLINE</span>
      </header>

      <div className="border border-[#FF6600]/20 bg-black/50 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#FF6600]/20 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 bg-black">
              <th className="p-5">MEDIA_SLUG</th>
              <th className="p-5 text-center">TIER_01</th>
              <th className="p-5 text-center">TIER_02</th>
              <th className="p-5 text-center">TIER_03</th>
              <th className="p-5 text-right">ASSET_TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {vaultStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-700 text-[10px] tracking-widest uppercase">
                  // NO_METRICS_AVAILABLE
                </td>
              </tr>
            ) : (
              vaultStats.map((vault) => (
                <tr key={vault.id} className="border-b border-[#FF6600]/10 hover:bg-[#FF6600]/5 transition-colors">
                  <td className="p-5">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white">{vault.id}</span>
                  </td>
                  <td className="p-5 text-center text-gray-400 text-[11px]">{vault.tier1 || 0}</td>
                  <td className="p-5 text-center text-gray-400 text-[11px]">{vault.tier2 || 0}</td>
                  <td className="p-5 text-center text-gray-400 text-[11px]">{vault.tier3 || 0}</td>
                  <td className="p-5 text-right font-black text-[#FF6600] text-[12px]">{vault.total || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}