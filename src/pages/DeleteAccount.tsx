import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  AlertTriangle, 
  Trash2, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  UserX, 
  History, 
  Users, 
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../firebase";
import { useLanguage } from "../contexts/LanguageContext";

export default function DeleteAccount({ user }: { user?: any }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  // Steps: 'confirm' (Step 1) -> 'final' (Step 2) -> 'deleting' (Step 3) -> 'success' (Step 4)
  const [step, setStep] = useState<"confirm" | "final" | "deleting" | "success">("confirm");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translations
  const t = {
    fr: {
      backToProfile: "Retour au profil",
      pageTitle: "Suppression du compte",
      step1Title: "Êtes-vous sûr de vouloir supprimer votre compte ?",
      step1Subtitle: "Cette action est irréversible. Tout votre historique et vos données seront définitivement effacés.",
      consequenceHeader: "Conséquences de la suppression définitive :",
      consequenceHistory: "Tout votre historique de vérifications et d'appels sera effacé.",
      consequenceContacts: "Tous vos contacts de confiance et liaisons vérifiées seront supprimés.",
      consequenceData: "Vos données personnelles (nom, email, téléphone) seront effacées de nos bases Firestore.",
      consequenceAuth: "Votre compte de connexion Firebase sera détruit : vous ne pourrez plus vous connecter.",
      btnNoKeep: "Non, conserver mon compte",
      btnYesContinue: "Oui, continuer",
      step2Badge: "Dernière étape",
      step2Title: "Confirmation définitive",
      step2Warning: "Attention : une fois validée, la suppression prend effet immédiatement et vos données ne pourront plus être restaurées.",
      checkboxLabel: "Je confirme vouloir supprimer définitivement mon compte SafeCallr et l'ensemble de mes données.",
      btnFinalDelete: "Supprimer définitivement mon compte",
      btnCancel: "Annuler et retourner au profil",
      deletingTitle: "Suppression définitive en cours...",
      deletingSubtitle: "Effacement des données Firestore et de votre compte Firebase Authentication...",
      successTitle: "Suppression définitive validée",
      successSubtitle: "Votre compte SafeCallr ainsi que l'ensemble de votre historique et de vos données personnelles ont été supprimés avec succès.",
      successNote: "Conformément à nos engagements de confidentialité et aux règles de l'App Store, aucune donnée résiduelle n'est conservée.",
      btnBackHome: "Retour à l'accueil",
      errorGeneric: "Une erreur est survenue lors de la suppression de votre compte. Veuillez réessayer.",
      authMissing: "Utilisateur non authentifié. Veuillez vous reconnecter.",
    },
    en: {
      backToProfile: "Back to profile",
      pageTitle: "Account Deletion",
      step1Title: "Are you sure you want to delete your account?",
      step1Subtitle: "This action is irreversible. All your history and personal data will be permanently erased.",
      consequenceHeader: "Consequences of permanent deletion:",
      consequenceHistory: "All your identity checks and verification history will be erased.",
      consequenceContacts: "All your trusted contacts and connections will be permanently removed.",
      consequenceData: "Your personal data (name, email, phone) will be permanently deleted from Firestore.",
      consequenceAuth: "Your Firebase login account will be destroyed: you will no longer be able to sign in.",
      btnNoKeep: "No, keep my account",
      btnYesContinue: "Yes, continue",
      step2Badge: "Final Step",
      step2Title: "Final Confirmation",
      step2Warning: "Warning: once confirmed, deletion is immediate and your data cannot be recovered.",
      checkboxLabel: "I confirm that I want to permanently delete my SafeCallr account and all associated data.",
      btnFinalDelete: "Permanently delete my account",
      btnCancel: "Cancel and back to profile",
      deletingTitle: "Deleting account...",
      deletingSubtitle: "Erasing Firestore records and Firebase Authentication account...",
      successTitle: "Account successfully deleted",
      successSubtitle: "Your SafeCallr account and all your personal data and history have been permanently erased.",
      successNote: "In compliance with privacy regulations and App Store guidelines, no residual data is kept.",
      btnBackHome: "Back to Home",
      errorGeneric: "An error occurred while deleting your account. Please try again.",
      authMissing: "User not authenticated. Please log in again.",
    },
    es: {
      backToProfile: "Volver al perfil",
      pageTitle: "Eliminar cuenta",
      step1Title: "¿Estás seguro de que deseas eliminar tu cuenta?",
      step1Subtitle: "Esta acción es irreversible. Todo su historial y datos serán eliminados permanentemente.",
      consequenceHeader: "Consecuencias de la eliminación permanente:",
      consequenceHistory: "Todo su historial de verificaciones y registros será eliminado.",
      consequenceContacts: "Todos sus contactos de confianza y conexiones serán eliminados.",
      consequenceData: "Sus datos personales (nombre, correo, teléfono) se eliminarán de Firestore.",
      consequenceAuth: "Su cuenta de acceso de Firebase será destruida: ya no podrá iniciar sesión.",
      btnNoKeep: "No, mantener mi cuenta",
      btnYesContinue: "Sí, continuar",
      step2Badge: "Último paso",
      step2Title: "Confirmación final",
      step2Warning: "Atención: una vez confirmada, la eliminación es inmediata y sus datos no se podrán recuperar.",
      checkboxLabel: "Confirmo que deseo eliminar definitivamente mi cuenta de SafeCallr y todos mis datos asociados.",
      btnFinalDelete: "Eliminar definitivamente mi cuenta",
      btnCancel: "Cancelar y volver al perfil",
      deletingTitle: "Eliminación en curso...",
      deletingSubtitle: "Borrando datos de Firestore y cuenta de Firebase Authentication...",
      successTitle: "Eliminación definitiva validada",
      successSubtitle: "Su cuenta de SafeCallr y todos sus datos personales e historial han sido eliminados con éxito.",
      successNote: "De conformidad con la normativa de privacidad y las directrices del App Store, no se conservan datos residuales.",
      btnBackHome: "Volver al inicio",
      errorGeneric: "Ocurrió un error al eliminar su cuenta. Por favor, inténtelo de nuevo.",
      authMissing: "Usuario no autenticado. Inicie sesión de nuevo.",
    }
  }[lang === "es" ? "es" : lang === "en" ? "en" : "fr"];

  const handleDeleteAccount = async () => {
    if (!agreed) return;
    setError(null);
    setStep("deleting");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error(t.authMissing);
      }

      // 1. Récupérer le jeton ID valide de l'utilisateur
      const idToken = await currentUser.getIdToken(true);

      // 2. Appel au point de terminaison de suppression complète backend
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ idToken })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || t.errorGeneric);
      }

      // 3. Suppression locale Firebase Auth (best-effort si le serveur ne l'a pas déjà détruit)
      try {
        await currentUser.delete();
      } catch (authClientErr) {
        // Ignoré : le serveur avec admin.auth() s'en est déjà chargé
      }

      // 4. Déconnexion et nettoyage des stockages locaux
      try {
        await auth.signOut();
      } catch (signOutErr) {
        // Ignoré
      }

      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageErr) {
        // Ignoré
      }

      // 5. Affichage de l'écran de validation
      setStep("success");
    } catch (err: any) {
      console.error("[DeleteAccount] Erreur:", err);
      setError(err.message || t.errorGeneric);
      setStep("final");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background px-4 py-8 max-w-lg mx-auto flex flex-col justify-center">
      {/* Top bar with back button (hidden during deleting or success) */}
      {step !== "deleting" && step !== "success" && (
        <div className="flex items-center justify-between mb-8">
          <button 
            type="button"
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label={t.backToProfile}
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">
            {t.pageTitle}
          </span>
          <div className="w-10" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ÉTAPE 1 : AVERTISSEMENT ET EXPLICATION */}
        {step === "confirm" && (
          <motion.div
            key="step-confirm"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-3xl bg-error/10 border border-error/20 flex items-center justify-center text-error shadow-xl shadow-error/10">
                <AlertTriangle size={36} />
              </div>
              <h1 className="font-headline font-black text-2xl text-on-surface">
                {t.step1Title}
              </h1>
              <p className="text-slate-400 text-sm max-w-sm">
                {t.step1Subtitle}
              </p>
            </div>

            {/* Cartes d'impact */}
            <div className="bg-surface-container-low p-6 rounded-[28px] border border-white/5 space-y-4">
              <p className="text-xs font-black uppercase tracking-wider text-error flex items-center gap-2">
                <ShieldAlert size={16} />
                {t.consequenceHeader}
              </p>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-highest/40">
                  <History className="text-error shrink-0 mt-0.5" size={16} />
                  <span>{t.consequenceHistory}</span>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-highest/40">
                  <Users className="text-error shrink-0 mt-0.5" size={16} />
                  <span>{t.consequenceContacts}</span>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-highest/40">
                  <UserX className="text-error shrink-0 mt-0.5" size={16} />
                  <span>{t.consequenceData}</span>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-highest/40">
                  <Lock className="text-error shrink-0 mt-0.5" size={16} />
                  <span>{t.consequenceAuth}</span>
                </div>
              </div>
            </div>

            {/* Boutons d'action Étape 1 : Non / Oui */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="w-full bg-surface-container-highest hover:bg-surface-container text-white py-4 rounded-2xl font-headline font-bold text-base transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                {t.btnNoKeep}
              </button>

              <button
                type="button"
                onClick={() => setStep("final")}
                className="w-full bg-error/10 hover:bg-error/20 text-error border border-error/30 py-4 rounded-2xl font-headline font-bold text-base transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                {t.btnYesContinue}
              </button>
            </div>
          </motion.div>
        )}

        {/* ÉTAPE 2 : CONFIRMATION DÉFINITIVE AVEC CASE À COCHER */}
        {step === "final" && (
          <motion.div
            key="step-final"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-3xl bg-error/15 border border-error/30 flex items-center justify-center text-error shadow-xl shadow-error/20">
                <ShieldAlert size={40} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-error/20 text-error border border-error/30">
                {t.step2Badge}
              </span>
              <h1 className="font-headline font-black text-2xl text-on-surface">
                {t.step2Title}
              </h1>
              <p className="text-slate-400 text-xs max-w-sm">
                {t.step2Warning}
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-error/15 border border-error/30 text-error text-xs font-bold text-center">
                {error}
              </div>
            )}

            {/* Boîte de confirmation explicite */}
            <div className="bg-surface-container-low p-6 rounded-[28px] border border-error/20 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded-lg border-2 border-slate-500 text-error focus:ring-error bg-surface-container-highest cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200 leading-relaxed">
                  {t.checkboxLabel}
                </span>
              </label>
            </div>

            {/* Actions finales */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={!agreed}
                onClick={handleDeleteAccount}
                className="w-full bg-error disabled:opacity-40 disabled:cursor-not-allowed hover:bg-error/90 text-white py-4 rounded-2xl font-headline font-black text-base transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-error/20"
              >
                <Trash2 size={20} />
                {t.btnFinalDelete}
              </button>

              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="w-full bg-surface-container-low text-slate-400 hover:text-white py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer"
              >
                {t.btnCancel}
              </button>
            </div>
          </motion.div>
        )}

        {/* ÉTAPE 3 : SUPPRESSION EN COURS */}
        {step === "deleting" && (
          <motion.div
            key="step-deleting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-6 py-12"
          >
            <div className="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center text-primary shadow-xl">
              <Loader2 size={36} className="animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="font-headline font-black text-xl text-on-surface">
                {t.deletingTitle}
              </h2>
              <p className="text-slate-400 text-xs max-w-xs">
                {t.deletingSubtitle}
              </p>
            </div>
          </motion.div>
        )}

        {/* ÉTAPE 4 : SUPPRESSION DÉFINITIVE VALIDÉE */}
        {step === "success" && (
          <motion.div
            key="step-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
                <CheckCircle2 size={48} />
              </div>
              <h1 className="font-headline font-black text-2xl text-on-surface">
                {t.successTitle}
              </h1>
              <p className="text-slate-300 text-sm max-w-sm">
                {t.successSubtitle}
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-[28px] border border-white/5 text-xs text-slate-400 leading-relaxed">
              {t.successNote}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="w-full bg-primary text-on-primary py-4 rounded-2xl font-headline font-black text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                {t.btnBackHome}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
