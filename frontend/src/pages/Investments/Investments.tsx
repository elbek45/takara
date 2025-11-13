import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentsService } from '../../services/api';
import { Investment } from '../../types';

const Investments: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['investments'],
    queryFn: () => investmentsService.getAll(),
  });

  const claimMutation = useMutation({
    mutationFn: ({ id, currency }: { id: string; currency: 'TAKARA' | 'USDT' }) =>
      investmentsService.claimRewards(id, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      alert('Rewards claimed successfully!');
    },
    onError: (err: any) => {
      alert(err.error || 'Failed to claim rewards. Please try again.');
    },
  });

  const investments: Investment[] = data?.data || [];

  const handleClaim = (id: string, currency: 'TAKARA' | 'USDT') => {
    if (window.confirm(`Are you sure you want to claim your ${currency} rewards?`)) {
      claimMutation.mutate({ id, currency });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'completed':
        return 'text-gray-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer rounded-lg p-8">
          <div className="text-2xl gradient-text font-bold">Loading investments...</div>
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
            <h2 className="text-xl font-bold mb-2">Error Loading Investments</h2>
            <p className="text-gray-400">
              Failed to load your investments. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="section-title text-center">My Investments</h1>
          <div className="card max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">💎</div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">No Investments Yet</h3>
            <p className="text-gray-400 mb-6">
              Start investing in our pools to earn TAKARA tokens and USDT rewards.
            </p>
            <a href="/pools" className="btn-primary inline-block">
              Explore Pools
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalTakaraEarned = investments.reduce((sum, inv) => sum + parseFloat(inv.takaraReward), 0);
  const totalUsdtEarned = investments.reduce((sum, inv) => sum + parseFloat(inv.usdtReward), 0);
  // Reserved for future use
  // const totalTakaraClaimed = investments.reduce((sum, inv) => sum + parseFloat(inv.takaraClaimed), 0);
  // const totalUsdtClaimed = investments.reduce((sum, inv) => sum + parseFloat(inv.usdtClaimed), 0);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h1 className="section-title text-center">My Investments</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-7xl mx-auto">
          <div className="card text-center">
            <div className="text-sm text-gray-400 mb-1">Total Invested</div>
            <div className="text-2xl font-bold gradient-text">${totalInvested.toLocaleString()}</div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-gray-400 mb-1">TAKARA Earned</div>
            <div className="text-2xl font-bold gradient-text">{totalTakaraEarned.toLocaleString()}</div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-gray-400 mb-1">USDT Earned</div>
            <div className="text-2xl font-bold gradient-text">${totalUsdtEarned.toLocaleString()}</div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-gray-400 mb-1">Active Investments</div>
            <div className="text-2xl font-bold gradient-text">
              {investments.filter((i) => i.status === 'active').length}
            </div>
          </div>
        </div>

        {/* Investments List */}
        <div className="max-w-7xl mx-auto space-y-6">
          {investments.map((investment) => {
            const progress =
              ((new Date().getTime() - new Date(investment.startDate).getTime()) /
                (new Date(investment.endDate).getTime() - new Date(investment.startDate).getTime())) *
              100;
            const cappedProgress = Math.min(Math.max(progress, 0), 100);

            return (
              <div key={investment.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-takara-gold mb-1">
                      {investment.pool?.name || 'Investment Pool'}
                    </h3>
                    <span className={`text-sm font-medium ${getStatusColor(investment.status)}`}>
                      {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right mt-2 md:mt-0">
                    <div className="text-2xl font-bold text-white">${parseFloat(investment.amount).toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Investment Amount</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Time Progress</span>
                    <span className="text-takara-gold font-semibold">{cappedProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-takara-dark rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-takara-gold to-takara-gold-light transition-all duration-500"
                      style={{ width: `${cappedProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-400">
                    <span>{new Date(investment.startDate).toLocaleDateString()}</span>
                    <span>{new Date(investment.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Rewards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* TAKARA Rewards */}
                  <div className="bg-takara-dark bg-opacity-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">TAKARA Rewards</div>
                        <div className="text-xl font-bold text-takara-gold">
                          {parseFloat(investment.takaraReward).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaim(investment.id, 'TAKARA')}
                        disabled={
                          parseFloat(investment.takaraReward) <= parseFloat(investment.takaraClaimed) ||
                          claimMutation.isPending
                        }
                        className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Claim
                      </button>
                    </div>
                    <div className="text-xs text-gray-400">
                      Claimed: {parseFloat(investment.takaraClaimed).toLocaleString()} TAKARA
                    </div>
                  </div>

                  {/* USDT Rewards */}
                  <div className="bg-takara-dark bg-opacity-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">USDT Rewards</div>
                        <div className="text-xl font-bold text-takara-gold">
                          ${parseFloat(investment.usdtReward).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaim(investment.id, 'USDT')}
                        disabled={
                          parseFloat(investment.usdtReward) <= parseFloat(investment.usdtClaimed) ||
                          claimMutation.isPending
                        }
                        className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Claim
                      </button>
                    </div>
                    <div className="text-xs text-gray-400">
                      Claimed: ${parseFloat(investment.usdtClaimed).toLocaleString()} USDT
                    </div>
                  </div>
                </div>

                {/* NFT Miner Info */}
                {investment.nftMiner && (
                  <div className="mt-4 pt-4 border-t border-takara-gold border-opacity-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">🎨</div>
                        <div>
                          <div className="text-sm font-semibold text-takara-gold">NFT Wexel Miner</div>
                          <div className="text-xs text-gray-400">
                            {investment.nftMiner.mintAddress.slice(0, 8)}...
                            {investment.nftMiner.mintAddress.slice(-8)}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`https://solscan.io/token/${investment.nftMiner.mintAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-takara-gold hover:text-takara-gold-light text-sm transition-colors"
                      >
                        View on Solscan →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Investments;
