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
import Welcome from "./pages/Welcome";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCompanies from "./pages/AdminCompanies";
import AdminRequests from "./pages/AdminRequests";
import AdminPros from "./pages/AdminPros";
import AdminAlerts from "./pages/AdminAlerts";
import AdminOrganizationsList from "./pages/admin/AdminOrganizationsList";
import AdminCreateOrganization from "./pages/AdminCreateOrganization";
import AdminOrganizationDetail from "./pages/AdminOrganizationDetail";
import AdminBlog from "./pages/admin/AdminBlog";
import Actualites from "./pages/Actualites";
import ArticleDetail from "./pages/ArticleDetail";
import RepDashboard from "./pages/RepDashboard";
import MeDashboard from "./pages/me/MeDashboard";
import MeHistory from "./pages/me/MeHistory";
import Unauthorized from "./pages/Unauthorized";
import OrgAuthRequestDetails from "./pages/OrgAuthRequestDetails";
import InstitutionErrorPage from "./pages/InstitutionErrorPage";

// SafeCallr Business Administrator Pages
import BusinessAdminDashboard from "./pages/business/AdminDashboard";
import BusinessAdminMembers from "./pages/business/AdminMembers";
import BusinessAdminHistory from "./pages/business/AdminHistory";
import BusinessAdminSettings from "./pages/business/AdminSettings";
import BusinessRegister from "./pages/business/BusinessRegister";
import AdminBusinessBilling from "./pages/admin/AdminBusinessBilling";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Layout from "./components/Layout";
import SEOManager from "./components/seo/SEOManager";
import ScrollToTop from "./components/ScrollToTop";
import { registerSW } from 'virtual:pwa-register';

import Particuliers from "./pages/Particuliers";
import Professionnels from "./pages/Professionnels";
import Entreprises from "./pages/Entreprises";

import { Capacitor } from "@capacitor/core";

// Register Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  registerSW({
    onNeedRefresh() {
      console.log('App needs refresh');
    },
    onOfflineReady() {
      console.log('App is ready for offline use');
    },
  });
}

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

import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";

