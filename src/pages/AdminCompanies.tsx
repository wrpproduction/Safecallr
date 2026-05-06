import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  User,
  FileText,
  Mail,
  Phone,
  Calendar,
  X
} from "lucide-react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  doc, 
  where,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "../firebase";
import AdminLayout from "../components/AdminLayout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

const PAGE_SIZE = 20;

type CompanyStatus = "pending" | "verified" | "rejected";

interface Company {
  id: string;
  name: string;
  domain: string;
  siret: string;
  status: CompanyStatus;
  createdAt: string;
  category?: string;
}

interface Pro {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  status: string;
  siretDocUrl?: string;
  createdAt: string;
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Details State
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyPros, setCompanyPros] = useState<Pro[]>([]);
  const [prosLoading, setProsLoading] = useState(false);
  
  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
    action: "verify" | "reject" | "delete";
  }>({
    isOpen: false,
    companyId: "",
    companyName: "",
    action: "verify"
  });
  
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchCompanies = async (pageNumber = 1) => {
    setLoading(true);
    setFeedback(null);
    try {
      let q = query(
        collection(db, "companies"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (statusFilter !== "all") {
        q = query(q, where("status", "==", statusFilter));
      }

      if (pageNumber > 1 && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const fetchedCompanies = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt = data.createdAt;
        
        // Convert Firebase Timestamp or string to Date object
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate();
        } else if (createdAt) {
          const date = new Date(createdAt);
          createdAt = isNaN(date.getTime()) ? null : date;
        } else {
          createdAt = null;
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt
        };
      }) as Company[];

      setCompanies(fetchedCompanies);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching companies:", error);
      handleFirestoreError(error, OperationType.LIST, "companies");
      setFeedback({ type: "error", message: "Erreur lors du chargement des entreprises." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setLastDoc(null);
    fetchCompanies(1);
  }, [statusFilter]);

  const handleAction = async () => {
    if (!confirmDialog.companyId) return;
    
    setActionLoading(true);
    setFeedback(null);
    
    try {
      if (confirmDialog.action === "delete") {
        // 1. Fetch pros to delete them as well (optional but recommended based on dialog text)
        const prosQuery = query(collection(db, "pros"), where("companyId", "==", confirmDialog.companyId));
        const prosSnapshot = await getDocs(prosQuery);
        
        // Delete each pro
        const deleteProsPromises = prosSnapshot.docs.map(proDoc => deleteDoc(doc(db, "pros", proDoc.id)));
        await Promise.all(deleteProsPromises);

        // 2. Delete the company
        await deleteDoc(doc(db, "companies", confirmDialog.companyId));
        
        setCompanies(prev => prev.filter(c => c.id !== confirmDialog.companyId));
        if (selectedCompany?.id === confirmDialog.companyId) {
          setSelectedCompany(null);
        }
        setFeedback({ type: "success", message: "L'entreprise et ses données associées ont été supprimées." });
      } else {
        const newStatus: CompanyStatus = confirmDialog.action === "verify" ? "verified" : "rejected";
        await updateDoc(doc(db, "companies", confirmDialog.companyId), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
        
        setCompanies(prev => prev.map(c => 
          c.id === confirmDialog.companyId ? { ...c, status: newStatus } : c
        ));
        setFeedback({ 
          type: "success", 
          message: `L'entreprise a été ${confirmDialog.action === "verify" ? "validée" : "rejetée"} avec succès.` 
        });
      }
      
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    } catch (error) {
      console.error("Error performing company action:", error);
      setFeedback({ 
        type: "error", 
        message: "Une erreur est survenue lors de l'opération. Vérifiez vos permissions." 
      });
    } finally {
      setActionLoading(false);
      // Clear feedback after 5 seconds
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const fetchCompanyPros = async (companyId: string) => {
    setProsLoading(true);
    try {
      const q = query(
        collection(db, "pros"),
        where("companyId", "==", companyId)
      );
      const snapshot = await getDocs(q);
      const fetchedPros = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt = data.createdAt;
        
        // Convert Firebase Timestamp or string to Date object
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate();
        } else if (createdAt) {
          const date = new Date(createdAt);
          createdAt = isNaN(date.getTime()) ? null : date;
        } else {
          createdAt = null;
        }

        return {
          id: doc.id,
          ...data,
          createdAt
        };
      }) as Pro[];
      setCompanyPros(fetchedPros);
    } catch (error) {
      console.error("Error fetching company pros:", error);
    } finally {
      setProsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyPros(selectedCompany.id);
    } else {
      setCompanyPros([]);
    }
  }, [selectedCompany]);

  const filteredCompanies = companies.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(searchLower) ||
      company.domain.toLowerCase().includes(searchLower) ||
      company.siret.includes(searchLower)
    );
  });

  const pendingCount = companies.filter(c => c.status === "pending").length;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Entreprises</h1>
              {pendingCount > 0 && (
                <span className="bg-[#fbbf24] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                  {pendingCount} en attente
                </span>
              )}
            </div>
            <p className="text-[#9a9a9f] mt-1">Validez les entreprises partenaires SafeCallr</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className={`p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${
            feedback.type === "success" 
              ? "bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]" 
              : "bg-[#f87171]/10 border-[#f87171]/20 text-[#f87171]"
          }`}>
            <div className="flex items-center gap-3">
              {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <p className="text-sm font-medium">{feedback.message}</p>
              <button onClick={() => setFeedback(null)} className="ml-auto hover:opacity-70">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f] group-focus-within:text-[#4ade80] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, domaine ou SIRET..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-xl py-3 pl-12 pr-4 text-[#e4e4e8] focus:outline-none focus:border-[#4ade80] transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-xl py-3 pl-12 pr-4 text-[#e4e4e8] appearance-none focus:outline-none focus:border-[#4ade80] transition-all cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="verified">Validées</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111113] border-bottom border-[#2e2e34]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Entreprise</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Domaine / SIRET</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Date Ajout</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e34]">
                {loading && companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
                        <p className="text-[#9a9a9f]">Chargement des entreprises...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-[#9a9a9f]">
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company, idx) => (
                    <tr 
                      key={company.id} 
                      className={`${idx % 2 === 0 ? "bg-[#1a1a1e]" : "bg-[#1e1e22]"} hover:bg-[#252529] transition-colors group cursor-pointer`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#2e2e34] flex items-center justify-center text-[#60a5fa] font-bold">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-[#e4e4e8]">{company.name}</p>
                            <p className="text-xs text-[#9a9a9f]">ID: {company.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-[#e4e4e8]">{company.domain}</p>
                          <p className="text-xs text-[#9a9a9f]">SIRET: {company.siret}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          company.status === "pending" 
                            ? "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20" 
                            : company.status === "verified"
                            ? "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20"
                            : "bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20"
                        }`}>
                          {company.status === "pending" ? "En attente" : company.status === "verified" ? "Validée" : "Rejetée"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#9a9a9f]">
                        {company.createdAt instanceof Date && !isNaN(company.createdAt.getTime()) ? (
                          format(company.createdAt, "dd MMM yyyy", { locale: fr })
                        ) : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {company.status === "pending" && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDialog({
                                    isOpen: true,
                                    companyId: company.id,
                                    companyName: company.name,
                                    action: "verify"
                                  });
                                }}
                                className="p-2 bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 rounded-lg transition-colors border border-[#4ade80]/20"
                                title="Valider"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDialog({
                                    isOpen: true,
                                    companyId: company.id,
                                    companyName: company.name,
                                    action: "reject"
                                  });
                                }}
                                className="p-2 bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20 rounded-lg transition-colors border border-[#f87171]/20"
                                title="Rejeter"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setSelectedCompany(company)}
                            className="p-2 bg-[#111113] text-[#9a9a9f] hover:text-white rounded-lg border border-[#2e2e34] transition-colors"
                            title="Voir détails"
                          >
                            <ExternalLink size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDialog({
                                isOpen: true,
                                companyId: company.id,
                                companyName: company.name,
                                action: "delete"
                              });
                            }}
                            className="p-2 bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20 rounded-lg transition-colors border border-[#f87171]/20"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-[#111113] border-t border-[#2e2e34] flex items-center justify-between">
            <p className="text-xs text-[#9a9a9f]">
              Affichage de <span className="text-white font-bold">{filteredCompanies.length}</span> entreprises
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1 || loading}
                onClick={() => {
                  setPage(1);
                  setLastDoc(null);
                  fetchCompanies(1);
                }}
                className="p-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-[#9a9a9f] hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold px-4">Page {page}</span>
              <button 
                disabled={!hasMore || loading}
                onClick={() => {
                  setPage(p => p + 1);
                  fetchCompanies(page + 1);
                }}
                className="p-2 bg-[#1e1e22] border border-[#2e2e34] rounded-xl text-[#9a9a9f] hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#1e1e22] border border-[#2e2e34] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
              confirmDialog.action === "verify" ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-[#f87171]/10 text-[#f87171]"
            }`}>
              {confirmDialog.action === "verify" ? <CheckCircle2 size={32} /> : confirmDialog.action === "reject" ? <AlertTriangle size={32} /> : <Trash2 size={32} />}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {confirmDialog.action === "verify" ? "Valider l'entreprise ?" : confirmDialog.action === "reject" ? "Rejeter l'entreprise ?" : "Supprimer l'entreprise ?"}
            </h2>
            <p className="text-[#9a9a9f] mb-8 leading-relaxed">
              {confirmDialog.action === "delete" ? (
                <>Êtes-vous sûr de vouloir supprimer l'entreprise <span className="text-white font-bold">"{confirmDialog.companyName}"</span> ? Cette action est irréversible et supprimera toutes les données associées.</>
              ) : (
                <>Êtes-vous sûr de vouloir {confirmDialog.action === "verify" ? "valider" : "rejeter"} l'entreprise <span className="text-white font-bold">"{confirmDialog.companyName}"</span> ? Cette action modifiera son statut et sera visible par tous les professionnels associés.</>
              )}
            </p>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="flex-1 px-6 py-3.5 bg-[#111113] border border-[#2e2e34] rounded-xl font-bold text-[#9a9a9f] hover:text-white hover:border-[#9a9a9f] transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-black transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                  confirmDialog.action === "verify" ? "bg-[#4ade80] hover:bg-[#22c55e]" : "bg-[#f87171] hover:bg-[#ef4444]"
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  confirmDialog.action === "verify" ? "Confirmer" : confirmDialog.action === "reject" ? "Rejeter" : "Supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-[#2e2e34]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#111113] border border-[#2e2e34] flex items-center justify-center text-[#60a5fa]">
                  <Building2 size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">{selectedCompany.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedCompany.status === "pending" 
                        ? "bg-[#fbbf24]/10 text-[#fbbf24]" 
                        : selectedCompany.status === "verified"
                        ? "bg-[#4ade80]/10 text-[#4ade80]"
                        : "bg-[#f87171]/10 text-[#f87171]"
                    }`}>
                      {selectedCompany.status === "pending" ? "En attente" : selectedCompany.status === "verified" ? "Validée" : "Rejetée"}
                    </span>
                    <span className="text-xs text-[#9a9a9f]">SIRET: {selectedCompany.siret}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="p-3 bg-[#111113] border border-[#2e2e34] rounded-2xl text-[#9a9a9f] hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8">
              {/* Company Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111113] p-6 rounded-2xl border border-[#2e2e34]">
                  <p className="text-[10px] font-bold text-[#9a9a9f] uppercase tracking-widest mb-2">Domaine</p>
                  <p className="text-lg font-bold text-white">{selectedCompany.domain}</p>
                </div>
                <div className="bg-[#111113] p-6 rounded-2xl border border-[#2e2e34]">
                  <p className="text-[10px] font-bold text-[#9a9a9f] uppercase tracking-widest mb-2">Catégorie</p>
                  <p className="text-lg font-bold text-white capitalize">{selectedCompany.category || "Non spécifiée"}</p>
                </div>
                <div className="bg-[#111113] p-6 rounded-2xl border border-[#2e2e34]">
                  <p className="text-[10px] font-bold text-[#9a9a9f] uppercase tracking-widest mb-2">Date d'inscription</p>
                  <p className="text-lg font-bold text-white">
                    {selectedCompany.createdAt instanceof Date && !isNaN(selectedCompany.createdAt.getTime()) 
                      ? format(selectedCompany.createdAt, "dd MMMM yyyy", { locale: fr }) 
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Pros Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="text-[#4ade80]" size={20} />
                    Professionnels associés
                  </h3>
                  <span className="text-xs font-bold text-[#9a9a9f] uppercase tracking-widest">
                    {companyPros.length} membre{companyPros.length > 1 ? 's' : ''}
                  </span>
                </div>

                {prosLoading ? (
                  <div className="flex items-center justify-center py-12 bg-[#111113] rounded-2xl border border-[#2e2e34]">
                    <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
                  </div>
                ) : companyPros.length === 0 ? (
                  <div className="text-center py-12 bg-[#111113] rounded-2xl border border-[#2e2e34]">
                    <p className="text-[#9a9a9f]">Aucun professionnel associé à cette entreprise.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companyPros.map(pro => (
                      <div key={pro.id} className="bg-[#111113] p-6 rounded-2xl border border-[#2e2e34] hover:border-[#4ade80]/30 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#1e1e22] border border-[#2e2e34] flex items-center justify-center text-[#4ade80]">
                              <User size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-white">{pro.firstName} {pro.lastName}</p>
                              <p className="text-xs text-[#9a9a9f]">{pro.jobTitle}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            pro.status === 'active' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-[#fbbf24]/10 text-[#fbbf24]'
                          }`}>
                            {pro.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-xs text-[#9a9a9f]">
                            <Mail size={14} />
                            {pro.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#9a9a9f]">
                            <Phone size={14} />
                            {pro.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#9a9a9f]">
                            <Calendar size={14} />
                            Inscrit le {pro.createdAt instanceof Date && !isNaN(pro.createdAt.getTime()) 
                              ? format(pro.createdAt, "dd/MM/yyyy") 
                              : "N/A"}
                          </div>
                        </div>

                        {pro.siretDocUrl && (
                          <a 
                            href={pro.siretDocUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1e1e22] border border-[#2e2e34] rounded-xl text-xs font-bold text-white hover:bg-[#4ade80] hover:text-black transition-all"
                          >
                            <FileText size={16} />
                            Voir le justificatif SIRET
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-[#111113] border-t border-[#2e2e34] rounded-b-[32px] flex items-center justify-between">
              <button 
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    companyId: selectedCompany.id,
                    companyName: selectedCompany.name,
                    action: "delete"
                  });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171] hover:text-white rounded-xl font-bold transition-all"
              >
                <Trash2 size={18} />
                Supprimer l'entreprise
              </button>
              
              <div className="flex items-center gap-4">
                {selectedCompany.status === "pending" && (
                  <>
                    <button 
                      onClick={() => setConfirmDialog({
                        isOpen: true,
                        companyId: selectedCompany.id,
                        companyName: selectedCompany.name,
                        action: "reject"
                      })}
                      className="px-6 py-3 bg-[#1e1e22] border border-[#2e2e34] rounded-xl font-bold text-[#f87171] hover:bg-[#f87171] hover:text-white transition-all"
                    >
                      Rejeter
                    </button>
                    <button 
                      onClick={() => setConfirmDialog({
                        isOpen: true,
                        companyId: selectedCompany.id,
                        companyName: selectedCompany.name,
                        action: "verify"
                      })}
                      className="px-8 py-3 bg-[#4ade80] text-black rounded-xl font-bold hover:bg-[#22c55e] transition-all"
                    >
                      Valider l'entreprise
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
