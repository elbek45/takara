export interface NftMiner {
  id: string;
  investmentId: string;
  mintAddress: string;
  imageUrl: string | null;
  metadata: any;
  createdAt: string;
}

export interface Pool {
  id: string;
  name: string;
  description?: string;
  durationMonths: number;
  takaraMultiplier: string | number;
  usdtApy: string | number;
  minInvestment: string | number;
  maxInvestment: string | number | null;
  targetAmount: string | number;
  currentAmount: string | number;
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

export interface Investment {
  id: string;
  userId: string;
  poolId: string;
  amount: string;
  status: 'pending' | 'active' | 'completed';
  takaraReward: string;
  usdtReward: string;
  takaraClaimed: string;
  usdtClaimed: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  pool?: Pool;
  nftMiner?: NftMiner;
}

export interface User {
  id: string;
  walletAddress: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: string;
  currency: 'TAKARA' | 'USDT';
  walletAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  txSignature: string | null;
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
  user?: {
    id: string;
    walletAddress: string;
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user?: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AdminUser {
  username: string;
  role: string;
}

export interface DashboardData {
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
