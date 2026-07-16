import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import QuickResponse from "../components/seo/QuickResponse";
import FAQSection from "../components/seo/FAQSection";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Phone, 
  Video, 
  Mail, 
  Users, 
  Building2, 
  Banknote, 
  Zap, 
  Lock, 
  Cpu,
  BarChart3,
  Check,
  XCircle,
  ChevronDown,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, collection, getDocs, query, where } from "../firebase";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

export default function Landing({ persona, legal }: { persona?: string; legal?: string }) {
  const { t } = useLanguage();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const registerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (loginRef.current && !loginRef.current.contains(event.target as Node)) {
        setIsLoginOpen(false);
      }
      if (registerRef.current && !registerRef.current.contains(event.target as Node)) {
        setIsRegisterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const q = query(
          collection(db, "articles"),
          where("published", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const items: any[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date manually and take first 3
        items.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setLatestArticles(items.slice(0, 3));
      } catch (err) {
        console.error("Error loading latest articles:", err);
      } finally {
        setBlogLoading(false);
      }
    };

    fetchLatestArticles();
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Shield className="text-on-primary w-6 h-6" />
            </div>
            <span className="font-headline font-black text-xl md:text-2xl tracking-tighter text-primary hidden min-[400px]:block">SafeCallr</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
            <a href="#problem" className="hover:text-primary transition-colors">Problème</a>
            <a href="#solution" className="hover:text-primary transition-colors">Solution</a>
            <a href="#for-whom" className="hover:text-primary transition-colors">Pour qui</a>
            <a href="#differentiation" className="hover:text-primary transition-colors">Différence</a>
            <Link to="/actualite" className="hover:text-primary transition-colors">Actualités</Link>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {/* Connexion Dropdown */}
            <div className="relative" ref={loginRef}>
              <button 
                onClick={() => { setIsLoginOpen(!isLoginOpen); setIsRegisterOpen(false); }}
                className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                Connexion <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isLoginOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isLoginOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-4 w-64 bg-surface-container-low border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
                  >
                    <Link to="/auth?mode=login" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Particulier</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Accès personnel</div>
                      </div>
                    </Link>
                    <Link to="/pro/login" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Professionnel</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Espace Pro</div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Inscription Dropdown */}
            <div className="relative" ref={registerRef}>
              <button 
                onClick={() => { setIsRegisterOpen(!isRegisterOpen); setIsLoginOpen(false); }}
                className="bg-primary text-on-primary px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap"
              >
                S'inscrire <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isRegisterOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isRegisterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-4 w-72 bg-surface-container-low border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
                  >
                    <Link to="/particuliers" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Vous êtes un particulier</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">En savoir plus</div>
                      </div>
                    </Link>
                    <Link to="/professionnels" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Vous êtes un pro</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">En savoir plus</div>
                      </div>
                    </Link>
                    <Link to="/entreprises" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Banknote className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Vous êtes une entreprise</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">En savoir plus</div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Scan Protocol Active</span>
            </div>
            <h1 className="font-headline font-black text-5xl md:text-8xl tracking-tight leading-[0.9] mb-8">
              On ne sait plus à qui <span className="text-primary">faire confiance.</span>
            </h1>
            <p className="text-xl md:text-3xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              SafeCallr vérifie l’identité de votre interlocuteur en temps réel.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 px-4"
          >
            <Link to="/particuliers" className="w-full sm:w-auto bg-primary text-on-primary px-6 md:px-10 py-5 md:py-6 rounded-2xl font-headline font-black text-lg md:text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              Particulier : Inscrivez-vous
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
            <Link to="/professionnels" className="w-full sm:w-auto bg-surface-container-low border border-white/10 text-on-surface px-6 md:px-10 py-5 md:py-6 rounded-2xl font-headline font-black text-lg md:text-xl hover:bg-surface-container transition-all flex items-center justify-center gap-3">
              Vous êtes un Pro ?
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { icon: Zap, title: "Vérification instantanée", desc: "Moins de 10 secondes pour confirmer l'identité." },
              { icon: Cpu, title: "Résistant à l'IA", desc: "Impossible à automatiser, même avec des deepfakes." },
              { icon: Lock, title: "Multi-canal", desc: "Compatible téléphone, visio, email et physique." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-surface-container-low/50 backdrop-blur-sm p-8 rounded-3xl border border-white/5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="text-primary w-6 h-6" />
                </div>
                <h3 className="font-headline font-bold text-xl mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GEO Quick Response Block */}
      <QuickResponse />

      {/* Problem Section */}
      <section id="problem" className="py-32 px-6 bg-surface-container-lowest relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-error font-bold uppercase tracking-[0.3em] text-xs mb-6 block">Section Problème</span>
              <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight leading-none mb-8">
                La fraude a changé de <span className="text-error">visage.</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                Aujourd’hui, les hackers ne piratent plus les systèmes. Ils vous appellent.
              </p>
              <div className="space-y-4">
                {[
                  "Faux conseiller bancaire",
                  "Fraude au président (entreprises)",
                  "Faux notaire / avocat",
                  "Usurpation d’identité (amis, famille)",
                  "Deepfake voix et vidéo"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-on-surface">
                    <div className="w-2 h-2 rounded-full bg-error"></div>
                    <span className="font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Fraude en France", value: "+4,5 Mrd €", sub: "Particuliers" },
                { label: "Victimes / an", value: "+400 000", sub: "En France" },
                { label: "Manipulation humaine", value: "+80 %", sub: "Des fraudes" },
                { label: "Europe / an", value: "+25 Mrd €", sub: "Chaque année" }
              ].map((stat, i) => (
                <div key={i} className="bg-surface-container-low p-8 rounded-3xl border border-white/5 flex flex-col justify-center">
                  <BarChart3 className="text-error w-6 h-6 mb-4 opacity-50" />
                  <span className="text-3xl font-black text-on-surface mb-1">{stat.value}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{stat.label}</span>
                  <span className="text-[10px] text-slate-600 italic mt-1">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 text-center">
            <p className="text-2xl md:text-4xl font-headline font-bold text-slate-400 italic">
              "Le problème n’est plus technique. Il est <span className="text-on-surface not-italic underline decoration-error underline-offset-8">humain.</span>"
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full pointer-events-none">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-6 block">Section Solution</span>
            <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight leading-none mb-8">
              Et si vous pouviez vérifier <br className="hidden md:block" /> en <span className="text-primary">10 secondes ?</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              SafeCallr introduit une nouvelle norme : l’authentification humaine en temps réel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Lancement", desc: "Vous lancez une vérification depuis l'app." },
              { step: "02", title: "Notification", desc: "Votre interlocuteur reçoit une notification." },
              { step: "03", title: "Code Unique", desc: "Chacun reçoit un code unique sur son écran." },
              { step: "04", title: "Validation", desc: "Vous vous les lisez à voix haute pour confirmer." }
            ].map((step, i) => (
              <div key={i} className="bg-surface-container-low p-8 rounded-3xl border border-white/5 relative group hover:border-primary/30 transition-all">
                <span className="text-6xl font-black text-white/5 absolute top-4 right-6 group-hover:text-primary/10 transition-colors">{step.step}</span>
                <h3 className="font-headline font-bold text-xl mb-4 relative z-10">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative z-10">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 bg-primary/10 border border-primary/20 p-12 rounded-[40px] text-center">
            <div className="flex flex-wrap justify-center gap-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="text-on-primary w-6 h-6" />
                </div>
                <span className="font-headline font-bold text-2xl">Identité confirmée</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="text-on-primary w-6 h-6" />
                </div>
                <span className="font-headline font-bold text-2xl">Aucun doute</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="text-on-primary w-6 h-6" />
                </div>
                <span className="font-headline font-bold text-2xl">Aucune fraude possible</span>
              </div>
            </div>
            <p className="mt-12 text-sm font-bold uppercase tracking-[0.5em] text-primary">Simple. Rapide. Universel.</p>
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section id="for-whom" className="py-32 px-6 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight mb-8">
              SafeCallr protège <span className="text-primary">tout le monde.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Particuliers */}
            <div className="bg-surface-container-low p-10 rounded-[40px] border border-primary/30 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">Grand Public</div>
              <Users className="text-primary w-12 h-12 mb-8" />
              <h3 className="font-headline font-bold text-3xl mb-6">Particuliers</h3>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Appels suspects</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Sécurisation des proches</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Protection contre les arnaques</span>
                </li>
              </ul>
              <Link to="/particuliers" className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold text-center shadow-lg shadow-primary/20 transition-all">
                Découvrir l'offre Particuliers
              </Link>
            </div>

            {/* Professionnels */}
            <div className="bg-surface-container-low p-10 rounded-[40px] border border-white/5 flex flex-col h-full">
              <Building2 className="text-primary w-12 h-12 mb-8" />
              <h3 className="font-headline font-bold text-3xl mb-6">Professionnels</h3>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Relation client sécurisée</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Crédibilité renforcée</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Différenciation concurrentielle</span>
                </li>
              </ul>
              <Link to="/professionnels" className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-center hover:bg-primary hover:text-on-primary transition-all">
                Découvrir l'offre Professionnels
              </Link>
            </div>

            {/* Entreprises */}
            <div className="bg-surface-container-low p-10 rounded-[40px] border border-white/5 flex flex-col h-full">
              <Banknote className="text-primary w-12 h-12 mb-8" />
              <h3 className="font-headline font-bold text-3xl mb-6">Entreprises</h3>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Sécurisation des virements</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Protection interne</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>Conformité et traçabilité</span>
                </li>
              </ul>
              <Link to="/entreprises" className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-center hover:bg-white hover:text-background transition-all">
                Découvrir l'offre Entreprises
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed B2C Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-container-low rounded-[60px] p-12 md:p-24 border border-white/5 relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-6 block">Particulier Grand Public</span>
                <h2 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-none mb-8">
                  Inscrivez-vous et <br /> <span className="text-primary">activez votre protection</span>
                </h2>
                <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                  Ne prenez plus jamais un appel "à l'aveugle". Avec SafeCallr, vous protégez vos proches, vérifiez un conseiller bancaire et sécurisez un appel suspect.
                </p>
                <Link to="/register" className="inline-flex bg-primary text-on-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  S'inscrire maintenant
                </Link>
              </div>
              <div className="relative h-[480px] w-full max-w-[440px] mx-auto lg:mx-0">
                {/* Mock 1: Camille (à gauche, au-dessus) */}
                <div className="absolute top-0 left-0 w-[90%] sm:w-[325px] bg-background rounded-3xl p-6 border border-white/10 shadow-2xl -rotate-2 hover:rotate-0 transition-all duration-500 z-10 hover:z-20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Phone className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Appel entrant</div>
                      <div className="text-lg font-bold text-white">Camille — Ma fille</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-surface-container-highest p-4 rounded-xl text-sm italic text-slate-400">"Papa c'est moi, j'ai eu un souci, il faut que tu m'envoies de l'argent vite..."</div>
                    <div className="bg-primary p-4 rounded-xl text-on-primary font-bold text-center cursor-pointer hover:bg-primary/95 transition-colors">Lancer SafeCallr</div>
                  </div>
                </div>

                {/* Mock 2: Conseiller BNP (à droite, en-dessous) */}
                <div className="absolute bottom-0 right-0 w-[90%] sm:w-[325px] bg-background rounded-3xl p-6 border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500 z-0 hover:z-20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Phone className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Appel entrant</div>
                      <div className="text-lg font-bold text-white">Conseiller BNP</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-surface-container-highest p-4 rounded-xl text-sm italic text-slate-400">"Bonjour, je vous appelle pour une opération suspecte sur votre compte..."</div>
                    <div className="bg-primary p-4 rounded-xl text-on-primary font-bold text-center cursor-pointer hover:bg-primary/95 transition-colors">Lancer SafeCallr</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed B2B Section */}
      <section className="py-32 px-6 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary-gradient rounded-[60px] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10 text-on-primary">
              <div className="order-2 lg:order-1">
                <div className="bg-on-primary/10 backdrop-blur-md rounded-3xl p-8 border border-on-primary/20 shadow-2xl -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-on-primary/20 flex items-center justify-center">
                      <Shield className="text-on-primary w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-primary/60 uppercase tracking-widest">Certifié SafeCallr</div>
                      <div className="text-lg font-bold">Cabinet Notarial Durand</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-on-primary/10 p-4 rounded-xl">
                      <span className="text-sm font-bold">Identité vérifiée</span>
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="text-center text-[10px] font-bold uppercase tracking-widest opacity-60">Confiance client +100%</div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-on-primary/60 font-bold uppercase tracking-[0.3em] text-xs mb-6 block">Vous êtes un professionnel ?</span>
                <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight leading-none mb-8">
                  Créez votre compte pro <br /> chez <span className="text-on-primary/80">SafeCallr.</span>
                </h2>
                <p className="text-xl text-on-primary/80 mb-12 leading-relaxed">
                  Devenez un professionnel de confiance certifié. Prouvez votre identité en temps réel, évitez toute suspicion de fraude et sécurisez vos échanges sensibles.
                </p>
                <Link to="/pro/register" className="inline-flex bg-on-primary text-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
                  Créer mon compte Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Enterprise Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs mb-6 block">Grands Comptes</span>
          <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight mb-12">
            Intégrez SafeCallr dans <br /> votre <span className="text-primary">écosystème.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              "Sécurisation des interactions client",
              "Réduction de la fraude",
              "Amélioration de la confiance",
              "Logs et conformité"
            ].map((item, i) => (
              <div key={i} className="bg-surface-container-low p-6 rounded-2xl border border-white/5 font-bold">
                {item}
              </div>
            ))}
          </div>
          <p className="text-2xl text-slate-400 mb-12 italic">"SafeCallr devient votre couche de confiance."</p>
          <Link to="/company-contact" className="bg-white text-background px-12 py-6 rounded-2xl font-headline font-black text-xl hover:bg-primary hover:text-on-primary transition-all">
            Nous contacter
          </Link>
        </div>
      </section>

      {/* Differentiation Section */}
      <section id="differentiation" className="py-32 px-6 bg-surface-container-lowest relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight mb-8">
              Pourquoi SafeCallr est <span className="text-primary">différent ?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface-container-low p-12 rounded-[40px] border border-white/5">
              <h3 className="font-headline font-bold text-3xl mb-10 text-slate-500">❌ Les solutions actuelles</h3>
              <ul className="space-y-6">
                {["SMS / OTP", "Mots de passe", "Biométrie"].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl text-slate-500 line-through decoration-error/50">
                    <XCircle className="text-error w-6 h-6" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-12 text-error font-bold italic">Inefficaces contre la manipulation humaine.</p>
            </div>
            <div className="bg-primary/5 p-12 rounded-[40px] border border-primary/30">
              <h3 className="font-headline font-bold text-3xl mb-10 text-primary">✅ SafeCallr</h3>
              <ul className="space-y-6">
                {["Vérification active humaine", "Double validation croisée", "Impossible à automatiser", "Résistant à l’IA"].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl font-bold">
                    <CheckCircle className="text-primary w-6 h-6" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-12 text-primary font-bold italic">SafeCallr sécurise là où les autres échouent : la conversation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Trust Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-10">
            <Cpu className="text-primary w-10 h-10" />
          </div>
          <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tight mb-8">
            Une réponse aux nouvelles <span className="text-primary">fraudes IA.</span>
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed mb-12">
            Les deepfakes et l’IA rendent les fraudes plus crédibles, plus rapides et plus difficiles à détecter. SafeCallr impose une preuve humaine impossible à simuler.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 rounded-full bg-surface-container-low border border-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">Anti-Deepfake</span>
            <span className="px-4 py-2 rounded-full bg-surface-container-low border border-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">Anti-Voice Cloning</span>
            <span className="px-4 py-2 rounded-full bg-surface-container-low border border-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">Human-in-the-loop</span>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 px-6 bg-primary text-on-primary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <h2 className="font-headline font-black text-5xl md:text-8xl tracking-tight leading-[0.8]">
              Demain, chaque interaction sera <span className="text-on-primary/50 italic">vérifiée.</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                "Appels bancaires",
                "Signatures à distance",
                "Validation de paiement",
                "Échanges professionnels"
              ].map((item, i) => (
                <div key={i} className="bg-on-primary/10 p-8 rounded-3xl border border-on-primary/20 font-headline font-bold text-xl">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-20 text-center text-sm font-bold uppercase tracking-[1em] opacity-60">SafeCallr devient un réflexe</p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-full pointer-events-none">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-[180px]"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="font-headline font-black text-5xl md:text-8xl tracking-tight leading-none mb-12">
            Et vous, vous feriez confiance <span className="text-primary">sans vérifier ?</span>
          </h2>
          
          <div className="flex flex-col items-center gap-6">
            <Link to="/register" className="w-full sm:w-auto bg-primary text-on-primary px-12 py-8 rounded-[32px] font-headline font-black text-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
              Particulier : Inscrivez-vous
              <ArrowRight className="w-8 h-8" />
            </Link>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/pro/register" className="text-sm font-bold uppercase tracking-widest bg-surface-container-low px-8 py-4 rounded-2xl border border-white/5 hover:bg-surface-container transition-all">
                Pro : créer votre compte
              </Link>
              <Link to="/company-contact" className="text-sm font-bold uppercase tracking-widest bg-surface-container-low px-8 py-4 rounded-2xl border border-white/5 hover:bg-surface-container transition-all">
                Contacter un expert
              </Link>
            </div>
          </div>

          <div className="mt-32 grid grid-cols-1 md:grid-cols-4 gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="text-xs font-black uppercase tracking-widest">Vérifiez avant de faire confiance</div>
            <div className="text-xs font-black uppercase tracking-widest">Ne croyez plus, vérifiez</div>
            <div className="text-xs font-black uppercase tracking-widest">La confiance doit se prouver</div>
            <div className="text-xs font-black uppercase tracking-widest">Chaque appel mérite une preuve</div>
          </div>
        </div>
      </section>

      {/* Blog / Actualités Section */}
      <section className="py-32 px-6 border-t border-white/5 bg-[#08080a]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
                Actualités & Vigilance
              </span>
              <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tight text-white">
                Dossiers & <span className="text-primary">Prévention</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base">
                Découvrez nos derniers décryptages d'arnaques téléphoniques et conseils d'experts pour vous protéger, vous et votre organisation.
              </p>
            </div>
            <Link 
              to="/actualite" 
              className="text-sm font-bold uppercase tracking-widest text-primary hover:text-white flex items-center gap-2 transition-colors shrink-0"
            >
              Voir tous les articles <ArrowRight size={16} />
            </Link>
          </div>

          {blogLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : latestArticles.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low border border-white/5 rounded-3xl text-slate-500 text-sm">
              Aucun article de vigilance n'est publié pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestArticles.map((art) => (
                <div 
                  key={art.id}
                  className="bg-surface-container-low border border-white/5 hover:border-white/10 rounded-3xl overflow-hidden shadow-xl flex flex-col group transition-all duration-300"
                >
                  <Link to={`/actualite/${art.metaTitle}`} className="flex flex-col h-full">
                    <div className="h-48 relative overflow-hidden bg-slate-950">
                      <img 
                        src={art.imageUrl || "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"} 
                        alt={art.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        art.category === "grand_public" 
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}>
                        {art.category === "grand_public" ? "Grand Public" : "Professionnel"}
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-lg text-white leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {art.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {art.summary}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium shrink-0">
                        {art.geoTargeting ? (
                          <span className="flex items-center gap-1 text-primary font-bold uppercase">
                            <Globe size={10} /> {art.geoTargeting}
                          </span>
                        ) : (
                          <span></span>
                        )}
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-primary font-bold uppercase tracking-wider">
                          Lire <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section for SEO/GEO */}
      <FAQSection />

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="text-on-primary w-5 h-5" />
            </div>
            <span className="font-headline font-black text-xl tracking-tighter text-primary">SafeCallr</span>
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            © 2026 SafeCallr Technologies. Tous droits réservés.
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Link id="footer-privacy-link" to="/confidentialite" className="hover:text-primary transition-colors">{t("common.privacyPolicy")}</Link>
            <a href="#" className="hover:text-primary transition-colors">Conditions</a>
            <a href="#" className="hover:text-primary transition-colors">Mentions légales</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
