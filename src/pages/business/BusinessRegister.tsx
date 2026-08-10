import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../../firebase";
import AppLogo from "../../components/AppLogo";
import { signInWithCustomToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import SEOManager from "../../components/seo/SEOManager";
import { getApiUrl } from "../../lib/api";

export default function BusinessRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract invitation parameters from URL
  const urlEmail = searchParams.get("email") || "";
  const urlFirstName = searchParams.get("firstName") || searchParams.get("first_name") || "";
  const urlLastName = searchParams.get("lastName") || searchParams.get("last_name") || "";
  const urlCompanyName = searchParams.get("companyName") || searchParams.get("name") || searchParams.get("org") || "";
  const urlSiret = searchParams.get("siret") || "";
  const urlAddress = searchParams.get("address") || "";
  const urlZipCode = searchParams.get("zipCode") || searchParams.get("zip") || "";
  const urlCity = searchParams.get("city") || "";
  const urlOrgId = searchParams.get("orgId") || "";

  // Step navigation (1: Account Activation, 2: Confirmation)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingOrg, setFetchingOrg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states pre-filled from URL parameters
  const [email, setEmail] = useState(urlEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState(urlFirstName);
  const [lastName, setLastName] = useState(urlLastName);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Organization states pre-filled from URL parameters
  const [companyName, setCompanyName] = useState(urlCompanyName);
  const [siret, setSiret] = useState(urlSiret);
  const [address, setAddress] = useState(urlAddress);
  const [zipCode, setZipCode] = useState(urlZipCode);
  const [city, setCity] = useState(urlCity);
  const [orgId, setOrgId] = useState(urlOrgId);

  // Auto-fetch details from Firestore if orgId is passed and some info is missing
  useEffect(() => {
    if (urlOrgId && (!urlCompanyName || !urlEmail)) {
      setFetchingOrg(true);
      const fetchOrgDetails = async () => {
        try {
          const orgRef = doc(db, "organizations", urlOrgId);
          const orgSnap = await getDoc(orgRef);
          if (orgSnap.exists()) {
            const data = orgSnap.data();
            if (!companyName && data.name) setCompanyName(data.name);
            if (!siret && data.siret) setSiret(data.siret);
            if (!address && data.address) setAddress(data.address);
            if (!zipCode && data.zipCode) setZipCode(data.zipCode);
            if (!city && data.city) setCity(data.city);
            if (!email && data.adminEmail) setEmail(data.adminEmail);
          }
        } catch (err) {
          console.error("Error fetching org details:", err);
        } finally {
          setFetchingOrg(false);
        }
      };
      fetchOrgDetails();
    }
  }, [urlOrgId]);

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Veuillez définir un mot de passe.");
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

    if (!email) {
      setError("Adresse e-mail manquante dans l'invitation.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/business/activate-account"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          email,
          password,
          firstName,
          lastName,
          companyName,
          siret,
          address,
          zipCode,
          city,
          phoneNumber,
          jobTitle
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'activation du compte.");
      }

      // Auto-login using the generated custom token
      if (result.customToken) {
        await signInWithCustomToken(auth, result.customToken);
      }

      setStep(2);
      toast.success(`Compte organisation ${companyName || ''} activé avec succès !`);
    } catch (err: any) {
      console.error("Error activating business account:", err);
      setError(err.message || "Une erreur est survenue lors de l'activation.");
    } finally {
      setLoading(false);
    }
  };

  // SECURITY CHECK: If no email parameter is provided in URL, deny public direct registration
  if (!urlEmail && !email) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        <SEOManager 
          title="Accès Restreint — Espace Business SafeCallr" 
          description="Création d'espace entreprise exclusivement sur invitation administrative." 
          noIndex 
        />

        {/* Decorative Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none z-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="z-10 w-full max-w-lg bg-[#0f131f] border border-amber-500/20 p-8 md:p-10 rounded-3xl shadow-2xl text-center space-y-6 backdrop-blur-md">
          <div className="flex justify-center">
            <AppLogo size={40} className="gap-2" textClassName="text-2xl" />
          </div>

          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert size={36} />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
              Protocole d'Accès Sécurisé B2B
            </span>
            <h2 className="font-headline font-extrabold text-2xl text-white pt-2">
              Création d'Espace sur Invitation Uniquement
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto pt-1">
              L'enregistrement d'un espace organisationnel sur le réseau SafeCallr s'effectue exclusivement sur invitation, après la validation préalable de votre entreprise par nos équipes d'administration.
            </p>
          </div>

          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-left space-y-2 text-xs">
            <div className="font-bold text-slate-300 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#3DFFA0]" /> Vous avez déjà reçu une invitation ?
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Veuillez utiliser le lien d'activation sécurisé qui a été transmis par email à votre représentant désigné ou contactez votre administrateur SafeCallr.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link 
              to="/company-contact" 
              className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-headline font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-[#2eed90] transition-all flex items-center justify-center gap-2"
            >
              <HelpCircle size={16} /> Demander l'ouverture d'un espace entreprise
            </Link>

            <Link 
              to="/pro/login" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-white/10 font-headline font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={16} /> Se connecter à un espace existant
            </Link>

            <Link 
              to="/" 
              className="inline-block text-xs text-slate-500 hover:text-slate-300 transition-colors pt-2"
            >
              ← Retour au site SafeCallr
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <SEOManager 
        title="Activation d'Espace Business SafeCallr" 
        description="Finalisez la création de votre compte organisationnel SafeCallr." 
        noIndex 
      />

      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#3DFFA0]/5 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-xl bg-surface-container-low border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl space-y-8 backdrop-blur-md">
        
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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3DFFA0]/10 border border-[#3DFFA0]/20 rounded-full text-[#3DFFA0] text-[10px] font-black uppercase tracking-widest mb-2">
              <ShieldCheck size={12} /> Invitation Validée
            </div>
            <h2 className="font-headline font-extrabold text-2xl tracking-tight text-white">
              Activation de votre espace {companyName ? `"${companyName}"` : "Business"}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Finalisez votre inscription pour accéder à votre console de sécurité anti-usurpation.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="activate-form" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              onSubmit={handleActivateAccount} 
              className="space-y-5"
            >
              {/* Locked Email Notice */}
              <div className="p-4 bg-black/40 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Mail size={14} className="text-[#3DFFA0]" /> Adresse Email du Représentant
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-500/20">
                    <Lock size={10} /> Validé par le Back-office
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/70 w-4 h-4" />
                  <input 
                    type="email" 
                    disabled 
                    readOnly 
                    value={email}
                    className="w-full bg-[#151720] border border-slate-700/60 text-slate-300 font-mono text-sm rounded-xl py-3.5 pl-10 pr-4 select-none cursor-not-allowed opacity-90 shadow-inner"
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  L'adresse email est verrouillée car elle correspond à l'invitation enregistrée dans notre back-office.
                </p>
              </div>

              {/* Pre-filled Representative details */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 border-l-2 border-[#3DFFA0] pl-3">
                  Informations Personnelles
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="text" placeholder="Prénom" required
                      value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="text" placeholder="Nom" required
                      value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="text" placeholder="Fonction / Poste" 
                      value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="tel" placeholder="Tél. Direct"
                      value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Pre-filled Organization details */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-slate-300 border-l-2 border-[#3DFFA0] pl-3">
                  Informations de l'Organisation
                </div>

                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" placeholder="Nom de l'organisation" required
                    value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm"
                  />
                </div>

                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" placeholder="SIRET (14 chiffres)" required
                    maxLength={14}
                    value={siret} onChange={(e) => setSiret(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                    <input 
                      type="text" placeholder="Adresse" required
                      value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-9 pr-3 text-white text-xs"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="text" placeholder="Code Postal" required
                      maxLength={5}
                      value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 px-3 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" placeholder="Ville" required
                    value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm"
                  />
                </div>
              </div>

              {/* Security Credentials */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-300 border-l-2 border-[#3DFFA0] pl-3">
                  Définition du Mot de Passe d'Accès
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="password" placeholder="Mot de passe" required
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="password" placeholder="Confirmation" required
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 pl-10 pr-4 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" disabled={loading}
                className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-headline font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#3DFFA0]/15 hover:bg-[#2eed90] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#0F1B3D] border-t-transparent" />
                    Activation de l'espace...
                  </>
                ) : (
                  <>
                    Activer mon compte & mon organisation <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.div 
              key="success-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-4"
            >
              <div className="w-20 h-20 rounded-full bg-[#3DFFA0]/15 border border-[#3DFFA0]/30 flex items-center justify-center mx-auto text-[#3DFFA0] animate-bounce">
                <ShieldCheck size={40} />
              </div>

              <div className="space-y-2">
                <h3 className="font-headline font-black text-2xl text-white">Espace Activé !</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Votre compte de représentant pour <span className="text-white font-bold">{companyName || "votre organisation"}</span> est maintenant opérationnel.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl max-w-sm mx-auto text-left space-y-2">
                <div className="text-xs font-bold text-[#3DFFA0] uppercase tracking-wider">Identifiant d'accès</div>
                <div className="font-mono text-xs text-white bg-black/40 p-2.5 rounded-lg border border-white/5 truncate">
                  {email}
                </div>
              </div>

              <button 
                onClick={() => navigate("/business/admin/dashboard")}
                className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-headline font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-center inline-block cursor-pointer font-bold"
              >
                Accéder au Dashboard Business
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full flex items-center gap-4 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
          <div className="h-px flex-grow bg-white/5" />
          <span>Sécurité Certifiée SafeCallr</span>
          <div className="h-px flex-grow bg-white/5" />
        </div>
      </div>
    </div>
  );
}
