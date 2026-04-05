'use client';

import React, { useEffect, useState } from 'react';
import { getPendingDeposits, approveDeposit, rejectDeposit } from '../../actions/admin';

export default function DepositMonitor() {
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState<string | null>(null);

  const loadDeposits = async () => {
    const data = await getPendingDeposits();
    setPendingDeposits(data);
  };

  // Fetch immediately when the tab loads
  useEffect(() => {
    loadDeposits();
  }, []);

  const handleApprove = async (dep: any) => {
    const confirm = window.confirm(`// AUTHORIZE_CREDIT_SYNC\nUSER: ${dep.profiles?.username || 'UNKNOWN'}\nAMOUNT: +$${dep.amount}\n\nPROCEED?`);
    if (!confirm) return;

    setIsProcessingDeposit(dep.id);
    const res = await approveDeposit(dep.id, dep.user_id, dep.amount);
    if (res.success) {
      alert(`[ SYSTEM ] CREDITS_INJECTED: New Balance: $${res.newBalance}`);
      loadDeposits();
    } else {
      alert(`[ ERROR ] ${res.error}`);
    }
    setIsProcessingDeposit(null);
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("DENY_CLAIM: Are you sure?")) return;
    const res = await rejectDeposit(id);
    if (res.success) loadDeposits();
  };

  return (
    <div className="max-w-6xl animate-in fade-in duration-500">
      <header className="mb-10 border-b border-[#3B82F6]/20 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-[24px] font-black uppercase tracking-widest text-white">Inbound Credit Monitor</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">// PENDING_GIFT_CARD_CLAIMS</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-[#3B82F6] uppercase tracking-[0.2em]">QUEUE_COUNT: {pendingDeposits.length}</p>
        </div>
      </header>

      <div className="border border-[#3B82F6]/20 bg-black/50 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#3B82F6]/20 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 bg-black">
              <th className="p-5">TIMESTAMP</th>
              <th className="p-5">GHOST_ID</th>
              <th className="p-5">PLATFORM</th>
              <th className="p-5">CODE_REFERENCE</th>
              <th className="p-5 text-center">AMOUNT</th>
              <th className="p-5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {pendingDeposits.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-700 text-[10px] tracking-widest uppercase">
                  // NO_PENDING_CLAIMS_IN_MAIN_FRAME
                </td>
              </tr>
            ) : (
              pendingDeposits.map((dep) => (
                <tr key={dep.id} className="border-b border-[#3B82F6]/10 hover:bg-[#3B82F6]/5 transition-colors">
                  <td className="p-5 text-gray-400 text-[10px]">{new Date(dep.created_at).toLocaleString()}</td>
                  <td className="p-5 font-bold uppercase">
                    {/* Priority 1: Custom Display ID | Priority 2: Username | Fallback: Raw ID */}
                    {dep.profiles?.user_id_display || dep.profiles?.username || (
                      <span className="text-red-500 opacity-50">
                        {dep.user_id.slice(0, 8)}... (NO_PROFILE)
                      </span>
                    )}
                  </td>
                  <td className="p-5">
                    <span className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-2 py-1 text-[9px] text-[#3B82F6]">
                      {dep.platform}
                    </span>
                  </td>
                  <td className="p-5 text-[#3B82F6] font-mono text-[11px] tracking-tighter">{dep.code}</td>
                  <td className="p-5 text-center text-white font-black text-[12px]">${dep.amount}</td>
                  <td className="p-5 text-right space-x-3">
                    <button 
                      disabled={isProcessingDeposit === dep.id}
                      onClick={() => handleApprove(dep)}
                      className="bg-[#3B82F6] text-black px-4 py-2 text-[9px] font-black uppercase hover:bg-white transition-all disabled:opacity-50"
                    >
                      [ APPROVE ]
                    </button>
                    <button 
                      onClick={() => handleReject(dep.id)}
                      className="border border-red-500 text-red-500 px-4 py-2 text-[9px] font-black uppercase hover:bg-red-500 hover:text-black transition-all"
                    >
                      [ DENY ]
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}