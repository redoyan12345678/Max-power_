
import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { db } from '../firebase';
import { ref, push, set, update } from 'firebase/database';
import { ArrowUpRight } from 'lucide-react';

interface WalletViewProps {
  user: User;
  onAdminLogin: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ user, onAdminLogin }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash'|'nagad'>('bkash');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin Auth State
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  const handleWithdraw = async () => {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt < 150) return alert("Minimum withdrawal is 150 Tk");
      if (amt > user.balance) return alert("Insufficient balance");
      if (!number) return alert("Enter number");

      setLoading(true);
      try {
          // Create request
          const newRef = push(ref(db, 'withdrawals'));
          const tx: Transaction = {
              id: newRef.key as string,
              userId: user.id,
              amount: amt,
              method,
              mobileNumber: number,
              type: 'withdrawal',
              status: 'pending',
              timestamp: Date.now()
          };
          await set(newRef, tx);
          
          // Deduct balance locally first (optimistic UI)
          await update(ref(db, `users/${user.id}`), {
              balance: user.balance - amt
          });
          
          alert("Withdrawal requested!");
          setAmount('');
      } catch (e) {
          alert("Error processing request");
      } finally {
          setLoading(false);
      }
  };

  const checkAdminPass = () => {
    if (adminPass === '@redoyanRR334t') {
      setShowAdminAuth(false);
      onAdminLogin();
    } else {
      alert("Wrong Password");
    }
  };

  return (
      <div className="space-y-6 pt-4 relative">
          <h1 className="text-2xl font-bold">Withdraw Funds</h1>
          
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-1">
                <p className="text-slate-400 text-sm">Available Balance</p>
                {/* Hidden Admin Button - Beside Balance Label */}
                <button 
                  onClick={() => setShowAdminAuth(true)}
                  className="text-slate-700 text-[10px] font-serif hover:text-slate-500 transition-colors px-3 py-2"
                >
                  r
                </button>
              </div>
              <h2 className="text-4xl font-bold">৳{user.balance.toFixed(2)}</h2>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                  <ArrowUpRight className="text-violet-600" /> Request Withdrawal
              </h3>
              
              <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setMethod('bkash')} 
                        className={`p-3 rounded-xl font-bold border text-sm transition-all active:scale-95 ${method === 'bkash' ? 'bg-pink-50 border-pink-200 text-pink-600' : 'border-slate-100'}`}
                      >
                        bKash
                      </button>
                      <button 
                        type="button"
                        onClick={() => setMethod('nagad')} 
                        className={`p-3 rounded-xl font-bold border text-sm transition-all active:scale-95 ${method === 'nagad' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'border-slate-100'}`}
                      >
                        Nagad
                      </button>
                   </div>

                   <input 
                     type="number" 
                     placeholder="Amount (Min 150)" 
                     className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none text-base bg-slate-50/50 focus:bg-slate-100 transition-colors appearance-none"
                     value={amount}
                     onChange={e => setAmount(e.target.value)}
                   />
                   
                   <input 
                     type="tel" 
                     placeholder="Wallet Number" 
                     className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none text-base bg-slate-50/50 focus:bg-slate-100 transition-colors appearance-none"
                     value={number}
                     onChange={e => setNumber(e.target.value)}
                   />

                   <button 
                     onClick={handleWithdraw}
                     disabled={loading}
                     className="w-full bg-violet-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-violet-700 transition-all active:scale-95 touch-manipulation"
                   >
                       {loading ? 'Processing...' : 'Withdraw Now'}
                   </button>
              </div>
          </div>

          {/* Secret Admin Modal - Clean Version */}
          {showAdminAuth && (
            <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
               <div className="w-full max-w-xs space-y-4">
                  {/* Minimalist Interface */}
                  <input 
                    type="password" 
                    className="w-full p-4 bg-slate-100 rounded-2xl text-center outline-none focus:ring-2 focus:ring-slate-200 text-lg tracking-widest text-base"
                    placeholder="Enter Key" 
                    autoFocus
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                  />
                  <button 
                    onClick={checkAdminPass}
                    className="w-full bg-black text-white font-bold py-4 rounded-2xl text-lg touch-manipulation active:scale-95 transition-transform"
                  >
                    Access
                  </button>
                  <button 
                    onClick={() => setShowAdminAuth(false)}
                    className="w-full text-center text-slate-400 text-sm py-2 active:text-slate-600"
                  >
                    Close
                  </button>
               </div>
            </div>
          )}
      </div>
  );
};