// JSON-LD Constants
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SafeCallr",
  "url": "https://safecallr.com",
  "logo": "https://safecallr.com/logo.png",
  "description": "Plateforme d'authentification humaine pour lutter contre la fraude téléphonique professionnelle et le spoofing.",
  "sameAs": [
    "https://www.linkedin.com/company/safecallr",
    "https://twitter.com/safecallr"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "contact@safecallr.com",
    "contactType": "customer support"
  }
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SafeCallr",
  "url": "https://safecallr.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://safecallr.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fail-safe timeout to dismiss the splash loading spinner after 6 seconds
    const timeoutId = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn("[SafeCallr] Startup loading timed out. Forcing app initialization.");
          return false;
        }
        return prevLoading;
      });
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          // Wrap the profile document fetch in a 15-second safety timeout
          const getProfilePromise = getDoc(doc(db, "users", authUser.uid));
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout profile retrieval")), 15000)
          );

          try {
            const userDoc = await Promise.race([getProfilePromise, timeoutPromise]);
            if (userDoc && userDoc.exists()) {
              setUser({ ...authUser, ...userDoc.data() });
            } else {
              setUser({ ...authUser });
            }
          } catch (profileErr) {
            console.warn("[SafeCallr] User profile fetch timed out or failed, using auth fallback:", profileErr);
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
        clearTimeout(timeoutId);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
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
    if (!user) return <Navigate to="/" />;
    if (!isEmailVerified) return <VerifyEmail user={user} />;
    if (!isProfileComplete) return <CompleteProfile user={user} />;
    return <Component user={user} />;
  };

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={
            <>
              <SEOManager 
                title="Authentification Appel & Lutte Fraude Bancaire"
                description="SafeCallr sécurise vos appels bancaires et professionnels. Luttez contre le spoofing et la fraude au faux conseiller grâce à notre 2FA pour téléphone."
                jsonLd={[
                  ORGANIZATION_JSON_LD,
                  WEBSITE_JSON_LD,
                  {
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "SafeCallr",
                    "operatingSystem": "iOS, Android, Web",
                    "applicationCategory": "SecurityApplication",
                    "offers": {
                      "@type": "Offer",
                      "price": "0",
                      "priceCurrency": "EUR"
                    }
                  }
                ]}
              />
              {user ? (isEmailVerified ? (isProfileComplete ? <Navigate to="/dashboard" /> : <CompleteProfile user={user} />) : <VerifyEmail user={user} />) : <Landing />}
            </>
          } />
          
          <Route path="/particuliers" element={<Particuliers />} />

          <Route path="/professionnels" element={<Professionnels />} />

          <Route path="/entreprises" element={<Entreprises />} />
          <Route path="/institutions" element={<Entreprises />} />

          <Route path="/company-contact" element={
            <>
              <SEOManager 
                title="Contactez un expert en sécurité téléphonique"
                description="Une question sur le déploiement ou besoin d'une démo ? Contactez l'équipe SafeCallr pour sécuriser vos communications professionnelles."
              />
              <CompanyContact />
            </>
          } />

          {/* Legal routes Placeholder mapping to be handled in Landing or specific component if needed */}
          <Route path="/mentions-legales" element={
            <>
              <SEOManager title="Mentions Légales" description="Informations légales relatives à l'utilisation du service SafeCallr." noIndex />
              <Landing legal="mentions" />
            </>
          } />
          <Route path="/cgu" element={
            <>
              <SEOManager title="Conditions Générales d'Utilisation" description="Les CGU encadrent l'accès et l'utilisation de la plateforme SafeCallr." noIndex />
              <Landing legal="cgu" />
            </>
          } />
          <Route path="/confidentialite" element={
            <>
              <SEOManager title="Politique de Confidentialité" description="Découvrez comment SafeCallr protège vos données personnelles et respecte le RGPD." noIndex />
              <Landing legal="privacy" />
            </>
          } />

          <Route path="/actualite" element={<Actualites />} />
          <Route path="/actualite/:slug" element={<ArticleDetail />} />

          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/auth" element={user ? (isEmailVerified ? (isProfileComplete ? <Navigate to="/dashboard" /> : <CompleteProfile user={user} />) : <VerifyEmail user={user} />) : <Auth />} />
          <Route path="/register" element={user ? (isEmailVerified ? (isProfileComplete ? <Navigate to="/dashboard" /> : <CompleteProfile user={user} />) : <VerifyEmail user={user} />) : <Register />} />
          
          <Route path="/pro/login" element={<ProLogin />} />
          <Route path="/pro/register" element={<ProRegister />} />
          <Route path="/pro/forgot-password" element={<ProForgotPassword />} />
          
          {/* zones non indexées (robots.txt les bloquera) */}
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
  
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
          <Route path="/admin/companies" element={<AdminProtectedRoute><AdminCompanies /></AdminProtectedRoute>} />
          <Route path="/admin/requests" element={<AdminProtectedRoute><AdminRequests /></AdminProtectedRoute>} />
          <Route path="/admin/pros" element={<AdminProtectedRoute><AdminPros /></AdminProtectedRoute>} />
          <Route path="/admin/alerts" element={<AdminProtectedRoute><AdminAlerts /></AdminProtectedRoute>} />
          <Route path="/admin/blog" element={<AdminProtectedRoute><AdminBlog /></AdminProtectedRoute>} />
          <Route path="/admin/organizations" element={<AdminProtectedRoute><AdminOrganizationsList /></AdminProtectedRoute>} />
          <Route path="/admin/organizations/new" element={<AdminProtectedRoute><AdminCreateOrganization /></AdminProtectedRoute>} />
          <Route path="/admin/organizations/:id" element={<AdminProtectedRoute><AdminOrganizationDetail /></AdminProtectedRoute>} />
          <Route path="/admin/business/billing" element={<AdminProtectedRoute><AdminBusinessBilling /></AdminProtectedRoute>} />
          
          {/* SafeCallr Business Administrator Routes */}
          <Route path="/business/register" element={<BusinessRegister />} />
          <Route path="/business/admin/dashboard" element={<BusinessAdminDashboard />} />
          <Route path="/business/admin/members" element={<BusinessAdminMembers />} />
          <Route path="/business/admin/history" element={<BusinessAdminHistory />} />
          <Route path="/business/admin/settings" element={<BusinessAdminSettings />} />
          
          <Route path="/dashboard/:orgId" element={renderProtectedRoute(RepDashboard)} />
          <Route path="/me" element={renderProtectedRoute(MeDashboard)} />
          <Route path="/me/history" element={renderProtectedRoute(MeHistory)} />
          
          <Route element={<Layout user={user} />}>
            <Route path="/dashboard" element={renderProtectedRoute(Dashboard)} />
            <Route path="/new-request" element={renderProtectedRoute(NewRequest)} />
            <Route path="/request/:id" element={renderProtectedRoute(RequestStatus)} />
            <Route path="/auth-request/:id" element={renderProtectedRoute(AuthRequestDetails)} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/history" element={renderProtectedRoute(History)} />
            <Route path="/contacts" element={renderProtectedRoute(Contacts)} />
            <Route path="/profile" element={renderProtectedRoute(Profile)} />
          </Route>

          <Route path="/org-auth/:orgId/:requestId" element={renderProtectedRoute(OrgAuthRequestDetails)} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/account-suspended" element={<InstitutionErrorPage type="suspended" />} />
          <Route path="/organization-inactive" element={<InstitutionErrorPage type="inactive" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
