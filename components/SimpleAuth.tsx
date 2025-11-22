
import React, { useState } from 'react';
import { db } from '../firebase';
import { ref, get, set } from 'firebase/database';
import { User } from '../types';
import { Lock, ArrowRight, Users } from 'lucide-react';

interface SimpleAuthProps {
  onLogin: (uid: string) => void;
}

export const SimpleAuth: React.FC<SimpleAuthProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    const cleanPass = password.trim();
    // Remove special chars to make a valid firebase key
    const generatedUid = `user_${cleanPass.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    if (generatedUid.length < 8) {
        alert("Password/Key must be at least 3 characters.");
        return;
    }
    
    setLoading(true);

    try {
      const userRef = ref(db, 'users/' + generatedUid);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        // --- EXISTING USER: LOGIN ---
        onLogin(generatedUid);
      } else {
        // --- NEW USER: SIGNUP ---
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Determine referrer
        let finalReferrer = 'admin';
        if (referralInput.trim()) {
             finalReferrer = referralInput.trim().toUpperCase();
        }

        const newUser: User = {
          id: generatedUid,
          name: `Member ${code.substring(0,3)}`,
          email: '',
          phone: '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${generatedUid}`,
          balance: 0,
          isActive: false,
          referralCode: code,
          referrerId: finalReferrer,
          role: 'user'
        };
        
        await set(ref(db, 'users/' + generatedUid), newUser);
        alert("New Account Created Successfully!");
        onLogin(generatedUid);
      }
    } catch (error: any) {
      alert("Connection Error: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 safe-area-inset-bottom">
      {/* Scrollable Container for Mobile Keyboards */}
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative overflow-hidden mx-auto">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
          
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Enter your secret password to Login or Register.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
              <div>
                  <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">Secret Password *</label>
                  <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold p-4 rounded-xl outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:font-normal placeholder:text-base appearance-none"
                      required
                      autoComplete="current-password"
                  />
              </div>

              <div>
                  <label className="text-xs font-bold text-slate-500 ml-1 mb-1 flex items-center gap-1">
                      Referral Code <span className="font-normal text-slate-400">(Only for new users)</span>
                  </label>
                  <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="text" 
                          value={referralInput}
                          onChange={(e) => setReferralInput(e.target.value)}
                          placeholder="Ex: ADMIN123"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold p-4 pl-12 rounded-xl outline-none focus:border-violet-500 transition-all uppercase placeholder:normal-case appearance-none"
                          autoComplete="off"
                          autoCapitalize="characters"
                      />
                  </div>
              </div>

              <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl mt-4 touch-manipulation"
              >
                  {loading ? 'Processing...' : (
                  <>
                      Login / Join <ArrowRight size={20} />
                  </>
                  )}
              </button>
          </form>

          <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-800 leading-relaxed text-center">
                  If this password was used before, you will be logged in. <br/>
                  If it's new, a new account will be created.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};
