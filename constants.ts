import { ReferralTier } from './types';

export const ACTIVATION_FEE = 300;

// The algorithm defined by the user
export const REFERRAL_STRUCTURE: ReferralTier[] = [
  { level: 1, amount: 80, description: "Direct Referral" },
  { level: 2, amount: 35, description: "2nd Level Upline" },
  { level: 3, amount: 25, description: "3rd Level Upline" },
  { level: 4, amount: 15, description: "4th Level Upline" },
];

// Generate levels 5-20 automatically as they are all 2 Taka
for (let i = 5; i <= 20; i++) {
  REFERRAL_STRUCTURE.push({
    level: i,
    amount: 2,
    description: `${i}th Level Upline`
  });
}

export const MOCK_REFERRALS = [
  { id: '1', name: 'Rahim Ahmed', date: '2h ago', profit: 80, avatar: 'https://picsum.photos/seed/rahim/50/50' },
  { id: '2', name: 'Karim Ullah', date: '5h ago', profit: 35, avatar: 'https://picsum.photos/seed/karim/50/50' },
  { id: '3', name: 'Nusrat Jahan', date: '1d ago', profit: 2, avatar: 'https://picsum.photos/seed/nusrat/50/50' },
  { id: '4', name: 'Jamal Hossain', date: '2d ago', profit: 25, avatar: 'https://picsum.photos/seed/jamal/50/50' },
];