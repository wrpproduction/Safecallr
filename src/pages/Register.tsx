import React, { useState } from "react";
import { auth, signInWithPopup, googleProvider, db, setDoc, doc, serverTimestamp } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Mail, Lock, User, UserPlus, CheckCircle } from "lucide-react";
import { linkPendingConnections } from "../lib/connections";
import { emailService } from "../services/emailService";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Envoyer l'email de vérification personnalisé SafeCallr
      await emailService.sendCustomVerificationEmail(email, firstName);

      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          userClass: "individual",
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`,
          email,
          phoneNumber,
          emailVerified: false,
          createdAt: serverTimestamp(),
        });
        // Link pending connections
        await linkPendingConnections(user.uid, phoneNumber, email);

        // Notify Admin of new registration
        await emailService.sendAdminRegistrationNotification({
          firstName,
          lastName,
          email,
          phone: phoneNumber
        }, "grand_public");
      } catch (dbErr: any) {
        console.error("Error creating user doc:", dbErr);
      }
      
      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      try {
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          userClass: "individual",
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          emailVerified: result.user.emailVerified,
          createdAt: serverTimestamp(),
        }, { merge: true });
      } catch (dbErr) {
        console.error("Error updating user doc via Google:", dbErr);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-8 relative overflow-hidden text-center">
        <div className="z-10 w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">
              Vérifiez votre email
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Un email de validation a été envoyé à <span className="text-primary font-bold">{email}</span>.
            </p>
            <p className="text-slate-500 text-sm">
              Veuillez cliquer sur le lien dans l'email pour activer votre compte et accéder à votre espace personnel.
            </p>
          </div>
          <div className="pt-8">
            <Link to="/auth" className="text-primary font-bold hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-8 relative overflow-hidden">
      <div className="z-10 w-full max-w-md flex flex-col items-center text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="text-on-primary w-6 h-6" />
          </div>
          <h1 className="font-headline font-black text-2xl tracking-tighter text-primary">SafeCallr</h1>
        </div>

        <div className="space-y-2">
          <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">
            Inscription Particulier
          </h2>
          <p className="text-slate-400 text-sm">
            Créez votre compte pour sécuriser vos échanges
          </p>
        </div>

        <form onSubmit={handleRegister} className="w-full space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" placeholder="Prénom" required
                value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-xl py-4 pl-10 pr-4 text-on-surface text-sm"
              />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" placeholder="Nom" required
                value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-xl py-4 pl-10 pr-4 text-on-surface text-sm"
              />
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">FR</span>
            <input 
              type="tel" placeholder="Numéro de téléphone" required
              value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-xl py-4 pl-12 pr-6 text-on-surface"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="email" placeholder="Email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-xl py-4 pl-12 pr-6 text-on-surface"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="password" placeholder="Mot de passe" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-xl py-4 pl-12 pr-6 text-on-surface"
            />
          </div>

          {error && <p className="text-error text-xs font-medium">{error}</p>}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-primary text-on-primary font-headline font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-on-primary"></div> : <UserPlus className="w-5 h-5" />}
            S'inscrire
          </button>
        </form>

        <div className="w-full flex items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <div className="h-px flex-grow bg-white/10"></div>
          <span>SafeCallr Network</span>
          <div className="h-px flex-grow bg-white/10"></div>
        </div>

        <p className="text-slate-400 text-sm">
          Déjà un compte ?
          <Link to="/auth" className="text-primary font-bold ml-2">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
