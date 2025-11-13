import React from 'react';
import { Pool } from '../../types';

interface PoolCardProps {
  pool: Pool;
  onInvest: (pool: Pool) => void;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, onInvest }) => {
  const fillPercentage = (parseFloat(pool.currentAmount) / parseFloat(pool.targetAmount)) * 100;
  const remaining = parseFloat(pool.targetAmount) - parseFloat(pool.currentAmount);

  const getStatusColor = () => {
    switch (pool.status) {
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

  const getStatusText = () => {
    switch (pool.status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Coming Soon';
      default:
        return pool.status;
    }
  };

  return (
    <div className="pool-card">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-takara-gold mb-1">{pool.name}</h3>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-takara-gold">{pool.durationMonths}</div>
          <div className="text-xs text-gray-400">months</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-takara-dark bg-opacity-50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">TAKARA Multiplier</div>
          <div className="text-xl font-bold text-takara-gold">{pool.takaraMultiplier}x</div>
        </div>
        <div className="bg-takara-dark bg-opacity-50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">USDT APY</div>
          <div className="text-xl font-bold text-takara-gold">{pool.usdtApy}%</div>
        </div>
      </div>

      {/* Investment Range */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Min Investment</span>
          <span className="text-white font-semibold">${parseFloat(pool.minInvestment).toLocaleString()}</span>
        </div>
        {pool.maxInvestment && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Max Investment</span>
            <span className="text-white font-semibold">${parseFloat(pool.maxInvestment).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Pool Progress</span>
          <span className="text-takara-gold font-semibold">{fillPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-takara-dark rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-takara-gold to-takara-gold-light transition-all duration-500"
            style={{ width: `${Math.min(fillPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-gray-400">
            ${parseFloat(pool.currentAmount).toLocaleString()} raised
          </span>
          <span className="text-gray-400">
            ${remaining.toLocaleString()} remaining
          </span>
        </div>
      </div>

      {/* Investment Button */}
      <button
        onClick={() => onInvest(pool)}
        disabled={pool.status !== 'active' || fillPercentage >= 100}
        className={`w-full py-3 rounded-lg font-semibold transition-all ${
          pool.status === 'active' && fillPercentage < 100
            ? 'btn-primary'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {pool.status === 'active' && fillPercentage < 100
          ? 'Invest Now'
          : pool.status === 'completed'
          ? 'Pool Completed'
          : fillPercentage >= 100
          ? 'Pool Full'
          : 'Coming Soon'}
      </button>

      {/* Pool Target */}
      <div className="mt-4 pt-4 border-t border-takara-gold border-opacity-20 text-center">
        <div className="text-xs text-gray-400 mb-1">Target Amount</div>
        <div className="text-lg font-bold text-takara-gold">
          ${parseFloat(pool.targetAmount).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default PoolCard;
