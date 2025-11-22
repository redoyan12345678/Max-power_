
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string; // Added for Bkash/Nagad contact
  avatar: string;
  balance: number;
  isActive: boolean;
  referralCode: string;
  referrerId?: string; // Who referred this user
  role: 'user' | 'admin';
}

export interface ReferralTier {
  level: number;
  amount: number;
  description: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'activation' | 'withdrawal';
  amount: number;
  method: 'bkash' | 'nagad';
  mobileNumber: string;
  trxId?: string; // For activation
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export enum ViewState {
  AUTH = 'AUTH',
  HOME = 'HOME',
  WALLET = 'WALLET',
  REFERRALS = 'REFERRALS',
  PROFILE = 'PROFILE',
  STRUCTURE = 'STRUCTURE',
  ADMIN = 'ADMIN'
}
