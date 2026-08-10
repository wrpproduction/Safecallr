import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, 
  LayoutDashboard, 
  History, 
  Settings, 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Briefcase, 
  Clock, 
  UserPlus, 
  Loader2, 
  X, 
  UserX, 
  UserCheck, 
  Edit2, 
  FileSpreadsheet, 
  LogOut,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { auth, db, getIdToken } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { toast } from "sonner";
import CsvImportModal from "../../components/dashboard/CsvImportModal";

interface BusinessMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: string;
  status: "active" | "pending" | "suspended";
  createdAt?: any;
}

export default function AdminMembers() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Auth & Company Loading
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/business/login");
        return;
      }
      setCurrentUser(user);

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const cId = userData?.companyId || userData?.orgId || user.uid;
        setCompanyId(cId);

        // Fetch company info for domain validation
        const compSnap = await getDoc(doc(db, "companies", cId));
        if (compSnap.exists()) {
          setCompanyData(compSnap.data());
        } else {
          const orgSnap = await getDoc(doc(db, "organizations", cId));
          if (orgSnap.exists()) {
            setCompanyData(orgSnap.data());
          }
        }
      } catch (err) {
        console.error("Error loading user company:", err);
      }
    });

    return () => unsub();
  }, [navigate]);

  // Real-time members listener
  useEffect(() => {
    if (!companyId) return;

    // Listen to company members collection
    const membersRef = collection(db, "companies", companyId, "members");
    const unsub = onSnapshot(membersRef, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as BusinessMember[];

      setMembers(fetched);
      setLoading(false);
    }, (err) => {
      console.warn("Falling back to global pros query:", err);
      // Fallback: search in 'pros' or 'organizations'
      const prosQuery = query(collection(db, "pros"), where("companyId", "==", companyId));
      onSnapshot(prosQuery, (snap) => {
        const fallbackMembers = snap.docs.map(d => ({
          id: d.id,
          firstName: d.data().firstName || d.data().displayName?.split(" ")[0] || "Collaborateur",
          lastName: d.data().lastName || d.data().displayName?.split(" ")[1] || "",
          email: d.data().email || "",
          phone: d.data().phone || d.data().phoneNumber || "",
          jobTitle: d.data().jobTitle || d.data().function || "",
          role: d.data().role || "collaborator",
          status: d.data().status || "active",
          createdAt: d.data().createdAt
        })) as BusinessMember[];
        setMembers(fallbackMembers);
        setLoading(false);
      });
    });

    return () => unsub();
  }, [companyId]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/business/login");
  };

  const handleManualAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyId) return;

    setIsAddLoading(true);
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const firstName = (formData.get("firstName") as string).trim();
    const lastName = (formData.get("lastName") as string).trim();
    const phone = (formData.get("phone") as string).trim();
    const jobTitle = (formData.get("jobTitle") as string).trim();

    const allowedDomains = companyData?.allowedEmailDomains || (companyData?.domain ? [companyData.domain] : []);
    if (allowedDomains.length > 0) {
      const emailDomain = email.split("@")[1];
      if (!allowedDomains.includes(emailDomain)) {
        setModalError(`L'email doit appartenir à l'un des domaines autorisés : ${allowedDomains.map((d: string) => `@${d}`).join(", ")}`);
        setIsAddLoading(false);
        return;
      }
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Non authentifié");
      const idToken = await getIdToken(user);

      const response = await fetch("/api/dashboard/import-members-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          orgId: companyId,
          lang: "fr",
          members: [{ firstName, lastName, email, phone, jobTitle }]
        })
      });

      const res = await response.json();
      if (!response.ok || res.importedCount === 0) {
        throw new Error(res.errors?.[0]?.reason || res.error || "Échec de la création du collaborateur.");
      }

      toast.success(`Collaborateur ${firstName} ${lastName} ajouté avec succès !`);
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsAddLoading(false);
    }
  };

  // Filter members
  const filteredMembers = members.filter(m => {
    const matchSearch = `${m.firstName} ${m.lastName} ${m.email} ${m.phone || ''} ${m.jobTitle || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = members.filter(m => m.status === "active").length;
  const suspendedCount = members.filter(m => m.status === "suspended").length;

  return (
    <div className="min-h-screen bg-[#111113] flex text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#161618] shrink-0 min-h-screen text-white flex flex-col justify-between border-r border-[#2e2e34]">
        <div>
          <div className="p-6 border-b border-[#2e2e34] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3dffa0] flex items-center justify-center shadow-lg shadow-[#3dffa0]/20">
              <Shield className="text-black w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-white">SafeCallr</h2>
              <span className="text-[10px] text-[#3dffa0] uppercase font-black tracking-widest block -mt-1">Business Console</span>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <Link to="/business/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-[#1e1e22] font-bold text-xs uppercase tracking-wider transition-all">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/business/admin/members" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#3dffa0] text-black font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#3dffa0]/10">
              <Users size={18} />
              <span>Collaborateurs</span>
            </Link>
            <Link to="/business/admin/history" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-[#1e1e22] font-bold text-xs uppercase tracking-wider transition-all">
              <History size={18} />
              <span>Historique</span>
            </Link>
            <Link to="/business/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-[#1e1e22] font-bold text-xs uppercase tracking-wider transition-all">
              <Settings size={18} />
              <span>Paramètres</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-[#2e2e34]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e22] hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-[#2e2e34] rounded-2xl text-xs font-bold transition-all"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">Gestion des Collaborateurs</h1>
              <span className="bg-[#3dffa0]/10 text-[#3dffa0] border border-[#3dffa0]/20 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                {companyData?.name || "Business"}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Gérez l'annuaire d'entreprise, ajoutez vos collaborateurs ou importez-les en masse par CSV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="bg-[#1e1e22] hover:bg-slate-800 border border-[#2e2e34] hover:border-[#3dffa0] text-white px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
            >
              <FileSpreadsheet size={18} className="text-[#3dffa0]" />
              Import CSV Massif
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#3dffa0] text-black hover:bg-[#3dffa0]/90 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#3dffa0]/20"
            >
              <UserPlus size={18} />
              Nouveau Collaborateur
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Collaborateurs</span>
              <Users className="text-[#3dffa0]" size={20} />
            </div>
            <p className="text-3xl font-black text-white">{members.length}</p>
            <p className="text-xs text-slate-400 mt-2">Membres autorisés sur l'Espace Business</p>
          </div>

          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comptes Actifs</span>
              <CheckCircle2 className="text-green-400" size={20} />
            </div>
            <p className="text-3xl font-black text-white">{activeCount}</p>
            <p className="text-xs text-green-400 mt-2">Authentifications sécurisées opérationnelles</p>
          </div>

          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comptes Suspendus</span>
              <AlertTriangle className="text-amber-400" size={20} />
            </div>
            <p className="text-3xl font-black text-white">{suspendedCount}</p>
            <p className="text-xs text-slate-400 mt-2">Accès temporairement restreints</p>
          </div>
        </div>

        {/* Table & Toolbar Container */}
        <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Toolbar Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-4" />
              <input 
                type="text" 
                placeholder="Rechercher par nom, prénom, email pro, téléphone ou fonction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111113] border border-[#2e2e34] text-white rounded-2xl py-3 pl-12 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#3dffa0] focus:outline-none transition-all"
              />
            </div>
            <div className="flex gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#111113] border border-[#2e2e34] text-slate-300 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-[#3dffa0] focus:outline-none transition-all"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs uniquement</option>
                <option value="suspended">Suspendus uniquement</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-[#3dffa0] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111113] text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-[#2e2e34]">
                    <th className="px-6 py-4">Collaborateur</th>
                    <th className="px-6 py-4">Fonction</th>
                    <th className="px-6 py-4">Téléphone Pro</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e34]">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                        Aucun collaborateur trouvé. Utilisez le bouton "Import CSV" pour importer vos collaborateurs.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-[#111113] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-[#2e2e34] flex items-center justify-center text-[#3dffa0] font-black text-sm uppercase">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                                <Mail size={12} className="text-slate-500" /> {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-300 text-xs">
                            <Briefcase size={14} className="text-slate-500" />
                            <span>{member.jobTitle || "Collaborateur"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-300">
                          {member.phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone size={12} className="text-[#3dffa0]" /> {member.phone}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                            member.status === 'active' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-green-400' : 'bg-amber-400'}`} />
                            {member.status === 'active' ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-slate-500 font-mono">ID: {member.id.substring(0, 8)}...</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Manual Add Member */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e1e22] border border-[#2e2e34] w-full max-w-xl rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-start border-b border-[#2e2e34] pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">Ajouter un collaborateur</h3>
                  <p className="text-xs text-slate-400">Renseignez les 5 informations du collaborateur</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-xs font-bold">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleManualAddMember} className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom</label>
                  <input required name="lastName" className="w-full bg-[#111113] border border-[#2e2e34] text-white rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[#3dffa0]" placeholder="Dupont" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prénom</label>
                  <input required name="firstName" className="w-full bg-[#111113] border border-[#2e2e34] text-white rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[#3dffa0]" placeholder="Jean" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email professionnel</label>
                  <input required name="email" type="email" className="w-full bg-[#111113] border border-[#2e2e34] text-white rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[#3dffa0]" placeholder="jean.dupont@entreprise.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone</label>
                  <input name="phone" className="w-full bg-[#111113] border border-[#2e2e34] text-white rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[#3dffa0]" placeholder="+33 6 12 34 56 78" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fonction / Poste</label>
                  <input name="jobTitle" className="w-full bg-[#111113] border border-[#2e2e34] text-white rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[#3dffa0]" placeholder="Responsable Sécurité" />
                </div>

                <div className="col-span-2 pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-[#111113] border border-[#2e2e34] hover:bg-slate-800 text-white rounded-2xl py-3 font-bold text-xs uppercase"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={isAddLoading}
                    className="flex-1 bg-[#3dffa0] text-black font-black text-xs uppercase rounded-2xl py-3 hover:bg-[#3dffa0]/90 flex items-center justify-center gap-2"
                  >
                    {isAddLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Ajouter le collaborateur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        <CsvImportModal 
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          orgId={companyId || ""}
          orgName={companyData?.name || "SafeCallr Business"}
          allowedEmailDomains={companyData?.allowedEmailDomains || (companyData?.domain ? [companyData.domain] : [])}
        />
      </main>
    </div>
  );
}

