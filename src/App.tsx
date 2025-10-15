import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ProfileView } from './components/Profile/ProfileView';
import { WalletView } from './components/Wallet/WalletView';
import { ServiceList } from './components/Services/ServiceList';
import { BookingList } from './components/Bookings/BookingList';
import { SOSButton } from './components/SOS/SOSButton';
import { useGeolocation } from './hooks/useGeolocation';
import {
  LayoutDashboard,
  User,
  Wallet,
  Briefcase,
  Calendar,
  LogOut,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { AdminPanel } from './components/Admin/AdminPanel';
import { MessageCircle } from 'lucide-react';
import { useChatSection } from './components/Chat/useChatSection';
import { getUserChats } from './services/getUserChats';

type View = 'dashboard' | 'profile' | 'wallet' | 'services' | 'bookings' | 'admin';


function AppContent() {
  const { user, loading, logout } = useAuth();
  // Chat section state
  const { openInbox, ChatSectionUI } = useChatSection();
  const [unread, setUnread] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { location: userLocation } = useGeolocation();
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('timebank_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Listen for unread count (simple: sum all chats' unread)
  useEffect(() => {
    if (!user) return;
    let stop = false;
    getUserChats(user.id).then(chats => {
      let total = 0;
      import('./services/chatService').then(cs => {
        chats.forEach(chat => {
          cs.chatService.subscribeMessages(chat.id, msgs => {
            if (stop) return;
            total += msgs.filter(m => m.sender_id !== user.id).length;
            setUnread(total);
          });
        });
      });
    });
    return () => { stop = true; };
  }, [user?.id]);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('timebank_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('timebank_theme', 'light');
    }
  }, [dark]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:bg-gray-950 dark:text-emerald-400 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:bg-gray-950 dark:text-emerald-400 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 flex items-center justify-center p-4">
        {/* Theme toggle */}
        <button
          onClick={() => setDark((d) => !d)}
          className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-sm bg-white/70 hover:bg-white dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 transition"
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {dark ? 'Light' : 'Dark'} Mode
        </button>
        <div className="w-full max-w-6xl">
          <div className="text-center mb-6 md:mb-8">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Clock className="w-7 h-7 md:w-10 md:h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-emerald-400 mb-2 md:mb-3">TimeBank</h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-emerald-400/80 px-4">Exchange Skills, Share Time, Build Community</p>
          </div>

          {authMode === 'login' ? (
            <LoginForm onToggleMode={() => setAuthMode('register')} />
          ) : (
            <RegisterForm onToggleMode={() => setAuthMode('login')} />
          )}

          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 text-center dark:bg-gray-900/60 dark:text-emerald-400 dark:border dark:border-gray-800">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 dark:bg-emerald-900/30">
                <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-emerald-400 mb-2">Time-Based Exchange</h3>
              <p className="text-sm text-gray-600 dark:text-emerald-400/80">1 hour = 1 credit, fair for everyone</p>
            </div>

            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 text-center dark:bg-gray-900/60 dark:text-emerald-400 dark:border dark:border-gray-800">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 dark:bg-emerald-900/30">
                <Briefcase className="w-6 h-6 text-blue-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-emerald-400 mb-2">Diverse Skills</h3>
              <p className="text-sm text-gray-600 dark:text-emerald-400/80">From coding to cooking, all skills valued equally</p>
            </div>

            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 text-center dark:bg-gray-900/60 dark:text-emerald-400 dark:border dark:border-gray-800">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3 dark:bg-emerald-900/30">
                <User className="w-6 h-6 text-amber-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-emerald-400 mb-2">Community Trust</h3>
              <p className="text-sm text-gray-600 dark:text-emerald-400/80">Build reputation through quality service</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services' as View, label: 'Services', icon: Briefcase },
    { id: 'bookings' as View, label: 'Bookings', icon: Calendar },
    { id: 'wallet' as View, label: 'Wallet', icon: Wallet },
    { id: 'profile' as View, label: 'Profile', icon: User },
  ];

  // If user is the official admin id, expose admin nav
  if (user && user.id === 'official-account') {
    navItems.push({ id: 'admin' as View, label: 'Admin', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gray-950 dark:text-emerald-400 dark:from-gray-950 dark:to-gray-950 pb-20 md:pb-4">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-emerald-400">TimeBank</h1>
                <p className="hidden md:block text-xs text-gray-500 dark:text-emerald-400/80">Skill Exchange Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {/* Chat Inbox Button */}
              <button
                onClick={openInbox}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-gray-800"
                title="Chat Inbox"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="hidden md:inline">Chats</span>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full px-1.5">{unread}</span>
                )}
              </button>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      currentView === item.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                );
              })}

              {/* Dark mode toggle */}
              <button
                onClick={() => setDark((d) => !d)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-gray-800"
                title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="hidden md:inline">{dark ? 'Light' : 'Dark'} Mode</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition dark:hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>

            {/* Mobile Logout Button */}
            <div className="md:hidden">
              <button
                onClick={logout}
                className="flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition dark:hover:bg-red-900/20"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                  currentView === item.id
                    ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

  {/* Main Content */}
  <main className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-4 md:py-8">
  {currentView === 'dashboard' && <DashboardView />}
  {currentView === 'profile' && <ProfileView />}
  {currentView === 'wallet' && <WalletView />}
  {currentView === 'services' && <ServiceList />}
  {currentView === 'bookings' && <BookingList />}
  {currentView === 'admin' && <AdminPanel />}
      </main>

  {/* Chat Section Modal */}
  <ChatSectionUI />

  <footer className="bg-white border-t border-gray-200 mt-12 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium text-gray-800 dark:text-emerald-400 mb-1">TimeBank - Building Community Through Skill Exchange</p>
            <p className="dark:text-emerald-400/80">Every hour of service strengthens our collaborative network</p>
          </div>
        </div>
      </footer>

      {/* SOS Button - Always visible when logged in */}
      <SOSButton userLocation={userLocation} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
