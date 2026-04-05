import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import InvitePage from './pages/InvitePage';
import Portal_A78x from './pages/Portal_A78x';
import Gate_X92 from './pages/Gate_X92';
import OnboardingPage from './pages/OnboardingPage';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import UserLayout from './layouts/UserLayout';
import SpotlightSearch from './components/SpotlightSearch';
import TrialLockOverlay from './components/TrialLockOverlay';
import { useAuth } from './context/AuthContext';

// Super Admin Pages
const AuditsPage = lazy(() => import('./pages/admin/AuditsPage'));
const CompaniesPage = lazy(() => import('./pages/admin/CompaniesPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const SuperSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

// User Pages
const HomePage = lazy(() => import('./pages/dashboard/HomePage'));
const ChatPage = lazy(() => import('./pages/dashboard/ChatPage'));
const DocumentsPage = lazy(() => import('./pages/dashboard/DocumentsPage'));
const ProjectsPage = lazy(() => import('./pages/dashboard/ProjectsPage'));
const TeamPage = lazy(() => import('./pages/dashboard/TeamPage'));
const BillingPage = lazy(() => import('./pages/dashboard/BillingPage'));

/**
 * CORE HUD LOADER - SYSTEM INITIALIZATION
 */
const GlobalLoader = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 space-y-12 overflow-hidden relative">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-[3px] border-slate-200 border-t-blue-700 rounded-[32px] shadow-2xl"
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center text-white italic font-black text-xl shadow-xl">
              U
           </div>
        </div>
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-blue-500 blur-3xl rounded-full"
        />
      </div>

      <div className="text-center space-y-4 relative z-10">
        <h1 className="text-2xl font-[950] italic uppercase tracking-tighter text-slate-900">
           UNY <span className="text-blue-700">Protocol</span>
        </h1>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">
          Initializing Sovereign Handshake...
        </p>
      </div>
    </div>
  );
};

/**
 * ROOT PROTOCOL - SMART REDIRECTION
 */
const RootProtocol = () => {
  const { user, profile, isLoading, profileLoaded, isSuperAdmin } = useAuth();
  
  if (isLoading || !profileLoaded) return <GlobalLoader />;
  
  if (user) {
    if (isSuperAdmin || user.role === 'SUPER_ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    if (!profile?.organization_id) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/app" replace />;  // Regular users go to /app
  }
  
  return <LandingPage />;
};

/**
 * SUPER ADMIN ROUTE - Redirects non-super-admins to /app
 */
function SuperAdminRoute({ children }: { children?: React.ReactNode }) {
  const { user, isLoading, profileLoaded, isSuperAdmin } = useAuth();

  if (isLoading || !profileLoaded) return <GlobalLoader />;
  if (!isSuperAdmin && user?.role !== 'SUPER_ADMIN') return <Navigate to="/app" replace />;

  return <>{children}</>;
}

/**
 * USER ROUTE - Redirects super admins to /dashboard
 */
function UserRoute({ children }: { children?: React.ReactNode }) {
  const { user, profile, isLoading, profileLoaded, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading || !profileLoaded) return <GlobalLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // Super admins go to their dashboard
  if (isSuperAdmin || user.role === 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const hasOrg = !!profile?.organization_id;
  const isAtOnboarding = location.pathname === '/onboarding' || location.pathname === '/onboarding/';

  if (!hasOrg && !isAtOnboarding) return <Navigate to="/onboarding" replace />;
  if (hasOrg && isAtOnboarding) return <Navigate to="/app" replace />;

  return <>{children}</>;
}

const CatchAllRoute = () => {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

const App: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (anonKey && anonKey.length > 20) {
      // Supabase ANON_KEY detected and valid
    }
  }, []);

  return (
    <>
      <SpotlightSearch />
      <TrialLockOverlay />
      <Suspense fallback={<GlobalLoader />}>
        <Routes location={location}>
          <Route path="/" element={<RootProtocol />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/invite/:token/" element={<InvitePage />} />
          <Route path="/Portal_A78x" element={<Portal_A78x />} />
          <Route path="/Gate_X92" element={<Gate_X92 />} />
          
          <Route path="/onboarding" element={
            <UserRoute>
              <OnboardingPage />
            </UserRoute>
          } />
          
          {/* Super Admin Dashboard */}
          <Route path="/dashboard" element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }>
            <Route path="audits" element={
              <SuperAdminRoute>
                <AuditsPage />
              </SuperAdminRoute>
            } />
            <Route path="companies" element={
              <SuperAdminRoute>
                <CompaniesPage />
              </SuperAdminRoute>
            } />
            <Route path="users" element={
              <SuperAdminRoute>
                <UsersPage />
              </SuperAdminRoute>
            } />
            <Route path="settings" element={
              <SuperAdminRoute>
                <SuperSettingsPage />
              </SuperAdminRoute>
            } />
            <Route index element={
              <SuperAdminRoute>
                <AuditsPage />
              </SuperAdminRoute>
            } />
          </Route>

          {/* User Dashboard */}
          <Route path="/app" element={
            <UserRoute>
              <UserLayout />
            </UserRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="billing" element={<BillingPage />} />
          </Route>
          
          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;