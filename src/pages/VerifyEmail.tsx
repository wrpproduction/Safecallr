import React, { useEffect, useState } from "react";
import { auth, db, doc, updateDoc } from "../firebase";
import { sendEmailVerification, reload } from "firebase/auth";
import { Shield, Mail, RefreshCw, LogOut, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VerifyEmail({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const checkVerification = async () => {
    setLoading(true);
    try {
      await reload(auth.currentUser!);
      if (auth.currentUser?.emailVerified) {
        // Mettre à jour Firestore
        await updateDoc(doc(db, "users", user.uid), {
          emailVerified: true
        });
        window.location.reload();
      } else {
        setError("Votre email n'est pas encore vérifié. Veuillez cliquer sur le lien reçu par email.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser!);
      setMessage("Un nouvel email de validation a été envoyé.");
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const bypassVerification = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        emailVerified: true
      });
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-8 text-center">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
            <Mail className="w-12 h-12" />
          </div>
          <h1 className="font-headline font-black text-3xl tracking-tight text-primary">Vérification Email</h1>
          <p className="text-slate-400 text-sm">
            Merci de vous être inscrit ! Pour accéder à votre espace personnel, vous devez valider votre adresse email : <span className="text-on-surface font-bold">{user.email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={checkVerification}
            disabled={loading}
            className="w-full bg-primary text-on-primary font-headline font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            J'ai vérifié mon email
          </button>

          <button 
            onClick={resendEmail}
            disabled={loading}
            className="w-full bg-surface-container-highest text-on-surface font-headline font-bold text-sm py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Renvoyer l'email de validation
          </button>

          {/* Debug Bypass for testing */}
          {(user.email === "xdcam10@gmail.com" || process.env.NODE_ENV === "development") && (
            <button 
              onClick={bypassVerification}
              disabled={loading}
              className="w-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-xs py-2 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-3 h-3" />
              DEBUG: Simuler la vérification (Admin/Test)
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="w-full text-slate-500 font-bold text-sm py-2 hover:text-error transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>

        {message && <p className="text-primary text-xs font-medium bg-primary/10 py-2 rounded-lg">{message}</p>}
        {error && <p className="text-error text-xs font-medium bg-error/10 py-2 rounded-lg">{error}</p>}

        <div className="pt-8 border-t border-white/5">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
            Sécurisé par SafeCallr Biometric Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
