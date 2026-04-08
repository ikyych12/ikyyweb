export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
  referralCode: string;
  referredBy?: string;
  balance: number;
  totalChats: number;
  totalReferrals: number;
  apiKey?: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  walletInfo?: {
    provider: string;
    number: string;
  };
  createdAt: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  blastNumbers: string[];
  blastMessage: string;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  status: 'connected' | 'disconnected';
  connectionMethod: 'qr' | 'pairing';
  pairingCode?: string;
  qrCode?: string;
  createdAt: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  method: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredId: string;
  referredUsername: string;
  bonusAmount: number;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  targetUserId: string;
  targetUsername: string;
  action: 'credit' | 'debit';
  amount: number;
  chatsAdded: number;
  timestamp: string;
}

export interface BlastProgress {
  total: number;
  sent: number;
  status: 'idle' | 'running' | 'completed' | 'paused';
}
