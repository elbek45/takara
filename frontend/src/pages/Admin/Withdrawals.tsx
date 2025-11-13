import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/api';

interface Withdrawal {
  id: string;
  amount: string;
  currency: 'TAKARA' | 'USDT';
  walletAddress: string;
  status: 'pending' | 'completed' | 'rejected';
  txSignature: string | null;
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
  user: {
    id: string;
    walletAddress: string;
  };
}

const Withdrawals: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSignature, setTxSignature] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminWithdrawals', filter],
    queryFn: () => adminService.getAllWithdrawals(),
  });

  const withdrawals: Withdrawal[] = data?.data || [];
  const filteredWithdrawals = filter === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.status === filter);

  const processWithdrawalMutation = useMutation({
    mutationFn: ({ id, action, txSig, notes }: {
      id: string;
      action: 'approve' | 'reject';
      txSig?: string;
      notes?: string;
    }) => adminService.processWithdrawal(id, action, txSig, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      setSelectedWithdrawal(null);
      setTxSignature('');
      setAdminNotes('');
      setIsProcessing(false);
    },
    onError: (error: any) => {
      alert(`Error: ${error?.message || 'Failed to process withdrawal'}`);
      setIsProcessing(false);
    },
  });

  const handleProcessWithdrawal = async (action: 'approve' | 'reject') => {
    if (!selectedWithdrawal) return;

    if (action === 'approve' && !txSignature.trim()) {
      alert('Please enter a transaction signature to approve the withdrawal');
      return;
    }

    setIsProcessing(true);
    processWithdrawalMutation.mutate({
      id: selectedWithdrawal.id,
      action,
      txSig: action === 'approve' ? txSignature : undefined,
      notes: adminNotes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer rounded-lg p-8">
          <div className="text-2xl gradient-text font-bold">Loading withdrawals...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md">
          <div className="text-red-400 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Error Loading Withdrawals</h2>
            <p className="text-gray-400">
              Failed to load withdrawal requests. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">Withdrawal Management</h1>
          <p className="text-gray-300 text-lg text-center">
            Review and process user withdrawal requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8 flex-wrap gap-4">
          {[
            { key: 'pending', label: 'Pending', count: withdrawals.filter(w => w.status === 'pending').length },
            { key: 'all', label: 'All', count: withdrawals.length },
            { key: 'completed', label: 'Completed', count: withdrawals.filter(w => w.status === 'completed').length },
            { key: 'rejected', label: 'Rejected', count: withdrawals.filter(w => w.status === 'rejected').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === tab.key
                  ? 'bg-takara-gold text-takara-dark'
                  : 'bg-takara-green bg-opacity-40 text-gray-300 hover:bg-opacity-60'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Withdrawals Table */}
        <div className="card max-w-7xl mx-auto">
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">No withdrawals found</h3>
              <p className="text-gray-400">
                {filter === 'pending'
                  ? 'No pending withdrawal requests at this time.'
                  : `No ${filter} withdrawals found.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-takara-green border-opacity-30">
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">User</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Currency</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Date</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-takara-green border-opacity-20 hover:bg-takara-green hover:bg-opacity-10">
                      <td className="py-3 px-4">
                        <div className="text-white font-mono text-sm">
                          {withdrawal.user.walletAddress.substring(0, 8)}...
                          {withdrawal.user.walletAddress.substring(withdrawal.user.walletAddress.length - 6)}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-takara-gold">
                        {parseFloat(withdrawal.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {withdrawal.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            withdrawal.status === 'completed'
                              ? 'bg-green-500 bg-opacity-20 text-green-400'
                              : withdrawal.status === 'pending'
                              ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                              : 'bg-red-500 bg-opacity-20 text-red-400'
                          }`}
                        >
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {new Date(withdrawal.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {withdrawal.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setTxSignature('');
                              setAdminNotes('');
                            }}
                            className="btn-primary text-sm py-1 px-4"
                          >
                            Process
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedWithdrawal(withdrawal)}
                            className="text-takara-gold hover:text-takara-gold-light text-sm"
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Processing Modal */}
        {selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold gradient-text mb-6">
                {selectedWithdrawal.status === 'pending' ? 'Process Withdrawal' : 'Withdrawal Details'}
              </h2>

              {/* Withdrawal Info */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">User Wallet</div>
                    <div className="text-white font-mono text-sm break-all">
                      {selectedWithdrawal.user.walletAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Amount</div>
                    <div className="text-2xl font-bold gradient-text">
                      {parseFloat(selectedWithdrawal.amount).toFixed(2)} {selectedWithdrawal.currency}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Destination Wallet</div>
                    <div className="text-white font-mono text-sm break-all">
                      {selectedWithdrawal.walletAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        selectedWithdrawal.status === 'completed'
                          ? 'bg-green-500 bg-opacity-20 text-green-400'
                          : selectedWithdrawal.status === 'pending'
                          ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                          : 'bg-red-500 bg-opacity-20 text-red-400'
                      }`}
                    >
                      {selectedWithdrawal.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Requested</div>
                    <div className="text-white text-sm">
                      {new Date(selectedWithdrawal.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {selectedWithdrawal.processedAt && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Processed</div>
                      <div className="text-white text-sm">
                        {new Date(selectedWithdrawal.processedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {selectedWithdrawal.txSignature && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Transaction Signature</div>
                    <div className="text-white font-mono text-sm break-all bg-takara-green bg-opacity-20 p-2 rounded">
                      {selectedWithdrawal.txSignature}
                    </div>
                  </div>
                )}

                {selectedWithdrawal.adminNotes && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Admin Notes</div>
                    <div className="text-white text-sm bg-takara-green bg-opacity-20 p-2 rounded">
                      {selectedWithdrawal.adminNotes}
                    </div>
                  </div>
                )}
              </div>

              {/* Processing Form (only for pending withdrawals) */}
              {selectedWithdrawal.status === 'pending' && (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Transaction Signature (Required for approval)
                      </label>
                      <input
                        type="text"
                        value={txSignature}
                        onChange={(e) => setTxSignature(e.target.value)}
                        placeholder="Enter Solana transaction signature"
                        className="w-full px-4 py-2 bg-takara-dark border border-takara-green border-opacity-30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-takara-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add any notes about this withdrawal..."
                        rows={3}
                        className="w-full px-4 py-2 bg-takara-dark border border-takara-green border-opacity-30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-takara-gold"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleProcessWithdrawal('approve')}
                      disabled={isProcessing || !txSignature.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {isProcessing ? 'Processing...' : 'Approve Withdrawal'}
                    </button>
                    <button
                      onClick={() => handleProcessWithdrawal('reject')}
                      disabled={isProcessing}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {isProcessing ? 'Processing...' : 'Reject Withdrawal'}
                    </button>
                  </div>
                </>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setTxSignature('');
                  setAdminNotes('');
                }}
                disabled={isProcessing}
                className="w-full mt-4 bg-takara-green bg-opacity-40 hover:bg-opacity-60 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdrawals;
