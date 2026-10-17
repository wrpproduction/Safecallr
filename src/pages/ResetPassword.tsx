import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldAlert,
  Check,
  X
} from "lucide-react";
import AppLogo from "../components/AppLogo";
import { useLanguage } from "../contexts/LanguageContext";

export default function ResetPassword() {
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Code oobCode Firebase Auth
  const oobCode = searchParams.get("oobCode") || searchParams.get("code") || "";
  const initialEmail = searchParams.get("email") || "";

  const [verifiedEmail, setVerifiedEmail] = useState<string>(initialEmail);
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(true);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Champs de saisie
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // État de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Vérification de la validité du lien dès l'arrivée
  useEffect(() => {
    let isMounted = true;

    async function checkCode() {
      if (!oobCode) {
        if (isMounted) {
          setCodeError("Aucun code de réinitialisation détecté. Ce lien semble incomplet ou invalide.");
          setIsValidatingCode(false);
        }
        return;
      }

      try {
        auth.languageCode = lang || "fr";
        const emailFromCode = await verifyPasswordResetCode(auth, oobCode);
        if (isMounted) {
          setVerifiedEmail(emailFromCode || initialEmail);
          setIsValidatingCode(false);
        }
      } catch (err: any) {
        console.error("[ResetPassword] Erreur de vérification du code :", err);
        if (isMounted) {
          if (err.code === "auth/expired-action-code") {
            setCodeError("Ce lien de réinitialisation a expiré (durée maximale : 1 heure). Veuillez demander un nouveau lien.");
          } else if (err.code === "auth/invalid-action-code") {
            setCodeError("Ce lien de réinitialisation est invalide ou a déjà été utilisé pour modifier votre mot de passe.");
          } else {
            setCodeError("Impossible de valider ce lien de réinitialisation. Veuillez demander un nouveau lien.");
          }
          setIsValidatingCode(false);
        }
      }
    }

    checkCode();

    return () => {
      isMounted = false;
    };
  }, [oobCode, initialEmail, lang]);

  // Critères de validation du mot de passe
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasNumber && hasUppercase && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !oobCode) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("[ResetPassword] Erreur de confirmation :", err);
      if (err.code === "auth/expired-action-code") {
        setSubmitError("Ce lien a expiré pendant votre saisie. Veuillez demander un nouveau lien.");
      } else if (err.code === "auth/invalid-action-code") {
        setSubmitError("Ce lien n'est plus valide. Veuillez demander un nouveau lien.");
      } else if (err.code === "auth/weak-password") {
        setSubmitError("Le mot de passe choisi est trop faible. Veuillez choisir un mot de passe plus complexe.");
      } else {
        setSubmitError(err.message || "Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-body text-on-surface">
      <div className="w-full max-w-md bg-surface-container rounded-3xl shadow-2xl border border-surface-container-highest p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* En-tête SafeCallr */}
        <div className="flex flex-col items-center mb-8">
          <AppLogo 
            size={64} 
            className="flex-col gap-3" 
            textClassName="text-2xl font-headline font-black tracking-tight" 
            iconContainerClassName="shadow-lg shadow-primary/20 rounded-2xl" 
          />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-3">
            Sécurité du compte
          </p>
        </div>

        {/* 1. État de chargement initial */}
        {isValidatingCode && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-bold text-on-surface">Vérification de sécurité...</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Validation de votre lien de réinitialisation
            </p>
          </div>
        )}

        {/* 2. État d'erreur du lien (expiré ou invalide) */}
        {!isValidatingCode && codeError && (
          <div className="text-center py-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-error-container/20 text-error rounded-full flex items-center justify-center mx-auto mb-5 border border-error-container/30">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Lien expiré ou invalide</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
              {codeError}
            </p>
            <div className="space-y-3">
              <Link
                to="/auth"
                className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Demander un nouveau lien
              </Link>
              <Link
                to="/"
                className="block text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-2"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        )}

        {/* 3. État de succès */}
        {!isValidatingCode && !codeError && isSuccess && (
          <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-lg shadow-primary/10">
              <CheckCircle2 size={34} />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Mot de passe modifié !</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter à votre compte SafeCallr.
            </p>
            <div className="space-y-3">
              <Link
                to="/auth"
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-primary/20"
              >
                <span>Se connecter</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/pro/login"
                className="block text-xs font-bold text-on-surface-variant hover:text-primary transition-colors py-2 uppercase tracking-wider"
              >
                Espace Professionnel →
              </Link>
            </div>
          </div>
        )}

        {/* 4. Formulaire de saisie du nouveau mot de passe */}
        {!isValidatingCode && !codeError && !isSuccess && (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-on-surface">Réinitialiser votre mot de passe</h2>
              {verifiedEmail && (
                <div className="inline-flex items-center gap-2 bg-surface-container-highest px-3.5 py-1.5 rounded-full mt-2.5 border border-surface-container-highest">
                  <Lock size={13} className="text-primary" />
                  <span className="text-xs font-semibold text-on-surface">{verifiedEmail}</span>
                </div>
              )}
            </div>

            {submitError && (
              <div className="mb-6 p-4 bg-error-container/20 border border-error-container/30 rounded-2xl flex items-start gap-3 text-error text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Champ Nouveau mot de passe */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2 ml-1 uppercase tracking-wider">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 8 caractères"
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-2xl py-3.5 pl-12 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all font-body"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Champ Confirmation du mot de passe */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2 ml-1 uppercase tracking-wider">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez votre mot de passe"
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-2xl py-3.5 pl-12 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all font-body"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Critères de sécurité interactifs */}
              <div className="bg-surface-container-highest/60 rounded-2xl p-4 border border-surface-container-highest space-y-2 text-xs">
                <p className="font-bold text-on-surface-variant uppercase tracking-wider mb-2">Exigences de sécurité :</p>
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <Check size={14} className="text-primary shrink-0" />
                  ) : (
                    <X size={14} className="text-on-surface-variant/60 shrink-0" />
                  )}
                  <span className={hasMinLength ? "text-on-surface font-semibold" : "text-on-surface-variant"}>
                    Au moins 8 caractères
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? (
                    <Check size={14} className="text-primary shrink-0" />
                  ) : (
                    <X size={14} className="text-on-surface-variant/60 shrink-0" />
                  )}
                  <span className={hasNumber ? "text-on-surface font-semibold" : "text-on-surface-variant"}>
                    Au moins un chiffre (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUppercase ? (
                    <Check size={14} className="text-primary shrink-0" />
                  ) : (
                    <X size={14} className="text-on-surface-variant/60 shrink-0" />
                  )}
                  <span className={hasUppercase ? "text-on-surface font-semibold" : "text-on-surface-variant"}>
                    Au moins une lettre majuscule (A-Z)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <Check size={14} className="text-primary shrink-0" />
                  ) : (
                    <X size={14} className="text-on-surface-variant/60 shrink-0" />
                  )}
                  <span className={passwordsMatch ? "text-on-surface font-semibold" : "text-on-surface-variant"}>
                    Les mots de passe sont identiques
                  </span>
                </div>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>Enregistrer le mot de passe</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/auth"
                  className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  Annuler et retourner à la connexion
                </Link>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
