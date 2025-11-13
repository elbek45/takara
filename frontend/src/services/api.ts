import axios, { AxiosInstance } from 'axios';
import { Pool, Investment, WithdrawalRequest, AuthResponse, ApiResponse, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth API
export const authService = {
  getNonce: async (walletAddress: string): Promise<{ nonce: string }> => {
    return api.post('/auth/nonce', { walletAddress });
  },

  verifySignature: async (
    walletAddress: string,
    signature: string
  ): Promise<AuthResponse> => {
    return api.post('/auth/verify', { walletAddress, signature });
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    return api.get('/auth/profile');
  },
};

// Pools API
export const poolsService = {
  getAll: async (): Promise<ApiResponse<Pool[]>> => {
    return api.get('/pools');
  },

  getById: async (id: string): Promise<ApiResponse<Pool>> => {
    return api.get(`/pools/${id}`);
  },

  getActive: async (): Promise<ApiResponse<Pool[]>> => {
    return api.get('/pools/active');
  },
};

// Investments API
export const investmentsService = {
  getAll: async (): Promise<ApiResponse<Investment[]>> => {
    return api.get('/investments');
  },

  getById: async (id: string): Promise<ApiResponse<Investment>> => {
    return api.get(`/investments/${id}`);
  },

  create: async (poolId: string, amount: string, walletAddress: string, txSignature: string): Promise<ApiResponse<Investment>> => {
    return api.post('/investments', { poolId, amount, walletAddress, txSignature });
  },

  getRewards: async (id: string): Promise<ApiResponse<{
    takaraReward: string;
    usdtReward: string;
    takaraClaimed: string;
    usdtClaimed: string;
  }>> => {
    return api.get(`/investments/${id}/rewards`);
  },

  claimRewards: async (id: string, currency: 'TAKARA' | 'USDT'): Promise<ApiResponse<Investment>> => {
    return api.post(`/investments/${id}/claim`, { currency });
  },
};

// Withdrawals API
export const withdrawalsService = {
  getAll: async (): Promise<ApiResponse<WithdrawalRequest[]>> => {
    return api.get('/withdrawals');
  },

  create: async (
    amount: string,
    currency: 'TAKARA' | 'USDT',
    walletAddress: string
  ): Promise<ApiResponse<WithdrawalRequest>> => {
    return api.post('/withdrawals', { amount, currency, walletAddress });
  },

  getById: async (id: string): Promise<ApiResponse<WithdrawalRequest>> => {
    return api.get(`/withdrawals/${id}`);
  },
};

// Admin API (only accessible to admins)
export const adminService = {
  // Dashboard
  getDashboard: async (): Promise<ApiResponse<any>> => {
    return api.get('/admin/dashboard');
  },

  // Users management
  getAllUsers: async (): Promise<ApiResponse<any[]>> => {
    return api.get('/admin/users');
  },

  // Pools management
  getAllPools: async (): Promise<ApiResponse<Pool[]>> => {
    return api.get('/admin/pools');
  },

  createPool: async (poolData: Partial<Pool>): Promise<ApiResponse<Pool>> => {
    return api.post('/admin/pools', poolData);
  },

  updatePool: async (id: string, poolData: Partial<Pool>): Promise<ApiResponse<Pool>> => {
    return api.put(`/admin/pools/${id}`, poolData);
  },

  activatePool: async (id: string): Promise<ApiResponse<Pool>> => {
    return api.post(`/admin/pools/${id}/activate`);
  },

  completePool: async (id: string): Promise<ApiResponse<Pool>> => {
    return api.post(`/admin/pools/${id}/complete`);
  },

  // Withdrawals management
  getAllWithdrawals: async (): Promise<ApiResponse<WithdrawalRequest[]>> => {
    return api.get('/admin/withdrawals');
  },

  processWithdrawal: async (
    id: string,
    action: 'approve' | 'reject',
    txSignature?: string,
    adminNotes?: string
  ): Promise<ApiResponse<WithdrawalRequest>> => {
    return api.put(`/admin/withdrawals/${id}/process`, {
      action,
      txSignature,
      adminNotes,
    });
  },

  updateUser: async (
    id: string,
    updates: Partial<User>
  ): Promise<ApiResponse<User>> => {
    return api.put(`/admin/users/${id}`, updates);
  },

  // Statistics
  getStatistics: async (): Promise<ApiResponse<{
    totalUsers: number;
    totalInvestments: string;
    activeInvestments: number;
    pendingWithdrawals: number;
    totalTakaraDistributed: string;
    totalUsdtRewards: string;
  }>> => {
    return api.get('/admin/statistics');
  },
};

export default api;
