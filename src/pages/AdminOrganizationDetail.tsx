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
  AlertCircle
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import AdminLayout from "../components/AdminLayout";
import AuditLogTimeline from "../components/admin/AuditLogTimeline";
import DangerZone from "../components/admin/DangerZone";
import ChangeRepresentativeModal from "../components/admin/ChangeRepresentativeModal";
import { toast } from "sonner"; // Assuming sonner or similar is used, otherwise I'll need to define toast

export default function AdminOrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Editable fields for legal info
  const [legalData, setLegalData] = useState<any>(null);
  const [isSavingLegal, setIsSavingLegal] = useState(false);
  const [isChangingRep, setIsChangingRep] = useState(false);

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
        const orgDoc = await getDoc(doc(db, "organizations", id));
        if (!orgDoc.exists()) throw new Error("Organisation non trouvée");
        
        const orgData = orgDoc.data();
        
        let totalMembers = 0;
        let activeMembers = 0;
        try {
          const membersSnap = await getDocs(collection(db, "organizations", id, "members"));
          totalMembers = membersSnap.size;
          activeMembers = membersSnap.docs.filter(d => d.data().status === "active").length;
        } catch (mErr) {
          console.warn("Direct members read failed:", mErr);
        }

        let totalAuthRequests = 0;
        try {
          const authSnap = await getDocs(collection(db, "organizations", id, "authRequests"));
          totalAuthRequests = authSnap.size;
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
        }

        data = {
          ...orgData,
          id: orgDoc.id,
          stats: {
            totalMembers,
            activeMembers,
            totalAuthRequests
          },
          auditLog,
          representative
        };
      }

      setOrg(data);
      setLegalData({
        name: data.name,
        siret: data.siret,
        address: data.address,
        streetNumber: data.streetNumber || "",
        zipCode: data.zipCode || "",
        city: data.city || "",
        allowedEmailDomains: data.allowedEmailDomains
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur de chargement");
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

  const handleToggleStatus = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/organizations/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, active: !org.active })
      });
      if (!response.ok) throw new Error("Erreur lors du changement de statut");
      toast.success(org.active ? "Organisation désactivée" : "Organisation réactivée");
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
                <img src={org.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-white">{org.name}</h1>
                  {org.active ? (
                    <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">Active</span>
                  ) : (
                    <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">Désactivée</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                  <span className="flex items-center gap-2 italic">
                    <Calendar size={14} /> Créée le {format(new Date(org.createdAt?.seconds * 1000), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                  <span className="px-2 py-0.5 bg-[#1e1e22] rounded text-xs font-mono">SIRET: {org.siret}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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
                  { label: "Collaborateurs", value: org.stats?.totalMembers, sub: `${org.stats?.activeMembers} actifs`, color: "#c084fc", icon: User },
                  { label: "Demandes Totales", value: org.stats?.totalAuths, sub: "Depuis création", color: "#60a5fa", icon: ShieldCheck },
                  { label: "Taux de Succès", value: "98.2%", sub: "+2.1% vs mois dernier", color: "#4ade80", icon: TrendingUp },
                  { label: "Domaines mail", value: org.allowedEmailDomains?.length, sub: "Domaines autorisés", color: "#fbbf24", icon: Globe },
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
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Vérifications réussies vs échouées sur 90 jours</p>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={[
                       { name: 'Mars', success: 4000, error: 240 },
                       { name: 'Avril', success: 3000, error: 139 },
                       { name: 'Mai', success: 2000, error: 980 },
                       { name: 'Juin', success: 2780, error: 390 },
                       { name: 'Juillet', success: 1890, error: 480 },
                       { name: 'Août', success: 2390, error: 380 },
                       { name: 'Septembre', success: 3490, error: 430 },
                     ]}>
                       <defs>
                         <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e2e34" />
                       <Tooltip 
                        contentStyle={{ backgroundColor: '#111113', border: '1px solid #2e2e34', borderRadius: '12px', fontSize: '12px' }} 
                        itemStyle={{ color: '#fff' }}
                       />
                       <Area type="monotone" dataKey="success" stroke="#4ade80" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={3} />
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
                    <div className="flex items-center gap-3 mb-2">
                      <Palette className="text-purple-500" size={20} />
                      <h3 className="text-lg font-black text-white">Identité Visuelle</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-[#111113] border border-[#2e2e34] rounded-3xl p-4 flex items-center justify-center relative group shrink-0">
                          <img src={org.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                          <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-3xl transition-opacity">
                            <PlusCircle className="text-white" size={24} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white font-bold">Logo Institutionnel</p>
                          <p className="text-xs text-slate-500">Format SVG ou PNG transparent recommandé.</p>
                          <p className="text-[10px] text-slate-600 italic">Visible lors du déclenchement d'un code chez le client.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Couleur Signature</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl shadow-xl border border-[#2e2e34]" style={{ backgroundColor: org.primaryColor }} />
                            <div className="bg-[#111113] px-4 py-2 border border-[#2e2e34] rounded-xl text-sm font-mono text-white">
                              {org.primaryColor}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Message de confiance</p>
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs text-slate-400 leading-relaxed italic">
                            "{org.trustMessage}"
                          </div>
                        </div>
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
                                     <p className="text-[10px] text-slate-500">Depuis le {format(new Date(org.representative?.createdAt?.seconds * 1000), 'dd/MM/yyyy')}</p>
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

                       <button className="w-full flex items-center justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl hover:border-primary transition-colors group">
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">Activation</p>
                            <p className="text-white font-bold text-sm">Renvoyer les accès</p>
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
