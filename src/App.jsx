import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppMain from '@/pages/AppMain';
import UserProfilePage from '@/pages/UserProfilePage';
import AccountSettings from '@/pages/AccountSettings';
import ServerDiscovery from '@/pages/ServerDiscovery';
import FriendListPage from '@/pages/FriendListPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ServerSettingsPage from '@/pages/ServerSettingsPage';
import ChannelSettingsPage from '@/pages/ChannelSettingsPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the app — auth pages are public; the main app is gated by ProtectedRoute
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<AppMain />} />
        <Route path="/channels/:serverId?/:channelId?" element={<AppMain />} />
        <Route path="/channel-settings" element={<ChannelSettingsPage />} />
        <Route path="/user-profile" element={<UserProfilePage />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/server-discovery" element={<ServerDiscovery />} />
        <Route path="/friend-list" element={<FriendListPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/server-settings" element={<ServerSettingsPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App