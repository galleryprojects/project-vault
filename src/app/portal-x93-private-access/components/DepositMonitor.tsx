'use client';

import React, { useEffect, useState } from 'react';
import { getPendingDeposits, approveDeposit, rejectDeposit } from '../../actions/admin';

export default function DepositMonitor() {
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);

  const loadDeposits = async () => {
    const data = await getPendingDeposits();
    setPendingDeposits(data);
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handleApprove = async (dep: any) => {
    const confirm = window.confirm(`Update balance for ${dep.profiles?.username || 'user'} by $${dep.amount}?`);
    if (!confirm) return;

    setIsProcessingDeposit(dep.id);
    const res = await approveDeposit(dep.id, dep.user_id, dep.amount);
    
    if (res.success) {
      alert(`Success: User balance updated. New Total: $${res.newBalance}`);
      loadDeposits();
    } else {
      alert(`Error: Unable to process the request at this time.`);
    }
    setIsProcessingDeposit(null);
  };

  const handleDeclineSubmit = async (id: string, reason: string) => {
    setIsProcessingDeposit(id);
    // Passing false because this is from the web admin, not Telegram
    const res = await rejectDeposit(id, reason, false);
    if (res.success) {
      loadDeposits();
    } else {
      alert(`System Error: Could not update the ledger.`);
    }
    setDeclineId(null);
    setIsProcessingDeposit(null);
  };

  return (
    <div className="max-w-6xl animate-in fade-in duration-500">
      <header className="mb-10 border-b border-gray-800 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-[24px] font-bold text-white">Deposit Requests</h2>
          <p className="text-[12px] text-gray-400 mt-2">Manage pending account credits</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-semibold text-blue-400">Total in Queue: {pendingDeposits.length}</p>
        </div>
      </header>

      <div className="border border-gray-800 bg-black/50 overflow-hidden shadow-2xl rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-black/80">
              <th className="p-5">Date</th>
              <th className="p-5">User</th>
              <th className="p-5">Platform</th>
              <th className="p-5">Reference Code</th>
              <th className="p-5 text-center">Amount</th>
              <th className="p-5 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {pendingDeposits.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-600 text-[12px]">
                  No pending requests found.
                </td>
              </tr>
            ) : (
              pendingDeposits.map((req) => (
                <tr key={req.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                  
                  {/* DATA COLUMNS */}
                  <td className="p-5 text-gray-400 text-[12px]">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-5 text-white font-medium">
                    {req.profiles?.user_id_display || req.profiles?.username || 'Unknown User'}
                  </td>
                  <td className="p-5">
                    <span className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-[10px] text-blue-400 rounded">
                      {req.platform}
                    </span>
                  </td>
                  <td className="p-5 font-mono text-[12px] text-gray-300">
                    {req.code}
                  </td>
                  <td className="p-5 text-center text-white font-bold">
                    ${req.amount}
                  </td>

                  {/* ACTION COLUMN */}
                  <td className="p-5 text-right">
                    {declineId === req.id ? (
                      <div className="flex gap-2 justify-end animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => handleDeclineSubmit(req.id, 'FAILED: BAD CARD')} 
                          className="bg-red-500/10 text-red-500 border border-red-500/30 px-3 py-2 text-[10px] font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        >
                          Bad Card
                        </button>
                        <button 
                          onClick={() => handleDeclineSubmit(req.id, 'FAILED: WRONG CODE')} 
                          className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-2 text-[10px] font-bold rounded-lg hover:bg-yellow-500 hover:text-white transition-all"
                        >
                          Wrong Code
                        </button>
                        <button 
                          onClick={() => setDeclineId(null)} 
                          className="text-gray-500 text-[10px] uppercase font-bold px-2 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-3">
                        <button 
                          disabled={isProcessingDeposit === req.id} 
                          onClick={() => handleApprove(req)} 
                          className="bg-blue-600 text-white px-5 py-2 text-[11px] font-bold rounded-lg hover:bg-blue-500 transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button 
                          disabled={isProcessingDeposit === req.id}
                          onClick={() => setDeclineId(req.id)} 
                          className="border border-red-500/30 text-red-400 px-5 py-2 text-[11px] font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
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