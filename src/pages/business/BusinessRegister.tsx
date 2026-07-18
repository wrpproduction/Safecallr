import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Shield, 
  Building2, 
  User, 
  Mail, 
  Lock, 
  FileText, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  MapPin,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../../firebase";
import AppLogo from "../../components/AppLogo";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "sonner";
import SEOManager from "../../components/seo/SEOManager";

export default function BusinessRegister() {
  const navigate = useNavigate();
  
  // Step navigation (1: Admin Info, 2: Organization details, 3: Confirmation)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Organization states
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber) {
        setError("Veuillez remplir tous les champs requis.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
      setStep(2);
    }
  };

  const handleCreateBusinessAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!companyName || !siret || !address || !zipCode || !city) {
      setError("Veuillez remplir toutes les informations d'organisation.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Pre-generate a unique organization id
      const orgRef = doc(collection(db, "organizations"));
      const orgId = orgRef.id;

      const fullPostalAddress = `${address}, ${zipCode} ${city}`;

      // 3. Write Organization document in 'organizations' collection
      await setDoc(orgRef, {
        id: orgId,
        name: companyName,
        siret: siret,
        address: fullPostalAddress,
        streetNumber: address.split(" ")[0] || "",
        zipCode: zipCode,
        city: city,
        adminEmail: email,
        status: "active",
        active: true,
        primaryColor: "#0F1B3D",
        trustMessage: `Authentification de sécurité validée par ${companyName}.`,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        allowedEmailDomains: [email.split("@")[1] || "gmail.com"]
      });

      // 4. Create member entry in 'organizations/{orgId}/members/{uid}'
      const memberRef = doc(db, "organizations", orgId, "members", user.uid);
      await setDoc(memberRef, {
        firstName,
        lastName,
        email,
        role: "admin",
        status: "active",
        jobTitle: jobTitle || "Administrateur principal",
        directPhone: phoneNumber,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      // 5. Update personal user record with the orgId link
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        userClass: "professional",
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        email,
        phoneNumber,
        orgId: orgId,
        role: "representative",
        emailVerified: true, // Business demo workspace shortcut for ultimate utility
        createdAt: serverTimestamp()
      }, { merge: true });

      // 6. Action successful !
      setStep(3);
      toast.success(`Compte Business ${companyName} créé avec succès !`);
    } catch (err: any) {
      console.error("Error creating business organization:", err);
      setError(err.message || "Une erreur est survenue lors de la création de la base de données de l'organisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <SEOManager 
        title="Créer un compte Business SafeCallr" 
        description="Inscrivez votre entreprise et commencez à protéger vos transactions financières et vos collaborateurs." 
        noIndex 
      />

      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#3DFFA0]/5 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-lg bg-surface-container-low border border-white/5 p-8 md:p-10 rounded-3xl shadow-2xl space-y-8 backdrop-blur-md">
        
        {/* Header containing unified professional logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link to="/">
            <AppLogo 
              size={40} 
              className="gap-2" 
              textClassName="text-2xl" 
              iconContainerClassName="shadow-lg shadow-primary/20 rounded-xl" 
            />
          </Link>
          <div>
            <h2 className="font-headline font-extrabold text-2xl tracking-tight text-white">
              Créer mon espace Business
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Protégez vos collaborateurs et dirigeants contre la fraude téléphonique et le spoofing.
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        {step < 3 && (
          <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-widest font-sans border-b border-white/5 pb-6">
            <div className={`flex items-center gap-2 pb-2 ${step === 1 ? "border-b-2 border-primary text-primary" : "text-slate-500"}`}>
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">1</span>
              <span>Administrateur</span>
            </div>
            <div className={`flex items-center gap-2 pb-2 ${step === 2 ? "border-b-2 border-primary text-primary" : "text-slate-500"}`}>
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">2</span>
              <span>Organisation</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1" 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }} 
              onSubmit={handleNextStep} 
              className="space-y-4"
              id="admin-form"
            >
              <div className="text-sm font-bold text-slate-300 mb-2 border-l-2 border-[#3DFFA0] pl-3">
                Informations du Représentant Principal
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" placeholder="Prénom" required
                    value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" placeholder="Nom" required
                    value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                  />
                </div>
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" placeholder="Titre du poste (ex : Trésorier, Directeur Sécurité)" 
                  value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="tel" placeholder="Numéro de téléphone direct" required
                  value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="email" placeholder="Adresse email professionnelle" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="password" placeholder="Mot de passe d'accès" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="password" placeholder="Confirmer le mot de passe" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-primary text-on-primary font-headline font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="next-btn"
              >
                Continuer vers l'organisation <ChevronRight size={16} />
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2" 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }} 
              onSubmit={handleCreateBusinessAccount} 
              className="space-y-4"
              id="org-form"
            >
              <div className="text-sm font-bold text-slate-300 mb-2 border-l-2 border-[#3DFFA0] pl-3 flex justify-between items-center">
                <span>Détails de l'Organisation</span>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Retour
                </button>
              </div>

              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" placeholder="Nom officiel de l'entreprise" required
                  value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                />
              </div>

              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" placeholder="Numéro SIRET (14 chiffres)" required
                  maxLength={14}
                  value={siret} onChange={(e) => setSiret(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm font-mono"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" placeholder="Adresse postale (rue et numéro)" required
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" placeholder="Code Postal" required
                    maxLength={5}
                    value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" placeholder="Ville" required
                    value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl space-y-1 text-slate-400 text-xs">
                <div className="font-bold text-primary flex items-center gap-1">
                  <ShieldCheck size={14} /> Base de données isolée
                </div>
                <p className="leading-relaxed">
                  Votre organisation se verra attribuer une partition logique au sein de notre infrastructure Firestore, séparant hermétiquement vos collaborateurs de l'espace grand public.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" disabled={loading}
                className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-headline font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#3DFFA0]/15 hover:bg-[#2eed90] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="create-btn"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#0F1B3D] border-t-transparent" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    Activer mon compte & Organisation <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-6"
              id="success-view"
            >
              <div className="w-20 h-20 rounded-full bg-[#3DFFA0]/15 border border-[#3DFFA0]/30 flex items-center justify-center mx-auto text-[#3DFFA0] animate-bounce">
                <ShieldCheck size={40} />
              </div>

              <div className="space-y-2">
                <h3 className="font-headline font-black text-2xl text-white">Félicitations !</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Votre espace d'organisation <span className="text-white font-bold">{companyName}</span> est actif. Votre partition sécurisée a été générée.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl max-w-sm mx-auto text-left space-y-2">
                <div className="text-xs font-bold text-[#3DFFA0] uppercase tracking-wider">Identifiants d'accès</div>
                <div className="text-xs text-slate-400">Pour vous connecter ultérieurement ou sur l'application mobile :</div>
                <div className="font-mono text-xs text-white bg-black/40 p-2 rounded border border-white/5 truncate">
                  {email}
                </div>
              </div>

              <button 
                onClick={() => navigate("/business/admin/dashboard")}
                className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-headline font-black text-sm uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-center inline-block cursor-pointer font-bold"
              >
                Accéder au Dashboard Business Proches
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full flex items-center gap-4 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
          <div className="h-px flex-grow bg-white/5" />
          <span>Fidèle au standard bancaire</span>
          <div className="h-px flex-grow bg-white/5" />
        </div>

        {step < 3 && (
          <p className="text-center text-slate-400 text-xs">
            Déjà inscrit pour votre organisation ?{" "}
            <Link to="/auth?mode=login" className="text-primary font-bold hover:underline">
              Se connecter
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
