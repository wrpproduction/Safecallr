import React, { useState, useEffect } from "react";
import { 
  Search, 
  User, 
  Phone, 
  ShieldCheck, 
  ChevronRight, 
  X, 
  History,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  UserPlus,
  CheckCircle2,
  Mail,
  Clock
} from "lucide-react";
import { db, auth } from "../../firebase";
import { handleFirestoreError, OperationType } from "../../lib/firestore-errors";
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ProClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form state for adding client
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const proId = auth.currentUser?.uid;
    if (!proId) return;

    setLoading(true);

    // On utilise onSnapshot pour plus de robustesse et de réactivité
    // On enlève le orderBy pour éviter les erreurs d'index ou d'assertion interne Firestore
    const qRequests = query(
      collection(db, "authRequests"),
      where("fromProId", "==", proId),
      where("status", "==", "validated")
    );

    const qConnections = query(
      collection(db, "proClientConnections"),
      where("proId", "==", proId)
    );

    let requestsData: any[] = [];
    let connectionsData: any[] = [];

    const updateClients = () => {
      const uniqueClientsMap = new Map();

      // Traiter les authRequests
      requestsData.forEach(data => {
        if (data.toUserId && !uniqueClientsMap.has(data.toUserId)) {
          uniqueClientsMap.set(data.toUserId, {
            id: data.toUserId,
            phone: data.toUserPhone,
            firstName: data.toUserName?.split(' ')[0] || "",
            lastName: data.toUserName?.split(' ').slice(1).join(' ') || "",
            lastVerification: data.createdAt,
            count: 1,
            status: 'connected'
          });
        } else if (data.toUserId) {
          const existing = uniqueClientsMap.get(data.toUserId);
          if (existing) existing.count += 1;
        }
      });

      // Traiter les connexions manuelles
      connectionsData.forEach(data => {
        const clientId = data.userId || `pending_${data.clientPhone}`;
        
        if (!uniqueClientsMap.has(clientId)) {
          uniqueClientsMap.set(clientId, {
            id: clientId,
            phone: data.clientPhone,
            firstName: data.clientFirstName,
            lastName: data.clientLastName,
            lastVerification: data.createdAt,
            count: 0,
            status: data.status,
            connectionId: data.id
          });
        } else if (data.status === 'connected') {
          const existing = uniqueClientsMap.get(clientId);
          if (existing) {
            existing.status = 'connected';
            existing.connectionId = data.id;
          }
        }
      });

      const clientList = Array.from(uniqueClientsMap.values());
      
      // Trier par date de création (décroissant)
      clientList.sort((a, b) => {
        const dateA = a.lastVerification?.seconds || 0;
        const dateB = b.lastVerification?.seconds || 0;
        return dateB - dateA;
      });

      setClients(clientList);
      setLoading(false);
      
      // Enrichir avec les données users de manière asynchrone
      clientList.forEach(async (c) => {
        if (!c.id || typeof c.id !== 'string' || c.id.startsWith('pending_')) return;
        try {
          const userDoc = await getDoc(doc(db, "users", c.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setClients(prev => prev.map(item => 
              item.id === c.id ? { ...item, ...userData } : item
            ));
          }
        } catch (e) {
          console.error("Error fetching user data for client", c.id, e);
        }
      });
    };

    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      requestsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      updateClients();
    }, (err) => {
      console.error("Requests snapshot error:", err);
      setLoading(false);
    });

    const unsubConnections = onSnapshot(qConnections, (snapshot) => {
      connectionsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      updateClients();
    }, (err) => {
      console.error("Connections snapshot error:", err);
      setLoading(false);
    });

    return () => {
      unsubRequests();
      unsubConnections();
    };
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const proId = auth.currentUser?.uid;
      if (!proId) return;

      // Récupérer les infos du pro pour la connexion
      const proSnap = await getDoc(doc(db, "pros", proId));
      if (!proSnap.exists()) {
        throw new Error("Votre profil professionnel n'a pas été trouvé. Veuillez vous reconnecter.");
      }
      const proData = proSnap.data();
      const companySnap = proData?.companyId ? await getDoc(doc(db, "companies", proData.companyId)) : null;
      const companyData = companySnap?.data();

      // Nettoyer le numéro (enlever espaces, tirets, etc.)
      const cleanPhone = newClient.phone.replace(/\s/g, "").replace(/-/g, "");

      // 1. Vérifier si le client existe déjà dans users (par téléphone ou email)
      const userQueryPhone = query(collection(db, "users"), where("phoneNumber", "==", cleanPhone));
      const userQueryEmail = query(collection(db, "users"), where("email", "==", newClient.email));
      
      const [userSnapPhone, userSnapEmail] = await Promise.all([
        getDocs(userQueryPhone),
        getDocs(userQueryEmail)
      ]);
      
      let userId = null;
      let status = "pending";

      if (!userSnapPhone.empty) {
        userId = userSnapPhone.docs[0].id;
      } else if (!userSnapEmail.empty) {
        userId = userSnapEmail.docs[0].id;
      }

      // 2. Créer la connexion
      await addDoc(collection(db, "proClientConnections"), {
        proId,
        proName: `${proData?.firstName} ${proData?.lastName}`,
        companyName: companyData?.name || "Entreprise",
        userId,
        clientPhone: cleanPhone,
        clientEmail: newClient.email,
        clientFirstName: newClient.firstName,
        clientLastName: newClient.lastName,
        status,
        createdAt: serverTimestamp()
      });

      // 3. Simuler l'envoi d'une invitation par email
      await addDoc(collection(db, "mail"), {
        to: newClient.email || "simulation@safecallr.app",
        message: {
          subject: "Invitation SafeCallr - Sécurisez vos échanges",
          text: `Bonjour ${newClient.firstName}, ${proData?.firstName} ${proData?.lastName} de ${companyData?.name || "son entreprise"} vous invite à rejoindre SafeCallr pour sécuriser vos échanges. Inscrivez-vous ici: https://safecallr.app/register?email=${newClient.email}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #4ade80;">Invitation SafeCallr</h2>
              <p>Bonjour ${newClient.firstName},</p>
              <p><strong>${proData?.firstName} ${proData?.lastName}</strong> de l'entreprise <strong>${companyData?.name || "son entreprise"}</strong> souhaite vous ajouter à sa base de clients certifiés.</p>
              <p>SafeCallr vous permet de vérifier l'identité de vos interlocuteurs et de sécuriser vos échanges professionnels.</p>
              <div style="margin: 30px 0;">
                <a href="https://safecallr.app/register?email=${newClient.email}" style="background-color: #4ade80; color: black; padding: 15px 25px; text-decoration: none; font-weight: bold; rounded: 10px; border-radius: 8px;">Créer mon compte sécurisé</a>
              </div>
              <p style="color: #666; font-size: 12px;">Si le bouton ne fonctionne pas, copiez ce lien : https://safecallr.app/register?email=${newClient.email}</p>
            </div>
          `
        },
        createdAt: serverTimestamp()
      });

      setAddSuccess(true);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess(false);
        setNewClient({ firstName: "", lastName: "", phone: "", email: "" });
        // Plus besoin de fetchClients() car onSnapshot s'en occupe
      }, 2000);

    } catch (err: any) {
      console.error("Add client error:", err);
      const message = err.message || "Erreur lors de l'ajout du client.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!selectedClient || selectedClient.id.startsWith('pending_')) {
      setClientHistory([]);
      return;
    }

    setLoadingHistory(true);
    const proId = auth.currentUser?.uid;
    const q = query(
      collection(db, "authRequests"),
      where("fromProId", "==", proId),
      where("toUserId", "==", selectedClient.id),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setClientHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingHistory(false);
    }, (err) => {
      console.error("Fetch history error:", err);
      setLoadingHistory(false);
    });

    return () => unsub();
  }, [selectedClient]);

  const openClientDetails = (client: any) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
  };

  const filteredClients = clients.filter(c => 
    (c.firstName?.toLowerCase().includes(search.toLowerCase())) ||
    (c.lastName?.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone?.includes(search))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#e4e4e8]">Mes clients</h1>
          <p className="text-[#9a9a9f] mt-2">Gérez votre base de clients vérifiés.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-2xl py-3 pl-12 pr-4 text-[#e4e4e8] focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#4ade80] text-black px-6 py-3 rounded-2xl font-bold hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10 flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus size={20} />
            <span className="hidden sm:inline">Inscrire un client</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#2e2e34] mb-4" size={40} />
          <p className="text-[#9a9a9f] font-medium">Chargement de vos clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm p-20 text-center">
          <div className="w-20 h-20 bg-[#111113] text-[#2e2e34] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#2e2e34]">
            <User size={40} />
          </div>
          <h2 className="text-xl font-bold text-[#e4e4e8]">Aucun client trouvé</h2>
          <p className="text-[#9a9a9f] mt-2">
            Les clients apparaissent ici après leur première vérification validée ou après une inscription manuelle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#1e1e22] text-[#e4e4e8] border border-[#2e2e34] px-8 py-4 rounded-2xl font-bold hover:bg-[#2e2e34] transition-all"
            >
              <UserPlus size={20} />
              Inscrire un client
            </button>
            <button 
              onClick={() => navigate("/pro/search")}
              className="inline-flex items-center gap-2 bg-[#4ade80] text-black px-8 py-4 rounded-2xl font-bold hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10"
            >
              <Plus size={20} />
              Nouvelle vérification
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div 
              key={client.id}
              onClick={() => openClientDetails(client)}
              className="bg-[#1e1e22] p-6 rounded-3xl border border-[#2e2e34] shadow-sm hover:border-[#4ade80]/30 transition-all cursor-pointer group relative overflow-hidden"
            >
              {client.status === 'pending' && (
                <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wider border-l border-b border-amber-500/20">
                  En attente
                </div>
              )}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#111113] flex items-center justify-center text-[#9a9a9f] font-bold text-xl overflow-hidden border-2 border-[#2e2e34] shadow-sm group-hover:border-[#4ade80]/30 transition-colors">
                  {client.photoUrl ? (
                    <img src={client.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{client.firstName?.[0]}{client.lastName?.[0]}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#e4e4e8] group-hover:text-[#4ade80] transition-colors">{client.firstName} {client.lastName}</h3>
                  <div className="flex items-center gap-1.5 text-[#9a9a9f] text-xs">
                    <Phone size={12} />
                    {client.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#2e2e34] text-xs">
                <div className="text-[#9a9a9f]">
                  {client.count > 0 ? (
                    <><span className="font-bold text-[#4ade80]">{client.count}</span> vérification{client.count > 1 ? 's' : ''}</>
                  ) : (
                    <span className="italic">Inscrit manuellement</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[#9a9a9f]/60">
                  <History size={12} />
                  {client.lastVerification ? format(client.lastVerification.toDate(), "dd/MM/yy") : "-"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isSubmitting && setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#1e1e22] rounded-[2rem] border border-[#2e2e34] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {addSuccess ? (
              <div className="p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-[#4ade80]/10 text-[#4ade80] rounded-full flex items-center justify-center mx-auto border border-[#4ade80]/20">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[#e4e4e8]">Client inscrit !</h2>
                  <p className="text-[#9a9a9f]">
                    Une invitation a été envoyée à {newClient.firstName}. Il apparaîtra comme "Connecté" dès qu'il aura validé son compte.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddClient}>
                <div className="p-8 border-b border-[#2e2e34] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4ade80]/10 text-[#4ade80] rounded-xl flex items-center justify-center">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#e4e4e8]">Inscrire un client</h2>
                      <p className="text-xs text-[#9a9a9f]">Ajoutez un client à votre base SafeCallr.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-[#2e2e34] rounded-full transition-colors text-[#9a9a9f]">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#9a9a9f] uppercase tracking-widest ml-1">Prénom</label>
                      <input
                        required
                        type="text"
                        value={newClient.firstName}
                        onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                        placeholder="Ex: Jean"
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-2xl py-4 px-5 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#9a9a9f] uppercase tracking-widest ml-1">Nom</label>
                      <input
                        required
                        type="text"
                        value={newClient.lastName}
                        onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                        placeholder="Ex: Dupont"
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-2xl py-4 px-5 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#9a9a9f] uppercase tracking-widest ml-1">Adresse email</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
                      <input
                        required
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        placeholder="jean.dupont@email.com"
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-2xl py-4 pl-14 pr-5 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#9a9a9f] uppercase tracking-widest ml-1">Numéro de téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
                      <input
                        required
                        type="tel"
                        value={newClient.phone}
                        onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                        placeholder="06 12 34 56 78"
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-2xl py-4 pl-14 pr-5 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-[#9a9a9f] ml-1">Le client recevra une invitation par email pour valider son identité.</p>
                  </div>
                </div>

                <div className="p-8 bg-[#111113]/50 border-t border-[#2e2e34]">
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full bg-[#4ade80] text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Inscrire et envoyer l'invitation
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Client Drawer */}
      {isDrawerOpen && selectedClient && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-[#1e1e22] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-[#2e2e34]">
            <div className="p-6 border-b border-[#2e2e34] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#e4e4e8]">Fiche client</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-[#2e2e34] rounded-full transition-colors text-[#9a9a9f]">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-[#111113] flex items-center justify-center text-[#9a9a9f] font-bold text-3xl overflow-hidden border-4 border-[#2e2e34] shadow-md">
                  {selectedClient.photoUrl ? (
                    <img src={selectedClient.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedClient.firstName?.[0]}{selectedClient.lastName?.[0]}</span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#e4e4e8]">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="flex items-center justify-center gap-2 text-[#9a9a9f] font-medium text-sm">
                      <Phone size={14} />
                      {selectedClient.phone}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[#9a9a9f] font-medium text-sm">
                      <Mail size={14} />
                      {selectedClient.email || selectedClient.clientEmail}
                    </div>
                  </div>
                  {selectedClient.status === 'connected' ? (
                    <div className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1 bg-[#4ade80]/10 text-[#4ade80] rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#4ade80]/20">
                      <ShieldCheck size={12} />
                      Compte vérifié SafeCallr
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                      <Clock size={12} />
                      Invitation en attente
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-bold text-sm text-[#9a9a9f] uppercase tracking-widest">Historique avec ce client</h3>
                {loadingHistory ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-[#2e2e34]" size={32} />
                  </div>
                ) : clientHistory.length === 0 ? (
                  <p className="text-center text-[#9a9a9f] text-sm py-10">Aucun historique récent.</p>
                ) : (
                  <div className="space-y-3">
                    {clientHistory.map((h) => (
                      <div key={h.id} className="p-4 bg-[#111113] rounded-2xl flex items-center justify-between border border-[#2e2e34]">
                        <div>
                          <p className="text-sm font-bold text-[#e4e4e8]">{format(h.createdAt.toDate(), "dd MMMM yyyy", { locale: fr })}</p>
                          <p className="text-[10px] text-[#9a9a9f] uppercase tracking-widest">{h.channel === 'phone' ? 'Appel' : 'Visio'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          h.status === 'validated' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-[#2e2e34] text-[#9a9a9f]'
                        }`}>
                          {h.status === 'validated' ? 'Validé' : h.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-[#2e2e34]">
              <button 
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate("/pro/search", { state: { phone: selectedClient.phone } });
                }}
                className="w-full bg-[#4ade80] text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10"
              >
                Nouvelle vérification
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
