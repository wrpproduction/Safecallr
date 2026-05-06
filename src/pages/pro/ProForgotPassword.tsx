import React, { useState } from "react";
import { ShieldCheck, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { auth } from "../../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ProForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
    } catch (err: any) {
      console.error("Reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("Aucun compte n'est associé à cet email.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-surface-container rounded-3xl shadow-2xl border border-surface-container-highest p-8 md:p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <ShieldCheck className="text-on-primary w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tighter font-headline">SafeCallr <span className="text-sm font-normal text-on-surface-variant opacity-70">PRO</span></h1>
          <p className="text-on-surface-variant mt-2 text-center">Récupération de compte</p>
        </div>

        {isSent ? (
          <div className="text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-4">Email envoyé !</h2>
            <p className="text-on-surface-variant mb-8">
              Consultez votre boîte mail ({email}) pour réinitialiser votre mot de passe.
            </p>
            <Link
              to="/pro/login"
              className="block w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:opacity-90 transition-all"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-error-container/20 border border-error-container/30 rounded-2xl flex items-start gap-3 text-error text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-6">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Entrez votre email professionnel pour recevoir un lien de réinitialisation de mot de passe.
              </p>
              
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Envoyer le lien"
                )}
              </button>

              <Link to="/pro/login" className="flex items-center justify-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
                <ArrowLeft size={16} />
                Retour à la connexion
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
