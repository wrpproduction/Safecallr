import React, { useEffect, useState } from "react";
import { auth, db, doc, updateDoc, getDoc } from "../firebase";
import { reload } from "firebase/auth";
import { Shield, Mail, RefreshCw, LogOut, CheckCircle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { emailService } from "../services/emailService";

export default function VerifyEmail({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (enteredCode.trim().length !== 6) {
      setError("Le code de validation doit comporter 6 chiffres.");
      setLoading(false);
      return;
    }

    try {
      // 1. Essai de vérification serveur (via notre endpoint API)
      const response = await fetch("/api/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, code: enteredCode.trim() })
      });

      if (response.ok) {
        // Succès : marquer l'utilisateur comme vérifié dans Firestore localement pour accélerer la navigation
        await updateDoc(doc(db, "users", user.uid), {
          emailVerified: true
        }).catch(() => {});
        
        await updateDoc(doc(db, "pros", user.uid), {
          emailVerified: true
        }).catch(() => {});

        setMessage("Votre adresse e-mail a été vérifiée avec succès !");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
        return;
      } else {
        const errData = await response.json().catch(() => ({}));
        if (errData.error) {
          throw new Error(errData.error);
        }
      }
    } catch (apiErr: any) {
      console.warn("[VerifyEmail] L'API de validation a échoué (" + apiErr.message + "), tentative de repli direct Firestore...");
    }

    // 2. Repli direct via Firestore (client-side verification si l'Admin SDK ou le serveur de l'applet connaît des soucis)
    try {
      const codeRef = doc(db, "verification_codes", user.email);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        setError("Code de validation incorrect ou expiré.");
        setLoading(false);
        return;
      }

      const data = codeSnap.data();
      if (data.used) {
        setError("Ce code de validation a déjà été utilisé.");
        setLoading(false);
        return;
      }

      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (expiresAt < new Date()) {
        setError("Ce code de validation a expiré (validité de 30 minutes). Veuillez en demander un nouveau.");
        setLoading(false);
        return;
      }

      if (data.code !== enteredCode.trim()) {
        setError("Code incorrect. Veuillez vérifier les 6 chiffres saisis.");
        setLoading(false);
        return;
      }

      // Valider le code et l'utilisateur dans Firestore
      await updateDoc(codeRef, { used: true });
      
      // Essayer de mettre à jour le document correspondant (particulier ou pro)
      try {
        await updateDoc(doc(db, "users", user.uid), {
          emailVerified: true
        });
      } catch (e) {
        await updateDoc(doc(db, "pros", user.uid), {
          emailVerified: true
        });
      }

      setMessage("Votre adresse e-mail a été vérifiée avec succès !");
      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (fallbackErr: any) {
      setError("Erreur de validation : " + fallbackErr.message);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      let firstName = "";
      if (user?.uid) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            firstName = userSnap.data().firstName || "";
          } else {
            const proSnap = await getDoc(doc(db, "pros", user.uid));
            if (proSnap.exists()) {
              firstName = proSnap.data().firstName || "";
            }
          }
        } catch (dbErr) {
          console.warn("Could not fetch user document for name customization:", dbErr);
        }
      }
      await emailService.sendCustomVerificationEmail(user.email, firstName);
      setMessage("Un nouveau code de validation à 6 chiffres a été envoyé par e-mail.");
    } catch (err: any) {
      setError("Impossible d'envoyer le code : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const bypassVerification = async () => {
    setLoading(true);
    try {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          emailVerified: true
        });
      } catch (e) {
        await updateDoc(doc(db, "pros", user.uid), {
          emailVerified: true
        });
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <Mail className="w-12 h-12" />
          </div>
          <h1 className="font-headline font-black text-3xl tracking-tight text-primary">Activez votre compte</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Pour sécuriser votre compte, saisissez le <strong>code de validation à 6 chiffres</strong> envoyé à : <br />
            <span className="text-on-surface font-extrabold block mt-1 text-base text-primary">{user.email}</span>
          </p>
        </div>

        {/* Formulaire de saisie du code */}
        <form onSubmit={handleVerifyCode} className="space-y-4 bg-surface-container-low p-6 rounded-2xl border border-white/5 shadow-xl">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              Code de sécurité (6 chiffres)
            </label>
            <input 
              type="text" 
              maxLength={6}
              placeholder="000000"
              required
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-[#18181b] border border-white/15 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-4 text-center text-3xl font-mono tracking-[0.4em] text-primary"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-headline font-bold text-base py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            Activer mon compte
          </button>
        </form>

        <div className="space-y-3">
          <button 
            onClick={resendEmail}
            disabled={loading}
            className="w-full text-slate-300 font-bold text-sm py-2 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            Renvoyer le code par e-mail
          </button>

          {/* Debug Bypass representation */}
          {(user.email === "xdcam10@gmail.com" || process.env.NODE_ENV === "development") && (
            <button 
              onClick={bypassVerification}
              disabled={loading}
              className="w-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-xs py-2 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-3 h-3" />
              DEBUG: Simuler la validation du compte
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

        {message && <p className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl">{message}</p>}
        {error && <p className="text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/25 py-3 rounded-xl">{error}</p>}

        <div className="pt-6 border-t border-white/5">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
            Sécurisé par SafeCallr Cryptographic Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
