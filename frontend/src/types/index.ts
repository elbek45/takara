// Updated timestamp: 2025-11-12T13:45:00Z
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
  durationMonths: number;
  takaraMultiplier: string;
  usdtApy: string;
  minInvestment: string;
  maxInvestment: string | null;
  targetAmount: string;
  currentAmount: string;
  status: 'pending' | 'active' | 'completed';
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  fillPercentage?: string;
  remainingAmount?: string;
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
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
