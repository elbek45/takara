import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { withdrawalsService, investmentsService } from '../../services/api';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { publicKey } = useWallet();

  const { data: withdrawalsData } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => withdrawalsService.getAll(),
  });

  const { data: investmentsData } = useQuery({
    queryKey: ['investments'],
    queryFn: () => investmentsService.getAll(),
  });

  const withdrawals = withdrawalsData?.data || [];
  const investments = investmentsData?.data || [];

  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalTakaraEarned = investments.reduce((sum, inv) => sum + parseFloat(inv.takaraReward), 0);
  const totalUsdtEarned = investments.reduce((sum, inv) => sum + parseFloat(inv.usdtReward), 0);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 bg-opacity-20 text-green-400 border-green-500';
      case 'processing':
        return 'bg-blue-500 bg-opacity-20 text-blue-400 border-blue-500';
      case 'pending':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500';
      case 'rejected':
        return 'bg-red-500 bg-opacity-20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="section-title text-center">My Profile</h1>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* User Info Card */}
          <div className="card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-takara-gold rounded-full flex items-center justify-center text-3xl">
                👤
              </div>
              <div>
                <h2 className="text-2xl font-bold text-takara-gold">
                  {user?.role === 'admin' ? 'Admin' : 'Investor'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-takara-dark bg-opacity-50 rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1">Total Invested</div>
                <div className="text-2xl font-bold gradient-text">
                  ${totalInvested.toLocaleString()}
                </div>
              </div>
              <div className="bg-takara-dark bg-opacity-50 rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1">TAKARA Earned</div>
                <div className="text-2xl font-bold gradient-text">
                  {totalTakaraEarned.toLocaleString()}
                </div>
              </div>
              <div className="bg-takara-dark bg-opacity-50 rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1">USDT Earned</div>
                <div className="text-2xl font-bold gradient-text">
                  ${totalUsdtEarned.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-takara-gold border-opacity-20">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Member Since</div>
                  <div className="text-white font-semibold">
                    {new Date(user?.createdAt || '').toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Account Status</div>
                  <div className="text-green-400 font-semibold">
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="card">
            <h3 className="text-2xl font-bold gradient-text mb-4">Withdrawal History</h3>

            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-5xl mb-3">💸</div>
                <p>No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="bg-takara-dark bg-opacity-50 rounded-lg p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-2xl">
                            {withdrawal.currency === 'TAKARA' ? '💎' : '💵'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {parseFloat(withdrawal.amount).toLocaleString()} {withdrawal.currency}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(withdrawal.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 ml-11">
                          {withdrawal.walletAddress.slice(0, 16)}...{withdrawal.walletAddress.slice(-16)}
                        </div>
                      </div>
                      <div className="mt-3 md:mt-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                            withdrawal.status
                          )}`}
                        >
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {withdrawal.txSignature && (
                      <div className="mt-3 pt-3 border-t border-takara-gold border-opacity-10">
                        <a
                          href={`https://solscan.io/tx/${withdrawal.txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-takara-gold hover:text-takara-gold-light text-xs transition-colors"
                        >
                          View Transaction →
                        </a>
                      </div>
                    )}

                    {withdrawal.adminNotes && (
                      <div className="mt-2 text-xs text-gray-400 italic">
                        Note: {withdrawal.adminNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-2xl font-bold gradient-text mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/pools"
                className="bg-takara-dark bg-opacity-50 hover:bg-opacity-70 rounded-lg p-4 transition-all flex items-center space-x-3"
              >
                <div className="text-3xl">💎</div>
                <div>
                  <div className="font-semibold text-takara-gold">Explore Pools</div>
                  <div className="text-xs text-gray-400">Find new investment opportunities</div>
                </div>
              </a>
              <a
                href="/investments"
                className="bg-takara-dark bg-opacity-50 hover:bg-opacity-70 rounded-lg p-4 transition-all flex items-center space-x-3"
              >
                <div className="text-3xl">📊</div>
                <div>
                  <div className="font-semibold text-takara-gold">My Investments</div>
                  <div className="text-xs text-gray-400">View and manage your investments</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
