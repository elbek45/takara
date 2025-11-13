import React, { useState } from 'react';
import { Pool } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { investmentsService } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface InvestmentModalProps {
  pool: Pool | null;
  isOpen: boolean;
  onClose: () => void;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ pool, isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const investMutation = useMutation({
    mutationFn: (data: { poolId: string; amount: string; walletAddress: string; txSignature: string }) =>
      investmentsService.create(data.poolId, data.amount, data.walletAddress, data.txSignature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      setAmount('');
      setError('');
      onClose();
      alert('Investment successful! Your NFT Wexel miner has been minted.');
    },
    onError: (err: any) => {
      setError(err.error || 'Failed to create investment. Please try again.');
    },
  });

  if (!isOpen || !pool) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      setError('Please connect your wallet and authenticate first.');
      return;
    }

    const amountNum = parseFloat(amount);
    const minInvestment = parseFloat(pool.minInvestment);
    const maxInvestment = pool.maxInvestment ? parseFloat(pool.maxInvestment) : Infinity;
    const remaining = parseFloat(pool.targetAmount) - parseFloat(pool.currentAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (amountNum < minInvestment) {
      setError(`Minimum investment is $${minInvestment.toLocaleString()}`);
      return;
    }

    if (amountNum > maxInvestment) {
      setError(`Maximum investment is $${maxInvestment.toLocaleString()}`);
      return;
    }

    if (amountNum > remaining) {
      setError(`Only $${remaining.toLocaleString()} remaining in this pool.`);
      return;
    }

    if (!publicKey) {
      setError('Please connect your wallet first.');
      return;
    }

    // TODO: In production, create actual Solana transaction to transfer USDT
    // For now, using placeholder transaction signature
    const placeholderTxSignature = `tx_${Date.now()}_${publicKey.toBase58().slice(0, 8)}`;

    investMutation.mutate({
      poolId: pool.id,
      amount: amount,
      walletAddress: publicKey.toBase58(),
      txSignature: placeholderTxSignature
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-takara-green bg-opacity-95 backdrop-blur-lg rounded-xl p-6 max-w-md w-full border border-takara-gold border-opacity-30">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-1">Invest in Pool</h2>
            <p className="text-gray-400 text-sm">{pool.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Pool Info */}
        <div className="bg-takara-dark bg-opacity-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Duration</div>
              <div className="text-white font-semibold">{pool.durationMonths} months</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">TAKARA Multiplier</div>
              <div className="text-takara-gold font-semibold">{pool.takaraMultiplier}x</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">USDT APY</div>
              <div className="text-takara-gold font-semibold">{pool.usdtApy}%</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Min Investment</div>
              <div className="text-white font-semibold">${parseFloat(pool.minInvestment).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Investment Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-300 mb-2 font-medium">
              Investment Amount (USDT)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                $
              </span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min={pool.minInvestment}
                max={pool.maxInvestment || undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: ${pool.minInvestment}`}
                className="input-field pl-8"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Expected Rewards */}
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <div className="mb-6 p-4 bg-takara-dark bg-opacity-50 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Expected Rewards:</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">TAKARA Tokens:</span>
                  <span className="text-takara-gold font-semibold">
                    {(parseFloat(amount) * parseFloat(pool.takaraMultiplier)).toLocaleString()} TAKARA
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">USDT Rewards (Total):</span>
                  <span className="text-takara-gold font-semibold">
                    ${((parseFloat(amount) * parseFloat(pool.usdtApy) / 100) * (pool.durationMonths / 12)).toFixed(2)} USDT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={investMutation.isPending}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {investMutation.isPending ? 'Processing...' : 'Confirm Investment'}
          </button>
        </form>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-takara-gold bg-opacity-10 rounded-lg text-xs text-gray-400">
          <p className="mb-1">
            📝 Upon investment confirmation:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>An NFT Wexel miner will be created for your investment</li>
            <li>TAKARA rewards accumulate daily</li>
            <li>USDT rewards are calculated based on your investment period</li>
            <li>Rewards can be claimed anytime during the lock period</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;
