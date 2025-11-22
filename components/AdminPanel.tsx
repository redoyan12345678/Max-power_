
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue, update, get, increment } from 'firebase/database';
import { Transaction, User } from '../types';
import { CheckCircle, Settings, DollarSign, Users, Wallet, LogOut, Loader2 } from 'lucide-react';
import { REFERRAL_STRUCTURE } from '../constants';

interface AdminPanelProps {
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [activations, setActivations] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // 1. Listen for pending activations
    const activationsRef = ref(db, 'activations');
    const unsubActivations = onValue(activationsRef, (snapshot) => {
      const data = snapshot.val();
      const list: Transaction[] = [];
      if (data) {
        Object.entries(data).forEach(([key, val]: [string, any]) => {
          // Only show pending requests
          if (val.status === 'pending') list.push({ ...val, id: key });
        });
      }
      setActivations(list.reverse()); 
    });

    // 2. Listen for pending withdrawals
    const withdrawalsRef = ref(db, 'withdrawals');
    const unsubWithdrawals = onValue(withdrawalsRef, (snapshot) => {
      const data = snapshot.val();
      const list: Transaction[] = [];
      if (data) {
        Object.entries(data).forEach(([key, val]: [string, any]) => {
          if (val.status === 'pending') list.push({ ...val, id: key });
        });
      }
      setWithdrawals(list.reverse());
    });

