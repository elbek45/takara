import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { poolsService } from '../../services/api';
import { Pool } from '../../types';
import PoolCard from '../../components/pools/PoolCard';
import InvestmentModal from '../../components/pools/InvestmentModal';

const Pools: React.FC = () => {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['pools'],
    queryFn: () => poolsService.getAll(),
  });

  const pools = data?.data || [];

  const filteredPools = pools.filter((pool) => {
    if (filter === 'all') return true;
    return pool.status === filter;
  });

  const handleInvest = (pool: Pool) => {
    setSelectedPool(pool);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPool(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer rounded-lg p-8">
          <div className="text-2xl gradient-text font-bold">Loading pools...</div>
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
            <h2 className="text-xl font-bold mb-2">Error Loading Pools</h2>
            <p className="text-gray-400">
              Failed to load investment pools. Please try again later.
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
        <div className="text-center mb-12">
          <h1 className="section-title">Investment Pools</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Choose from our selection of investment pools with varying durations and TAKARA multipliers.
            All pools offer 7% USDT APY.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8 flex-wrap gap-4">
          {[
            { key: 'all', label: 'All Pools' },
            { key: 'active', label: 'Active' },
            { key: 'pending', label: 'Coming Soon' },
            { key: 'completed', label: 'Completed' },
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pools Grid */}
        {filteredPools.length === 0 ? (
          <div className="card max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">No pools found</h3>
            <p className="text-gray-400">
              {filter === 'all'
                ? 'No investment pools are available at this time.'
                : `No ${filter} pools found. Try a different filter.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredPools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} onInvest={handleInvest} />
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold gradient-text mb-4 text-center">
              How Investment Pools Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="text-takara-gold font-semibold mb-2">🕐 Lock Periods</h3>
                <p className="text-gray-400">
                  Choose from 12, 24, or 36-month lock periods. Longer periods offer higher TAKARA multipliers.
                </p>
              </div>
              <div>
                <h3 className="text-takara-gold font-semibold mb-2">💎 TAKARA Rewards</h3>
                <p className="text-gray-400">
                  Earn TAKARA tokens based on your investment amount and the pool's multiplier (1x, 1.5x, or 2x).
                </p>
              </div>
              <div>
                <h3 className="text-takara-gold font-semibold mb-2">💰 USDT APY</h3>
                <p className="text-gray-400">
                  All pools offer a guaranteed 7% USDT APY, calculated and distributed throughout your investment period.
                </p>
              </div>
              <div>
                <h3 className="text-takara-gold font-semibold mb-2">🎨 NFT Miners</h3>
                <p className="text-gray-400">
                  Each investment creates a unique NFT Wexel miner that represents your stake on the blockchain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      <InvestmentModal
        pool={selectedPool}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Pools;
