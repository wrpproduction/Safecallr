import React, { useState } from "react";
import { auth, db, doc, setDoc, serverTimestamp } from "../firebase";
import { Shield, Phone, ArrowRight, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { linkPendingConnections } from "../lib/connections";

export default function CompleteProfile({ user }: { user: any }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user.email === "ulrich.vidal@gmail.com" ? "0663558820" : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || phoneNumber.length < 10) {
      setError("Veuillez remplir tous les champs correctement.");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        email: user.email,
        phoneNumber,
        createdAt: user.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      await linkPendingConnections(user.uid, phoneNumber, user.email);
      window.location.reload();
    } catch (err: any) {
      console.error("Error completing profile:", err);
      setError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
            <Shield className="text-on-primary w-10 h-10" />
          </div>
          <h1 className="font-headline font-black text-3xl tracking-tight text-primary">Dernière étape</h1>
          <p className="text-slate-400 text-sm max-w-[280px]">
            Finalisez votre profil pour rejoindre le réseau de confiance SafeCallr.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" placeholder="Prénom" required
                value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-2xl py-4 pl-10 pr-4 text-on-surface font-bold"
              />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" placeholder="Nom" required
                value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-2xl py-4 pl-10 pr-4 text-on-surface font-bold"
              />
            </div>
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="tel" placeholder="06 12 34 56 78" required
              value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-2xl py-5 pl-12 pr-6 text-on-surface text-lg font-bold"
            />
          </div>

          {error && <p className="text-error text-xs font-bold uppercase tracking-widest">{error}</p>}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-primary text-on-primary font-headline font-bold text-xl py-5 rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? "Enregistrement..." : "Activer mon compte"}
            <ArrowRight className="w-6 h-6" />
          </button>

          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={async () => {
                try {
                  await auth.signOut();
                } catch (err) {
                  console.error("Logout error:", err);
                }
                navigate("/");
              }}
              className="text-slate-500 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer pb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
