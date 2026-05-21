import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Building2, 
  Mail, 
  FileText,
  Loader2,
  AlertCircle,
  Check,
  X,
  MessageSquare,
  Clock
} from "lucide-react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc
} from "firebase/firestore";
import AdminLayout from "../components/AdminLayout";
import { emailService } from "../services/emailService";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

interface Pro {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl: string;
  jobTitle: string;
  companyId: string;
  status: string;
  verified: boolean;
  siretDocUrl: string;
  createdAt: any;
  companyName?: string;
}

export default function AdminPros() {
  const [allPros, setAllPros] = useState<Pro[]>([]);
  const [pendingPros, setPendingPros] = useState<Pro[]>([]);
  const [searchResults, setSearchResults] = useState<Pro[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [totalProsCount, setTotalProsCount] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [showRejectionInput, setShowRejectionInput] = useState<{ [key: string]: boolean }>({});

  // Companies state for dynamic lookups and assignment
  const [companies, setCompanies] = useState<any[]>([]);

  // Modal editing states
  const [selectedProForEdit, setSelectedProForEdit] = useState<Pro | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
    companyId: string;
    siretDocUrl: string;
    status: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    companyId: "",
    siretDocUrl: "",
    status: "",
  });

  const [companyCreation, setCompanyCreation] = useState({
    name: "",
    domain: "",
    siret: "",
  });

  const [linkMode, setLinkMode] = useState<"existing" | "new">("new");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  useEffect(() => {
    // 1. Listen to all companies
    const compQ = query(collection(db, "companies"));
    const unsubComps = onSnapshot(compQ, (snap) => {
      const comps = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setCompanies(comps);
    }, (err) => {
      console.error("Error fetching companies list:", err);
    });

    // 2. Listen to all pros
    const prosQ = query(collection(db, "pros"));
    const unsubPros = onSnapshot(prosQ, async (snapshot) => {
      const prosData: Pro[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Pro;
        
        // Handle createdAt timestamp
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate();
        } else if (createdAt) {
          createdAt = new Date(createdAt);
        }

        // Fetch company name
        let companyName = "Inconnue";
        if (data.companyId) {
          try {
            const companySnap = await getDoc(doc(db, "companies", data.companyId));
            if (companySnap.exists()) {
              companyName = companySnap.data().name;
            }
          } catch (err) {
            console.error("Error fetching company name during snapshot iteration:", err);
          }
        }
        prosData.push({ ...data, id: docSnap.id, companyName });
      }
      
      setAllPros(prosData);
      setTotalProsCount(prosData.length);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching pros snapshot:", err);
      handleFirestoreError(err, OperationType.LIST, "pros");
      setLoading(false);
    });

    return () => {
      unsubComps();
      unsubPros();
    };
  }, []);

  // Update pendingPros array locally when allPros or the selection filter changes
  useEffect(() => {
    const filtered = allPros.filter(p => {
      if (statusFilter === "all") return true;
      return p.status === statusFilter;
    });
    setPendingPros(filtered);
  }, [allPros, statusFilter]);

  // Helper to dynamically get company name from list, or fallback
  const getCompanyName = (companyId: string, fallbackName?: string) => {
    if (!companyId) return "Inconnue";
    const comp = companies.find(c => c.id === companyId);
    return comp ? comp.name : (fallbackName || "Inconnue");
  };

  const openEditModal = (pro: Pro) => {
    setSelectedProForEdit(pro);
    setEditForm({
      firstName: pro.firstName || "",
      lastName: pro.lastName || "",
      email: pro.email || "",
      phone: pro.phone || "",
      jobTitle: pro.jobTitle || "",
      companyId: pro.companyId || "",
      siretDocUrl: pro.siretDocUrl || "",
      status: pro.status || "pending_validation",
    });
    // Set smart defaults for creating a brand new company
    setCompanyCreation({
      name: pro.companyName && pro.companyName !== "Inconnue" ? pro.companyName : `${pro.lastName} Entreprise`,
      domain: pro.email.includes("@") && !pro.email.endsWith("gmail.com") && !pro.email.endsWith("outlook.com") && !pro.email.endsWith("hotmail.com") && !pro.email.endsWith("yahoo.fr")
        ? pro.email.split("@")[1]
        : `${pro.lastName.toLowerCase()}-services.com`,
      siret: pro.companyId || "",
    });
    // Check if company exists currently
    const companyExists = companies.some(c => c.id === pro.companyId);
    setLinkMode(companyExists ? "existing" : "new");
  };

  const handleSaveProDetails = async () => {
    if (!selectedProForEdit) return;
    setIsSavingDetails(true);
    try {
      const proRef = doc(db, "pros", selectedProForEdit.id);
      
      const updateData: any = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        jobTitle: editForm.jobTitle.trim(),
        companyId: editForm.companyId.trim(),
        siretDocUrl: editForm.siretDocUrl.trim(),
        status: editForm.status,
        updatedAt: serverTimestamp()
      };

      await updateDoc(proRef, updateData);

      // Also ensure we update user record if they exist in the 'users' collection with same UID
      try {
        const userRef = doc(db, "users", selectedProForEdit.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          await updateDoc(userRef, {
            firstName: editForm.firstName.trim(),
            lastName: editForm.lastName.trim(),
            displayName: `${editForm.firstName.trim()} ${editForm.lastName.trim()}`,
            email: editForm.email.trim(),
            phone: editForm.phone.trim(),
            phoneNumber: editForm.phone.trim(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (userErr) {
        console.error("Error updating users collection sync:", userErr);
      }

      alert("Fiche modifiée avec succès !");
      setSelectedProForEdit(null);
    } catch (err: any) {
      console.error("Error saving pro details:", err);
      alert(`Erreur lors de l'enregistrement: ${err.message}`);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleCreateAndLinkCompany = async () => {
    if (!selectedProForEdit) return;
    if (!companyCreation.name.trim() || !companyCreation.siret.trim()) {
      alert("Le nom de l'entreprise et le SIRET sont obligatoires.");
      return;
    }

    setIsSavingDetails(true);
    try {
      const compId = companyCreation.siret.trim();
      const compRef = doc(db, "companies", compId);
      
      // Write verified company doc to DB
      await setDoc(compRef, {
        id: compId,
        siret: compId,
        name: companyCreation.name.trim(),
        domain: companyCreation.domain.trim() || `${companyCreation.name.toLowerCase().replace(/\s+/g, '')}.com`,
        status: "verified",
        createdAt: new Date().toISOString()
      });

      // Tie this companyId instantly in the pro's edit form
      setEditForm(prev => ({
        ...prev,
        companyId: compId
      }));

      // Set link mode to existing since it was successfully created in companies
      setLinkMode("existing");
      
      alert(`L'entreprise "${companyCreation.name}" a été enregistrée & validée. Elle est maintenant liée à ce pro.`);
    } catch (err: any) {
      console.error("Error creating company:", err);
      alert(`Erreur de création d'entreprise: ${err.message}`);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    
    setIsSearching(true);
    setError(null);
    try {
      const q = query(collection(db, "pros"), where("email", "==", searchEmail.trim()));
      const snap = await getDocs(q);
      const results: Pro[] = [];
      
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as Pro;
        let companyName = "Inconnue";
        if (data.companyId) {
          const companySnap = await getDoc(doc(db, "companies", data.companyId));
          if (companySnap.exists()) companyName = companySnap.data().name;
        }
        results.push({ ...data, id: docSnap.id, companyName });
      }
      setSearchResults(results);
      if (results.length === 0) {
        setError("Aucun professionnel trouvé avec cet email dans la base Firestore.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Erreur lors de la recherche.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleValidate = async (proId: string) => {
    setActionLoading(proId);
    try {
      const pro = pendingPros.find(p => p.id === proId);
      if (!pro) return;

      await updateDoc(doc(db, "pros", proId), {
        status: "active",
        verified: true,
        updatedAt: serverTimestamp()
      });
      
      // Envoi de l'email de validation
      await emailService.sendProValidationEmail(pro.email, pro.firstName);
      
      console.log(`Pro ${proId} validated`);
    } catch (err) {
      console.error("Error validating pro:", err);
      alert("Erreur lors de la validation.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (proId: string) => {
    const reason = rejectionReason[proId];
    if (!reason || reason.trim().length < 5) {
      alert("Veuillez saisir un motif de rejet valide (min 5 caractères).");
      return;
    }

    setActionLoading(proId);
    try {
      const pro = pendingPros.find(p => p.id === proId);
      if (!pro) return;

      await updateDoc(doc(db, "pros", proId), {
        status: "rejected",
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
      
      // Envoi de l'email de rejet
      await emailService.sendProRejectionEmail(pro.email, pro.firstName, reason);
      
      console.log(`Pro ${proId} rejected for: ${reason}`);
      
      // Reset state for this pro
      const newReasons = { ...rejectionReason };
      delete newReasons[proId];
      setRejectionReason(newReasons);
      
      const newShow = { ...showRejectionInput };
      delete newShow[proId];
      setShowRejectionInput(newShow);
    } catch (err) {
      console.error("Error rejecting pro:", err);
      alert("Erreur lors du rejet.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Pros</h1>
            <p className="text-[#9a9a9f] mt-1">
              {statusFilter === "pending_validation" 
                ? `Validation des nouveaux comptes professionnels (${pendingPros.length} en attente${totalProsCount !== null ? ` / ${totalProsCount} au total` : ""})`
                : statusFilter === "active"
                ? `Direction et gestion des professionnels actifs (${pendingPros.length} actifs)`
                : statusFilter === "rejected"
                ? `Comptes professionnels rejetés (${pendingPros.length} rejetés)`
                : `Tous les comptes professionnels (${pendingPros.length} enregistrés)`
              }
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#111113] border border-[#2e2e34] rounded-xl py-2 pl-9 pr-8 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all cursor-pointer select-none font-bold"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              >
                <option value="all">🌐 Tous ({allPros.length})</option>
                <option value="pending_validation">📁 En attente ({allPros.filter(p => p.status === "pending_validation").length})</option>
                <option value="active">✅ Actifs ({allPros.filter(p => p.status === "active").length})</option>
                <option value="rejected">❌ Rejetés ({allPros.filter(p => p.status === "rejected").length})</option>
              </select>
            </div>
            <form onSubmit={handleSearch} className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Rechercher par email..."
                className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl py-2 pl-10 pr-4 text-sm focus:border-[#4ade80] outline-none transition-all"
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#4ade80]" size={16} />}
            </form>
            <button
              onClick={async () => {
                const email = prompt("Entrez l'email du compte à réinitialiser (suppression Auth + Firestore) :");
                if (email && email.includes("@")) {
                  if (confirm(`Confirmez-vous la suppression TOTALE du compte ${email} ?`)) {
                    setLoading(true);
                    try {
                      const res = await fetch("/api/admin/delete-user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email })
                      });
                      const data = await res.json();
                      alert(data.message || data.error);
                    } catch (err) {
                      alert("Erreur lors de la réinitialisation.");
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              }}
              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
            >
              <XCircle size={18} />
              Réinitialiser
            </button>
            <div className="px-4 py-2 bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 rounded-lg text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={18} />
              {statusFilter === "pending_validation" ? `${pendingPros.length} En attente` : statusFilter === "active" ? `${pendingPros.length} Actifs` : `${pendingPros.length} Affichés`}
            </div>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
            <AlertCircle size={20} />
            <p>{error}</p>
            {searchResults.length > 0 && <button onClick={() => setSearchResults([])} className="ml-auto text-xs underline">Effacer la recherche</button>}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-[#111113] border border-[#4ade80]/30 rounded-3xl overflow-hidden shadow-lg shadow-[#4ade80]/5 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[#2e2e34] bg-[#18181b] flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[#4ade80]">
                <Search size={20} />
                Résultat de la recherche
              </h2>
              <button onClick={() => { setSearchResults([]); setSearchEmail(""); }} className="text-xs text-[#9a9a9f] hover:text-white underline">
                Fermer la recherche
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#18181b] text-[#9a9a9f] text-xs uppercase tracking-widest font-bold">
                    <th className="px-6 py-4 border-b border-[#2e2e34]">Professionnel</th>
                    <th className="px-6 py-4 border-b border-[#2e2e34]">Status</th>
                    <th className="px-6 py-4 border-b border-[#2e2e34]">Entreprise & SIRET</th>
                    <th className="px-6 py-4 border-b border-[#2e2e34] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e34]">
                  {searchResults.map((pro) => (
                    <tr key={pro.id} className="hover:bg-[#1e1e22] transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#1e1e22] border border-[#2e2e34] overflow-hidden flex-shrink-0">
                            {pro.photoUrl ? (
                              <img src={pro.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9a9a9f] font-bold">
                                {pro.firstName[0]}{pro.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{pro.firstName} {pro.lastName}</p>
                            <p className="text-xs text-[#9a9a9f]">{pro.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pro.status === "active" ? "bg-green-500/10 text-green-500" :
                          pro.status === "pending_validation" ? "bg-yellow-500/10 text-yellow-500" :
                          pro.status === "rejected" ? "bg-red-500/10 text-red-500" :
                          "bg-gray-500/10 text-gray-500"
                        }`}>
                          {pro.status}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-bold text-white">{getCompanyName(pro.companyId, pro.companyName)}</div>
                        <div className="text-xs text-[#9a9a9f]">SIRET: {pro.companyId}</div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(pro)}
                            className="px-3 py-1.5 bg-[#2e2e34] hover:bg-[#3f3f46] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <FileText size={14} />
                            Fiche Pro
                          </button>
                          {pro.status === "pending_validation" && (
                            <button
                              onClick={() => handleValidate(pro.id)}
                              className="px-4 py-2 bg-[#4ade80] text-black font-bold rounded-lg hover:bg-[#22c55e] transition-all"
                            >
                              Valider
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (confirm(`Êtes-vous sûr de vouloir réinitialiser le compte de ${pro.email} ? Cela supprimera son compte Auth et son profil Firestore.`)) {
                                setActionLoading(pro.id);
                                try {
                                  const res = await fetch("/api/admin/delete-user", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ email: pro.email })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    alert(data.message);
                                    setSearchResults([]);
                                    setSearchEmail("");
                                  } else {
                                    alert(data.error);
                                  }
                                } catch (err) {
                                  console.error(err);
                                  alert("Erreur lors de la réinitialisation.");
                                } finally {
                                  setActionLoading(null);
                                }
                              }
                            }}
                            disabled={actionLoading === pro.id}
                            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          >
                            {actionLoading === pro.id ? <Loader2 className="animate-spin" size={18} /> : "Réinitialiser"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#111113] border border-[#2e2e34] rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-[#2e2e34] bg-[#18181b]">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="text-[#fbbf24]" size={20} />
              {statusFilter === "pending_validation" ? "Demandes en attente de validation" :
               statusFilter === "active" ? "Professionnels validés et actifs" :
               statusFilter === "rejected" ? "Demandes professionnelles rejetées" :
               "Tous les professionnels"}
            </h2>
          </div>

          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-[#4ade80]" size={40} />
              <p className="text-[#9a9a9f]">Chargement des dossiers...</p>
            </div>
          ) : pendingPros.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-[#1e1e22] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-[#4ade80]" size={32} />
              </div>
              <p className="text-[#9a9a9f] font-medium">
                {statusFilter === "pending_validation" ? "Aucune demande en attente. Beau travail !" :
                 statusFilter === "active" ? "Aucun professionnel actif trouvé." :
                 statusFilter === "rejected" ? "Aucune demande rejetée." :
                 "Aucun professionnel trouvé."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#18181b] text-[#9a9a9f] text-xs uppercase tracking-widest font-bold">
                    <th className="px-6 py-4 border-b border-[#2e2e34]">Professionnel</th>
                    <th className="px-6 py-4 border-b border-[#2e2e34]">Entreprise & SIRET</th>
                    <th className="px-6 py-4 border-b border-[#2e2e34]">Justificatif</th>
                    <th className="px-6 py-4 border-b border-[#2e2e34] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e34]">
                  {pendingPros.map((pro) => (
                    <tr key={pro.id} className="hover:bg-[#1e1e22] transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#1e1e22] border border-[#2e2e34] overflow-hidden flex-shrink-0">
                            {pro.photoUrl ? (
                              <img src={pro.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9a9a9f] font-bold">
                                {pro.firstName[0]}{pro.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{pro.firstName} {pro.lastName}</p>
                            <p className="text-xs text-[#9a9a9f] flex items-center gap-1 mt-0.5">
                              <Mail size={12} />
                              {pro.email}
                            </p>
                            {pro.phone && (
                              <p className="text-xs text-[#9a9a9f] flex items-center gap-1 mt-0.5">
                                <span className="w-3 h-3 flex items-center justify-center">📞</span>
                                {pro.phone}
                              </p>
                            )}
                            <p className="text-[10px] text-[#4ade80] font-bold uppercase tracking-wider mt-1">{pro.jobTitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <Building2 size={14} className="text-[#60a5fa]" />
                            {getCompanyName(pro.companyId, pro.companyName)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#9a9a9f]">
                            <FileText size={14} />
                            SIRET: {pro.companyId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {pro.siretDocUrl ? (
                          <a 
                            href={pro.siretDocUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-xs font-bold text-[#60a5fa] hover:bg-[#60a5fa] hover:text-white transition-all"
                          >
                            <ExternalLink size={14} />
                            Voir le document
                          </a>
                        ) : (
                          <span className="text-xs text-red-400 italic">Aucun document</span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {!showRejectionInput[pro.id] ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(pro)}
                                className="px-3 py-2 bg-[#2e2e34] hover:bg-[#3f3f46] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                title="Fiche Renseignement"
                              >
                                <FileText size={14} />
                                Fiche Pro
                              </button>
                              <button
                                onClick={() => setShowRejectionInput({ ...showRejectionInput, [pro.id]: true })}
                                disabled={actionLoading === pro.id}
                                className="p-2 text-[#f87171] hover:bg-[#f87171]/10 rounded-lg transition-colors"
                                title="Rejeter"
                              >
                                <X size={20} />
                              </button>
                              <button
                                onClick={() => handleValidate(pro.id)}
                                disabled={actionLoading === pro.id}
                                className="px-4 py-2 bg-[#4ade80] text-black font-bold rounded-lg hover:bg-[#22c55e] transition-all flex items-center gap-2 disabled:opacity-50"
                              >
                                {actionLoading === pro.id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                Valider
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 w-full max-w-[250px] animate-in slide-in-from-right-4">
                              <div className="relative">
                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={14} />
                                <input
                                  type="text"
                                  value={rejectionReason[pro.id] || ""}
                                  onChange={(e) => setRejectionReason({ ...rejectionReason, [pro.id]: e.target.value })}
                                  placeholder="Motif du rejet..."
                                  className="w-full bg-[#111113] border border-[#f87171]/50 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f87171]"
                                  autoFocus
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setShowRejectionInput({ ...showRejectionInput, [pro.id]: false })}
                                  className="text-xs font-bold text-[#9a9a9f] hover:text-white"
                                >
                                  Annuler
                                </button>
                                <button
                                  onClick={() => handleReject(pro.id)}
                                  disabled={actionLoading === pro.id}
                                  className="px-3 py-1.5 bg-[#f87171] text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all flex items-center gap-1.5"
                                >
                                  {actionLoading === pro.id ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                                  Confirmer le rejet
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: FICHE COMPLÈTE PROFESSIONNEL */}
      {selectedProForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#111113] border border-[#2e2e34] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 text-left">
            
            {/* Header */}
            <div className="p-6 border-b border-[#2e2e34] bg-[#18181b] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center text-[#4ade80]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Fiche Renseignement de Professionnel</h3>
                  <p className="text-xs text-[#9a9a9f]">Compléter les documents, lier ou créer l'entreprise et valider</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProForEdit(null)}
                className="p-2 text-[#9a9a9f] hover:text-white bg-[#1e1e22] border border-[#2e2e34] rounded-xl hover:bg-red-500/10 hover:border-red-500/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* COLONNE GAUCHE: COORDONNÉES ET DETAILS PERSO */}
              <div className="space-y-6">
                <div className="p-4 bg-[#18181b] rounded-2xl border border-[#2e2e34]">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 text-[#4ade80]">1. Coordonnées & Profil</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Prénom</label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Nom</label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Email professionnel</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Numéro de Téléphone</label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Ex: 0612345678"
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Poste / Rôle</label>
                      <input
                        type="text"
                        value={editForm.jobTitle}
                        onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                        placeholder="Ex: CEO, Gérant, Développeur..."
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Statut de validation</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all cursor-pointer font-bold"
                      >
                        <option value="pending_validation">📁 En attente de validation</option>
                        <option value="active">✅ Actif / Validé</option>
                        <option value="rejected">❌ Rejeté</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* PIÈCES ENREGISTRÉES */}
                <div className="p-4 bg-[#18181b] rounded-2xl border border-[#2e2e34]">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 text-[#4ade80]">2. Pièces Justificatives (KBIS / SIRET)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Lien / URL du document KBIS</label>
                      <input
                        type="text"
                        value={editForm.siretDocUrl}
                        onChange={(e) => setEditForm({ ...editForm, siretDocUrl: e.target.value })}
                        placeholder="Aucun document justificatif fourni"
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all font-mono text-xs mb-2"
                      />
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, siretDocUrl: "https://firebasestorage.googleapis.com/v0/b/safecallr-app.appspot.com/o/siret_docs%2Fkbis_officiel_exemple.pdf?alt=media" })}
                          className="px-3 py-1 bg-[#4ade80]/15 hover:bg-[#4ade80]/25 text-[#4ade80] border border-[#4ade80]/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          🪄 Remplir avec un KBIS fictif
                        </button>
                        {editForm.siretDocUrl && (
                          <a
                            href={editForm.siretDocUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-[#60a5fa]/10 hover:bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          >
                            Consulter le document actuel
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLONNE DROITE: CORRESPONDANCE ENTREPRISE */}
              <div className="space-y-6">
                <div className="p-4 bg-[#18181b] rounded-2xl border border-[#2e2e34] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider text-[#60a5fa]">3. Liaison Entreprise</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#60a5fa]/10 text-[#60a5fa]">SIRET : {editForm.companyId || "Non défini"}</span>
                  </div>

                  {/* Diagnostic de l'entreprise */}
                  <div className="p-4 rounded-xl border bg-[#111113] border-[#2e2e34]">
                    <div className="text-xs text-[#9a9a9f] font-medium">Entreprise correspondante :</div>
                    <div className="text-base font-bold text-white mt-1 flex items-center gap-2">
                      <Building2 size={16} className="text-[#60a5fa]" />
                      {getCompanyName(editForm.companyId)}
                    </div>
                    
                    {!companies.some(c => c.id === editForm.companyId) ? (
                      <div className="mt-3 p-3 bg-red-400/10 border border-red-400/20 text-red-400 rounded-lg text-xs font-medium space-y-1">
                        <p className="font-bold">⚠️ Entreprise absente de la base !</p>
                        <p>Le compte professionnel utilise le SIRET <code className="font-mono bg-[#18181b] px-1 py-0.5 rounded text-[10px]">{editForm.companyId || "aucun"}</code> mais aucun dossier entreprise n'a été créé pour l'instant.</p>
                      </div>
                    ) : (
                      <div className="mt-3 p-2.5 bg-green-500/15 border border-green-500/20 text-[#4ade80] rounded-lg text-xs font-medium">
                        <span>✅</span> L'entreprise est correctement enregistrée et validée dans la base.
                      </div>
                    )}
                  </div>

                  {/* Mode de choix */}
                  <div className="flex bg-[#111113] p-1 rounded-xl border border-[#2e2e34]">
                    <button
                      type="button"
                      onClick={() => setLinkMode("new")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${linkMode === "new" ? "bg-[#2563eb] text-white" : "text-[#9a9a9f] hover:text-white"}`}
                    >
                      🏭 Créer l'entreprise (Ulrich...)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkMode("existing")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${linkMode === "existing" ? "bg-[#2563eb] text-white" : "text-[#9a9a9f] hover:text-white"}`}
                    >
                      🔗 Lier à une existante
                    </button>
                  </div>

                  {linkMode === "new" ? (
                    /* CREATION DE COMPAGNIE */
                    <div className="space-y-4 border-t border-[#2e2e34] pt-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Nom de l'entreprise à créer</label>
                        <input
                          type="text"
                          value={companyCreation.name}
                          onChange={(e) => setCompanyCreation({ ...companyCreation, name: e.target.value })}
                          placeholder="Nom légal (ex: Ulrich Services)"
                          className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">SIRET de l'entreprise</label>
                          <input
                            type="text"
                            value={companyCreation.siret}
                            onChange={(e) => setCompanyCreation({ ...companyCreation, siret: e.target.value })}
                            placeholder="14 chiffres"
                            className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Nom de domaine</label>
                          <input
                            type="text"
                            value={companyCreation.domain}
                            onChange={(e) => setCompanyCreation({ ...companyCreation, domain: e.target.value })}
                            placeholder="url.com"
                            className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateAndLinkCompany}
                        disabled={isSavingDetails}
                        className="w-full py-2.5 bg-[#2563eb] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                      >
                        {isSavingDetails ? <Loader2 className="animate-spin" size={14} /> : <span>⚙️</span>}
                        Créer l'entreprise & Lier ce Pro
                      </button>
                    </div>
                  ) : (
                    /* ASSOCIER EXISTANT */
                    <div className="space-y-4 border-t border-[#2e2e34] pt-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs text-[#9a9a9f] font-medium mb-1.5">Sélectionner une entreprise existante</label>
                        <select
                          value={editForm.companyId}
                          onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
                          className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-sm text-[#e4e4e8] outline-none focus:border-[#4ade80] transition-all cursor-pointer font-bold"
                        >
                          <option value="">-- Choisir --</option>
                          {companies.map((comp) => (
                            <option key={comp.id} value={comp.id}>
                              🏢 {comp.name} (SIRET : {comp.id})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-xs text-[#9a9a9f] italic">
                        <span>💡</span> Cela modifiera la liaison SIRET du professionnel pour correspondre d'office à l'entreprise choisie.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#2e2e34] bg-[#18181b] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9a9a9f]">Etat d'avancement:</span>
                {editForm.status !== "active" && (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSavingDetails(true);
                      try {
                        const proRef = doc(db, "pros", selectedProForEdit.id);
                        await updateDoc(proRef, {
                          firstName: editForm.firstName.trim(),
                          lastName: editForm.lastName.trim(),
                          email: editForm.email.trim(),
                          phone: editForm.phone.trim(),
                          jobTitle: editForm.jobTitle.trim(),
                          companyId: editForm.companyId.trim(),
                          siretDocUrl: editForm.siretDocUrl.trim(),
                          status: "active",
                          verified: true,
                          updatedAt: serverTimestamp()
                        });
                        await handleValidate(selectedProForEdit.id);
                        alert("Le professionnel a été validé et notifié par email avec succès !");
                        setSelectedProForEdit(null);
                      } catch (err: any) {
                        alert(`Erreur lors de la validation: ${err.message}`);
                      } finally {
                        setIsSavingDetails(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#4ade80] text-black text-xs font-bold rounded-xl hover:bg-[#22c55e] transition-all flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    Valider et Activer le Pro
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProForEdit(null)}
                  className="px-4 py-2 bg-transparent text-[#9a9a9f] hover:text-white hover:bg-[#2e2e34]/50 border border-[#2e2e34] rounded-xl text-xs font-bold transition-all"
                >
                  Annuler / Fermer
                </button>
                <button
                  type="button"
                  onClick={handleSaveProDetails}
                  disabled={isSavingDetails}
                  className="px-5 py-2 bg-[#2563eb] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isSavingDetails ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
