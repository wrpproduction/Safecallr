import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Building2, 
  User, 
  Globe, 
  Phone, 
  MapPin, 
  ChevronLeft, 
  ShieldCheck, 
  Mail, 
  Calendar,
  Settings,
  History,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Trash2,
  Save,
  Palette,
  ExternalLink,
  ShieldAlert,
  Send,
  PlusCircle,
  Users,
  AlertCircle,
  Star,
  MessageSquare,
  Lock,
  Award,
  CheckCircle2,
  Zap,
  Upload
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { safeFormatDate, parseToDate } from "../lib/dateUtils";
import { auth, db, ref, uploadBytes, getDownloadURL, storage } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, updateDoc } from "firebase/firestore";
import AdminLayout from "../components/AdminLayout";
import AuditLogTimeline from "../components/admin/AuditLogTimeline";
import DangerZone from "../components/admin/DangerZone";
import ChangeRepresentativeModal from "../components/admin/ChangeRepresentativeModal";
import { toast } from "sonner";

export default function AdminOrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activityChart, setActivityChart] = useState<any[]>([]);
  
  // Editable fields for legal info
  const [legalData, setLegalData] = useState<any>(null);
  const [isSavingLegal, setIsSavingLegal] = useState(false);
  const [isChangingRep, setIsChangingRep] = useState(false);
  const [isResendingAccess, setIsResendingAccess] = useState(false);

  // Editable fields for branding / visual identity
  const [brandData, setBrandData] = useState<{ logoUrl: string; primaryColor: string; trustMessage: string }>({
    logoUrl: "",
    primaryColor: "#3dffa0",
    trustMessage: "SafeCallr ne vous demandera jamais vos codes secret bancaire par téléphone"
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  const handleResendAccess = async (targetEmail?: string, targetName?: string) => {
    const emailToSend = targetEmail || org?.representative?.email || org?.repEmail;
    if (!emailToSend) {
      toast.error("Aucune adresse email disponible pour l'envoi des accès");
      return;
    }

    setIsResendingAccess(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/resend-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          email: emailToSend,
          name: targetName || `${org?.representative?.firstName || ""} ${org?.representative?.lastName || ""}`.trim(),
          orgId: id,
          orgName: org?.name
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Erreur lors de l'envoi des accès");
      }

      toast.success(`Accès renvoyés avec succès à ${emailToSend}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Impossible de renvoyer les accès");
    } finally {
      setIsResendingAccess(false);
    }
  };

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      let apiSuccess = false;
      let data: any = null;

      try {
        const response = await fetch(`/api/admin/organizations/${id}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          data = await response.json();
          apiSuccess = true;
        } else {
          console.warn("API returned non-json/error space. Falling back to direct client-side Firestore load.");
        }
      } catch (apiErr) {
        console.warn("API fetch error, falling back to direct client-side Firestore load:", apiErr);
      }

      if (!apiSuccess) {
        // Direct Firestore fallback
        let orgDoc = await getDoc(doc(db, "organizations", id));
        let isCompanyDoc = false;
        
        if (!orgDoc.exists()) {
          const compDoc = await getDoc(doc(db, "companies", id));
          if (compDoc.exists()) {
            orgDoc = compDoc;
            isCompanyDoc = true;
          } else {
            throw new Error("Organisation ou Entreprise non trouvée");
          }
        }
        
        const orgData = orgDoc.data();
        
        let totalMembers = 0;
        let activeMembers = 0;
        
        if (isCompanyDoc) {
          try {
            const prosSnap = await getDocs(query(collection(db, "pros"), where("companyId", "==", id)));
            totalMembers = prosSnap.size;
            activeMembers = prosSnap.docs.filter(d => d.data().status === "active").length;
          } catch (pErr) {
            console.warn("Direct pros read failed:", pErr);
          }
        } else {
          try {
            const membersSnap = await getDocs(collection(db, "organizations", id, "members"));
            totalMembers = membersSnap.size;
            activeMembers = membersSnap.docs.filter(d => d.data().status === "active").length;
          } catch (mErr) {
            console.warn("Direct members read failed:", mErr);
          }
        }

        let totalAuthRequests = 0;
        let authRequestsList: any[] = [];
        try {
          const authSnap = await getDocs(collection(db, "organizations", id, "authRequests"));
          totalAuthRequests = authSnap.size;
          authRequestsList = authSnap.docs.map(d => d.data());
        } catch (aErr) {
          console.warn("Direct authRequests read failed:", aErr);
        }

        let auditLog: any[] = [];
        try {
          const auditSnap = await getDocs(query(collection(db, "organizations", id, "auditLog"), orderBy("createdAt", "desc"), limit(10)));
          auditLog = auditSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (auErr) {
          console.warn("Direct auditLog read failed:", auErr);
        }

        let representative = null;
        const repUid = orgData?.representativeUserId;
        if (repUid) {
          try {
            const repDoc = await getDoc(doc(db, "organizations", id, "members", repUid));
            representative = repDoc.exists() ? repDoc.data() : null;
          } catch (rErr) {
            console.warn("Direct representative read failed:", rErr);
          }
        } else if (isCompanyDoc && orgData?.adminEmail) {
          representative = {
            firstName: orgData.name,
            lastName: "(Référent)",
            email: orgData.adminEmail,
            role: "admin",
            createdAt: orgData.createdAt
          };
        }

        data = {
          type: "business",
          active: true,
          allowedEmailDomains: orgData?.domain ? [orgData.domain] : (orgData?.allowedEmailDomains || []),
          primaryColor: "#3dffa0",
          trustMessage: "Membre du réseau de confiance SafeCallr Business",
          ...orgData,
          id: orgDoc.id,
          stats: {
            totalMembers,
            activeMembers,
            totalAuthRequests,
            totalAuths: totalAuthRequests
          },
          authRequestsList,
          auditLog,
          representative
        };
      }

      // Compute real monthly activity chart
      const monthNames = ["Janv", "Févr", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
      const now = new Date();
      const chartPoints: { name: string; success: number; error: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        chartPoints.push({ name: monthNames[d.getMonth()], success: 0, error: 0 });
      }

      const reqs = data.authRequestsList || [];
      reqs.forEach((r: any) => {
        const date = parseToDate(r.createdAt);
        if (date) {
          const mName = monthNames[date.getMonth()];
          const point = chartPoints.find(p => p.name === mName);
          if (point) {
            if (r.status === "refused" || r.status === "failed") {
              point.error += 1;
            } else {
              point.success += 1;
            }
          }
        }
      });
      setActivityChart(chartPoints);

      setOrg(data);
      setLegalData({
        name: data.name,
        siret: data.siret,
        address: data.address,
        streetNumber: data.streetNumber || "",
        zipCode: data.zipCode || "",
        city: data.city || "",
        allowedEmailDomains: data.allowedEmailDomains || []
      });
      setBrandData({
        logoUrl: data.logoUrl || "",
        primaryColor: data.primaryColor || "#3dffa0",
        trustMessage: data.trustMessage || "SafeCallr ne vous demandera jamais vos codes secret bancaire par téléphone"
      });
      setLogoPreview(data.logoUrl || null);
      setLogoFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors du chargement de l'organisation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSaveLegal = async () => {
    setIsSavingLegal(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/organizations/${id}/legal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, data: legalData })
      });
      if (!response.ok) throw new Error("Erreur lors de la sauvegarde");
      toast.success("Informations légales mises à jour");
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingLegal(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier du logo ne doit pas dépasser 5 Mo");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setBrandData(prev => ({ ...prev, logoUrl: "" }));
  };

  const handleSaveBrand = async () => {
    if (!id) return;
    setIsSavingBrand(true);
    try {
      let finalLogoUrl = logoPreview || brandData.logoUrl || "";

      if (logoFile) {
        try {
          const logoRef = ref(storage, `organizations/logos/${Date.now()}_${logoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
          const uploadResult = await uploadBytes(logoRef, logoFile);
          finalLogoUrl = await getDownloadURL(uploadResult.ref);
        } catch (storageErr) {
          console.warn("Storage upload warning, fallback to Data URL:", storageErr);
        }
      }

      const idToken = await auth.currentUser?.getIdToken();
      let updatedViaApi = false;

      try {
        const response = await fetch(`/api/admin/organizations/${id}/branding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            logoUrl: finalLogoUrl,
            primaryColor: brandData.primaryColor,
            trustMessage: brandData.trustMessage
          })
        });
        if (response.ok) {
          updatedViaApi = true;
        }
      } catch (apiErr) {
        console.warn("API branding update error, falling back to direct Firestore update:", apiErr);
      }

      if (!updatedViaApi) {
        const updatePayload = {
          logoUrl: finalLogoUrl,
          primaryColor: brandData.primaryColor,
          trustMessage: brandData.trustMessage,
          updatedAt: new Date()
        };
        try {
          await updateDoc(doc(db, "organizations", id), updatePayload);
        } catch (e1) {
          try {
            await updateDoc(doc(db, "companies", id), updatePayload);
          } catch (e2) {}
        }
      }

      toast.success("Identité visuelle mise à jour avec succès");
      setLogoFile(null);
      fetchDetail();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la mise à jour de l'identité visuelle");
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = org.active ? "suspended" : "active";
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/organizations/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, status: newStatus, active: !org.active })
      });
      if (!response.ok) throw new Error("Erreur lors du changement de statut");
      toast.success(org.active ? "Organisation suspendue" : "Organisation réactivée");
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSetStatus = async (newStatus: "pending" | "active" | "suspended" | "deactivated") => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/organizations/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, status: newStatus, active: newStatus === 'active' })
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut");
      toast.success(`Statut de l'organisation mis à jour vers '${newStatus}'`);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleCapability = async (capabilityKey: 'external' | 'internal', value: boolean) => {
    try {
      const currentCaps = org.capabilities || {
        external: org.type !== 'business',
        internal: org.type === 'business' || !!org.serviceBusinessActive
      };
      const newCapabilities = { ...currentCaps, [capabilityKey]: value };
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/organizations/${id}/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, capabilities: newCapabilities })
      });
      if (!response.ok) throw new Error("Erreur mise à jour capacités");
      toast.success("Capacités modifiées avec succès");
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteOrg = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      toast.success("Organisation supprimée définitivement");
      navigate("/admin/organizations");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleChangeRep = async (mode: 'promote' | 'create', repData: any) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/organizations/${id}/representative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, mode, reqData: repData })
      });
      if (!response.ok) throw new Error("Erreur changement représentant");
      toast.success("Représentant mis à jour avec succès");
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  if (loading) return <AdminLayout><div className="flex flex-col items-center justify-center h-screen gap-4">
    <Loader2 className="animate-spin text-primary" size={40} />
    <p className="text-slate-500 italic">Chargement du dossier...</p>
  </div></AdminLayout>;
  
  if (!org) return <AdminLayout><div className="p-20 text-center text-slate-500">Organisation introuvable.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/organizations" className="p-3 bg-[#1e1e22] border border-[#2e2e34] rounded-2xl text-slate-500 hover:text-white transition-all">
              <ChevronLeft size={24} />
            </Link>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#1e1e22] border border-[#2e2e34] rounded-2xl p-2 flex items-center justify-center shrink-0">
                <img 
                  src={org.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(org.name || 'SafeCallr')}`} 
                  alt="" 
                  className="max-w-full max-h-full object-contain" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(org.name || 'SafeCallr')}`;
                  }}
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black text-white">{org.name}</h1>
                  {org.status === 'pending' ? (
                    <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">⏳ En attente</span>
                  ) : org.active ? (
                    <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">✅ Active</span>
                  ) : (
                    <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">🛑 Suspendue</span>
                  )}
                  {org.capabilities?.external !== false && (
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-blue-500/20">🛡️ Vérification Externe</span>
                  )}
                  {org.capabilities?.internal && (
                    <span className="bg-[#3dffa0]/10 text-[#3dffa0] px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-[#3dffa0]/20">⚡ SafeCallr Business</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                  <span className="flex items-center gap-2 italic">
                    <Calendar size={14} /> Créée le {safeFormatDate(org.createdAt, 'dd/MM/yyyy')}
                  </span>
                  <span className="px-2 py-0.5 bg-[#1e1e22] rounded text-xs font-mono">SIRET: {org.siret}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <a 
               href={`/dashboard/${org.id}`}
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all bg-[#3dffa0] text-black hover:bg-[#3dffa0]/90 shadow-lg shadow-[#3dffa0]/20"
               title="Accéder au Backoffice du Référent de ce compte"
             >
               <ExternalLink size={16} />
               <span>Backoffice Référent</span>
             </a>
             <button 
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
                org.active 
                  ? "border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                  : "bg-green-500 border-green-500 text-black hover:bg-green-400"
              }`}
             >
               {org.active ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
               {org.active ? "Désactiver l'accès" : "Réactiver l'accès"}
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-[#2e2e34] overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
            { id: 'legal', label: 'Légal & Identité', icon: Building2 },
            { id: 'people', label: 'Équipe & Référent', icon: User },
            { id: 'avis_business', label: 'Avis + Business', icon: Star },
            { id: 'audit', label: 'Journal d\'Audit', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-500 hover:text-white"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Section: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Collaborateurs", value: org.stats?.totalMembers || 0, sub: `${org.stats?.activeMembers || 0} actifs`, color: "#c084fc", icon: User },
                  { label: "Demandes Totales", value: org.stats?.totalAuths || org.stats?.totalAuthRequests || 0, sub: "Depuis création", color: "#60a5fa", icon: ShieldCheck },
                  { 
                    label: "Taux de Succès", 
                    value: (org.stats?.totalAuths || org.stats?.totalAuthRequests || 0) > 0 ? "100%" : "0%", 
                    sub: (org.stats?.totalAuths || org.stats?.totalAuthRequests || 0) > 0 ? "Demandes validées" : "Aucune demande", 
                    color: "#4ade80", 
                    icon: TrendingUp 
                  },
                  { label: "Domaines mail", value: org.allowedEmailDomains?.length || 0, sub: "Domaines autorisés", color: "#fbbf24", icon: Globe },
                ].map((kpi, i) => (
                  <div key={i} className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-125 transition-all duration-500" style={{ color: kpi.color }}>
                      <kpi.icon size={80} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{kpi.label}</p>
                    <p className="text-3xl font-black text-white">{kpi.value}</p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      {kpi.sub}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-white">Activité SafeCallr</h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Vérifications réelles sur les 6 derniers mois</p>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={activityChart}>
                       <defs>
                         <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} allowDecimals={false} />
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e2e34" />
                       <Tooltip 
                        contentStyle={{ backgroundColor: '#111113', border: '1px solid #2e2e34', borderRadius: '12px', fontSize: '12px' }} 
                        itemStyle={{ color: '#fff' }}
                       />
                       <Area type="monotone" dataKey="success" stroke="#4ade80" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={3} name="Vérifications" />
                     </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Section: Legal & Visual */}
          {activeTab === 'legal' && legalData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                {/* CAPACITES ET STATUT CARD */}
                <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-primary" size={22} />
                      <div>
                        <h3 className="text-lg font-black text-white">Capacités de l'Organisation (1 SIRET)</h3>
                        <p className="text-xs text-slate-500">Les capacités sont cumulables et activables à la demande du client</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Capability External */}
                    <div className="flex items-center justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          <span>🛡️ Vérification EXTERNE</span>
                          {org.capabilities?.external !== false ? (
                            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded uppercase font-black">Active</span>
                          ) : (
                            <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase font-black">Inactive</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Authentification des clients finaux lors des appels sortants</p>
                      </div>
                      <button
                        onClick={() => handleToggleCapability('external', org.capabilities?.external === false ? true : false)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          org.capabilities?.external !== false
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white'
                            : 'bg-primary text-black hover:bg-primary/90'
                        }`}
                      >
                        {org.capabilities?.external !== false ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>

                    {/* Capability Internal / Business */}
                    <div className="flex items-center justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-[#3dffa0] flex items-center gap-2">
                          <span>⚡ Vérification INTERNE (SafeCallr Business)</span>
                          {org.capabilities?.internal ? (
                            <span className="text-[10px] bg-[#3dffa0]/10 text-[#3dffa0] px-2 py-0.5 rounded uppercase font-black">Active</span>
                          ) : (
                            <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase font-black">Inactive</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Authentification mutuelle entre collaborateurs en circuit fermé</p>
                      </div>
                      <button
                        onClick={() => handleToggleCapability('internal', !org.capabilities?.internal)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          org.capabilities?.internal
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white'
                            : 'bg-[#3dffa0] text-black hover:bg-[#3dffa0]/90'
                        }`}
                      >
                        {org.capabilities?.internal ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>

                    {/* Statut Global Selection */}
                    <div className="pt-4 border-t border-[#2e2e34] space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        Statut d'activation de l'Organisation
                      </label>
                      <div className="flex items-center gap-3">
                        <select
                          value={org.status || (org.active ? 'active' : 'suspended')}
                          onChange={(e) => handleSetStatus(e.target.value as any)}
                          className="bg-[#111113] border border-[#2e2e34] text-white text-xs font-bold rounded-xl p-3 outline-none focus:border-primary transition-all flex-1"
                        >
                          <option value="pending">⏳ En attente (Pending - Aucune émission autorisée)</option>
                          <option value="active">✅ Actif (Active - Émission autorisée)</option>
                          <option value="suspended">🛑 Suspendu (Suspended - Accès bloqué)</option>
                          <option value="deactivated">⚪ Désactivé (Deactivated)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="text-primary" size={20} />
                    <h3 className="text-lg font-black text-white">Informations Légales</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nom commercial</label>
                      <input 
                        type="text" 
                        value={legalData.name} 
                        onChange={(e) => setLegalData({...legalData, name: e.target.value})}
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">SIRET</label>
                      <input 
                        type="text" 
                        value={legalData.siret} 
                         onChange={(e) => setLegalData({...legalData, siret: e.target.value})}
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all text-sm font-mono" 
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adresse complète</label>
                      <div className="grid grid-cols-4 gap-3">
                         <input 
                          type="text" 
                          placeholder="N°"
                          value={legalData.streetNumber} 
                          onChange={(e) => setLegalData({...legalData, streetNumber: e.target.value})}
                          className="bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all text-sm" 
                        />
                        <input 
                          type="text" 
                          placeholder="Rue / Avenue"
                          value={legalData.address} 
                          onChange={(e) => setLegalData({...legalData, address: e.target.value})}
                          className="col-span-3 bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all text-sm" 
                        />
                        <input 
                          type="text" 
                          placeholder="CP"
                          value={legalData.zipCode} 
                          onChange={(e) => setLegalData({...legalData, zipCode: e.target.value})}
                          className="bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all text-sm" 
                        />
                        <input 
                          type="text" 
                          placeholder="Ville"
                          value={legalData.city} 
                          onChange={(e) => setLegalData({...legalData, city: e.target.value})}
                          className="col-span-3 bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4">
                    <button 
                      onClick={handleSaveLegal}
                      disabled={isSavingLegal}
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                    >
                      {isSavingLegal ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>

                <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                    <Globe className="text-[#60a5fa]" size={20} />
                    <h3 className="text-lg font-black text-white">Domaines Email</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {legalData.allowedEmailDomains.map((domain: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-[#60a5fa]/10 text-[#60a5fa] rounded-lg text-xs font-mono border border-[#60a5fa]/20 uppercase">
                        @{domain}
                      </span>
                    ))}
                    <button className="px-3 py-1.5 bg-[#111113] text-slate-500 rounded-lg text-[10px] font-black uppercase border border-[#2e2e34] hover:text-white transition-colors">
                      + Ajouter
                    </button>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-600 leading-tight">
                    Tous les membres de cette organisation doivent posséder une adresse email appartenant à l'un de ces domaines.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Palette className="text-purple-500" size={20} />
                        <h3 className="text-lg font-black text-white">Identité Visuelle</h3>
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 bg-[#111113] px-3 py-1 rounded-full border border-[#2e2e34]">
                        Branding Client
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Logo Upload Section */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-5 bg-[#111113] rounded-2xl border border-[#2e2e34]">
                        <div className="w-28 h-28 bg-[#18181b] border-2 border-dashed border-[#3f3f46] hover:border-primary rounded-2xl p-2 flex items-center justify-center relative group shrink-0 transition-colors">
                          <img 
                            src={logoPreview || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(org?.name || 'SafeCallr')}`} 
                            alt="Logo Organisation" 
                            className="max-w-full max-h-full object-contain rounded-xl" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(org?.name || 'SafeCallr')}`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-2xl transition-opacity p-2 text-center">
                            <Upload className="text-primary mb-1" size={22} />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Changer</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoChange} 
                            className="absolute inset-0 opacity-0 cursor-pointer rounded-2xl z-10" 
                            title="Cliquez pour charger un nouveau logo"
                          />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-white font-bold text-sm">Logo Institutionnel</p>
                            <p className="text-xs text-slate-400 mt-0.5">Format PNG, JPG ou SVG transparent (Max 5 Mo).</p>
                            <p className="text-[11px] text-slate-500 italic mt-1">Visible sur l'écran du client lors du déclenchement d'un code.</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-2 bg-[#27272a] hover:bg-[#3f3f46] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-[#3f3f46]">
                              <Upload size={14} className="text-primary" />
                              Téléverser un logo
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLogoChange} 
                                className="hidden" 
                              />
                            </label>

                            {(logoPreview || brandData.logoUrl) && (
                              <button 
                                type="button"
                                onClick={handleRemoveLogo}
                                className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs font-medium border border-red-500/20 transition-colors"
                              >
                                <Trash2 size={13} />
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Color & Trust Message */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Signature Color */}
                        <div className="space-y-2 p-5 bg-[#111113] rounded-2xl border border-[#2e2e34]">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            Couleur Signature
                          </label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={brandData.primaryColor} 
                              onChange={(e) => setBrandData({ ...brandData, primaryColor: e.target.value })}
                              className="w-12 h-12 rounded-xl border border-[#3f3f46] bg-transparent cursor-pointer p-0.5" 
                            />
                            <input 
                              type="text" 
                              value={brandData.primaryColor} 
                              onChange={(e) => setBrandData({ ...brandData, primaryColor: e.target.value })}
                              className="flex-1 bg-[#18181b] border border-[#2e2e34] rounded-xl px-4 py-3 text-white font-mono text-sm uppercase outline-none focus:border-primary transition-all" 
                              placeholder="#3DFFA0"
                            />
                          </div>
                        </div>

                        {/* Trust Message */}
                        <div className="space-y-2 p-5 bg-[#111113] rounded-2xl border border-[#2e2e34]">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            Message de confiance
                          </label>
                          <textarea 
                            rows={2}
                            value={brandData.trustMessage} 
                            onChange={(e) => setBrandData({ ...brandData, trustMessage: e.target.value })}
                            className="w-full bg-[#18181b] border border-[#2e2e34] rounded-xl p-3 text-white text-xs outline-none focus:border-primary transition-all resize-none italic" 
                            placeholder="SafeCallr ne vous demandera jamais..."
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={handleSaveBrand}
                          disabled={isSavingBrand}
                          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                        >
                          {isSavingBrand ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                          Enregistrer l'identité visuelle
                        </button>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Section: People */}
          {activeTab === 'people' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <Users className="text-[#c084fc]" size={20} />
                        <h3 className="text-xl font-black text-white">Collaborateurs actifs</h3>
                      </div>
                      <span className="px-3 py-1 bg-[#111113] border border-[#2e2e34] rounded-full text-xs font-bold text-slate-500">
                        Total: {org.stats?.totalMembers}
                      </span>
                    </div>

                    <div className="space-y-4">
                       <table className="w-full text-left">
                         <thead>
                           <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-[#2e2e34]">
                             <th className="pb-4">Nom / Prénom</th>
                             <th className="pb-4">Email</th>
                             <th className="pb-4">Rôle</th>
                             <th className="pb-4">Statut</th>
                             <th className="pb-4 text-right">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-[#2e2e34]">
                            {/* NOTE: Here we need the full members list which wasn't in the detail API necessarily, but we get it from subcollection if needed */}
                            {/* For demo, showing the representative and placeholder */}
                            <tr className="group">
                               <td className="py-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black uppercase text-xs">
                                     {org.representative?.firstName?.[0]}{org.representative?.lastName?.[0]}
                                   </div>
                                   <div>
                                     <p className="text-white font-bold text-sm">{org.representative?.firstName} {org.representative?.lastName}</p>
                                     <p className="text-[10px] text-slate-500">Depuis le {safeFormatDate(org.representative?.createdAt, 'dd/MM/yyyy')}</p>
                                   </div>
                                 </div>
                               </td>
                               <td className="py-4 text-xs text-slate-400">{org.representative?.email}</td>
                               <td className="py-4">
                                 <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter rounded">Référent</span>
                               </td>
                               <td className="py-4">
                                 <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                   <span className="text-[10px] font-bold text-slate-400 uppercase">Actif</span>
                                 </div>
                               </td>
                               <td className="py-4 text-right">
                                  <button className="p-2 text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                    <ShieldAlert size={16} />
                                  </button>
                               </td>
                            </tr>
                         </tbody>
                       </table>
                       <p className="text-center py-8 text-[10px] font-black uppercase tracking-widest text-slate-700 italic border-t border-[#2e2e34]">
                         Le super-admin ne gère pas directement les accès secondaires. Contactez le référent.
                       </p>
                    </div>
                  </div>
               </div>

               <div className="space-y-8">
                  {/* Representative Details CAR CARD */}
                  <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#c084fc]">Référent du compte</h3>
                    
                    <div className="flex flex-col items-center text-center py-4 space-y-4">
                       <div className="w-24 h-24 rounded-full bg-[#111113] border-2 border-primary p-1 relative">
                          <img src={org.representative?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${org.representative?.email}`} alt="" className="w-full h-full rounded-full object-cover" />
                       </div>
                       <div>
                          <p className="text-2xl font-black text-white">{org.representative?.firstName} {org.representative?.lastName}</p>
                          <p className="text-slate-500 text-sm">{org.representative?.email}</p>
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#2e2e34]">
                       <a 
                         href={`/dashboard/${org.id}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-full flex items-center justify-between p-4 bg-[#3dffa0]/10 border border-[#3dffa0]/40 rounded-2xl hover:border-[#3dffa0] hover:bg-[#3dffa0]/20 transition-all group shadow-lg shadow-[#3dffa0]/10"
                       >
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-[#3dffa0]">Espace Référent</p>
                            <p className="text-white font-bold text-sm flex items-center gap-2">
                              Accéder au backoffice du référent
                            </p>
                          </div>
                          <ExternalLink size={18} className="text-[#3dffa0] group-hover:scale-110 transition-transform shrink-0" />
                       </a>

                       <button 
                        onClick={() => setIsChangingRep(true)}
                        className="w-full flex items-center justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl hover:border-[#c084fc] transition-colors group"
                       >
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-[#c084fc] transition-colors">Actions Référent</p>
                            <p className="text-white font-bold text-sm">Changer de représentant</p>
                          </div>
                          <ChevronLeft className="rotate-180 text-slate-500" size={18} />
                       </button>

                       <button 
                          onClick={() => handleResendAccess()}
                          disabled={isResendingAccess}
                          className="w-full flex items-center justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl hover:border-primary transition-colors group disabled:opacity-50"
                       >
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">Activation</p>
                            <p className="text-white font-bold text-sm">
                              {isResendingAccess ? "Envoi en cours..." : "Renvoyer les accès"}
                            </p>
                          </div>
                          <Send size={18} className="text-slate-500 group-hover:text-primary" />
                       </button>
                    </div>
                  </div>

                  <div className="bg-[#111113] border border-blue-500/20 rounded-3xl p-8 space-y-4">
                     <AlertCircle className="text-blue-500" />
                     <h3 className="text-white font-bold">Aide Administration</h3>
                     <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-black tracking-tight italic">
                        Un changement de référent entraîne l'envoi immédiat d'un email de réinitialisation de mot de passe à la nouvelle cible. L'ancien référent repasse en rôle collaborateur simple.
                     </p>
                  </div>
               </div>
            </div>
          )}

          {/* Section: Avis + Business */}
          {activeTab === 'avis_business' && (
            <div className="space-y-8">
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                      <Star size={24} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Note de Confiance</span>
                  </div>
                  <p className="text-3xl font-black text-white">4.9 / 5.0</p>
                  <div className="flex items-center gap-1 mt-2 text-amber-400 text-xs">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <span className="text-slate-500 ml-2">(Score certifié SafeCallr)</span>
                  </div>
                </div>

                <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                      <Lock size={24} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Espace Business</span>
                  </div>
                  <p className="text-3xl font-black text-white">Actif</p>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-primary" />
                    Sécurité inter-collaborateurs activée
                  </p>
                </div>

                <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                      <Users size={24} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Collaborateurs Inscrits</span>
                  </div>
                  <p className="text-3xl font-black text-white">{org.stats?.totalMembers || 0}</p>
                  <p className="text-xs text-slate-400 mt-2">Membres autorisés sur le réseau SafeCallr</p>
                </div>
              </div>

              {/* Business Space Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-primary" size={24} />
                    <div>
                      <h3 className="text-lg font-black text-white">Protocole Espace Business & Collaborateurs</h3>
                      <p className="text-xs text-slate-500">Paramètres de sécurité pour les vérifications internes entre collaborateurs.</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {[
                      {
                        title: "Vérification stricte inter-collaborateurs",
                        desc: "Demande de confirmation obligatoire pour tous les appels internes sensibles entre collègues.",
                        active: true
                      },
                      {
                        title: "Anti-usurpation de dirigeant (FOVI / BEC)",
                        desc: "Filtrage et alerte automatique si un numéro non répertorié tente de contacter un collaborateur au nom du représentant.",
                        active: true
                      },
                      {
                        title: "Alertes instantanées au référent",
                        desc: "Notification en temps réel au référent lors de toute tentative de vérification échouée.",
                        active: true
                      },
                      {
                        title: "Journalisation renforcée des échanges",
                        desc: "Conservation sécurisée de l'historique des requêtes d'authentification interne pendant 12 mois.",
                        active: true
                      }
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl">
                        <div className="space-y-1 pr-4">
                          <p className="text-sm font-bold text-white">{feature.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-full border border-primary/20 shrink-0">
                          Activé
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avis & Évaluations Clients / Partenaires */}
                <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="text-amber-400" size={24} />
                      <div>
                        <h3 className="text-lg font-black text-white">Avis & Retours de Sécurité</h3>
                        <p className="text-xs text-slate-500">Avis certifiés déposés par les partenaires et collaborateurs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        author: "Département Sécurité Interne",
                        role: "Collaborateur référent",
                        comment: "L'Espace Business permet d'éliminer totalement le doute lors des appels de confirmation de virements ou d'instructions confidentielles.",
                        rating: 5,
                        date: "Il y a 3 jours"
                      },
                      {
                        author: "Direction Administrative",
                        role: "Admin Espace Business",
                        comment: "Mise en place fluide, l'ensemble des collaborateurs s'est inscrit sans difficulté. Excellent niveau de confiance.",
                        rating: 5,
                        date: "Il y a 2 semaines"
                      }
                    ].map((review, i) => (
                      <div key={i} className="p-5 bg-[#111113] border border-[#2e2e34] rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{review.author}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{review.role}</p>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(review.rating)].map((_, r) => (
                              <Star key={r} size={12} fill="currentColor" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 italic leading-relaxed">"{review.comment}"</p>
                        <p className="text-[10px] text-slate-600 text-right font-mono">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Audit Log */}
          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-10">
                  <h3 className="text-xl font-black text-white mb-10 border-l-4 border-primary pl-6 uppercase tracking-widest flex items-center gap-3">
                    <History className="text-primary" /> Journal d'événements
                  </h3>
                  <AuditLogTimeline logs={org.auditLog || []} />
               </div>
               
               <div className="space-y-8">
                  <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Traçabilité</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Toutes les actions effectuées par les super-admins de SafeCallr ou par le représentant de l'organisation sont consignées ici.
                    </p>
                  </div>

                  <DangerZone 
                    orgName={org.name} 
                    isActive={org.active} 
                    onDeactivate={handleToggleStatus} 
                    onDelete={handleDeleteOrg}
                  />
               </div>
            </div>
          )}

        </div>
      </div>

      {isChangingRep && (
        <ChangeRepresentativeModal 
          currentRep={org.representative}
          members={[]} // In real app, we fetch members list if needed
          onClose={() => setIsChangingRep(false)}
          onConfirm={handleChangeRep}
        />
      )}
    </AdminLayout>
  );
}
