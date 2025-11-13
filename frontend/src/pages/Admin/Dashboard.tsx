import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
  overview: {
    totalUsers: number;
    totalInvestments: number;
    totalPools: number;
    activeInvestments: number;
    pendingInvestments: number;
    pendingWithdrawals: number;
  };
  financial: {
    totalInvested: string;
    totalTakaraRewards: string;
    totalUsdtRewards: string;
  };
  pools: Array<{
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
    fillPercentage: string;
    status: string;
    investmentCount: number;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboard(),
  });

  const dashboardData: DashboardData | undefined = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer rounded-lg p-8">
          <div className="text-2xl gradient-text font-bold">Loading dashboard...</div>
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
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">
              You don't have permission to access the admin dashboard.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { overview, financial, pools } = dashboardData;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="text-gray-300 text-lg text-center">
            Platform overview and management
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/admin/withdrawals')}
            className="card hover:bg-takara-green hover:bg-opacity-50 transition-all p-6 text-center"
          >
            <div className="text-3xl mb-2">💰</div>
            <div className="text-lg font-semibold gradient-text">Withdrawals</div>
            <div className="text-sm text-gray-400 mt-1">
              {overview.pendingWithdrawals} pending
            </div>
          </button>
          <button
            onClick={() => navigate('/admin/pools')}
            className="card hover:bg-takara-green hover:bg-opacity-50 transition-all p-6 text-center"
          >
            <div className="text-3xl mb-2">🏊</div>
            <div className="text-lg font-semibold gradient-text">Pools</div>
            <div className="text-sm text-gray-400 mt-1">
              Manage investment pools
            </div>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="card hover:bg-takara-green hover:bg-opacity-50 transition-all p-6 text-center"
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="text-lg font-semibold gradient-text">Users</div>
            <div className="text-sm text-gray-400 mt-1">
              {overview.totalUsers} total users
            </div>
          </button>
        </div>

        {/* Overview Stats */}
        <div className="mb-8 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold gradient-text mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Total Users</div>
              <div className="text-2xl font-bold text-takara-gold">
                {overview.totalUsers}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Total Pools</div>
              <div className="text-2xl font-bold text-takara-gold">
                {overview.totalPools}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Total Investments</div>
              <div className="text-2xl font-bold text-takara-gold">
                {overview.totalInvestments}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Active</div>
              <div className="text-2xl font-bold text-green-400">
                {overview.activeInvestments}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-400">
                {overview.pendingInvestments}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Pending Withdrawals</div>
              <div className="text-2xl font-bold text-orange-400">
                {overview.pendingWithdrawals}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="mb-8 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold gradient-text mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Total Invested</div>
              <div className="text-3xl font-bold gradient-text">
                ${financial.totalInvested}
              </div>
              <div className="text-xs text-gray-500 mt-1">USDT</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">TAKARA Distributed</div>
              <div className="text-3xl font-bold gradient-text">
                {financial.totalTakaraRewards}
              </div>
              <div className="text-xs text-gray-500 mt-1">TAKARA tokens</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">USDT Rewards</div>
              <div className="text-3xl font-bold gradient-text">
                ${financial.totalUsdtRewards}
              </div>
              <div className="text-xs text-gray-500 mt-1">USDT rewards paid</div>
            </div>
          </div>
        </div>

        {/* Pools Status */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold gradient-text mb-4">Pools Status</h2>
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-takara-green border-opacity-30">
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Pool Name</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400 font-semibold">Current / Target</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400 font-semibold">Fill %</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400 font-semibold">Investments</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => (
                    <tr key={pool.id} className="border-b border-takara-green border-opacity-20">
                      <td className="py-3 px-4 font-medium text-white">{pool.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            pool.status === 'active'
                              ? 'bg-green-500 bg-opacity-20 text-green-400'
                              : pool.status === 'pending'
                              ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                              : 'bg-gray-500 bg-opacity-20 text-gray-400'
                          }`}
                        >
                          {pool.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        ${pool.currentAmount.toLocaleString()} / ${pool.targetAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <div className="w-16 h-2 bg-takara-green bg-opacity-30 rounded-full mr-2 overflow-hidden">
                            <div
                              className="h-full bg-takara-gold rounded-full"
                              style={{ width: `${Math.min(parseFloat(pool.fillPercentage), 100)}%` }}
                            />
                          </div>
                          <span className="text-takara-gold font-semibold text-sm">
                            {pool.fillPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {pool.investmentCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
