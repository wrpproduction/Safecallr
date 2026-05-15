import React, { useState, useEffect } from "react";
import { db, doc, updateDoc, serverTimestamp, auth, collection, query, where, getDocs, deleteDoc, writeBatch, addDoc } from "../firebase";
import { Shield, User, Mail, Phone, ArrowLeft, Save, AlertTriangle, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function Profile({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phoneNumber: user.phoneNumber || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // If displayName is set but firstName/lastName aren't, split it
    if (!user.firstName && !user.lastName && user.displayName) {
      const parts = user.displayName.split(" ");
      setFormData(prev => ({
        ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || ""
      }));
    }
  }, [user]);

  const handleSignOut = () => {
    auth.signOut();
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const hasChangedEmail = formData.email !== user.email;
      const hasChangedPhone = formData.phoneNumber !== user.phoneNumber;
      const hasChangedContact = hasChangedEmail || hasChangedPhone;
      
      if (hasChangedContact) {
        // 30 days check
        if (user.lastSensitiveUpdate) {
          const lastUpdate = user.lastSensitiveUpdate.toDate ? user.lastSensitiveUpdate.toDate() : new Date(user.lastSensitiveUpdate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (lastUpdate > thirtyDaysAgo) {
            setError("Vous ne pouvez changer vos coordonnées qu'une fois par mois pour des raisons de sécurité.");
            setLoading(false);
            return;
          }
        }

        // Sensitive update logging
        const newCount = (user.sensitiveUpdateCount || 0) + 1;
        if (newCount >= 3) {
          await addDoc(collection(db, "alerts"), {
            userId: user.uid,
            userName: `${user.firstName} ${user.lastName}`,
            type: "too_many_sensitive_updates",
            details: `L'utilisateur a changé ses coordonnées ${newCount} fois au total. Dernier changement: ${formData.email} / ${formData.phoneNumber}`,
            createdAt: serverTimestamp(),
            status: "new"
          });
        }
      }

      const updateData: any = {
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        updatedAt: serverTimestamp(),
      };

      if (hasChangedContact) {
        updateData.lastSensitiveUpdate = serverTimestamp();
        updateData.sensitiveUpdateCount = (user.sensitiveUpdateCount || 0) + 1;
      }

      await updateDoc(doc(db, "users", user.uid), updateData);

      if (hasChangedContact) {
        // PRECATION PRINCIPLE: Invalidate connections if contact info changes
        const batch = writeBatch(db);

        // 1. Invalidate User to User connections
        const qUserA = query(collection(db, "userConnections"), where("userAId", "==", user.uid));
        const qUserB = query(collection(db, "userConnections"), where("userBId", "==", user.uid));
        
        const [snapA, snapB] = await Promise.all([getDocs(qUserA), getDocs(qUserB)]);
        
        snapA.forEach(doc => batch.delete(doc.ref));
        snapB.forEach(doc => batch.delete(doc.ref));

        // 2. Invalidate Pro Client connections (Reset to pending)
        const qPro = query(collection(db, "proClientConnections"), where("userId", "==", user.uid));
        const snapPro = await getDocs(qPro);
        snapPro.forEach(doc => {
          batch.update(doc.ref, { 
            status: "pending", 
            clientPhone: formData.phoneNumber,
            clientEmail: formData.email,
            updatedAt: serverTimestamp() 
          });
        });

        await batch.commit();
        setSuccess("Profil mis à jour. Vos contacts devront vous valider de nouveau car vos coordonnées ont changé.");
      } else {
        setSuccess("Profil mis à jour avec succès.");
      }
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-headline font-black text-2xl text-on-surface">Mon Profil</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-surface-container-low overflow-hidden border-2 border-primary/20 shadow-xl">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="font-headline font-bold text-xl text-on-surface">{user.firstName} {user.lastName}</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            ID SafeCallr: <span className="text-primary">{user.uid.slice(0, 8)}...</span>
          </p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-container-low p-8 rounded-[32px] border border-white/5 shadow-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Prénom</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input 
                  type="text" 
                  value={formData.firstName}
                  readOnly
                  disabled
                  className="w-full bg-surface-container-highest/50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Nom</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input 
                  type="text" 
                  value={formData.lastName}
                  readOnly
                  disabled
                  className="w-full bg-surface-container-highest/50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 font-medium px-1 -mt-4">
            Le nom et le prénom ne peuvent pas être modifiés après l'inscription.
          </p>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-surface-container-highest border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary transition-all"
                placeholder="jean.dupont@exemple.fr"
                required
              />
            </div>
            {(formData.email !== user.email) && (
              <p className="flex items-start gap-2 text-[10px] text-error font-medium px-1 mt-2">
                <AlertTriangle size={12} className="shrink-0" />
                Changer votre email réinitialisera vos connexions vérifiées.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
              <input 
                type="tel" 
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-surface-container-highest border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                placeholder="06 00 00 00 00"
                required
              />
            </div>
            {(formData.phoneNumber !== user.phoneNumber) && (
              <p className="flex items-start gap-2 text-[10px] text-error font-medium px-1 mt-2">
                <AlertTriangle size={12} className="shrink-0" />
                Changer votre téléphone réinitialisera vos connexions vérifiées.
              </p>
            )}
          </div>

          {error && <p className="text-error text-xs font-bold text-center">{error}</p>}
          {success && <p className="text-primary text-xs font-bold text-center">{success}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Sauvegarder les modifications"}
            <Save size={20} />
          </button>
        </form>
      </motion.div>

      <button 
        onClick={handleSignOut}
        className="w-full bg-surface-container-low text-slate-500 py-4 rounded-2xl border border-white/5 font-bold flex items-center justify-center gap-3 hover:bg-error/10 hover:text-error hover:border-error/20 transition-all active:scale-95"
      >
        <LogOut size={20} />
        Déconnexion
      </button>

      <div className="pt-8 text-center text-[10px] text-slate-600 uppercase tracking-[0.2em] font-black">
        SafeCallr Protocol v2.4
      </div>
    </div>
  );
}
