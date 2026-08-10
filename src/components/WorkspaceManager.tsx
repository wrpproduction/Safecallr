import React, { useState } from "react";
import { useWorkspace, WorkspaceMode } from "../contexts/WorkspaceContext";
import { Shield, Building2, Briefcase, CheckCircle2, ChevronRight, Lock, Mail, KeyRound, Loader2, Unlink, ExternalLink, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function WorkspaceManager() {
  const { activeMode, linkedPro, linkedBusiness, switchMode, requestLinkingCode, verifyAndLinkAccount, unlinkAccount } = useWorkspace();

  const [linkingType, setLinkingType] = useState<"pro" | "business" | null>(null);
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [tempData, setTempData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleOpenLinking = (type: "pro" | "business") => {
    setLinkingType(type);
    setStep("credentials");
    setEmail("");
    setPassword("");
    setSecurityCode("");
    setTempData(null);
    setError(null);
    setInfoMessage(null);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingType) return;
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const res = await requestLinkingCode(linkingType, email, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Impossible de vérifier vos identifiants.");
    } else {
      setTempData(res.tempAccountData);
      setStep("code");
      setInfoMessage(`Code de confirmation envoyé à ${email}. Pour la démonstration, votre code est : ${res.code || '123456'}`);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingType || !tempData) return;
    setLoading(true);
    setError(null);

    const res = await verifyAndLinkAccount(linkingType, securityCode, tempData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Code de sécurité incorrect.");
    } else {
      setLinkingType(null);
    }
  };

  return (
    <div className="bg-surface-container-low p-6 md:p-8 rounded-[32px] border border-white/5 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Briefcase size={20} />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Espaces Pro & Business</h3>
            <p className="text-slate-400 text-xs">Connectez et basculez entre vos comptes SafeCallr Pro et Business</p>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
        <button
          onClick={() => switchMode("particulier")}
          className={`py-3 px-2 rounded-xl text-xs font-headline font-bold flex flex-col items-center gap-1 transition-all ${
            activeMode === "particulier"
              ? "bg-[#3dffa0] text-black shadow-lg shadow-[#3dffa0]/20 scale-[1.02]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Shield size={16} />
          <span>Particulier</span>
        </button>

        <button
          onClick={() => {
            if (linkedPro) {
              switchMode("pro");
            } else {
              handleOpenLinking("pro");
            }
          }}
          className={`py-3 px-2 rounded-xl text-xs font-headline font-bold flex flex-col items-center gap-1 transition-all ${
            activeMode === "pro"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]"
              : linkedPro
              ? "text-blue-400 hover:text-blue-300"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Briefcase size={16} />
          <span>Pro</span>
          {linkedPro && <span className="text-[9px] opacity-80">● Connecté</span>}
        </button>

        <button
          onClick={() => {
            if (linkedBusiness) {
              switchMode("business");
            } else {
              handleOpenLinking("business");
            }
          }}
          className={`py-3 px-2 rounded-xl text-xs font-headline font-bold flex flex-col items-center gap-1 transition-all ${
            activeMode === "business"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]"
              : linkedBusiness
              ? "text-blue-300 hover:text-blue-200"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Building2 size={16} />
          <span>Business</span>
          {linkedBusiness && <span className="text-[9px] opacity-80">● Connecté</span>}
        </button>
      </div>

      {/* Account Cards */}
      <div className="space-y-4 pt-2">
        {/* Pro Account Item */}
        <div className={`p-4 rounded-2xl border transition-all ${
          activeMode === "pro" 
            ? "bg-blue-500/10 border-blue-500/40" 
            : "bg-surface-container-highest/40 border-white/5"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs">
                PRO
              </div>
              <div>
                <p className="font-bold text-sm text-white flex items-center gap-2">
                  SafeCallr Pro
                  {linkedPro && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase">
                      Vérifié
                    </span>
                  )}
                </p>
                <p className="text-slate-400 text-xs">
                  {linkedPro ? `${linkedPro.email} ${linkedPro.organizationName ? `(${linkedPro.organizationName})` : ''}` : "Non connecté"}
                </p>
              </div>
            </div>

            {linkedPro ? (
              <div className="flex items-center gap-2">
                {activeMode !== "pro" && (
                  <button
                    onClick={() => switchMode("pro")}
                    className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                  >
                    Basculer
                  </button>
                )}
                <button
                  onClick={() => unlinkAccount("pro")}
                  className="p-2 text-slate-500 hover:text-error transition-colors"
                  title="Délier le compte Pro"
                >
                  <Unlink size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenLinking("pro")}
                className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Connecter</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Business Account Item */}
        <div className={`p-4 rounded-2xl border transition-all ${
          activeMode === "business" 
            ? "bg-blue-600/10 border-blue-600/40" 
            : "bg-surface-container-highest/40 border-white/5"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-300 font-black text-xs">
                BIZ
              </div>
              <div>
                <p className="font-bold text-sm text-white flex items-center gap-2">
                  SafeCallr Business
                  {linkedBusiness && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 text-[10px] font-black uppercase">
                      Vérifié
                    </span>
                  )}
                </p>
                <p className="text-slate-400 text-xs">
                  {linkedBusiness ? `${linkedBusiness.email} ${linkedBusiness.companyName ? `(${linkedBusiness.companyName} - ${linkedBusiness.role || 'Collaborateur'})` : ''}` : "Non connecté"}
                </p>
              </div>
            </div>

            {linkedBusiness ? (
              <div className="flex items-center gap-2">
                {activeMode !== "business" && (
                  <button
                    onClick={() => switchMode("business")}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Basculer
                  </button>
                )}
                <button
                  onClick={() => unlinkAccount("business")}
                  className="p-2 text-slate-500 hover:text-error transition-colors"
                  title="Délier le compte Business"
                >
                  <Unlink size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenLinking("business")}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Connecter</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Linking Modal / Form */}
      <AnimatePresence>
        {linkingType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 bg-surface-container-highest/90 border border-blue-500/30 rounded-3xl space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Lock size={18} className="text-blue-400" />
                Connexion {linkingType === "pro" ? "SafeCallr Pro" : "SafeCallr Business"}
              </h4>
              <button
                onClick={() => setLinkingType(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Fermer
              </button>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-semibold">
                {error}
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs">
                {infoMessage}
              </div>
            )}

            {step === "credentials" ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <p className="text-slate-400 text-xs">
                  Saisissez l'adresse email et le mot de passe de votre compte professionnel.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Email professionnel</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@entreprise.fr"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Mot de passe</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Demander le code de confirmation"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <p className="text-slate-400 text-xs">
                  Un code de sécurité à 6 chiffres a été généré pour valider le lien vers votre application SafeCallr.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Code de sécurité à 6 chiffres</label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-center tracking-widest font-mono text-lg font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="w-1/3 py-3 bg-surface-container-highest text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : "Valider et Basculer"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
