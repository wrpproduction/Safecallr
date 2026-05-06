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
  getDoc
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
  const [pendingPros, setPendingPros] = useState<Pro[]>([]);
  const [searchResults, setSearchResults] = useState<Pro[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [totalProsCount, setTotalProsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [showRejectionInput, setShowRejectionInput] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Debug: Get total pros count
    const totalQ = query(collection(db, "pros"));
    getDocs(totalQ).then(snap => setTotalProsCount(snap.size)).catch(err => handleFirestoreError(err, OperationType.LIST, "pros"));

    const q = query(
      collection(db, "pros"), 
      where("status", "==", "pending_validation")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
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
            console.error("Error fetching company:", err);
          }
        }
        prosData.push({ ...data, id: docSnap.id, companyName });
      }
      
      setPendingPros(prosData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching pros:", err);
      handleFirestoreError(err, OperationType.LIST, "pros");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Pros</h1>
            <p className="text-[#9a9a9f] mt-1">
              Validation des nouveaux comptes professionnels ({pendingPros.length} en attente
              {totalProsCount !== null && ` / ${totalProsCount} au total`})
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full md:w-80">
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
              Réinitialiser un compte
            </button>
            <div className="px-4 py-2 bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 rounded-lg text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={18} />
              {pendingPros.length} Demandes en attente
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
                        <div className="text-sm font-bold text-white">{pro.companyName}</div>
                        <div className="text-xs text-[#9a9a9f]">SIRET: {pro.companyId}</div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
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
              Demandes en attente de validation
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
              <p className="text-[#9a9a9f] font-medium">Aucune demande en attente. Beau travail !</p>
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
                            {pro.companyName}
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
    </AdminLayout>
  );
}
