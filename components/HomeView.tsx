
import React, { useState, useEffect } from 'react';
import { WalletCard } from './WalletCard';
import { User, Transaction } from '../types';
import { Share2, Trophy, TrendingUp, Copy, Check, LogOut } from 'lucide-react';
import { db } from '../firebase';
import { ref, push, set, onValue } from 'firebase/database';
import { ACTIVATION_FEE } from '../constants';

interface HomeViewProps {
  user: User;
  onLogout: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, onLogout }) => {
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch admin payment number
    const settingsRef = ref(db, 'admin/settings/activePaymentNumber');
    onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) setPaymentNumber(snapshot.val());
    });
  }, []);

  const handleCopyReferral = () => {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const submitActivation = async () => {
      if (!senderNumber || !trxId) return alert("Please fill all fields");
      setSubmitting(true);
      try {
          const newTxRef = push(ref(db, 'activations'));
          const transaction: Transaction = {
              id: newTxRef.key as string,
              userId: user.id,
              type: 'activation',
              amount: ACTIVATION_FEE,
              method: paymentMethod,
              mobileNumber: senderNumber,
              trxId: trxId,
              status: 'pending',
              timestamp: Date.now()
          };
          await set(newTxRef, transaction);
          setShowActivateModal(false);
          alert("Activation request submitted! Wait for admin approval.");
      } catch (e) {
          alert("Error submitting request");
      } finally {
          setSubmitting(false);
      }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Wallet</h1>
          <p className="text-slate-500 text-sm">Hello, {user.name.split(' ')[0]}</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={onLogout}
                className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors active:scale-95 touch-manipulation"
            >
                <LogOut size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
        </div>
      </header>

      <WalletCard 
        balance={user.balance} 
        isActive={user.isActive} 
        onActivate={() => setShowActivateModal(true)} 
      />

      {/* Quick Actions */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transform transition-all">
         <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500 rounded-full filter blur-3xl opacity-20 translate-x-10 -translate-y-10"></div>
         
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
               <div>
                   <h2 className="text-xl font-bold mb-1">Your Refer Code</h2>
                   <p className="text-slate-400 text-sm">Share to earn money</p>
               </div>
               <button 
                 onClick={handleCopyReferral}
                 className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors active:scale-90"
                >
                   {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
               </button>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-xl text-center font-mono text-lg tracking-wider border border-slate-700 select-all">
                {user.referralCode}
            </div>
            
            <button 
               onClick={() => {
                   if (navigator.share) {
                       navigator.share({title: 'Join Referral Wallet', text: `Use my code ${user.referralCode}!`})
                   } else {
                       handleCopyReferral();
                       alert("Referral Code Copied!");
                   }
               }}
               className="w-full mt-4 bg-violet-500 hover:bg-violet-400 text-white py-3 rounded-xl font-semibold shadow-lg shadow-violet-900/50 flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation"
            >
               <Share2 size={18} /> Share Link
            </button>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3 text-green-600">
               <Trophy size={20} />
            </div>
            <p className="text-xs text-slate-400 font-medium mb-1">Total Income</p>
            <p className="text-lg font-bold text-slate-800">৳{user.balance.toFixed(2)}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
               <TrendingUp size={20} />
            </div>
            <p className="text-xs text-slate-400 font-medium mb-1">Status</p>
            <p className="text-lg font-bold text-slate-800">{user.isActive ? 'Active' : 'Inactive'}</p>
         </div>
      </div>

      {/* Activation Modal */}
      {showActivateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                  <h2 className="text-xl font-bold mb-4">Activate Account</h2>
                  <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-xs text-yellow-800 mb-4">
                      Send ৳{ACTIVATION_FEE} to the number below using Send Money.
                  </div>
                  
                  <div className="text-center mb-6">
                      <p className="text-xs text-slate-500 mb-1">Admin Number (Personal)</p>
                      <p className="text-2xl font-bold text-slate-800 tracking-wider select-all">{paymentNumber || "Loading..."}</p>
                  </div>

                  <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={() => setPaymentMethod('bkash')}
                            className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${paymentMethod === 'bkash' ? 'bg-pink-600 text-white border-pink-600 scale-[1.02]' : 'border-slate-200'}`}
                          >
                              bKash
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentMethod('nagad')}
                            className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${paymentMethod === 'nagad' ? 'bg-orange-600 text-white border-orange-600 scale-[1.02]' : 'border-slate-200'}`}
                          >
                              Nagad
                          </button>
                      </div>
                      <input 
                          type="number"
                          placeholder="Sender Number"
                          value={senderNumber}
                          onChange={e => setSenderNumber(e.target.value)}
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-base appearance-none focus:border-violet-500 outline-none"
                      />
                      <input 
                          type="text"
                          placeholder="Transaction ID (TrxID)"
                          value={trxId}
                          onChange={e => setTrxId(e.target.value)}
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-base appearance-none focus:border-violet-500 outline-none"
                      />
                  </div>

                  <div className="flex gap-3 mt-6">
                      <button type="button" onClick={() => setShowActivateModal(false)} className="flex-1 py-3 font-bold text-slate-500 active:scale-95 transition-transform">Cancel</button>
                      <button 
                          type="button"
                          onClick={submitActivation}
                          disabled={submitting}
                          className="flex-1 bg-violet-600 text-white rounded-xl font-bold py-3 shadow-lg touch-manipulation active:scale-95 transition-transform"
                        >
                          {submitting ? '...' : 'Submit'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
