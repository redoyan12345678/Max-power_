
import React, { useState, useEffect } from 'react';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ReferralStructure } from './components/ReferralStructure';
import { AdminPanel } from './components/AdminPanel';
import { WalletView } from './components/WalletView';
import { SimpleAuth } from './components/SimpleAuth';
import { ViewState, User } from './types';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';
import { Users, Loader2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen to user data ONLY when userId is set (logged in)
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const userRef = ref(db, 'users/' + userId);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUser(data);
      }
      setLoading(false);
    }, (error) => {
      console.error("DB Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleLogin = (uid: string) => {
    setUserId(uid);
  };

  const handleLogout = () => {
    setUserId(null);
    setUser(null);
    setCurrentView(ViewState.HOME);
  };

  const handleAdminLogin = () => {
    setCurrentView(ViewState.ADMIN);
  };

  // If not logged in, show Simple Password Auth
  if (!userId) {
    return <SimpleAuth onLogin={handleLogin} />;
  }

  // If logged in but data loading
  if (loading && !user) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-violet-600" size={40} />
          </div>
      );
  }

  // Safety fallback
  if (!user) return null;

  const renderContent = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView user={user} onLogout={handleLogout} />;
      case ViewState.WALLET:
        return <WalletView user={user} onAdminLogin={handleAdminLogin} />;
      case ViewState.STRUCTURE:
        return <ReferralStructure />;
      case ViewState.REFERRALS:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
             <div className="bg-slate-100 p-6 rounded-full mb-4">
                <Users size={40} />
             </div>
             <p>Team View Coming Soon</p>
             <p className="text-xs mt-2">Your Upline: {user.referrerId || 'Admin'}</p>
          </div>
        );
      case ViewState.ADMIN:
        return <AdminPanel onExit={() => setCurrentView(ViewState.HOME)} />;
      default:
        return <HomeView user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans antialiased flex justify-center overflow-hidden">
      <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col">
        
        {currentView !== ViewState.ADMIN && (
             <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none z-0"></div>
        )}
        
        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto relative z-10 no-scrollbar">
           <div className="p-6 pb-32"> {/* Extra padding bottom for nav */}
             {renderContent()}
           </div>
        </main>

        {/* Navigation Fixed at Bottom within Container */}
        {currentView !== ViewState.ADMIN && (
            <BottomNav currentView={currentView} onChangeView={setCurrentView} />
        )}
      </div>
    </div>
  );
}
