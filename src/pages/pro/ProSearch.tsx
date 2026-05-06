import React, { useState, useEffect } from "react";
import { 
  Search, 
  Phone, 
  Video, 
  ShieldCheck, 
  ArrowRight, 
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Clock
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, doc, getDoc } from "firebase/firestore";

export default function ProSearch() {
  const [phone, setPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [channel, setChannel] = useState<"phone" | "video">("phone");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientSearch, setClientSearch] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchClients();
    
    // Check if phone is passed in state
    if (location.state?.phone) {
      setPhone(location.state.phone);
      // Trigger search automatically if phone is passed
      autoSearch(location.state.phone);
    }
  }, [location.state]);

  const autoSearch = async (phoneNumber: string) => {
    setIsSearching(true);
    try {
      const cleanPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", cleanPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setClient({ id: userDoc.id, ...userDoc.data() });
      } else {
        setClient(null);
      }
      setSearchDone(true);
    } catch (err) {
      console.error("Auto search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const proId = auth.currentUser?.uid;
      if (!proId) return;

      const qConnections = query(
        collection(db, "proClientConnections"),
        where("proId", "==", proId),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const connectionsSnap = await getDocs(qConnections);
      const uniqueClientsMap = new Map();

      connectionsSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const clientId = data.userId || `pending_${data.clientPhone}`;
        
        if (!uniqueClientsMap.has(clientId)) {
          uniqueClientsMap.set(clientId, {
            id: clientId,
            phone: data.clientPhone,
            firstName: data.clientFirstName,
            lastName: data.clientLastName,
            status: data.status,
            userId: data.userId
          });
        }
      });

      setClients(Array.from(uniqueClientsMap.values()));
    } catch (err) {
      console.error("Fetch clients error:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  const selectClient = (c: any) => {
    setPhone(c.phone);
    if (c.userId) {
      setClient({ 
        id: c.userId, 
        firstName: c.firstName, 
        lastName: c.lastName, 
        phone: c.phone 
      });
    } else {
      setClient(null);
    }
    setSearchDone(true);
    setError(null);
    
    // Scroll to channel selection
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsSearching(true);
    setError(null);
    setClient(null);
    setSearchDone(false);

    try {
      // Nettoyer le numéro (enlever espaces, tirets, etc.)
      const cleanPhone = phone.replace(/\s/g, "").replace(/-/g, "");
      
      // TODO: FIREBASE - Rechercher l'utilisateur par téléphone
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", cleanPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setClient({ id: userDoc.id, ...userDoc.data() });
      } else {
        setClient(null);
      }
      setSearchDone(true);
    } catch (err) {
      console.error("Search error:", err);
      setError("Une erreur est survenue lors de la recherche.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchDone) return;
    
    setIsSending(true);
    setError(null);

    try {
      const proId = auth.currentUser?.uid;
      if (!proId) throw new Error("Vous devez être connecté.");

      // Récupérer les infos du pro pour avoir son companyId
      const { doc, getDoc } = await import("firebase/firestore");
      const proDoc = await getDoc(doc(db, "pros", proId));
      const proData = proDoc.exists() ? proDoc.data() : null;
      
      const companyId = proData?.companyId || "UNKNOWN";
      const fromProName = proData?.firstName && proData?.lastName 
        ? `${proData.firstName} ${proData.lastName}` 
        : "Professionnel";
      const fromCompanyName = proData?.companyName || "Entreprise";
      
      let fromCompanyCategory = "";
      if (companyId !== "UNKNOWN") {
        const compDoc = await getDoc(doc(db, "companies", companyId));
        if (compDoc.exists()) {
          fromCompanyCategory = compDoc.data().category || "";
        }
      }

      // Générer un code de sécurité à 6 chiffres
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 45); // Expire dans 45 secondes

      // Nettoyer le numéro (enlever espaces, tirets, etc.)
      const cleanPhone = phone.replace(/\s/g, "").replace(/-/g, "");

      // Créer la demande d'authentification
      const requestData = {
        fromProId: proId,
        fromProName,
        fromCompanyName,
        fromCompanyCategory,
        toUserId: client?.id || null,
        toUserPhone: cleanPhone,
        toUserName: client ? `${client.firstName} ${client.lastName}` : "Invité",
        companyId: companyId,
        channel,
        status: "code_generated", // On passe directement à code_generated pour simplifier le flux
        createdAt: serverTimestamp(),
        acceptedAt: null,
        validatedAt: null,
        refusedAt: null,
        code: generatedCode,
        codeExpiresAt: expiresAt,
      };

      const docRef = await addDoc(collection(db, "authRequests"), requestData);
      
      // Redirection vers la page d'attente
      navigate(`/pro/request/${docRef.id}/wait`);
    } catch (err: any) {
      console.error("Send request error:", err);
      setError(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredClients = clients.filter(c => 
    (c.firstName?.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (c.lastName?.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (c.phone?.includes(clientSearch))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#e4e4e8]">Nouvelle vérification</h1>
        <p className="text-[#9a9a9f] mt-2">Sélectionnez un client existant ou recherchez un nouveau numéro.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-[#2e2e34] space-y-4">
              <h2 className="font-bold text-[#e4e4e8] flex items-center gap-2">
                <User size={18} className="text-[#4ade80]" />
                Mes clients
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={16} />
                <input
                  type="text"
                  placeholder="Filtrer..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl py-2 pl-10 pr-4 text-sm text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loadingClients ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="animate-spin text-[#2e2e34]" size={24} />
                  <span className="text-xs text-[#9a9a9f]">Chargement...</span>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-xs text-[#9a9a9f]">Aucun client trouvé.</p>
                </div>
              ) : (
                filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectClient(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group ${
                      phone === c.phone 
                        ? "bg-[#4ade80]/10 border border-[#4ade80]/20" 
                        : "hover:bg-[#111113] border border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#111113] border border-[#2e2e34] flex items-center justify-center text-xs font-bold text-[#9a9a9f] group-hover:border-[#4ade80]/30 transition-colors">
                      {c.firstName?.[0]}{c.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${phone === c.phone ? "text-[#4ade80]" : "text-[#e4e4e8]"}`}>
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-[10px] text-[#9a9a9f] truncate">{c.phone}</p>
                    </div>
                    {c.status === 'pending' && <Clock size={12} className="text-amber-500 shrink-0" />}
                    {c.status === 'connected' && <ShieldCheck size={12} className="text-[#4ade80] shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Search & Request */}
        <div className="lg:col-span-2 space-y-8">
          {/* Search Section */}
          <section className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm p-8">
            <h2 className="text-lg font-bold mb-6 text-[#e4e4e8]">Rechercher un numéro</h2>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={20} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setSearchDone(false);
                  }}
                  placeholder="Numéro de téléphone"
                  className="w-full bg-[#111113] border border-[#2e2e34] rounded-2xl py-4 pl-12 pr-4 text-[#e4e4e8] focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !phone}
                className="bg-[#4ade80] text-black px-8 py-4 rounded-2xl font-bold hover:bg-[#22c55e] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#4ade80]/10"
              >
                {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                Rechercher
              </button>
            </form>

            {searchDone && (
              <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
                {client ? (
                  <div className="flex items-center justify-between p-6 bg-[#4ade80]/10 rounded-2xl border border-[#4ade80]/20">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#111113] border-2 border-[#4ade80]/30 flex items-center justify-center overflow-hidden">
                        {client.photoUrl ? (
                          <img src={client.photoUrl} alt="Client" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#4ade80] font-bold text-xl">{client.firstName?.[0]}{client.lastName?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-[#e4e4e8]">{client.firstName} {client.lastName}</p>
                        <div className="flex items-center gap-1.5 text-[#4ade80] text-xs font-bold uppercase tracking-wider">
                          <ShieldCheck size={14} />
                          Compte vérifié SafeCallr
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <CheckCircle2 className="text-[#4ade80]" size={32} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#111113] border-2 border-amber-500/30 flex items-center justify-center">
                        <UserPlus className="text-amber-500" size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-amber-500">Client non inscrit</p>
                        <p className="text-amber-500/70 text-sm">Ce numéro n'est pas encore sur SafeCallr.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setClient({ firstName: "Invité", lastName: "", phone })}
                      className="text-sm font-bold text-amber-500 underline underline-offset-4 hover:text-amber-400 transition-colors"
                    >
                      Envoyer quand même
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Channel & Confirmation */}
          {searchDone && (client || phone) && (
            <section className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold mb-4 text-[#e4e4e8]">Sélectionnez le canal</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setChannel("phone")}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                      channel === "phone" 
                        ? "border-[#4ade80] bg-[#4ade80]/5" 
                        : "border-[#2e2e34] hover:border-[#3e3e44] bg-[#111113]"
                    }`}
                  >
                    <Phone size={32} className={channel === "phone" ? "text-[#4ade80]" : "text-[#9a9a9f]"} />
                    <span className={`font-bold ${channel === "phone" ? "text-[#4ade80]" : "text-[#9a9a9f]"}`}>Téléphone</span>
                  </button>
                  <button
                    onClick={() => setChannel("video")}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                      channel === "video" 
                        ? "border-[#4ade80] bg-[#4ade80]/5" 
                        : "border-[#2e2e34] hover:border-[#3e3e44] bg-[#111113]"
                    }`}
                  >
                    <Video size={32} className={channel === "video" ? "text-[#4ade80]" : "text-[#9a9a9f]"} />
                    <span className={`font-bold ${channel === "video" ? "text-[#4ade80]" : "text-[#9a9a9f]"}`}>Visioconférence</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-[#111113] rounded-2xl space-y-4 border border-[#2e2e34]">
                <h3 className="font-bold text-sm uppercase tracking-widest text-[#9a9a9f]">Déroulement de la vérification</h3>
                <div className="space-y-4">
                  {[
                    "Le client reçoit une notification sur son mobile",
                    "Il accepte la demande d'authentification",
                    "Un code unique à 6 chiffres s'affiche sur votre écran",
                    "Le client saisit ce code pour valider son identité"
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#4ade80] text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-[#4ade80]/20">
                        {i + 1}
                      </div>
                      <p className="text-sm text-[#9a9a9f]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-[#f87171]/10 border border-[#f87171]/20 rounded-2xl flex items-start gap-3 text-[#f87171] text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleSendRequest}
                disabled={isSending}
                className="w-full bg-[#4ade80] text-black py-5 rounded-2xl font-bold text-lg hover:bg-[#22c55e] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#4ade80]/10 disabled:opacity-70"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    Envoyer la demande
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
