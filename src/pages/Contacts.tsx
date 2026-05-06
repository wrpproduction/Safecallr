import React, { useEffect, useState } from "react";
import { db, collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, addDoc, deleteDoc, getDocs } from "../firebase";
import { UserPlus, Check, X, Shield, Building2, Phone, Mail, Clock, Search, User, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Contacts({ user }: { user: any }) {
  const [connections, setConnections] = useState<any[]>([]);
  const [validatedAuthRequests, setValidatedAuthRequests] = useState<any[]>([]);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [personalContacts, setPersonalContacts] = useState<any[]>([]);
  const [personalRequests, setPersonalRequests] = useState<any[]>([]);
  const [pros, setPros] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  useEffect(() => {
    if (!user) return;

    const cleanUserPhone = user.phoneNumber?.replace(/\s/g, "").replace(/-/g, "");

    // Fetch Professional Connections
    const qPro = query(collection(db, "proClientConnections"));

    const unsubscribePro = onSnapshot(qPro, (snapshot) => {
      const allConns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userConns = allConns.filter((c: any) => 
        (c.userId === user.uid || 
        (cleanUserPhone && c.clientPhone?.replace(/\s/g, "").replace(/-/g, "") === cleanUserPhone) ||
        c.clientEmail === user.email)
      );
      setConnections(userConns);
    });

    // Fetch User to User Connections
    const qUserConn = query(
      collection(db, "userConnections"),
      where("userAId", "==", user.uid)
    );
    const qUserConnB = query(
      collection(db, "userConnections"),
      where("userBId", "==", user.uid)
    );

    const unsubscribeUserConnA = onSnapshot(qUserConn, (snapshot) => {
      const connsA = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserConnections(prev => {
        const other = prev.filter(c => c.userBId === user.uid);
        return [...connsA, ...other];
      });
    });

    const unsubscribeUserConnB = onSnapshot(qUserConnB, (snapshot) => {
      const connsB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserConnections(prev => {
        const other = prev.filter(c => c.userAId === user.uid);
        return [...other, ...connsB];
      });
    });

    // Fetch Validated Auth Requests (Retroactive support)
    const qAuth = query(collection(db, "authRequests"));

    const unsubscribeAuth = onSnapshot(qAuth, (snapshot) => {
      const allAuths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userAuths = allAuths.filter((r: any) => 
        (r.toUserId === user.uid || 
        (cleanUserPhone && r.toUserPhone?.replace(/\s/g, "").replace(/-/g, "") === cleanUserPhone)) &&
        r.status === "validated"
      );
      setValidatedAuthRequests(userAuths);
    });

    // Fetch Personal Contacts
    const qPerso = query(
      collection(db, "personalContacts"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribePerso = onSnapshot(qPerso, (snapshot) => {
      setPersonalContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch Personal Contact Requests
    const qPersoReq = query(
      collection(db, "personalContactRequests"),
      where("toUserId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribePersoReq = onSnapshot(qPersoReq, (snapshot) => {
      setPersonalRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch all pros and companies for joining data
    const unsubscribePros = onSnapshot(collection(db, "pros"), (snapshot) => {
      setPros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeCompanies = onSnapshot(collection(db, "companies"), (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribePro();
      unsubscribeUserConnA();
      unsubscribeUserConnB();
      unsubscribeAuth();
      unsubscribePerso();
      unsubscribePersoReq();
      unsubscribePros();
      unsubscribeCompanies();
    };
  }, [user]);

  const handleUpdateStatus = async (id: string, status: "connected" | "rejected") => {
    try {
      await updateDoc(doc(db, "proClientConnections", id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Update connection error:", err);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone || !newContact.email) return;
    setAdding(true);
    setAddError("");
    setAddSuccess("");
    
    try {
      // Normalize phone for comparison
      const cleanPhone = newContact.phone.replace(/\s/g, "").replace(/-/g, "");
      
      // Check if user exists in SafeCallr base
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", newContact.email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      
      let targetUser = null;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const userPhone = userData.phoneNumber?.replace(/\s/g, "").replace(/-/g, "");
        if (userPhone === cleanPhone || userData.phoneNumber === newContact.phone) {
          targetUser = { id: doc.id, ...userData };
        }
      });

      if (targetUser) {
        // Person is in the base, send a validation request
        const target = targetUser as any;
        const targetName = target.displayName || (target.firstName ? `${target.firstName} ${target.lastName}` : "Utilisateur SafeCallr");
        
        await addDoc(collection(db, "personalContactRequests"), {
          fromUserId: user.uid,
          fromUserName: user.displayName || "Utilisateur SafeCallr",
          fromUserPhone: user.phoneNumber || "",
          toUserId: target.id,
          toUserName: targetName,
          toUserPhone: target.phoneNumber || "",
          toUserEmail: target.email || "",
          status: "pending",
          createdAt: serverTimestamp()
        });
        setAddSuccess("Demande de validation envoyée à " + newContact.name);
        setTimeout(() => setShowAddModal(false), 2000);
      } else {
        // Person not in base, add as local contact
        await addDoc(collection(db, "personalContacts"), {
          ownerId: user.uid,
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email,
          createdAt: serverTimestamp()
        });
        setAddSuccess("Contact ajouté localement (non inscrit sur SafeCallr)");
        setTimeout(() => setShowAddModal(false), 2000);
      }
      
      setNewContact({ name: "", phone: "", email: "" });
    } catch (err: any) {
      console.error("Add contact error:", err);
      setAddError("Erreur lors de l'ajout : " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleAcceptRequest = async (request: any) => {
    try {
      // Create connection for both users
      await addDoc(collection(db, "userConnections"), {
        userAId: request.fromUserId,
        userAName: request.fromUserName,
        userAPhone: request.fromUserPhone,
        userBId: request.toUserId,
        userBName: request.toUserName,
        userBPhone: request.toUserPhone,
        createdAt: serverTimestamp()
      });

      // Update request status
      await updateDoc(doc(db, "personalContactRequests", request.id), {
        status: "accepted",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Accept request error:", err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "personalContactRequests", requestId), {
        status: "rejected",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Reject request error:", err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteDoc(doc(db, "personalContacts", id));
    } catch (err) {
      console.error("Delete contact error:", err);
    }
  };

  const pending = connections.filter(c => c.status === "pending").map(c => {
    const proDoc = pros.find(p => p.id === c.proId);
    const compDoc = companies.find(cp => cp.id === proDoc?.companyId);
    return {
      ...c,
      proName: proDoc ? `${proDoc.firstName} ${proDoc.lastName}` : c.proName,
      companyName: compDoc?.name || c.companyName,
      companyCategory: compDoc?.category || c.companyCategory
    };
  });
  
  // Combine connections and validated auth requests, removing duplicates by proId
  const allPros = [
    ...connections.filter(c => c.status === "connected").map(c => {
      const proDoc = pros.find(p => p.id === c.proId);
      const compDoc = companies.find(cp => cp.id === proDoc?.companyId);
      return {
        id: c.id,
        proId: c.proId,
        proName: proDoc ? `${proDoc.firstName} ${proDoc.lastName}` : c.proName,
        companyName: compDoc?.name || c.companyName,
        companyCategory: compDoc?.category || c.companyCategory
      };
    }),
    ...validatedAuthRequests.map(r => {
      const proDoc = pros.find(p => p.id === r.fromProId);
      const compDoc = companies.find(cp => cp.id === proDoc?.companyId);
      return {
        id: r.id,
        proId: r.fromProId,
        proName: proDoc ? `${proDoc.firstName} ${proDoc.lastName}` : r.fromProName,
        companyName: compDoc?.name || r.fromCompanyName,
        companyCategory: compDoc?.category || r.fromCompanyCategory
      };
    })
  ];

  // Unique pros by proId
  const uniquePros = Array.from(new Map(allPros.map(p => [p.proId, p])).values());

  const acceptedPros = uniquePros.filter(c => {
    const proName = c.proName?.toLowerCase() || "";
    const companyName = c.companyName?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return proName.includes(search) || companyName.includes(search);
  });

  const filteredUserConnections = userConnections.filter(c => {
    const otherName = c.userAId === user.uid ? c.userBName : c.userAName;
    const otherPhone = c.userAId === user.uid ? c.userBPhone : c.userAPhone;
    const search = searchTerm.toLowerCase();
    return otherName?.toLowerCase().includes(search) ||
           otherPhone?.toLowerCase().includes(search);
  });

  const filteredPersonal = personalContacts.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  const getCategoryLabel = (cat: string) => {
    const categories: Record<string, string> = {
      "banque": "Banque",
      "notaire": "Notaire",
      "avocat": "Avocat",
      "courtier": "Courtier",
      "agent immobilier": "Agent Immobilier",
      "autres": "Autres"
    };
    return categories[cat] || cat;
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="space-y-2">
        <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">
          Mes <span className="text-primary">contacts</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Gérez vos relations avec les professionnels certifiés SafeCallr.
        </p>
      </section>

      {/* Pending Requests */}
      {(pending.length > 0 || personalRequests.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Nouvelles demandes</h3>
          </div>
          <div className="flex flex-col gap-3">
            {/* Pro Requests */}
            {pending.map((conn) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={conn.id} 
                className="bg-surface-container-low p-5 rounded-3xl border border-primary/20 flex flex-col gap-4 shadow-lg shadow-primary/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-bold text-on-surface text-lg">
                      {conn.companyName}
                    </h4>
                    <p className="text-slate-400 text-xs font-medium">
                      Contact : {conn.proName}
                    </p>
                    {conn.companyCategory && (
                      <span className="inline-block mt-1 text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {getCategoryLabel(conn.companyCategory)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed px-1">
                  Ce professionnel souhaite vous ajouter à sa base de clients pour sécuriser vos futurs échanges.
                </p>
                <div className="flex gap-3 mt-1">
                  <button 
                    onClick={() => handleUpdateStatus(conn.id, "connected")}
                    className="flex-1 bg-primary text-on-primary py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Check size={16} />
                    Autoriser
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(conn.id, "rejected")}
                    className="flex-1 bg-surface-container-highest text-slate-400 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-error/10 hover:text-error active:scale-95 transition-all"
                  >
                    <X size={16} />
                    Refuser
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Personal Requests */}
            {personalRequests.map((req) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={req.id} 
                className="bg-surface-container-low p-5 rounded-3xl border border-secondary/20 flex flex-col gap-4 shadow-lg shadow-secondary/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-bold text-on-surface text-lg">
                      {req.fromUserName}
                    </h4>
                    <p className="text-slate-400 text-xs font-medium">
                      Souhaite vous ajouter à ses contacts personnels
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-1">
                  <button 
                    onClick={() => handleAcceptRequest(req)}
                    className="flex-1 bg-secondary text-on-secondary py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Check size={16} />
                    Accepter
                  </button>
                  <button 
                    onClick={() => handleRejectRequest(req.id)}
                    className="flex-1 bg-surface-container-highest text-slate-400 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-error/10 hover:text-error active:scale-95 transition-all"
                  >
                    <X size={16} />
                    Décliner
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Rechercher un contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Contacts List */}
      <div className="space-y-8">
        {/* Verified User Connections (Renamed to Mes contacts vérifiés and moved to top) */}
        {filteredUserConnections.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-headline font-bold text-lg text-on-surface">Mes contacts vérifiés</h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest">
                {filteredUserConnections.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {filteredUserConnections.map((conn) => {
                const otherName = conn.userAId === user.uid ? conn.userBName : conn.userAName;
                const otherPhone = conn.userAId === user.uid ? conn.userBPhone : conn.userAPhone;
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={conn.id} 
                    className="bg-surface-container-low p-4 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-primary/30 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-headline font-bold text-on-surface text-lg leading-tight">
                        {otherName || "Utilisateur Vérifié"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone size={12} className="text-slate-500" />
                        <p className="text-slate-400 text-xs font-medium">
                          {otherPhone}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Vérifié
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Professional Contacts (Moved to middle) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-headline font-bold text-lg text-on-surface">Mes contacts professionnels</h3>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest">
              {acceptedPros.length}
            </span>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : acceptedPros.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-white/10">
              <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-xs">Aucun professionnel autorisé</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {acceptedPros.map((conn) => (
                <motion.div 
                  layout
                  key={conn.id}
                  className="bg-surface-container-low p-5 rounded-2xl border border-white/5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface text-lg">
                        {conn.companyName}
                      </h4>
                      <p className="text-slate-400 text-xs font-medium">
                        Contact : {conn.proName}
                      </p>
                      {conn.companyCategory && (
                        <span className="inline-block mt-1 text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                          {getCategoryLabel(conn.companyCategory)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Check size={16} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Personal Contacts (Manual - moved to bottom) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-headline font-bold text-lg text-on-surface">Mes contacts personnels</h3>
            <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-1 rounded-full uppercase tracking-widest">
              {filteredPersonal.length}
            </span>
          </div>
          
          {loading ? null : filteredPersonal.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-white/10">
              <User className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-xs">Aucun contact personnel</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredPersonal.map((contact) => (
                <motion.div 
                  layout
                  key={contact.id}
                  className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface text-sm">
                        {contact.name}
                      </h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        {contact.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <Shield size={16} />
                    </div>
                    <button 
                      onClick={() => handleDeleteContact(contact.id)}
                      className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error hover:bg-error hover:text-on-error transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-surface-container-low rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/5 p-8 shadow-2xl"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8 sm:hidden" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-surface">Ajouter un contact</h3>
                  <p className="text-slate-500 text-xs">Sécurisez vos échanges personnels</p>
                </div>
              </div>

              <form onSubmit={handleAddContact} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Nom du contact</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Maman"
                    required
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-600 focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Numéro de téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="+33 6 00 00 00 00"
                    required
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-600 focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="email@exemple.com"
                    required
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-600 focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                {addError && <p className="text-error text-xs font-bold px-1">{addError}</p>}
                {addSuccess && <p className="text-primary text-xs font-bold px-1">{addSuccess}</p>}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:bg-white/5 transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={adding}
                    className="flex-[2] bg-primary text-on-primary py-4 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {adding ? "Ajout..." : "Ajouter le contact"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