    // 3. Payment number
    const settingsRef = ref(db, 'admin/settings');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.activePaymentNumber) setPaymentNumber(data.activePaymentNumber);
    });

    // 4. Stats
    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        let userCount = 0;
        let balanceSum = 0;
        if (data) {
            const usersArray = Object.values(data) as User[];
            userCount = usersArray.length;
            usersArray.forEach(u => {
              if (u.balance && !isNaN(u.balance)) balanceSum += u.balance;
            });
        }
        setStats({ totalUsers: userCount, totalBalance: balanceSum });
        setLoading(false);
    });

    return () => {
      unsubActivations();
      unsubWithdrawals();
      unsubUsers();
    };

  }, []);

  const updatePaymentNumber = async () => {
    if (!newNumber) return;
    await update(ref(db, 'admin/settings'), { activePaymentNumber: newNumber });
    alert('Number updated successfully');
    setNewNumber('');
  };

  const approveActivation = async (trx: Transaction) => {
    if (!confirm("Account active করবেন?")) return;
    setProcessingId(trx.id);

    const updates: any = {};
    
    // --- 1. PRIORITY: Force Activation ---
    updates[`activations/${trx.id}/status`] = 'approved';
    updates[`users/${trx.userId}/isActive`] = true;

    // --- 2. SECONDARY: Commission Distribution ---
    try {
        const userSnapshot = await get(ref(db, `users/${trx.userId}`));
        
        if (userSnapshot.exists()) {
            const user = userSnapshot.val() as User;
            const referrerCode = user.referrerId;

            if (referrerCode && referrerCode.toLowerCase() !== 'admin') {
                const allUsersSnap = await get(ref(db, 'users'));
                if (allUsersSnap.exists()) {
                    const allUsers = allUsersSnap.val();
                    const codeToUid: Record<string, string> = {};
                    Object.values(allUsers).forEach((u: any) => {
                       if (u.referralCode) codeToUid[u.referralCode] = u.id;
                    });

                    let currentUplineUid = codeToUid[referrerCode];

                    for (const tier of REFERRAL_STRUCTURE) {
                        if (!currentUplineUid) break; 
                        updates[`users/${currentUplineUid}/balance`] = increment(tier.amount);
                        const uplineUser = allUsers[currentUplineUid];
                        if (uplineUser && uplineUser.referrerId) {
                           currentUplineUid = codeToUid[uplineUser.referrerId];
                        } else {
                           break;
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("Commission failed", err);
    }

    try {
        await update(ref(db), updates);
        alert("সফলভাবে অ্যাপ্রুভ হয়েছে!");
    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setProcessingId(null);
    }
  };

  const approveWithdrawal = async (trx: Transaction) => {
     if(!confirm("পেমেন্ট কনফার্ম করছেন?")) return;
     setProcessingId(trx.id);
     
     try {
        const updates: any = {};
        updates[`withdrawals/${trx.id}/status`] = 'approved';
        await update(ref(db), updates);
        alert("সফলভাবে পেমেন্ট অ্যাপ্রুভ হয়েছে!");
     } catch (error: any) {
        alert("Error: " + error.message);
     } finally {
        setProcessingId(null);
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 sticky top-0 z-20 border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-800">Admin Dashboard</h1>
        <button 
          onClick={onExit}
          className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors active:bg-red-100"
        >
          <LogOut size={16} />
          Exit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 px-4">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-2 mb-2 text-blue-600">
                 <Users size={18} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Users</span>
             </div>
             <p className="text-2xl font-bold text-slate-800">
               {loading ? '...' : stats.totalUsers}
             </p>
         </div>
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-2 mb-2 text-emerald-600">
                 <Wallet size={18} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Holdings</span>
             </div>
             <p className="text-2xl font-bold text-slate-800">
                ৳{loading ? '...' : stats.totalBalance.toFixed(0)}
             </p>
         </div>
      </div>

      {/* Settings */}
      <div className="bg-white p-4 mx-4 rounded-2xl shadow-sm border border-slate-200">
         <div className="flex items-center gap-2 mb-3 text-slate-800">
            <Settings size={18} />
            <h2 className="font-bold text-sm">Payment Settings</h2>
         </div>
         <div className="flex gap-2">
            <input 
              value={newNumber} 
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder={paymentNumber || "Set Active Number"}
              className="flex-1 border border-slate-200 p-3 rounded-xl outline-none focus:border-violet-500 text-sm"
            />
            <button onClick={updatePaymentNumber} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform">
                Save
            </button>
         </div>
      </div>

      {/* Activations */}
      <div className="px-4">
         <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CheckCircle className="text-violet-600" size={18} /> 
                Activations
            </h2>
            <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded text-[10px] font-bold">{activations.length} Pending</span>
         </div>
         
         <div className="space-y-3">
            {activations.length === 0 && (
                <div className="text-center py-6 bg-white rounded-xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 text-xs">No pending activations</p>
                </div>
            )}
            {activations.map(trx => (
               <div key={trx.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${trx.method === 'bkash' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>
                            {trx.method}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">৳{trx.amount}</span>
                     </div>
                     <p className="text-xs text-slate-500 font-mono">{trx.mobileNumber}</p>
                     <p className="text-[10px] text-slate-900 font-bold mt-1">Trx: {trx.trxId}</p>
                  </div>
                  <button 
                    onClick={() => approveActivation(trx)}
                    disabled={processingId === trx.id}
                    className="bg-violet-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-70"
                  >
                     {processingId === trx.id ? <Loader2 className="animate-spin" size={14} /> : 'Approve'}
                  </button>
               </div>
            ))}
         </div>
      </div>

      {/* Withdrawals */}
      <div className="px-4 pb-10">
         <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <DollarSign className="text-emerald-600" size={18} /> 
                Withdrawals
            </h2>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">{withdrawals.length} Pending</span>
         </div>

         <div className="space-y-3">
            {withdrawals.length === 0 && (
                <div className="text-center py-6 bg-white rounded-xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 text-xs">No pending withdrawals</p>
                </div>
            )}
            {withdrawals.map(trx => (
               <div key={trx.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                  <div>
                     <p className="font-bold text-slate-800 mb-1">৳{trx.amount}</p>
                     <p className="text-xs text-slate-500">{trx.mobileNumber}</p>
                     <span className="text-[10px] text-slate-400 uppercase">{trx.method}</span>
                  </div>
                  <button 
                    onClick={() => approveWithdrawal(trx)}
                    disabled={processingId === trx.id}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70"
                >
                    {processingId === trx.id ? <Loader2 className="animate-spin" size={14} /> : 'Pay'}
                </button>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};
