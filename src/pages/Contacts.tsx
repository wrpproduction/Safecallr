import React, { useEffect, useState } from "react";
import { db, collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, addDoc, deleteDoc, getDocs } from "../firebase";
import { UserPlus, Check, X, Shield, Building2, Phone, Mail, Clock, Search, User, Plus, Trash2, MapPin, Globe, CheckCircle2, ShieldCheck, ExternalLink } from "lucide-react";
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
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "", description: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [selectedPro, setSelectedPro] = useState<any>(null);

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
            description: newContact.description,
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
            description: newContact.description,
            createdAt: serverTimestamp()
          });
        setAddSuccess("Contact ajouté localement (non inscrit sur SafeCallr)");
        setTimeout(() => setShowAddModal(false), 2000);
      }
      
      setNewContact({ name: "", phone: "", email: "", description: "" });
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
  
  // Prefix-robust phone normalization
  const normalizePhone = (phone: string | undefined | null) => {
    if (!phone) return "";
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    if (cleaned.startsWith("+33")) {
      cleaned = "0" + cleaned.slice(3);
    } else if (cleaned.startsWith("33") && cleaned.length === 11) {
      cleaned = "0" + cleaned.slice(2);
    }
    return cleaned;
  };

  // Create sets of Pro and Company properties for rapid filtering or exclusion
  const proIdsSet = new Set(pros.map(p => p.id).filter(Boolean));
  const proPhonesSet = new Set(pros.map(p => normalizePhone(p.phone)).filter(Boolean));
  const proEmailsSet = new Set(pros.map(p => p.email?.toLowerCase().trim()).filter(Boolean));

  const companySiretsSet = new Set(companies.map(c => c.id?.toLowerCase().trim()).filter(Boolean));
  const companyPhonesSet = new Set(companies.map(c => normalizePhone(c.phone)).filter(Boolean));
  const companyEmailsSet = new Set(companies.map(c => c.email?.toLowerCase().trim()).filter(Boolean));

  // Determine if a user-to-user connection belongs to a Pro
  const isConnectionAPro = (c: any) => {
    const otherId = c.userAId === user.uid ? c.userBId : c.userAId;
    const otherPhone = c.userAId === user.uid ? c.userBPhone : c.userAPhone;
    const otherName = c.userAId === user.uid ? c.userBName : c.userAName;
    const cleanOtherPhone = normalizePhone(otherPhone);

    // 1. Check if UID is registered as a Pro
    if (otherId && proIdsSet.has(otherId)) {
      return true;
    }

    // 2. Check by phone number + company/pro naming to prevent general personal accounts from being misidentified
    if (cleanOtherPhone && (proPhonesSet.has(cleanOtherPhone) || companyPhonesSet.has(cleanOtherPhone))) {
      const matchesCompany = companies.some(comp => {
        const compPhone = normalizePhone(comp.phone);
        const nameMatches = comp.name?.toLowerCase().trim() === otherName?.toLowerCase().trim();
        return (compPhone === cleanOtherPhone) && nameMatches;
      });

      const matchesProName = pros.some(p => {
        const pPhone = normalizePhone(p.phone);
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
        return (pPhone === cleanOtherPhone) && (fullName === otherName?.toLowerCase().trim() || otherName?.toLowerCase().includes(p.lastName?.toLowerCase() || ""));
      });

      const isCompanyIndicator = otherName?.toLowerCase().includes("production") || 
                                 otherName?.toLowerCase().includes("sarl") || 
                                 otherName?.toLowerCase().includes("sas") ||
                                 otherName?.toLowerCase().includes("pro");

      if (matchesCompany || matchesProName || isCompanyIndicator || otherName === "wrpproduction") {
        return true;
      }
    }

    return false;
  };

  // Identify and convert any user-to-user connections (userConnections) with Pros
  const userConnectionsWithPros = userConnections.filter(c => isConnectionAPro(c)).map(c => {
    const otherId = c.userAId === user.uid ? c.userBId : c.userAId;
    const otherName = c.userAId === user.uid ? c.userBName : c.userAName;
    const otherPhone = c.userAId === user.uid ? c.userBPhone : c.userAPhone;
    const cleanOtherPhone = normalizePhone(otherPhone);

    // Find the pro document
    const proDoc = pros.find(p => p.id === otherId || (cleanOtherPhone && normalizePhone(p.phone) === cleanOtherPhone));
    const compDoc = proDoc?.companyId ? companies.find(cp => cp.id === proDoc.companyId) : null;

    return {
      id: c.id,
      proId: proDoc?.id || otherId,
      proName: proDoc ? `${proDoc.firstName} ${proDoc.lastName}` : otherName,
      companyName: compDoc?.name || proDoc?.companyName || "Entreprise Professionnelle",
      companyCategory: compDoc?.category || proDoc?.companyCategory || "autres",
      pro: proDoc || null,
      company: compDoc || null
    };
  });

  // Combine connections, validated auth requests, and pro user-to-user connections, removing duplicates by proId
  const allPros = [
    ...connections.filter(c => c.status === "connected").map(c => {
      const proDoc = pros.find(p => p.id === c.proId);
      const compDoc = companies.find(cp => cp.id === proDoc?.companyId);
      return {
        id: c.id,
        proId: c.proId,
        proName: proDoc ? `${proDoc.firstName} ${proDoc.lastName}` : c.proName,
        companyName: compDoc?.name || c.companyName,
        companyCategory: compDoc?.category || c.companyCategory,
        pro: proDoc || null,
        company: compDoc || null
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
        companyCategory: compDoc?.category || r.fromCompanyCategory,
        pro: proDoc || null,
        company: compDoc || null
      };
    }),
    ...userConnectionsWithPros
  ];

  // Unique pros by proId
  const uniquePros = Array.from(new Map(allPros.map(p => [p.proId, p])).values());

  const acceptedPros = uniquePros.filter(c => {
    const proName = c.proName?.toLowerCase() || "";
    const companyName = c.companyName?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return proName.includes(search) || companyName.includes(search);
  });

  const filteredUserConnections = userConnections.filter(c => !isConnectionAPro(c)).filter(c => {
    const otherName = c.userAId === user.uid ? c.userBName : c.userAName;
    const otherPhone = c.userAId === user.uid ? c.userBPhone : c.userAPhone;

    const search = searchTerm.toLowerCase();
    return otherName?.toLowerCase().includes(search) ||
           otherPhone?.toLowerCase().includes(search);
  });

  const filteredPersonal = personalContacts.filter(c => {
    // Normalize phone and email
    const cleanPhone = normalizePhone(c.phone);
    const cleanEmail = c.email?.toLowerCase().trim();

    // Filter out manual contacts from personal only if they match a known corporate pro/company name
    if (cleanPhone && (proPhonesSet.has(cleanPhone) || companyPhonesSet.has(cleanPhone))) {
      const isCompanyIndicator = c.name?.toLowerCase().includes("production") || 
                                 c.name?.toLowerCase().includes("sarl") || 
                                 c.name?.toLowerCase().includes("sas") ||
                                 c.name?.toLowerCase().includes("pro");
      if (isCompanyIndicator || c.name === "wrpproduction") {
        return false;
      }
    }

    return c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.phone?.includes(searchTerm);
  });

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
          Mes contacts <span className="text-primary">vérifiés</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Gérez vos relations avec les professionnels et particuliers certifiés SafeCallr.
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
                    {req.description && (
                      <p className="mt-2 text-[10px] text-slate-500 italic bg-white/5 p-2 rounded-xl border border-white/5">
                        "{req.description}"
                      </p>
                    )}
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
        {/* Personal Contacts (Verified + Manual) */}
        {(filteredUserConnections.length > 0 || filteredPersonal.length > 0) && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-headline font-bold text-lg text-on-surface">Mes contacts personnels</h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest">
                {filteredUserConnections.length + filteredPersonal.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {/* Verified User Connections */}
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

              {/* Manual Personal Contacts */}
              {filteredPersonal.map((contact) => (
                <motion.div 
                  layout
                  key={contact.id}
                  className="bg-surface-container-low p-4 rounded-3xl border border-white/5 flex items-center justify-between hover:border-secondary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface text-lg leading-tight">
                        {contact.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone size={12} className="text-slate-500" />
                        <p className="text-slate-400 text-xs font-medium">
                          {contact.phone}
                        </p>
                      </div>
                      {contact.description && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          {contact.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteContact(contact.id)}
                      className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error hover:bg-error hover:text-on-error transition-all active:scale-90"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Professional Contacts */}
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
                  onClick={() => setSelectedPro(conn)}
                  className="bg-surface-container-low p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-primary/30 hover:bg-surface-container-high cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
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
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <Check size={16} />
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

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Description / Contexte</label>
                  <textarea 
                    placeholder="Ex: Ma soeur, rencontré à la conférence..."
                    value={newContact.description}
                    onChange={(e) => setNewContact({ ...newContact, description: e.target.value })}
                    rows={2}
                    className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-600 focus:ring-2 focus:ring-primary transition-all resize-none"
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

      {/* Detailed Professional Profile Modal */}
      <AnimatePresence>
        {selectedPro && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface-container p-8 rounded-[32px] border border-white/10 shadow-2xl relative space-y-6 my-8"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPro(null)}
                className="absolute right-6 top-6 p-2 bg-surface-container-highest hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              {/* Header Context */}
              <div className="flex flex-col items-center text-center space-y-3 pt-4 border-b border-white/5 pb-6">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
                  <Building2 size={32} />
                </div>
                <div>
                  <h3 className="font-headline font-black text-on-surface text-2xl tracking-tight uppercase leading-tight">
                    {selectedPro.companyName || selectedPro.company?.name || "Fiche Entreprise"}
                  </h3>
                  {selectedPro.companyCategory && (
                    <span className="inline-block mt-2 text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest border border-primary/25">
                      {getCategoryLabel(selectedPro.companyCategory)}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Information */}
              <div className="space-y-4">
                {/* Contact Section */}
                <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 space-y-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                    Contact Professionnel
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-base leading-tight">
                        {selectedPro.proName || "Contact indéfini"}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        {selectedPro.pro?.jobTitle || "Professionnel Qualifié"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Coordinates Block */}
                <div className="bg-surface-container-low p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                    Coordonnées Professionnelles
                  </div>

                  {/* Address */}
                  <div className="flex gap-3 items-start">
                    <MapPin className="text-primary shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adresse de l'établissement</p>
                      <p className="text-on-surface text-sm font-medium mt-0.5 whitespace-pre-line leading-relaxed">
                        {selectedPro.company?.address || "Adresse non renseignée"}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-3 items-start">
                    <Phone className="text-primary shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Téléphone professionnel (Appels)</p>
                      {selectedPro.company?.phone || selectedPro.pro?.phone ? (
                        <a 
                          href={`tel:${selectedPro.company?.phone || selectedPro.pro?.phone}`}
                          className="text-primary text-sm font-bold hover:underline mt-0.5 inline-block"
                        >
                          {selectedPro.company?.phone || selectedPro.pro?.phone}
                        </a>
                      ) : (
                        <p className="text-slate-400 text-xs italic mt-0.5">Non spécifié</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex gap-3 items-start">
                    <Mail className="text-primary shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email de contact</p>
                      {selectedPro.company?.email || selectedPro.pro?.email ? (
                        <a 
                          href={`mailto:${selectedPro.company?.email || selectedPro.pro?.email}`}
                          className="text-primary text-sm font-bold hover:underline mt-0.5 inline-block"
                        >
                          {selectedPro.company?.email || selectedPro.pro?.email}
                        </a>
                      ) : (
                        <p className="text-slate-400 text-xs italic mt-0.5">Non spécifié</p>
                      )}
                    </div>
                  </div>

                  {/* Website */}
                  <div className="flex gap-3 items-start">
                    <Globe className="text-primary shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Site internet officiel</p>
                      {selectedPro.company?.website ? (
                        <a 
                          href={selectedPro.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm font-bold hover:underline mt-0.5 inline-flex items-center gap-1"
                        >
                          {selectedPro.company.website.replace(/^https?:\/\//i, "")}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-slate-400 text-xs italic mt-0.5">Non spécifié</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Validation and Registry bottom section */}
                <div className="bg-surface-container-highest/60 p-5 rounded-2xl border border-white/5 space-y-3 font-mono text-xs text-slate-400">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Numéro SIRET</span>
                    <span className="font-bold text-on-surface">{selectedPro.company?.siret || "En cours de validation"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Numéro RCS + Ville</span>
                    <span className="font-bold text-on-surface text-right">
                      {selectedPro.company?.rcs ? `${selectedPro.company.rcs} ${selectedPro.company.rcsCity ? `(${selectedPro.company.rcsCity})` : ""}` : "En cours de validation"}
                    </span>
                  </div>
                </div>

                {/* Verified Mention Banner */}
                <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-[#4ade80] border border-green-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest mt-2">
                  <ShieldCheck size={16} />
                  <span>SafeCallr — Authentification professionnelle vérifiée</span>
                </div>
              </div>

              {/* Close button inside modal at the bottom */}
              <div className="pt-2">
                <button 
                  onClick={() => setSelectedPro(null)}
                  className="w-full bg-white/5 hover:bg-white/10 text-on-surface py-3.5 rounded-2xl font-bold text-sm transition-all text-center"
                >
                  Fermer la fiche
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
