import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, onAuthStateChanged, doc, getDoc, db } from "./firebase";
import Onboarding from "./pages/Onboarding";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewRequest from "./pages/NewRequest";
import RequestStatus from "./pages/RequestStatus";
import History from "./pages/History";
import Contacts from "./pages/Contacts";
import AuthRequestDetails from "./pages/AuthRequestDetails";
import HowItWorks from "./pages/HowItWorks";
import CompleteProfile from "./pages/CompleteProfile";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Profile from "./pages/Profile";
import CompanyContact from "./pages/CompanyContact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCompanies from "./pages/AdminCompanies";
import AdminRequests from "./pages/AdminRequests";
import AdminPros from "./pages/AdminPros";
import AdminAlerts from "./pages/AdminAlerts";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Layout from "./components/Layout";

// Pro Pages
import ProLayout from "./components/pro/ProLayout";
import ProLogin from "./pages/pro/ProLogin";
import ProRegister from "./pages/pro/ProRegister";
import ProForgotPassword from "./pages/pro/ProForgotPassword";
import ProSearch from "./pages/pro/ProSearch";
import ProClients from "./pages/pro/ProClients";
import ProProfile from "./pages/pro/ProProfile";
import ProHistory from "./pages/pro/ProHistory";
import ProRequestWait from "./pages/pro/ProRequestWait";
import ProRequestCode from "./pages/pro/ProRequestCode";
import ProDashboard from "./pages/pro/ProDashboard";
import ProRouteGuard from "./components/pro/ProRouteGuard";

import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          const userDoc = await getDoc(doc(db, "users", authUser.uid));
          if (userDoc.exists()) {
            setUser({ ...authUser, ...userDoc.data() });
          } else {
            // Document non existant (ex: Google login interrompu)
            setUser({ ...authUser });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state error:", error);
        setUser(authUser ? { ...authUser } : null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  const isProfileComplete = user && user.phoneNumber;
  const isEmailVerified = user && (user.emailVerified || user.providerData?.some((p: any) => p.providerId === "google.com"));

  const renderProtectedRoute = (Component: any) => {
    if (!user) return <Navigate to="/auth" />;
    if (!isEmailVerified) return <VerifyEmail user={user} />;
    if (!isProfileComplete) return <CompleteProfile user={user} />;
    return <Component user={user} />;
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={user ? (isEmailVerified ? (isProfileComplete ? <Navigate to="/dashboard" /> : <CompleteProfile user={user} />) : <VerifyEmail user={user} />) : <Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth" element={user ? (isEmailVerified ? (isProfileComplete ? <Navigate to="/dashboard" /> : <CompleteProfile user={user} />) : <VerifyEmail user={user} />) : <Auth />} />
          <Route path="/register" element={user ? (isEmailVerified ? (isProfileComplete ? <Navigate to="/dashboard" /> : <CompleteProfile user={user} />) : <VerifyEmail user={user} />) : <Register />} />
          <Route path="/company-contact" element={<CompanyContact />} />
          
          {/* Pro Routes */}
          <Route path="/pro/login" element={<ProLogin />} />
          <Route path="/pro/register" element={<ProRegister />} />
          <Route path="/pro/forgot-password" element={<ProForgotPassword />} />
          <Route path="/pro" element={
            <ProRouteGuard>
              <ProLayout />
            </ProRouteGuard>
          }>
            <Route index element={<ProDashboard />} />
            <Route path="search" element={<ProSearch />} />
            <Route path="request/:id/wait" element={<ProRequestWait />} />
            <Route path="request/:id/code" element={<ProRequestCode />} />
            <Route path="clients" element={<ProClients />} />
            <Route path="history" element={<ProHistory />} />
            <Route path="profile" element={<ProProfile />} />
          </Route>
  
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <AdminUsers />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/companies" element={
            <AdminProtectedRoute>
              <AdminCompanies />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/requests" element={
            <AdminProtectedRoute>
              <AdminRequests />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/pros" element={
            <AdminProtectedRoute>
              <AdminPros />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/alerts" element={
            <AdminProtectedRoute>
              <AdminAlerts />
            </AdminProtectedRoute>
          } />
  
          <Route element={<Layout user={user} />}>
            <Route path="/dashboard" element={renderProtectedRoute(Dashboard)} />
            <Route path="/new-request" element={renderProtectedRoute(NewRequest)} />
            <Route path="/request/:id" element={renderProtectedRoute(RequestStatus)} />
            <Route path="/auth-request/:id" element={renderProtectedRoute(AuthRequestDetails)} />
            <Route path="/history" element={renderProtectedRoute(History)} />
            <Route path="/contacts" element={renderProtectedRoute(Contacts)} />
            <Route path="/profile" element={renderProtectedRoute(Profile)} />
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
