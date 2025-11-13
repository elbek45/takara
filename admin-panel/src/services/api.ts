import axios, { AxiosInstance } from 'axios';
import { Pool, WithdrawalRequest, AuthResponse, ApiResponse, User, DashboardData } from '../types';

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
    const token = localStorage.getItem('adminToken');
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
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Admin Auth API
export const adminAuthService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    return api.post('/admin/login', { username, password });
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },
};

// Admin API
export const adminService = {
  // Dashboard
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    return api.get('/admin/dashboard');
  },

  // Users management
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    return api.get('/admin/users');
  },

  updateUser: async (
    id: string,
    updates: Partial<User>
  ): Promise<ApiResponse<User>> => {
    return api.put(`/admin/users/${id}`, updates);
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
