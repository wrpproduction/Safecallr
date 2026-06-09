import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, 
  Clock, 
  Activity, 
  Database, 
  Plus, 
  LayoutDashboard, 
  History, 
  Settings, 
  LogOut, 
  Loader2, 
  Mail, 
  Smartphone,
  CheckCircle,
  AlertTriangle,
  XCircle,
  User,
  Shield,
  Send,
  X
} from "lucide-react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { toast } from "sonner";

// ==========================================
// TYPINGS & INTERFACES (SafeCallr Business)
// ==========================================

export interface BusinessMember {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "admin" | "co-admin" | "member";
  status: "active" | "pending" | "suspended";
  photoUrl?: string;
  jobTitle?: string;
  bio?: string;
  createdAt: any;
}

export interface BusinessAuthentication {
  id?: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  targetName: string;
  code: string;
  status: "authenticated" | "expired" | "refused";
  createdAt: any;
  resolvedAt: any;
}

export interface BusinessOrganization {
  id: string;
  name: string;
  siret: string;
  address: string;
  adminEmail: string;
  status: "active" | "inactive" | "suspended";
  createdAt: any;
  annualFee?: number;
  licenseStart?: any;
  licenseEnd?: any;
}

export default function BusinessAdminDashboard() {
  const navigate = useNavigate();
  
  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [memberProfile, setMemberProfile] = useState<BusinessMember | null>(null);
  const [organization, setOrganization] = useState<BusinessOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Business Data
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [authentications, setAuthentications] = useState<BusinessAuthentication[]>([]);
  const [totalAuthenticationsCount, setTotalAuthenticationsCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // FIRESTORE ERROR HANDLER (Required by Skill)
  // ==========================================
  const handleFirestoreErrorLocal = (err: unknown, operationType: "create" | "update" | "delete" | "list" | "get" | "write", path: string | null) => {
    const errInfo = {
      error: err instanceof Error ? err.message : String(err),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error("Firestore Error Detailed: ", JSON.stringify(errInfo));
    toast.error("Erreur d'accès à la base de données. Veuillez recharger.");
  };

  // ==========================================
  // AUTH & CONTEXT INITIALIZATION
  // ==========================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast.error("Veuillez vous connecter pour accéder à l'administration Business.");
        navigate("/auth");
        return;
      }
      setCurrentUser(user);

      try {
        // 1. Fetch user collection doc to get orgId
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        let orgId = userDoc.exists() ? userDoc.data()?.orgId : null;
        
        // Dynamic Fallback: If no orgId found (e.g. newly registered user testing business),
        // let's check custom claim/admins or create a template organization for testing!
        if (!orgId) {
          console.log("No organization associated. Searching or bootstrapping a test organization for debug...");
          // Try to look for any organization where user is a member
          const orgsSnapshot = await getDocs(collection(db, "organizations"));
          
          let foundOrgId = null;
          for (const orgDoc of orgsSnapshot.docs) {
            const memberDoc = await getDoc(doc(db, "organizations", orgDoc.id, "members", user.uid));
            if (memberDoc.exists()) {
              foundOrgId = orgDoc.id;
              break;
            }
          }
          
          if (!foundOrgId) {
            // Self-create a test business sandbox organization for Ulrich/xdcam to test
            const newOrgId = "org_sandbox_" + user.uid.substring(0, 6);
            const demoOrg: BusinessOrganization = {
              id: newOrgId,
              name: "Acme Corporation",
              siret: "12345678900012",
              address: "10 Rue de la Paix, 75002 Paris",
              adminEmail: user.email || "admin@acme.com",
              status: "active",
              createdAt: new Date(),
              annualFee: 1500,
              licenseStart: new Date(),
              licenseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            };
            
            await setDoc(doc(db, "organizations", newOrgId), demoOrg);
            
            // Create member profile as Admin
            const demoAdmin: BusinessMember = {
              firstName: user.displayName?.split(" ")[0] || "Administrateur",
              lastName: user.displayName?.split(" ")[1] || "Conncté",
              email: user.email || "admin@acme.com",
              role: "admin",
              status: "active",
              createdAt: new Date(),
              jobTitle: "Directeur de la Sécurité"
            };
            
            await setDoc(doc(db, "organizations", newOrgId, "members", user.uid), demoAdmin);
            
            // Update user's orgId links
            await setDoc(doc(db, "users", user.uid), { orgId: newOrgId }, { merge: true });
            orgId = newOrgId;
            toast.success("Espace de démonstration SafeCallr Business initialisé avec succès !");
          } else {
            orgId = foundOrgId;
          }
        }

        if (!orgId) {
          setError("Aucune organisation SafeCallr Business associée à votre compte.");
          setLoading(false);
          return;
        }

        // 2. Fetch Organization Details
        const orgDocRef = doc(db, "organizations", orgId);
        const orgSnapshot = await getDoc(orgDocRef);
        if (!orgSnapshot.exists()) {
          setError("L'organisation est introuvable de notre côté.");
          setLoading(false);
          return;
        }

        setOrganization({ id: orgSnapshot.id, ...orgSnapshot.data() } as BusinessOrganization);

        // 3. Keep real-time monitor on the current administrator's role
        const memberRef = doc(db, "organizations", orgId, "members", user.uid);
        const unsubMember = onSnapshot(memberRef, (snap) => {
          if (!snap.exists()) {
            setError("Votre profil membre au sein de l'organisation n'existe pas.");
            setLoading(false);
            return;
          }
          const profile = snap.data() as BusinessMember;
          setMemberProfile(profile);

          // VERIFY ADMIN ROLE: must be admin or co-admin
          if (profile.role !== "admin" && profile.role !== "co-admin") {
            setError("Accès refusé : Seuls les rôles Administrateur et Co-Administrateur peuvent accéder à ce portail.");
            setLoading(false);
            return;
          }
        }, (err) => {
          handleFirestoreErrorLocal(err, "get", `organizations/${orgId}/members/${user.uid}`);
          setLoading(false);
        });

        // 4. Real-time fetch members list
        const membersQuery = collection(db, "organizations", orgId, "members");
        const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
          const membersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessMember));
          setMembers(membersList);
        }, (err) => {
          handleFirestoreErrorLocal(err, "list", `organizations/${orgId}/members`);
        });

        // 5. Real-time fetch authentications limit 10 (Last 10 Sollicitations)
        const authsQuery = query(
          collection(db, "organizations", orgId, "authentications"),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const unsubAuths = onSnapshot(authsQuery, (snapshot) => {
          const authsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessAuthentication));
          setAuthentications(authsList);
        }, (err) => {
          // If query fails because index is missing or first time creation, fallback to un-ordered simple listing
          console.warn("Ordered authentications query failed. Triggering fallback list...", err);
          const fallbackQuery = collection(db, "organizations", orgId, "authentications");
          onSnapshot(fallbackQuery, (snapshot) => {
            const authsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessAuthentication));
            // Sort client-side
            authsList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setAuthentications(authsList.slice(0, 10));
          });
        });

        // 6. Get Total authentications count
        const totalAuthsQuery = collection(db, "organizations", orgId, "authentications");
        const unsubTotalAuths = onSnapshot(totalAuthsQuery, (snapshot) => {
          setTotalAuthenticationsCount(snapshot.size);
          setLoading(false);
        });

        return () => {
          unsubMember();
          unsubMembers();
          unsubAuths();
          unsubTotalAuths();
        };

      } catch (err: any) {
        console.error("Init context error:", err);
        setError("Erreur fatale de chargement: " + err.message);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // ==========================================
  // ACTION: ADD MEMBER & TRIGGER EMAIL
  // ==========================================
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !currentUser) return;
    
    const { firstName, lastName, email, jobTitle } = newMember;
    if (!firstName || !lastName || !email) {
      toast.error("Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email).");
      return;
    }

    setIsSubmitting(true);
    const pathForCreate = `organizations/${organization.id}/members`;

    try {
      // 1. Create member in subcollection with status 'pending'
      const generatedMemberId = doc(collection(db, "organizations", organization.id, "members")).id;
      const memberPayload: BusinessMember = {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        role: "member",
        status: "pending",
        createdAt: new Date(),
        jobTitle: jobTitle || "Collaborateur"
      };

      await setDoc(doc(db, "organizations", organization.id, "members", generatedMemberId), memberPayload);

      // 2. Queue Invitation Email via Firestore Trigger Email extension
      const onboardingLink = `${window.location.origin}/business/onboarding?orgId=${organization.id}&email=${encodeURIComponent(email.trim().toLowerCase())}&memberId=${generatedMemberId}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 40px; color: #0F1B3D;">
          <div style="max-width: 600px; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(15,27,61,0.05); margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 24px; font-weight: bold; color: #0F1B3D; border-bottom: 3px solid #3DFFA0; padding-bottom: 8px;">SafeCallr Business</span>
            </div>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Bonjour ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Votre administrateur vient de vous inviter à rejoindre l'espace professionnel de l'entreprise <strong>${organization.name}</strong> sur SafeCallr.</p>
            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">SafeCallr Business est une solution d'authentification vocale double-facteur qui vous prémunit du spoofing téléphonique et des tentatives d'usurpation d'identité lors d'appels à fort enjeu.</p>
            
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="${onboardingLink}" style="display: inline-block; background-color: #0F1B3D; color: #3DFFA0; text-decoration: none; font-weight: bold; padding: 14px 32px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Finaliser mon inscription SafeCallr Business
              </a>
            </div>
            
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Si le bouton ci-dessus ne fonctionne pas, copiez-collez l'adresse suivante dans votre navigateur : <br/> 
            <a href="${onboardingLink}" style="color: #0F1B3D;">${onboardingLink}</a></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">L'équipe de SafeCallr • Sécurité téléphonique renforcée</p>
          </div>
        </div>
      `;

      await addDoc(collection(db, "mail"), {
        to: email.trim().toLowerCase(),
        message: {
          subject: `Invitation SafeCallr Business - ${organization.name}`,
          html: emailHtml,
          text: `Bonjour ${firstName},\n\nVous êtes invité à rejoindre SafeCallr Business pour l'entreprise ${organization.name}.\nUtilisez l'adresse suivante pour finaliser votre inscription : ${onboardingLink}`
        },
        createdAt: new Date()
      });

      toast.success(`Invitation envoyée à ${firstName} (${email}) !`);
      setIsModalOpen(false);
      setNewMember({ firstName: "", lastName: "", email: "", jobTitle: "" });

    } catch (err) {
      handleFirestoreErrorLocal(err, "create", pathForCreate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Helper stats computed from snapshot states
  const activeMembersCount = members.filter(m => m.status === "active").length;
  const pendingMembersCount = members.filter(m => m.status === "pending").length;

  // Compute solicitations this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthAuthenticationsCount = authentications.filter(authDoc => {
    if (!authDoc.createdAt) return false;
    // can be JS Date or Firebase Timestamp with method .toDate()
    const itemDate = typeof authDoc.createdAt.toDate === "function" 
      ? authDoc.createdAt.toDate() 
      : new Date(authDoc.createdAt);
    return itemDate >= startOfMonth;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#0F1B3D] animate-spin mb-4" />
        <p className="text-[#0F1B3D] font-medium text-sm">Chargement de votre espace Business...</p>
      </div>
    );
  }

  if (error || !memberProfile || !organization) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <XCircle size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#0F1B3D]">Une anomalie est survenue</h1>
            <p className="text-slate-500 text-sm">{error || "Vous n'avez pas l'autorisation d'accéder à ce portail."}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/me" className="bg-[#0F1B3D] text-[#3DFFA0] py-3 rounded-lg font-bold text-sm hover:opacity-95 transition-all text-center">
              Retour à mon espace
            </Link>
            <button onClick={handleLogout} className="text-slate-500 hover:text-[#0F1B3D] text-sm py-2 font-medium">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-[#0F1B3D] font-sans">
      
      {/* ==========================================
          SIDEBAR NAVIGATION (Light slate / Navy)
          ========================================== */}
      <aside className="w-64 bg-[#0F1B3D] shrink-0 min-h-screen text-white flex flex-col justify-between border-r border-[#1a2d5e]">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-[#1a2d5e] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#3DFFA0] flex items-center justify-center">
              <Shield className="text-[#0F1B3D] w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-white">SafeCallr</h2>
              <span className="text-[10px] text-[#3DFFA0] uppercase font-bold tracking-widest block -mt-1">Business</span>
            </div>
          </div>

          {/* Connected User / Corporate Identity Info */}
          <div className="p-6 border-b border-[#1a2d5e] bg-[#14234c] space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Organisation</p>
              <h4 className="text-sm font-bold text-white truncate leading-tight mt-0.5">{organization.name}</h4>
              <span className="text-[9px] text-[#3DFFA0] uppercase font-bold bg-[#3DFFA0]/10 px-2 py-0.5 rounded-full inline-block mt-1">
                SIRET: {organization.siret}
              </span>
            </div>
            
            <div className="pt-2 border-t border-[#1a2d5e]/50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-[#0F1B3D] text-xs font-bold">
                {memberProfile.photoUrl ? (
                  <img src={memberProfile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  memberProfile.firstName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase font-bold text-slate-300 leading-none truncate">{memberProfile.firstName} {memberProfile.lastName}</p>
                <span className="text-[9px] font-medium text-slate-400 capitalize mt-0.5 inline-block">
                  {memberProfile.role === "admin" ? "Administrateur" : "Co-administrateur"}
                </span>
              </div>
            </div>
          </div>

          {/* Links navigation list */}
          <nav className="p-4 space-y-1">
            <Link 
              to="/business/admin/dashboard" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#3DFFA0] text-[#0F1B3D] font-bold text-sm transition-all shadow-md shadow-[#3DFFA0]/10"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            <Link 
              to="/business/admin/members" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-[#1a2d5e] font-medium text-sm transition-all"
            >
              <Users size={18} />
              <span>Collaborateurs</span>
            </Link>

            <Link 
              to="/business/admin/history" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-[#1a2d5e] font-medium text-sm transition-all"
            >
              <History size={18} />
              <span>Historique</span>
            </Link>

            <Link 
              to="/business/admin/settings" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-[#1a2d5e] font-medium text-sm transition-all"
            >
              <Settings size={18} />
              <span>Paramètres</span>
            </Link>
          </nav>
        </div>

        {/* Support & Logout links at bottom */}
        <div className="p-4 border-t border-[#1a2d5e]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl text-sm font-semibold transition-all"
          >
            <LogOut size={18} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN AREA CONTENT
          ========================================== */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Top Header navbar banner */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-[#0F1B3D]">Console de Supervision SafeCallr Business</h1>
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest border border-slate-200">
              Espace Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#0F1B3D] text-[#3DFFA0] px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:opacity-95 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Ajouter un collaborateur</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid Container */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* ==========================================
              FOUR KPI SPANNING CARDS (Pristine layout)
              ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1 : Active members */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
              <div className="space-y-2">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Collaborateurs actifs</p>
                <h3 className="text-3xl font-black text-[#0F1B3D]">{activeMembersCount}</h3>
                <p className="text-slate-400 text-xs">Utilisateurs configurés</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F1B3D]">
                <Users size={24} />
              </div>
            </div>

            {/* KPI 2 : Pending fiches */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
              <div className="space-y-2">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Fiches en attente</p>
                <h3 className="text-3xl font-black text-[#0F1B3D]">{pendingMembersCount}</h3>
                <p className="text-slate-400 text-xs">Invitations en cours</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
                <Clock size={24} />
              </div>
            </div>

            {/* KPI 3 : Current Month request activities */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
              <div className="space-y-2">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sollicitations ce mois</p>
                <h3 className="text-3xl font-black text-[#0F1B3D]">{monthAuthenticationsCount}</h3>
                <p className="text-slate-400 text-xs">Activité en direct</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Activity size={24} />
              </div>
            </div>

            {/* KPI 4 : Total request count ever */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
              <div className="space-y-2">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sollicitations totales</p>
                <h3 className="text-3xl font-black text-[#0F1B3D]">{totalAuthenticationsCount}</h3>
                <p className="text-slate-400 text-xs">Historique cumulé</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Database size={24} />
              </div>
            </div>

          </div>

          {/* ==========================================
              TABLE FOR THE 10 LATEST CUSTOM PROTOCOLS
              ========================================== */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F1B3D]">10 dernières sollicitations d'authentification</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-1">
                  Protocole d'authentification intercepté et monitoré en direct par le protocole SafeCallr.
                </p>
              </div>
              <Link 
                to="/business/admin/history"
                className="text-xs uppercase tracking-wider font-extrabold text-[#0F1B3D] bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg"
              >
                Voir tout l'historique
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">De (Collaborateur)</th>
                    <th className="px-6 py-4">Vers (Cible)</th>
                    <th className="px-6 py-4">Date/Heure</th>
                    <th className="px-6 py-4 text-center">Code push</th>
                    <th className="px-6 py-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {authentications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Shield className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-medium text-slate-500">Aucune sollicitation d'authentification</p>
                          <p className="text-xs text-slate-400">Quand vos collaborateurs utiliseront le protocole SafeCallr, les audits apparaîtront ici.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    authentications.map((authLog) => {
                      const dtFormatted = authLog.createdAt
                        ? (typeof authLog.createdAt.toDate === "function" ? authLog.createdAt.toDate() : new Date(authLog.createdAt)).toLocaleString("fr-FR")
                        : "N/A";
                      
                      return (
                        <tr key={authLog.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold font-mono">
                                {authLog.requesterName ? authLog.requesterName.charAt(0) : "U"}
                              </div>
                              <div>
                                <p className="font-bold text-[#0F1B3D]">{authLog.requesterName || "Utilisateur"}</p>
                                <span className="text-[10px] text-slate-400">ID: {authLog.requesterId?.substring(0, 8)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-[#0F1B3D]">{authLog.targetName || "Contact"}</p>
                              <span className="text-[10px] text-slate-400">ID: {authLog.targetId?.substring(0, 8)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                            {dtFormatted}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-mono bg-slate-100 px-3 py-1 rounded text-xs font-black text-[#0F1B3D] tracking-widest">
                              {authLog.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {authLog.status === "authenticated" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle size={12} />
                                Authentifié
                              </span>
                            )}
                            {authLog.status === "expired" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle size={12} />
                                Expiré
                              </span>
                            )}
                            {authLog.status === "refused" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle size={12} />
                                Refusé
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>

      {/* ==========================================
          MODAL DIALOG: ADD COLLABORATOR (PAGE 2 requirement integrated)
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 relative space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[#0F1B3D]">
                  <Plus size={18} />
                </div>
                <h3 className="text-lg font-bold text-[#0F1B3D]">Ajouter un collaborateur</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed">
              Le collaborateur recevra par email un lien unique d'activation lui permettant de finaliser sa fiche profil et d'accéder au protocole SafeCallr Business.
            </p>

            {/* Form */}
            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-extrabold text-slate-500">Prénom <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={newMember.firstName}
                    onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                    placeholder="ex: Thomas"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white focus:border-[#0F1B3D] focus:ring-1 focus:ring-[#0F1B3D] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-extrabold text-slate-500">Nom <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={newMember.lastName}
                    onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                    placeholder="ex: Durand"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white focus:border-[#0F1B3D] focus:ring-1 focus:ring-[#0F1B3D] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-extrabold text-slate-500">Email professionnel <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 text-slate-400 w-4 h-4" />
                  <input 
                    type="email" 
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="Thomas.durand@entreprise.com"
                    className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-2.5 rounded-xl text-sm focus:bg-white focus:border-[#0F1B3D] focus:ring-1 focus:ring-[#0F1B3D] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-extrabold text-slate-500">Fonction / Poste professionnel</label>
                <input 
                  type="text" 
                  value={newMember.jobTitle}
                  onChange={(e) => setNewMember({ ...newMember, jobTitle: e.target.value })}
                  placeholder="ex: Chef des Comptes"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white focus:border-[#0F1B3D] focus:ring-1 focus:ring-[#0F1B3D] outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#0F1B3D] font-bold text-sm py-3 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-[#0F1B3D] text-[#3DFFA0] font-bold text-sm py-3 rounded-xl hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#3DFFA0]" />
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Envoyer l'invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
