import React, { useState } from "react";
import { ShieldCheck, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import LanguageSelector from "../../components/LanguageSelector";
import AppLogo from "../../components/AppLogo";

export default function ProLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    console.log("[Login] début");
    console.log("[Login] avant signIn");

    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("La tentative de connexion a expiré (timeout de 15 secondes). Veuillez vérifier votre connexion.")), 15000)
      );

      const loginProcessPromise = (async () => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("[Login] signIn OK");
        const uid = userCredential.user.uid;

        console.log("[Login] lecture profil Firestore");
        const proDoc = await getDoc(doc(db, "pros", uid));
        console.log("[Login] profil OK");
        
        return { userCredential, proDoc };
      })();

      const { userCredential, proDoc } = await Promise.race([loginProcessPromise, timeoutPromise]);
      
      if (!proDoc.exists()) {
        setError("Ce compte n'a pas encore de profil professionnel complet. Veuillez terminer votre inscription sur la page d'inscription.");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      const proData = proDoc.data();
      
      if (proData.status !== "active") {
        let message = "";
        switch (proData.status) {
          case "pending_validation":
            message = "Votre compte est en cours de validation (24-48h).";
            break;
          case "suspended":
            message = "Votre compte a été suspendu. Contactez le support.";
            break;
          case "rejected":
            message = `Votre demande a été refusée. Motif : ${proData.rejectionReason || "Non spécifié"}`;
            break;
          default:
            message = "Accès restreint.";
        }
        setStatusMessage(message);
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // Si tout est ok
      navigate("/pro");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message && err.message.includes("timeout de 15 secondes")) {
        setError(err.message);
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Email ou mot de passe incorrect.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Identifiants invalides.");
      } else {
        setError(err.message || "Une erreur est survenue lors de la connexion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-surface-container rounded-3xl shadow-2xl border border-surface-container-highest p-8 md:p-10">
        <div className="flex flex-col items-center mb-10">
          <AppLogo 
            size={64} 
            className="flex-col gap-4" 
            textClassName="text-2xl font-headline" 
            iconContainerClassName="shadow-lg shadow-primary/20 rounded-2xl" 
          />
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-2 block">PRO</span>
          <p className="text-on-surface-variant mt-2 text-center">Espace professionnel sécurisé</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container/20 border border-error-container/30 rounded-2xl flex items-start gap-3 text-error text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {statusMessage && (
          <div className="mb-6 p-4 bg-tertiary-container/20 border border-tertiary-container/30 rounded-2xl flex items-start gap-3 text-tertiary-container text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{statusMessage}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2 ml-1">Email professionnel</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-highest border border-surface-container-highest rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="nom@entreprise.fr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2 ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-highest border border-surface-container-highest rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link to="/pro/forgot-password" title="Mot de passe oublié ?" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-surface-container-highest text-center space-y-4">
          <div>
            <p className="text-on-surface-variant text-sm">
              Président, Cadre ou Professionnel Solo ?
            </p>
            <Link
              to="/pro/register"
              className="inline-block mt-2 text-primary font-bold hover:underline underline-offset-4"
            >
              S'inscrire comme Professionnel Solo
            </Link>
          </div>
          <div className="pt-4 border-t border-dashed border-surface-container-highest/50">
            <p className="text-on-surface-variant text-sm">
              Sécuriser les collaborateurs de votre entreprise ?
            </p>
            <Link
              to="/business/register"
              className="inline-block mt-2 text-emerald-400 font-bold hover:underline underline-offset-4"
            >
              Créer un Espace SafeCallr Business
            </Link>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-on-surface-variant/50 text-xs text-center">
        &copy; 2026 SafeCallr Platform. Tous droits réservés.
      </p>
      <div className="mt-4 flex justify-center">
        <LanguageSelector />
      </div>
    </div>
  );
}
