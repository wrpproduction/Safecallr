import React, { useEffect, useState } from "react";
import { auth, functions } from "../firebase";
import { reload } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { Shield, Mail, RefreshCw, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { emailService } from "../services/emailService";

export default function VerifyEmail({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const inputCode = enteredCode.trim().toUpperCase();
    if (inputCode.length < 5) {
      setError("Le code de validation saisi est invalide (format attendu : 6 chiffres + 1 lettre).");
      setLoading(false);
      return;
    }

    try {
      const verifyCodeFn = httpsCallable<{ code: string }, { ok: boolean }>(
        functions,
        "verifyCode"
      );
      await verifyCodeFn({ code: inputCode });

      // Rafraîchir l'objet Auth Firebase local
      if (auth.currentUser) {
        try {
          await reload(auth.currentUser);
        } catch {}
      }

      setMessage("Votre compte SafeCallr a été vérifié avec succès !");
      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload();
      }, 800);
    } catch (err: any) {
      console.error("[VerifyEmail] Erreur lors de la validation du code :", err);
      const msg = err.message || "Code de validation incorrect ou expiré.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await emailService.sendCustomVerificationEmail(user?.email, user?.displayName || "");
      setMessage("Un nouveau code de validation a été envoyé par e-mail.");
      setCooldown(60);
    } catch (err: any) {
      console.error("[VerifyEmail] Erreur renvoi code :", err);
      setError(err.message || "Impossible de renvoyer le code.");
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
            Pour sécuriser votre compte, saisissez le <strong>code de sécurité</strong> envoyé à : <br />
            <span className="text-on-surface font-extrabold block mt-1 text-base text-primary">{user?.email}</span>
          </p>
        </div>

        {/* Formulaire de saisie du code */}
        <form onSubmit={handleVerifyCode} className="space-y-4 bg-surface-container-low p-6 rounded-2xl border border-white/5 shadow-xl">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              Code de sécurité (chiffres + lettre)
            </label>
            <input 
              type="text" 
              maxLength={8}
              placeholder="123456A"
              required
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="w-full bg-[#18181b] border border-white/15 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-4 text-center text-3xl font-mono tracking-[0.3em] text-primary uppercase"
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
            disabled={loading || cooldown > 0}
            className="w-full text-slate-300 font-bold text-sm py-2 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? (
              <span>Renvoyer le code ({cooldown}s)</span>
            ) : (
              <span>Renvoyer le code par e-mail</span>
            )}
          </button>

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
