
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import LandingPage from './pages/LandingPage';
import DashboardHome from './pages/DashboardHome';
import LoginPage from './pages/LoginPage';
import InvitePage from './pages/InvitePage';
import Portal_A78x from './pages/Portal_A78x';
import Gate_X92 from './pages/Gate_X92';
import OnboardingPage from './pages/OnboardingPage';
import MainDashboard from './layouts/MainDashboard';
import TrialLockOverlay from './components/TrialLockOverlay';
import SpotlightSearch from './components/SpotlightSearch';
import { useAuth } from './context/AuthContext';

const NexusChatPage = lazy(() => import('./pages/NexusChatPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const MindMapPage = lazy(() => import('./pages/MindMapPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FinanceTresorerie = lazy(() => import('./pages/FinanceTresorerie'));
const TelemetryCenter = lazy(() => import('./pages/TelemetryCenter'));
const TimeTrackingPage = lazy(() => import('./pages/TimeTrackingPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const StrategyHub = lazy(() => import('./pages/StrategyHub'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const AuditLedgerPage = lazy(() => import('./pages/AuditLedgerPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const KnowledgeRegistry = lazy(() => import('./pages/KnowledgeRegistry'));
const KnowledgeHub = lazy(() => import('./pages/KnowledgeHub'));
const SupabaseTodoPage = lazy(() => import('./pages/SupabaseTodoPage'));
const PIIMonitor = lazy(() => import('./components/admin/PIIMonitor'));
const CompaniesMaster = lazy(() => import('./pages/admin/CompaniesMaster'));
const BillingControl = lazy(() => import('./pages/admin/BillingControl'));
const GlobalAudit = lazy(() => import('./pages/admin/GlobalAudit'));
const AdminAuditRequests = lazy(() => import('./pages/admin/AdminAuditRequests'));

/**
 * Super Admin route guard.
 */
function SuperAdminRoute({ children }: { children?: React.ReactNode }) {
  const { isSuperAdmin, isLoading, profileLoaded } = useAuth();

  if (isLoading || !profileLoaded) return <GlobalLoader />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

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
    // Super admin bypass tout - va directement au dashboard
    if (isSuperAdmin || user.role === 'SUPER_ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    // Utilisateur normal sans org → onboarding
    if (!profile?.organization_id) {
      return <Navigate to="/onboarding" replace />;
    }
    // Tout va bien → dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LandingPage />;
};

/**
 * PROTECTED ROUTE PROTOCOL v5.0 (Atomic Isolation)
 */
function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, profile, isLoading, profileLoaded, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading || !profileLoaded) return <GlobalLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Super admin peut accéder à tout sans restriction
  if (isSuperAdmin || user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const hasOrg = !!profile?.organization_id;
  const isAtOnboarding = location.pathname === '/onboarding' || location.pathname === '/onboarding/';

  if (!hasOrg && !isAtOnboarding) return <Navigate to="/onboarding" replace />;
  if (hasOrg && isAtOnboarding) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

const CatchAllRoute = () => {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

const App: React.FC = () => {
  const location = useLocation();

  // 🛡️ [Security] Verification of Supabase Client Configuration
  React.useEffect(() => {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const isDev = import.meta.env.DEV;
    
    if (anonKey && anonKey.length > 20) {
      // Supabase ANON_KEY detected and valid for public forms.
    } else {
      // Supabase ANON_KEY is missing or invalid. Public forms will fail.
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
          <Route path="/supabase-todos" element={<SupabaseTodoPage />} />
          
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="chat" element={<NexusChatPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="mindmap" element={<MindMapPage />} />
            <Route path="time" element={<TimeTrackingPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="knowledge" element={<KnowledgeRegistry />} />
            <Route path="knowledge-hub" element={<KnowledgeHub />} />
            <Route path="tools/treasury" element={<FinanceTresorerie />} />
            <Route path="tools/invoices" element={<InvoicesPage />} />
            <Route path="tools/contracts" element={<ContractsPage />} />
            <Route path="tools/strategy" element={<StrategyHub />} />
            <Route path="billing" element={<BillingPage />} />
            
            {/* Admin Routes */}
            <Route path="admin/telemetry" element={
              <SuperAdminRoute>
                <TelemetryCenter />
              </SuperAdminRoute>
            } />
            <Route path="admin/settings" element={
              <SuperAdminRoute>
                <SettingsPage />
              </SuperAdminRoute>
            } />
            <Route path="admin/audit" element={
              <SuperAdminRoute>
                <AuditLedgerPage />
              </SuperAdminRoute>
            } />
            <Route path="admin/pii" element={
              <SuperAdminRoute>
                <PIIMonitor />
              </SuperAdminRoute>
            } />
            <Route path="admin/companies" element={
              <SuperAdminRoute>
                <CompaniesMaster />
              </SuperAdminRoute>
            } />
            <Route path="admin/billing-control" element={
              <SuperAdminRoute>
                <BillingControl />
              </SuperAdminRoute>
            } />
            <Route path="admin/global-audit" element={
              <SuperAdminRoute>
                <GlobalAudit />
              </SuperAdminRoute>
            } />
            <Route path="admin/audit-requests" element={
              <SuperAdminRoute>
                <AdminAuditRequests />
              </SuperAdminRoute>
            } />
          </Route>
          
          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
