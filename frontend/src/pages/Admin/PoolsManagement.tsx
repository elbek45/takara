import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/api';

interface Pool {
  id: string;
  name: string;
  description: string;
  durationMonths: number;
  takaraMultiplier: number;
  usdtApy: number;
  targetAmount: number;
  currentAmount: number;
  minInvestment: number;
  maxInvestment: number;
  status: 'pending' | 'active' | 'completed';
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  fillPercentage?: string;
  remainingAmount?: string;
  investmentCount?: number;
  _count?: {
    investments: number;
  };
}

const PoolsManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminPools'],
    queryFn: () => adminService.getAllPools(),
  });

  const pools: Pool[] = data?.data || [];
  const filteredPools = filter === 'all'
    ? pools
    : pools.filter(p => p.status === filter);

  const activatePoolMutation = useMutation({
    mutationFn: (id: string) => adminService.activatePool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPools'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      setSelectedPool(null);
      alert('Pool activated successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error?.message || 'Failed to activate pool'}`);
    },
  });

  const completePoolMutation = useMutation({
    mutationFn: (id: string) => adminService.completePool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPools'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      setSelectedPool(null);
      alert('Pool completed successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error?.message || 'Failed to complete pool'}`);
    },
  });

  const handleActivatePool = (pool: Pool) => {
    if (window.confirm(`Are you sure you want to activate "${pool.name}"? This will activate all pending investments in this pool.`)) {
      activatePoolMutation.mutate(pool.id);
    }
  };

  const handleCompletePool = (pool: Pool) => {
    if (window.confirm(`Are you sure you want to complete "${pool.name}"? This will mark all active investments as completed.`)) {
      completePoolMutation.mutate(pool.id);
    }
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
        <div className="mb-8">
          <h1 className="section-title">Pools Management</h1>
          <p className="text-gray-300 text-lg text-center">
            Manage investment pools and their lifecycle
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8 flex-wrap gap-4">
          {[
            { key: 'all', label: 'All Pools', count: pools.length },
            { key: 'pending', label: 'Pending', count: pools.filter(p => p.status === 'pending').length },
            { key: 'active', label: 'Active', count: pools.filter(p => p.status === 'active').length },
            { key: 'completed', label: 'Completed', count: pools.filter(p => p.status === 'completed').length },
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

        {/* Pools Grid */}
        {filteredPools.length === 0 ? (
          <div className="card max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">No pools found</h3>
            <p className="text-gray-400">
              {filter === 'all'
                ? 'No investment pools are available at this time.'
                : `No ${filter} pools found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {filteredPools.map((pool) => (
              <div key={pool.id} className="card hover:border-takara-gold transition-all">
                {/* Pool Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold gradient-text mb-1">{pool.name}</h3>
                    <p className="text-sm text-gray-400">{pool.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      pool.status === 'active'
                        ? 'bg-green-500 bg-opacity-20 text-green-400'
                        : pool.status === 'pending'
                        ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                        : 'bg-gray-500 bg-opacity-20 text-gray-400'
                    }`}
                  >
                    {pool.status}
                  </span>
                </div>

                {/* Pool Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Duration</div>
                    <div className="text-lg font-semibold text-white">
                      {pool.durationMonths} months
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">TAKARA Multiplier</div>
                    <div className="text-lg font-semibold text-takara-gold">
                      {pool.takaraMultiplier}x
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">USDT APY</div>
                    <div className="text-lg font-semibold text-green-400">
                      {pool.usdtApy}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Investments</div>
                    <div className="text-lg font-semibold text-white">
                      {pool.investmentCount || pool._count?.investments || 0}
                    </div>
                  </div>
                </div>

                {/* Investment Range */}
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-1">Investment Range</div>
                  <div className="text-sm text-white">
                    ${pool.minInvestment.toLocaleString()} - ${pool.maxInvestment.toLocaleString()}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Target Progress</span>
                    <span className="text-takara-gold font-semibold">
                      {pool.fillPercentage || '0'}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-takara-green bg-opacity-30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-takara-gold to-takara-gold-light rounded-full transition-all"
                      style={{ width: `${Math.min(parseFloat(pool.fillPercentage || '0'), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>${pool.currentAmount.toLocaleString()}</span>
                    <span>${pool.targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div>
                    <div className="text-gray-400 mb-1">Created</div>
                    <div className="text-white">
                      {new Date(pool.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {pool.startDate && (
                    <div>
                      <div className="text-gray-400 mb-1">Start Date</div>
                      <div className="text-white">
                        {new Date(pool.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {pool.endDate && (
                    <div>
                      <div className="text-gray-400 mb-1">End Date</div>
                      <div className="text-white">
                        {new Date(pool.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-takara-green border-opacity-30">
                  <button
                    onClick={() => setSelectedPool(pool)}
                    className="flex-1 bg-takara-green bg-opacity-40 hover:bg-opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                  {pool.status === 'pending' && (
                    <button
                      onClick={() => handleActivatePool(pool)}
                      disabled={activatePoolMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                      {activatePoolMutation.isPending ? 'Activating...' : 'Activate'}
                    </button>
                  )}
                  {pool.status === 'active' && (
                    <button
                      onClick={() => handleCompletePool(pool)}
                      disabled={completePoolMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                      {completePoolMutation.isPending ? 'Completing...' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pool Details Modal */}
        {selectedPool && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold gradient-text mb-6">Pool Details</h2>

              {/* Detailed Info */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Pool Name</div>
                    <div className="text-xl font-bold text-white">{selectedPool.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        selectedPool.status === 'active'
                          ? 'bg-green-500 bg-opacity-20 text-green-400'
                          : selectedPool.status === 'pending'
                          ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                          : 'bg-gray-500 bg-opacity-20 text-gray-400'
                      }`}
                    >
                      {selectedPool.status}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Description</div>
                  <div className="text-white">{selectedPool.description}</div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Duration</div>
                    <div className="text-lg font-semibold text-white">
                      {selectedPool.durationMonths} months
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">TAKARA Multiplier</div>
                    <div className="text-lg font-semibold text-takara-gold">
                      {selectedPool.takaraMultiplier}x
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">USDT APY</div>
                    <div className="text-lg font-semibold text-green-400">
                      {selectedPool.usdtApy}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Minimum Investment</div>
                    <div className="text-lg font-semibold text-white">
                      ${selectedPool.minInvestment.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Maximum Investment</div>
                    <div className="text-lg font-semibold text-white">
                      ${selectedPool.maxInvestment.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Target Amount</div>
                    <div className="text-lg font-semibold text-white">
                      ${selectedPool.targetAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Current Amount</div>
                    <div className="text-lg font-semibold text-takara-gold">
                      ${selectedPool.currentAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Remaining</div>
                    <div className="text-lg font-semibold text-gray-300">
                      ${(selectedPool.targetAmount - selectedPool.currentAmount).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Fill Percentage</div>
                  <div className="w-full h-4 bg-takara-green bg-opacity-30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-takara-gold to-takara-gold-light rounded-full"
                      style={{ width: `${Math.min(parseFloat(selectedPool.fillPercentage || '0'), 100)}%` }}
                    />
                  </div>
                  <div className="text-center mt-2 text-takara-gold font-bold">
                    {selectedPool.fillPercentage || '0'}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Investments</div>
                    <div className="text-2xl font-bold text-white">
                      {selectedPool.investmentCount || selectedPool._count?.investments || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Created At</div>
                    <div className="text-white">
                      {new Date(selectedPool.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {selectedPool.startDate && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Start Date</div>
                      <div className="text-white">
                        {new Date(selectedPool.startDate).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {selectedPool.endDate && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">End Date</div>
                      <div className="text-white">
                        {new Date(selectedPool.endDate).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex gap-4 mt-6 pt-6 border-t border-takara-green border-opacity-30">
                {selectedPool.status === 'pending' && (
                  <button
                    onClick={() => handleActivatePool(selectedPool)}
                    disabled={activatePoolMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {activatePoolMutation.isPending ? 'Activating...' : 'Activate Pool'}
                  </button>
                )}
                {selectedPool.status === 'active' && (
                  <button
                    onClick={() => handleCompletePool(selectedPool)}
                    disabled={completePoolMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {completePoolMutation.isPending ? 'Completing...' : 'Complete Pool'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedPool(null)}
                  className="flex-1 bg-takara-green bg-opacity-40 hover:bg-opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoolsManagement;
