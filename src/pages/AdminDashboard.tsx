import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShieldCheck, 
  Building2, 
  History, 
  CheckCircle2, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Plus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import AdminLayout from "../components/AdminLayout";
import { toast } from "sonner";
import { safeFormatDate, parseToDate } from "../lib/dateUtils";
import { Link } from "react-router-dom";

// Mock data for the chart
const chartData = [
  { name: "Lun", requests: 45 },
  { name: "Mar", requests: 52 },
  { name: "Mer", requests: 38 },
  { name: "Jeu", requests: 65 },
  { name: "Ven", requests: 48 },
  { name: "Sam", requests: 25 },
  { name: "Dim", requests: 30 },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [resendConfigured, setResendConfigured] = useState<boolean | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      toast.error("Veuillez saisir une clé API Resend (ex: re_123456789)");
      return;
    }
    setIsSavingKey(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/resend-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde de la clé API");
      }

      toast.success("Clé API Resend enregistrée avec succès !");
      setResendConfigured(true);
      setShowKeyInput(false);
    } catch (err: any) {
      toast.error(err.message || "Échec de l'enregistrement de la clé API");
    } finally {
      setIsSavingKey(false);
    }
  };
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [recentOrgs, setRecentOrgs] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"members" | "pros" | "requests">("members");
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [recentPros, setRecentPros] = useState<any[]>([]);
  const [recentConns, setRecentConns] = useState<any[]>([]);
  const [orgsChartData, setOrgsChartData] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<"orgs" | "users" | "requests">("orgs");
  const [realStats, setRealStats] = useState({
    users: 0,
    pros: 0,
    orgs: 0,
    requests: 0
  });

  const formatSafeDate = (createdAt: any) => {
    return safeFormatDate(createdAt, "dd/MM/yyyy HH:mm", "N/A");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        
        // Auto-fix for Ulrich Vidal (to satisfy role user + pro, and resolve visibility)
        try {
          const emailToSearch = "ulrich.vidal@gmail.com";
          const { collection, query, where, getDocs, doc, setDoc, updateDoc } = await import("firebase/firestore");
          
          // A. Search in pros
          const prosQ = query(collection(db, "pros"), where("email", "==", emailToSearch));
          const prosSnap = await getDocs(prosQ);
          let proDocData: any = null;
          let proDocId: string | null = null;
          if (!prosSnap.empty) {
            proDocId = prosSnap.docs[0].id;
            proDocData = prosSnap.docs[0].data();
          }

          // B. Search in users
          const usersQ = query(collection(db, "users"), where("email", "==", emailToSearch));
          const usersSnap = await getDocs(usersQ);
          let userDocData: any = null;
          let userDocId: string | null = null;
          if (!usersSnap.empty) {
            userDocId = usersSnap.docs[0].id;
            userDocData = usersSnap.docs[0].data();
          }

          const targetUid = proDocId || userDocId;

          if (targetUid) {
            // 1. Ensure exists in pros and status is active
            if (!proDocData) {
              console.log("[AUTO-FIX CLIENT] Ulrich Vidal missing in pros, creating...");
              await setDoc(doc(db, "pros", targetUid), {
                id: targetUid,
                firstName: userDocData?.firstName || "Ulrich",
                lastName: userDocData?.lastName || "Vidal",
                email: emailToSearch,
                phone: userDocData?.phone || userDocData?.phoneNumber || "0663558820",
                role: "pro",
                status: "active",
                verified: true,
                siretVerified: true,
                createdAt: userDocData?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            } else if (proDocData.status !== "active" || !proDocData.verified) {
              console.log("[AUTO-FIX CLIENT] Ulrich Vidal exists in pros but status inactive/unverified, updating...");
              await updateDoc(doc(db, "pros", targetUid), {
                status: "active",
                verified: true,
                updatedAt: new Date().toISOString()
              });
            }

            // 2. Ensure exists in users and status is active & role is user
            if (!userDocData) {
              console.log("[AUTO-FIX CLIENT] Ulrich Vidal missing in users, creating...");
              await setDoc(doc(db, "users", targetUid), {
                uid: targetUid,
                id: targetUid,
                firstName: proDocData?.firstName || "Ulrich",
                lastName: proDocData?.lastName || "Vidal",
                displayName: `${proDocData?.firstName || "Ulrich"} ${proDocData?.lastName || "Vidal"}`,
                email: emailToSearch,
                phone: proDocData?.phone || "0663558820",
                phoneNumber: proDocData?.phone || "0663558820",
                role: "user",
                status: "active",
                createdAt: proDocData?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            } else if (userDocData.status !== "active" || userDocData.role !== "user") {
              console.log("[AUTO-FIX CLIENT] Ulrich Vidal exists in users, ensuring active/user role...");
              await updateDoc(doc(db, "users", targetUid), {
                status: "active",
                role: "user",
                updatedAt: new Date().toISOString()
              });
            }
          }
        } catch (autoFixErr) {
          console.error("Client side Ulrich auto-fix error:", autoFixErr);
        }

        // Fetch exact, live stats directly from Firestore to avoid API mismatch or replication caching lag
        const { getCountFromServer, collection, query, limit, getDocs, orderBy, doc, getDoc } = await import("firebase/firestore");
        
        let totalUsers = 0;
        let totalPros = 0;
        let activeOrgs = 0;
        let totalRequests = 0;

        try {
          const snapUsers = await getCountFromServer(collection(db, "users"));
          totalUsers = snapUsers.data().count;
        } catch (e) {
          console.error("Error reading users count from DB:", e);
        }

        try {
          const snapPros = await getCountFromServer(collection(db, "pros"));
          totalPros = snapPros.data().count;
        } catch (e) {
          console.error("Error reading pros count from DB:", e);
        }

        try {
          const snapOrgs = await getCountFromServer(collection(db, "organizations"));
          activeOrgs = snapOrgs.data().count;
        } catch (e) {
          console.error("Error reading organizations count from DB:", e);
        }

        try {
          const snapAuth = await getCountFromServer(collection(db, "authRequests"));
          const snapVerif = await getCountFromServer(collection(db, "verification_requests"));
          totalRequests = snapAuth.data().count + snapVerif.data().count;
        } catch (e) {
          console.error("Error reading requests count from DB:", e);
        }

        setRealStats({
          users: totalUsers,
          pros: totalPros,
          orgs: activeOrgs,
          requests: totalRequests
        });

        let orgs: any[] = [];
        try {
          const orgsResponse = await fetch('/api/admin/organizations', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          const ct = orgsResponse.headers.get("content-type");
          if (orgsResponse.ok && ct && ct.includes("application/json")) {
            orgs = await orgsResponse.json();
          } else {
            console.warn("Orgs API returned non-json/error, falling back to direct Firestore query.");
            const querySnapshot = await getDocs(query(collection(db, "organizations"), orderBy("createdAt", "desc")));
            orgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        } catch (orgsApiErr) {
          console.warn("Orgs API failed, using direct Firestore fallback:", orgsApiErr);
          try {
            const querySnapshot = await getDocs(query(collection(db, "organizations"), orderBy("createdAt", "desc")));
            orgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          } catch (dbErr) {
            console.error("Direct Firestore fallback also failed:", dbErr);
          }
        }

        // Fetch recent requests for global vision
        try {
          const requestsSnap = await getDocs(query(collection(db, "authRequests"), orderBy("createdAt", "desc"), limit(5)));
          const reqs = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setRecentRequests(reqs);
        } catch (err) {
          console.error("Error fetching recent requests:", err);
        }

        // Fetch recent members (both individuals and pros) and sort client-side safely to handle any missing fields transparently
        try {
          const usersSnap = await getDocs(query(collection(db, "users"), limit(50)));
          const membersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          membersList.sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });
          setRecentMembers(membersList.slice(0, 10));
        } catch (err) {
          console.error("Error fetching recent members:", err);
        }

        // Fetch recent pros and sort client-side safely
        try {
          const prosSnap = await getDocs(query(collection(db, "pros"), limit(50)));
          const prosList = prosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          prosList.sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });

          const loadedPros = await Promise.all(prosList.slice(0, 10).map(async (p: any) => {
            if (p.companyId) {
              try {
                const compSnap = await getDoc(doc(db, "companies", p.companyId));
                if (compSnap.exists()) {
                  return { ...p, companyName: compSnap.data().name };
                }
              } catch (e) {
                console.error("Error loading company for pro", p.id, e);
              }
            }
            return p;
          }));
          setRecentPros(loadedPros);
        } catch (err) {
          console.error("Error fetching recent pros:", err);
        }

        // Fetch and merge both professional and individual verification requests
        try {
          const authSnap = await getDocs(query(collection(db, "authRequests"), orderBy("createdAt", "desc"), limit(8)));
          const auths = authSnap.docs.map(d => ({ id: d.id, type: "pro", ...d.data() }));

          const verifSnap = await getDocs(query(collection(db, "verification_requests"), orderBy("createdAt", "desc"), limit(8)));
          const verifs = verifSnap.docs.map(d => ({ id: d.id, type: "individual", ...d.data() }));

          const merged = [...auths, ...verifs].sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
          setRecentConns(merged.slice(0, 15));
        } catch (err) {
          console.error("Error fetching recent connection requests:", err);
        }

        if (!Array.isArray(orgs) || orgs.length === 0) {
          try {
            const { query, collection, orderBy, limit, getDocs } = await import("firebase/firestore");
            const snapshot = await getDocs(query(collection(db, "organizations"), orderBy("createdAt", "desc"), limit(10)));
            orgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          } catch (e) {
            console.error("Fallback organizations fetch failed:", e);
            orgs = [];
          }
        }

        setOrganizations(orgs.slice(0, 5));
        setRecentOrgs(orgs.slice(0, 10));

        // Compute real cumulative growth over 6 months for Orgs, Users, and Requests
        const monthNames = ["Janv", "Févr", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
        const now = new Date();
        const chartDataPoints: { name: string; orgs: number; users: number; requests: number }[] = [];

        // Fetch all users for chart curve
        let allUsersList: any[] = [];
        try {
          const uSnap = await getDocs(query(collection(db, "users"), limit(500)));
          allUsersList = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.error("Error fetching users for chart:", e);
        }

        // Fetch all requests for chart curve
        let allRequestsList: any[] = [];
        try {
          const aSnap = await getDocs(query(collection(db, "authRequests"), limit(500)));
          const vSnap = await getDocs(query(collection(db, "verification_requests"), limit(500)));
          allRequestsList = [
            ...aSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            ...vSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          ];
        } catch (e) {
          console.error("Error fetching requests for chart:", e);
        }

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
          const label = monthNames[d.getMonth()];
          
          const orgCount = orgs.filter((o: any) => {
            const created = parseToDate(o.createdAt);
            return created && created <= endOfMonth;
          }).length;

          const userCount = allUsersList.filter((u: any) => {
            const created = parseToDate(u.createdAt);
            return created && created <= endOfMonth;
          }).length;

          const reqCount = allRequestsList.filter((r: any) => {
            const created = parseToDate(r.createdAt);
            return created && created <= endOfMonth;
          }).length;

          chartDataPoints.push({
            name: label,
            orgs: orgCount,
            users: userCount,
            requests: reqCount
          });
        }
        setOrgsChartData(chartDataPoints);

        // Check Resend Status
        try {
          const res = await fetch("/api/resend-status");
          if (res.ok) {
            const data = await res.json();
            setResendConfigured(data.configured);
          }
        } catch (e) {
          console.error("Error fetching resend status:", e);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayStats = [
    { label: "Utilisateurs Totaux", value: realStats.users.toLocaleString(), icon: Users, color: "#60a5fa", sub: "Base Firestore", path: "/admin/users" },
    { label: "Pros Actifs", value: realStats.pros.toLocaleString(), icon: ShieldCheck, color: "#4ade80", sub: "Comptes certifiés", path: "/admin/pros" },
    { label: "Organisations", value: realStats.orgs.toString(), icon: Building2, color: "#a78bfa", sub: "Espaces créés", path: "/admin/organizations" },
    { label: "Demandes (Total)", value: realStats.requests.toLocaleString(), icon: History, color: "var(--color-primary)", sub: "Vérifications faites", path: "/admin/requests" },
  ];

  const metricConfigs = {
    orgs: {
      title: "Croissance de la plateforme",
      subtitle: "Nombre réel d'organisations sur les 6 derniers mois",
      color: "#a78bfa",
      label: "Organisations",
      gradientId: "colorOrgs",
    },
    users: {
      title: "Nombre d'utilisateurs",
      subtitle: "Évolution de la base globale d'utilisateurs sur les 6 derniers mois",
      color: "#60a5fa",
      label: "Utilisateurs",
      gradientId: "colorUsers",
    },
    requests: {
      title: "Nombre de demandes",
      subtitle: "Volume global de demandes de vérification sur les 6 derniers mois",
      color: "#3DFFA0",
      label: "Demandes",
      gradientId: "colorRequests",
    },
  };
  const currentConfig = metricConfigs[selectedMetric];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-12 h-12 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-[#9a9a9f] mt-1">Vue d'ensemble de l'activité SafeCallr</p>
          </div>
          <div className="flex items-center gap-3">
            {debugInfo && (
              <div className="px-4 py-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-[10px] font-mono text-[#4ade80]">
                Admin: {debugInfo.email} ({debugInfo.uid.substring(0, 8)}...)
              </div>
            )}
            <div className="px-4 py-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-sm font-medium">
              Derniers 7 jours
            </div>
          </div>
        </div>

        {/* Notice of Missing Email Config (RESEND_API_KEY) */}
        {resendConfigured === false && (
          <div className="bg-[#ea580c]/10 border border-[#ea580c]/30 rounded-2xl p-6 flex flex-col md:flex-row gap-4 animate-in slide-in-from-top duration-300">
            <div className="p-3 bg-[#ea580c]/10 text-[#ea580c] rounded-xl shrink-0 h-fit self-start">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-white text-base">Configuration des emails à finaliser (RESEND_API_KEY)</h4>
                <button
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="px-3 py-1.5 bg-[#ea580c] hover:bg-[#ea580c]/80 text-white font-bold text-xs rounded-xl transition-colors self-start sm:self-auto"
                >
                  {showKeyInput ? "Masquer la saisie" : "Saisir la clé API ici"}
                </button>
              </div>

              <p className="text-[#9a9a9f] text-sm leading-relaxed">
                Si vous n'avez pas défini <code className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">RESEND_API_KEY</code> dans l'environnement, vous pouvez la renseigner directement ci-dessous pour activer immédiatement l'envoi d'emails.
              </p>

              {showKeyInput && (
                <div className="p-4 bg-[#111113] border border-[#ea580c]/40 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">Clé API Resend (ex: re_123456789...)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="flex-1 px-4 py-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#ea580c]"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={isSavingKey}
                      className="px-5 py-2 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSavingKey ? "Enregistrement..." : "Enregistrer et activer"}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-[#9a9a9f] text-sm leading-relaxed space-y-1">
                <p><strong>Pour obtenir une clé :</strong></p>
                <ol className="list-decimal list-inside pl-1 space-y-1 text-slate-300 text-xs">
                  <li>Inscrivez-vous gratuitement sur <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-bold">Resend.com</a></li>
                  <li>Copiez votre clé API de test ou de production</li>
                  <li>Saisissez-la ci-dessus ou ajoutez-la dans les secrets du projet</li>
                </ol>
              </div>
              <p className="text-xs text-[#9a9a9f] italic pt-1 border-t border-white/5">
                Note : Tous les e-mails générés sont également sauvegardés dans la collection Firestore <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono text-xs">/mail</code>.
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat, index) => (
            <Link 
              key={index}
              to={stat.path}
              className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-2xl hover:border-[#4ade80]/30 transition-all group block shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-3 rounded-xl bg-[#111113] group-hover:scale-110 transition-transform"
                  style={{ color: stat.color }}
                >
                  <stat.icon size={24} />
                </div>
                <div className="text-xs font-semibold text-slate-400 bg-[#111113] px-2.5 py-1 rounded-full border border-[#2e2e34]">
                  {stat.sub}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[#9a9a9f] text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1e1e22] border border-[#2e2e34] p-8 rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold">{currentConfig.title}</h2>
                  <p className="text-xs text-[#9a9a9f] mt-1 font-bold uppercase tracking-widest">{currentConfig.subtitle}</p>
                </div>

                <div className="flex items-center bg-[#111113] p-1 rounded-xl border border-[#2e2e34] text-xs self-start sm:self-auto">
                  <button 
                    type="button"
                    onClick={() => setSelectedMetric("orgs")}
                    className={`px-3 py-1.5 font-bold rounded-lg transition-all ${selectedMetric === "orgs" ? "bg-[#a78bfa] text-black shadow" : "text-[#9a9a9f] hover:text-white"}`}
                  >
                    Organisations
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedMetric("users")}
                    className={`px-3 py-1.5 font-bold rounded-lg transition-all ${selectedMetric === "users" ? "bg-[#60a5fa] text-black shadow" : "text-[#9a9a9f] hover:text-white"}`}
                  >
                    Utilisateurs
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedMetric("requests")}
                    className={`px-3 py-1.5 font-bold rounded-lg transition-all ${selectedMetric === "requests" ? "bg-primary text-black shadow" : "text-[#9a9a9f] hover:text-white"}`}
                  >
                    Demandes
                  </button>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orgsChartData}>
                    <defs>
                      <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3DFFA0" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3DFFA0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} allowDecimals={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e2e34" />
                    <Tooltip contentStyle={{ backgroundColor: '#111113', border: '1px solid #2e2e34', borderRadius: '12px' }} />
                    <Area 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke={currentConfig.color} 
                      fillOpacity={1} 
                      fill={`url(#${currentConfig.gradientId})`} 
                      strokeWidth={3} 
                      name={currentConfig.label} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl overflow-hidden shadow-xl">
               <div className="p-6 border-b border-[#2e2e34] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111113]/40">
                  <div>
                    <h3 className="font-bold text-lg">Activités globales</h3>
                    <p className="text-xs text-[#9a9a9f]">Vision consolidée des membres, pros et connexions</p>
                  </div>
                  <div className="flex bg-[#111113] p-1 rounded-xl border border-[#2e2e34] text-xs self-start md:self-auto">
                    <button 
                      type="button"
                      onClick={() => setActiveTab("members")}
                      className={`px-3 py-1.5 font-bold rounded-lg transition-all ${activeTab === "members" ? "bg-primary text-black" : "text-[#9a9a9f] hover:text-white"}`}
                    >
                      Membres ({recentMembers.length})
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab("pros")}
                      className={`px-3 py-1.5 font-bold rounded-lg transition-all ${activeTab === "pros" ? "bg-primary text-black" : "text-[#9a9a9f] hover:text-white"}`}
                    >
                      Pros ({recentPros.length})
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab("requests")}
                      className={`px-3 py-1.5 font-bold rounded-lg transition-all ${activeTab === "requests" ? "bg-primary text-black" : "text-[#9a9a9f] hover:text-white"}`}
                    >
                      Connexions ({recentConns.length})
                    </button>
                  </div>
               </div>

               <div className="divide-y divide-[#2e2e34]">
                  {activeTab === "members" && (
                    recentMembers.length === 0 ? (
                      <div className="p-12 text-center text-[#9a9a9f]">Aucun utilisateur inscrit</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-[#2e2e34] text-[#9a9a9f] text-[10px] uppercase font-black bg-[#111113]/20">
                              <th className="p-4 pl-6">Nom / Prénom</th>
                              <th className="p-4">Téléphone</th>
                              <th className="p-4">Email</th>
                              <th className="p-4 pr-6">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2e2e34]">
                            {recentMembers.map((m: any) => (
                              <tr key={m.id} className="hover:bg-[#111113] transition-colors">
                                <td className="p-4 pl-6 font-bold text-white">
                                  {m.firstName || m.lastName ? `${m.firstName || ""} ${m.lastName || ""}`.trim() : m.displayName || "Sans nom"}
                                </td>
                                <td className="p-4 font-mono text-xs text-slate-300">{m.phoneNumber || "N/A"}</td>
                                <td className="p-4 text-xs text-[#9a9a9f] truncate max-w-[150px]">{m.email || "N/A"}</td>
                                <td className="p-4 pr-6 text-xs text-slate-400">
                                  {formatSafeDate(m.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {activeTab === "pros" && (
                    recentPros.length === 0 ? (
                      <div className="p-12 text-center text-[#9a9a9f]">Aucun professionnel inscrit</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-[#2e2e34] text-[#9a9a9f] text-[10px] uppercase font-black bg-[#111113]/20">
                              <th className="p-4 pl-6">Professionnel</th>
                              <th className="p-4">Téléphone</th>
                              <th className="p-4">Entreprise / Secteur</th>
                              <th className="p-4 pr-6">Rôle</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2e2e34]">
                            {recentPros.map((p: any) => (
                              <tr key={p.id} className="hover:bg-[#111113] transition-colors">
                                <td className="p-4 pl-6 font-bold text-white">
                                  {p.firstName || p.lastName ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : p.displayName || "Sans nom"}
                                </td>
                                <td className="p-4 font-mono text-xs text-slate-300">{p.phone || p.phoneNumber || "N/A"}</td>
                                <td className="p-4">
                                  <div className="text-xs text-white font-semibold">{p.companyName || "N/A"}</div>
                                  <div className="text-[9px] text-primary font-bold uppercase tracking-wider">{p.jobTitle || p.companyCategory || ""}</div>
                                </td>
                                <td className="p-4 pr-6">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${p.status === 'approved' ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                    {p.status || "Inscrit"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {activeTab === "requests" && (
                    recentConns.length === 0 ? (
                      <div className="p-12 text-center text-[#9a9a9f]">Aucune demande de connexion récente</div>
                    ) : (
                      <div className="divide-y divide-[#2e2e34]">
                        {recentConns.map((req: any) => (
                          <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-[#111113] transition-colors gap-3">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                req.type === "pro" 
                                  ? "bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20" 
                                  : "bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/20"
                              }`}>
                                <ShieldCheck size={20} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-bold text-sm tracking-tight">
                                    {req.type === "pro" ? req.fromProName : req.requesterName}
                                  </span>
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                    req.type === "pro" 
                                      ? "bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/15" 
                                      : "bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/15"
                                  }`}>
                                    {req.type === "pro" ? "PRO" : "INDIVIDUEL"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                  Cible : <span className="text-slate-300 font-bold font-mono">{req.type === "pro" ? req.clientPhone : req.targetPhone}</span>
                                  {req.type === "pro" && ` (Entreprise : ${req.fromCompanyName || "Indépendant"})`}
                                  {req.type === "individual" && ` (Cible Nom : ${req.targetName || "Invité"})`}
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                              <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                req.status === 'verified' || req.status === 'validated' ? 'text-[#4ade80] border-[#4ade80]/20 bg-[#4ade80]/10' :
                                req.status === 'pending' || req.status === 'code_generated' ? 'text-[#fbbf24] border-[#fbbf24]/20 bg-[#fbbf24]/10' :
                                'text-[#f87171] border-[#f87171]/20 bg-[#f87171]/10'
                              }`}>
                                {req.status === "code_generated" ? "Code généré" : req.status === "pending" ? "En attente" : req.status === "validated" || req.status === "verified" ? "Validée" : req.status}
                              </div>
                              <p className="text-[10px] text-[#9a9a9f] uppercase font-black">
                                {safeFormatDate(req.createdAt, 'dd/MM/yyyy HH:mm', "Maintenant")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
               </div>
            </div>
          </div>

          {/* Quick Actions / Recent Orgs */}
          <div className="space-y-8">
            <div className="bg-[#1e1e22] border border-[#2e2e34] p-8 rounded-3xl flex flex-col">
              <h2 className="text-xl font-bold mb-6">Nouvelles Organisations</h2>
              <div className="space-y-4">
                {recentOrgs.map(org => (
                   <Link key={org.id} to={`/admin/organizations/${org.id}`} className="block p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl hover:border-primary transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1e1e22] p-1 flex items-center justify-center">
                          <img src={org.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="text-[10px] text-slate-500">{safeFormatDate(org.createdAt, 'dd/MM/yyyy')}</span>
                      </div>
                      <p className="text-sm font-bold text-white truncate">{org.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{org.siret}</p>
                   </Link>
                ))}
              </div>
              <Link to="/admin/organizations" className="mt-6 text-center text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                 Voir toutes les organisations
              </Link>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-primary" /> Note Admin
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-black tracking-tight italic">
                Ce dashboard consolide les données de toutes les institutions clientes. Les chiffres d'authentification sont mis à jour en temps réel via le protocole SafeCallr.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
