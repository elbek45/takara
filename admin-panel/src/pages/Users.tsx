import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/api';
import { User } from '../types';

const Users: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminService.getAllUsers(),
  });

  const users: User[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer rounded-lg p-8">
          <div className="text-2xl gradient-text font-bold">Loading users...</div>
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
            <h2 className="text-xl font-bold mb-2">Error Loading Users</h2>
            <p className="text-gray-400">
              Failed to load users. Please try again later.
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
          <h1 className="section-title">User Management</h1>
          <p className="text-gray-300 text-lg text-center">
            View and manage platform users
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto">
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Total Users</div>
            <div className="text-3xl font-bold text-takara-gold">
              {users.length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Active Users</div>
            <div className="text-3xl font-bold text-green-400">
              {users.filter(u => u.isActive).length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Admins</div>
            <div className="text-3xl font-bold text-blue-400">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Regular Users</div>
            <div className="text-3xl font-bold text-gray-400">
              {users.filter(u => u.role === 'user').length}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card max-w-7xl mx-auto">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">No users found</h3>
              <p className="text-gray-400">
                No users registered on the platform yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-takara-green border-opacity-30">
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Wallet Address</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Registered</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400 font-semibold">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-takara-green border-opacity-20 hover:bg-takara-green hover:bg-opacity-10">
                      <td className="py-3 px-4">
                        <div className="text-white font-mono text-sm">
                          {user.walletAddress.substring(0, 8)}...
                          {user.walletAddress.substring(user.walletAddress.length - 6)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-blue-500 bg-opacity-20 text-blue-400'
                              : 'bg-gray-500 bg-opacity-20 text-gray-400'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.isActive
                              ? 'bg-green-500 bg-opacity-20 text-green-400'
                              : 'bg-red-500 bg-opacity-20 text-red-400'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
