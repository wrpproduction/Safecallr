import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserX, 
  UserCheck, 
  CheckCircle,
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Loader2,
  Trash2,
  AlertTriangle
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

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchUsers = async (pageNumber = 1) => {
    if (pageNumber === 1) setRefreshing(true);
    setLoading(true);
    try {
      // Get total count once
      if (pageNumber === 1 && statusFilter === "all") {
        try {
          const totalSnap = await getDocs(collection(db, "users"));
          setTotalCount(totalSnap.size);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "users");
        }
      }

      let q = query(
        collection(db, "users"),
        limit(PAGE_SIZE)
      );

      if (statusFilter !== "all") {
        q = query(q, where("status", "==", statusFilter));
      }

      // Pour une pagination réelle avec Firestore sans offset, on utilise les curseurs
      // Si on n'est pas à la page 1, on aurait besoin du dernier doc de la page précédente
      // Pour simplifier ici, on va garder une navigation séquentielle
      if (pageNumber > 1 && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const fetchedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convertir le timestamp Firestore en Date si nécessaire
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate();
        } else if (createdAt) {
          createdAt = new Date(createdAt);
        }

        return {
          id: doc.id,
          ...data,
          createdAt
        };
      });

      setUsers(fetchedUsers);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      handleFirestoreError(error, OperationType.LIST, "users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setLastDoc(null);
    fetchUsers(1);
  }, [statusFilter]);

  const handleNextPage = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(1);
      setLastDoc(null);
      fetchUsers(1);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    setActionLoading(userId);
    setFeedback(null);
    try {
      await updateDoc(doc(db, "users", userId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
      setFeedback({ type: "success", message: `Statut de l'utilisateur mis à jour : ${newStatus === "active" ? "Actif" : "Suspendu"}` });
    } catch (error) {
      console.error("Error updating user status:", error);
      setFeedback({ type: "error", message: "Erreur lors de la mise à jour du statut." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    setFeedback(null);
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeleteConfirmId(null);
      if (selectedUser?.id === userId) setSelectedUser(null);
      if (totalCount !== null) setTotalCount(totalCount - 1);
      setFeedback({ type: "success", message: "Utilisateur supprimé avec succès." });
    } catch (error) {
      console.error("Error deleting user:", error);
      setFeedback({ type: "error", message: "Erreur lors de la suppression de l'utilisateur." });
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchUserDetails = async (user: any) => {
    setLoadingDetails(true);
    setSelectedUser(user);
    setUserDetails(null);
    try {
      // Fetch stats
      const [requestsSent, requestsReceived, authRequests, connections, contacts] = await Promise.all([
        getDocs(query(collection(db, "verification_requests"), where("requesterId", "==", user.id))),
        getDocs(query(collection(db, "verification_requests"), where("targetId", "==", user.id))),
        getDocs(query(collection(db, "authRequests"), where("toUserId", "==", user.id))),
        getDocs(query(collection(db, "proClientConnections"), where("userId", "==", user.id))),
        getDocs(query(collection(db, "personalContacts"), where("ownerId", "==", user.id)))
      ]);

      setUserDetails({
        requestsSent: requestsSent.size,
        requestsReceived: requestsReceived.size,
        authRequests: authRequests.size,
        connections: connections.size,
        contacts: contacts.size
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.firstName || ""} ${user.lastName || ""} ${user.displayName || ""}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (user.email || "").toLowerCase().includes(searchLower) ||
      (user.phone || user.phoneNumber || "").includes(searchLower)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
            <p className="text-[#9a9a9f] mt-1">
              Gérez les membres de la plateforme SafeCallr 
              {totalCount !== null && ` (${totalCount} au total)`}
            </p>
          </div>
          <button 
            onClick={() => fetchUsers(1)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e1e22] border border-[#2e2e34] rounded-xl text-[#e4e4e8] hover:bg-[#2e2e34] transition-all disabled:opacity-50"
          >
            <Loader2 className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            feedback.type === "success" ? "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20" : "bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20"
          }`}>
            {feedback.type === "success" ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <p className="text-sm font-medium">{feedback.message}</p>
            <button onClick={() => setFeedback(null)} className="ml-auto text-current opacity-50 hover:opacity-100">
              <MoreVertical size={16} className="rotate-90" />
            </button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f] group-focus-within:text-[#4ade80] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
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
              <option value="active">Actifs</option>
              <option value="suspended">Suspendus</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111113] border-bottom border-[#2e2e34]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Utilisateur</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Inscription</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e34]">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
                        <p className="text-[#9a9a9f]">Chargement des utilisateurs...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-[#9a9a9f]">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr 
                      key={user.id} 
                      className={`${idx % 2 === 0 ? "bg-[#1a1a1e]" : "bg-[#1e1e22]"} hover:bg-[#252529] transition-colors group cursor-pointer`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#111113] border border-[#2e2e34] flex items-center justify-center text-[#4ade80] font-bold overflow-hidden">
                            {user.photoUrl ? (
                              <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (user.firstName?.[0] || user.displayName?.[0] || "?").toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#e4e4e8]">{user.firstName} {user.lastName || user.displayName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-[#9a9a9f]">ID: {user.id.substring(0, 8)}...</p>
                              {(user.sensitiveUpdateCount >= 3) && (
                                <span className="flex items-center gap-1 text-[10px] bg-error/10 text-error border border-error/20 px-2 py-0.5 rounded-full font-black animate-pulse">
                                  <AlertTriangle size={10} /> SUSPECT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-[#e4e4e8]">{user.email}</p>
                          <p className="text-xs text-[#9a9a9f]">{user.phone || user.phoneNumber || "N/A"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.status === "suspended" 
                            ? "bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20" 
                            : "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20"
                        }`}>
                          {user.status === "suspended" ? "Suspendu" : "Actif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#9a9a9f]">
                        {user.createdAt ? (
                          format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })
                        ) : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(user.id, user.status);
                            }}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === "suspended"
                                ? "bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20"
                                : "bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20"
                            }`}
                            title={user.status === "suspended" ? "Réactiver" : "Suspendre"}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.status === "suspended" ? (
                              <UserCheck size={18} />
                            ) : (
                              <UserX size={18} />
                            )}
                          </button>
                          {!user.emailVerified && (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActionLoading(user.id);
                                try {
                                  await updateDoc(doc(db, "users", user.id), {
                                    emailVerified: true
                                  });
                                  setUsers(prev => prev.map(u => u.id === user.id ? { ...u, emailVerified: true } : u));
                                } catch (err) {
                                  console.error("Error verifying user:", err);
                                } finally {
                                  setActionLoading(null);
                                }
                              }}
                              disabled={actionLoading === user.id}
                              className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors"
                              title="Vérifier l'email manuellement"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(user.id);
                            }}
                            className="p-2 bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchUserDetails(user);
                            }}
                            className="p-2 bg-[#111113] text-[#9a9a9f] hover:text-white rounded-lg border border-[#2e2e34] transition-colors"
                            title="Voir détails"
                          >
                            <ExternalLink size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="p-6 border-b border-[#2e2e34] flex items-center justify-between bg-[#111113]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1e1e22] border border-[#2e2e34] flex items-center justify-center text-[#4ade80] font-bold text-xl overflow-hidden">
                      {selectedUser.photoUrl ? (
                        <img src={selectedUser.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (selectedUser.firstName?.[0] || selectedUser.displayName?.[0] || "?").toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedUser.firstName} {selectedUser.lastName || selectedUser.displayName}</h2>
                      <p className="text-sm text-[#9a9a9f]">ID: {selectedUser.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-[#2e2e34] rounded-xl transition-colors text-[#9a9a9f] hover:text-white"
                  >
                    <ChevronLeft className="rotate-180" size={24} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-[#9a9a9f] uppercase tracking-widest">Informations de contact</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[#e4e4e8]">
                          <div className="w-8 h-8 rounded-lg bg-[#111113] flex items-center justify-center text-[#9a9a9f]">
                            <Filter size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] text-[#9a9a9f] uppercase">Email</p>
                            <p className="text-sm">{selectedUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[#e4e4e8]">
                          <div className="w-8 h-8 rounded-lg bg-[#111113] flex items-center justify-center text-[#9a9a9f]">
                            <Filter size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] text-[#9a9a9f] uppercase">Téléphone</p>
                            <p className="text-sm">{selectedUser.phone || selectedUser.phoneNumber || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-[#9a9a9f] uppercase tracking-widest">Statut du compte</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            selectedUser.status === "suspended" 
                              ? "bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20" 
                              : "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20"
                          }`}>
                            {selectedUser.status === "suspended" ? "Suspendu" : "Actif"}
                          </div>
                          {selectedUser.emailVerified && (
                            <div className="bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle size={10} />
                              Email Vérifié
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#9a9a9f]">
                          Inscrit le : {selectedUser.createdAt ? format(new Date(selectedUser.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr }) : "N/A"}
                        </p>
                        {selectedUser.sensitiveUpdateCount > 0 && (
                          <div className={`p-3 rounded-xl border ${selectedUser.sensitiveUpdateCount >= 3 ? "bg-error/10 border-error/20 text-error" : "bg-warning/10 border-warning/20 text-warning"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle size={14} />
                              <p className="text-[10px] font-black uppercase tracking-widest">Activité sensible</p>
                            </div>
                            <p className="text-xs font-bold">{selectedUser.sensitiveUpdateCount} changements de coordonnées</p>
                            {selectedUser.lastSensitiveUpdate && (
                              <p className="text-[10px] opacity-70">
                                Dernier: {format(selectedUser.lastSensitiveUpdate.toDate ? selectedUser.lastSensitiveUpdate.toDate() : new Date(selectedUser.lastSensitiveUpdate), "dd/MM/yyyy HH:mm")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-[#9a9a9f] uppercase tracking-widest">Activité sur la plateforme</h3>
                    {loadingDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
                      </div>
                    ) : userDetails ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-[#111113] border border-[#2e2e34] p-4 rounded-xl text-center">
                          <p className="text-2xl font-bold text-white">{userDetails.requestsSent}</p>
                          <p className="text-[10px] text-[#9a9a9f] uppercase mt-1">Demandes envoyées</p>
                        </div>
                        <div className="bg-[#111113] border border-[#2e2e34] p-4 rounded-xl text-center">
                          <p className="text-2xl font-bold text-white">{userDetails.requestsReceived}</p>
                          <p className="text-[10px] text-[#9a9a9f] uppercase mt-1">Demandes reçues</p>
                        </div>
                        <div className="bg-[#111113] border border-[#2e2e34] p-4 rounded-xl text-center">
                          <p className="text-2xl font-bold text-white">{userDetails.connections}</p>
                          <p className="text-[10px] text-[#9a9a9f] uppercase mt-1">Connexions Pro</p>
                        </div>
                        <div className="bg-[#111113] border border-[#2e2e34] p-4 rounded-xl text-center">
                          <p className="text-2xl font-bold text-white">{userDetails.contacts}</p>
                          <p className="text-[10px] text-[#9a9a9f] uppercase mt-1">Contacts perso</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#9a9a9f] italic">Impossible de charger les statistiques d'activité.</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-[#2e2e34] flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                      disabled={actionLoading === selectedUser.id}
                      className={`flex-1 min-w-[150px] px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        selectedUser.status === "suspended"
                          ? "bg-[#4ade80] text-[#111113] hover:bg-[#34d399]"
                          : "bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20 hover:bg-[#f87171]/20"
                      }`}
                    >
                      {actionLoading === selectedUser.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : selectedUser.status === "suspended" ? (
                        <>
                          <UserCheck size={18} />
                          Réactiver le compte
                        </>
                      ) : (
                        <>
                          <UserX size={18} />
                          Suspendre le compte
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        setDeleteConfirmId(selectedUser.id);
                      }}
                      className="flex-1 min-w-[150px] px-4 py-3 bg-[#f87171] text-white rounded-xl font-bold hover:bg-[#ef4444] transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#f87171]/10 flex items-center justify-center text-[#f87171]">
                    <AlertTriangle size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Confirmer la suppression</h3>
                    <p className="text-[#9a9a9f]">
                      Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera uniquement les données de la base de données (pas le compte d'authentification).
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 px-4 py-3 bg-[#111113] border border-[#2e2e34] rounded-xl text-[#e4e4e8] font-bold hover:bg-[#2e2e34] transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(deleteConfirmId)}
                    disabled={actionLoading === deleteConfirmId}
                    className="flex-1 px-4 py-3 bg-[#f87171] text-white rounded-xl font-bold hover:bg-[#ef4444] transition-all shadow-lg shadow-[#f87171]/20 flex items-center justify-center gap-2"
                  >
                    {actionLoading === deleteConfirmId ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Supprimer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 bg-[#111113] border-t border-[#2e2e34] flex items-center justify-between">
            <p className="text-xs text-[#9a9a9f]">
              Affichage de <span className="text-white font-bold">{filteredUsers.length}</span> utilisateurs
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1 || loading}
                onClick={handlePrevPage}
                className="p-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-[#9a9a9f] hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold px-4">Page {page}</span>
              <button 
                disabled={!hasMore || loading}
                onClick={handleNextPage}
                className="p-2 bg-[#1e1e22] border border-[#2e2e34] rounded-xl text-[#9a9a9f] hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
