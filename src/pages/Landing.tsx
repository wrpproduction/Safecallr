import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import QuickResponse from "../components/seo/QuickResponse";
import FAQSection from "../components/seo/FAQSection";
import AppLogo from "../components/AppLogo";
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
  const { t, lang } = useLanguage();
  const getPrivacyPath = () => {
    if (lang === "es") return "/privacidad";
    if (lang === "en") return "/privacy";
    return "/confidentialite";
  };
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
          <AppLogo 
            size={40} 
            textClassName="hidden min-[400px]:block md:text-2xl" 
            className="gap-2 md:gap-3" 
            iconContainerClassName="shadow-lg shadow-primary/20 rounded-xl" 
          />
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
            <a href="#problem" className="hover:text-primary transition-colors">{t("landing.probleme")}</a>
            <a href="#solution" className="hover:text-primary transition-colors">{t("landing.solution")}</a>
            <a href="#for-whom" className="hover:text-primary transition-colors">{t("landing.pourQui")}</a>
            <a href="#differentiation" className="hover:text-primary transition-colors">{t("landing.difference")}</a>
            <Link to="/actualite" className="hover:text-primary transition-colors">{t("landing.actualites")}</Link>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {/* Connexion Dropdown */}
            <div className="relative" ref={loginRef}>
              <button 
                onClick={() => { setIsLoginOpen(!isLoginOpen); setIsRegisterOpen(false); }}
                className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                {t("landing.connexion")} <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isLoginOpen ? 'rotate-180' : ''}`} />
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
                        <div className="text-sm font-bold">{t("landing.particulier")}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("landing.accesPersonnel")}</div>
                      </div>
                    </Link>
                    <Link to="/pro/login" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t("landing.professionnel")}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("landing.espacePro")}</div>
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
                {t("landing.sInscrire")} <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isRegisterOpen ? 'rotate-180' : ''}`} />
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
                        <div className="text-sm font-bold">{t("landing.vousEtesParticulier")}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("landing.enSavoirPlus")}</div>
                      </div>
                    </Link>
                    <Link to="/professionnels" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t("landing.vousEtesPro")}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("landing.enSavoirPlus")}</div>
                      </div>
                    </Link>
                    <Link to="/entreprises" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Banknote className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t("landing.vousEtesEntreprise")}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("landing.enSavoirPlus")}</div>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("landing.heroLiveBadge")}</span>
            </div>
            <h1 className="font-headline font-black text-5xl md:text-8xl tracking-tight leading-[0.9] mb-8">
              {t("landing.heroTitlePart1")} <span className="text-primary">{t("landing.heroTitleAccent")}</span>
            </h1>
            <p className="text-xl md:text-3xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              {t("landing.heroSubtitle")}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 px-4"
          >
            <Link to="/particuliers" className="w-full sm:w-auto bg-primary text-on-primary px-6 md:px-10 py-5 md:py-6 rounded-2xl font-headline font-black text-lg md:text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              {t("landing.heroCtaParticulier")}
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
            <Link to="/professionnels" className="w-full sm:w-auto bg-surface-container-low border border-white/10 text-on-surface px-6 md:px-10 py-5 md:py-6 rounded-2xl font-headline font-black text-lg md:text-xl hover:bg-surface-container transition-all flex items-center justify-center gap-3">
              {t("landing.heroCtaPro")}
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { icon: Zap, title: t("landing.heroFeature1Title"), desc: t("landing.heroFeature1Desc") },
              { icon: Cpu, title: t("landing.heroFeature2Title"), desc: t("landing.heroFeature2Desc") },
              { icon: Lock, title: t("landing.heroFeature3Title"), desc: t("landing.heroFeature3Desc") }
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
              <span className="text-error font-bold uppercase tracking-[0.3em] text-xs mb-6 block">{t("landing.problemTag")}</span>
              <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight leading-none mb-8">
                {t("landing.problemTitlePart1")} <span className="text-error">{t("landing.problemTitleAccent")}</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                {t("landing.problemSubtitle")}
              </p>
              <div className="space-y-4">
                {[
                  t("landing.problemItem1"),
                  t("landing.problemItem2"),
                  t("landing.problemItem3"),
                  t("landing.problemItem4"),
                  t("landing.problemItem5")
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
                { label: t("landing.stat1Label"), value: t("landing.stat1Value"), sub: t("landing.stat1Sub") },
                { label: t("landing.stat2Label"), value: t("landing.stat2Value"), sub: t("landing.stat2Sub") },
                { label: t("landing.stat3Label"), value: t("landing.stat3Value"), sub: t("landing.stat3Sub") },
                { label: t("landing.stat4Label"), value: t("landing.stat4Value"), sub: t("landing.stat4Sub") }
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
              "{t("landing.problemQuotePart1")}<span className="text-on-surface not-italic underline decoration-error underline-offset-8">{t("landing.problemQuoteAccent")}</span>"
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
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-6 block">{t("landing.solutionTag")}</span>
            <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight leading-none mb-8">
              {t("landing.solutionTitlePart1")}<br className="hidden md:block" /> <span className="text-primary">{t("landing.solutionTitleAccent")}</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t("landing.solutionSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: t("landing.solutionStep1Title"), desc: t("landing.solutionStep1Desc") },
              { step: "02", title: t("landing.solutionStep2Title"), desc: t("landing.solutionStep2Desc") },
              { step: "03", title: t("landing.solutionStep3Title"), desc: t("landing.solutionStep3Desc") },
              { step: "04", title: t("landing.solutionStep4Title"), desc: t("landing.solutionStep4Desc") }
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
                <span className="font-headline font-bold text-2xl">{t("landing.solutionConfirm1")}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="text-on-primary w-6 h-6" />
                </div>
                <span className="font-headline font-bold text-2xl">{t("landing.solutionConfirm2")}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="text-on-primary w-6 h-6" />
                </div>
                <span className="font-headline font-bold text-2xl">{t("landing.solutionConfirm3")}</span>
              </div>
            </div>
            <p className="mt-12 text-sm font-bold uppercase tracking-[0.5em] text-primary">{t("landing.solutionBadge")}</p>
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section id="for-whom" className="py-32 px-6 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight mb-8">
              {t("landing.whomTitlePart1")} <span className="text-primary">{t("landing.whomTitleAccent")}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Particuliers */}
            <div className="bg-surface-container-low p-10 rounded-[40px] border border-primary/30 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">{t("landing.whomParticuliersBadge")}</div>
              <Users className="text-primary w-12 h-12 mb-8" />
              <h3 className="font-headline font-bold text-3xl mb-6">{t("landing.whomParticuliersTitle")}</h3>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomParticuliersItem1")}</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomParticuliersItem2")}</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomParticuliersItem3")}</span>
                </li>
              </ul>
              <Link to="/particuliers" className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold text-center shadow-lg shadow-primary/20 transition-all">
                {t("landing.whomParticuliersCta")}
              </Link>
            </div>

            {/* Professionnels */}
            <div className="bg-surface-container-low p-10 rounded-[40px] border border-white/5 flex flex-col h-full">
              <Building2 className="text-primary w-12 h-12 mb-8" />
              <h3 className="font-headline font-bold text-3xl mb-6">{t("landing.whomProfessionnelsTitle")}</h3>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomProfessionnelsItem1")}</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomProfessionnelsItem2")}</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomProfessionnelsItem3")}</span>
                </li>
              </ul>
              <Link to="/professionnels" className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-center hover:bg-primary hover:text-on-primary transition-all">
                {t("landing.whomProfessionnelsCta")}
              </Link>
            </div>

            {/* Entreprises */}
            <div className="bg-surface-container-low p-10 rounded-[40px] border border-white/5 flex flex-col h-full">
              <Banknote className="text-primary w-12 h-12 mb-8" />
              <h3 className="font-headline font-bold text-3xl mb-6">{t("landing.whomEntreprisesTitle")}</h3>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomEntreprisesItem1")}</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomEntreprisesItem2")}</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <CheckCircle className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("landing.whomEntreprisesItem3")}</span>
                </li>
              </ul>
              <Link to="/entreprises" className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-center hover:bg-white hover:text-background transition-all">
                {t("landing.whomEntreprisesCta")}
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
                <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-6 block">{t("landing.b2cTag")}</span>
                <h2 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-none mb-8">
                  {t("landing.b2cTitlePart1")} <br /> <span className="text-primary">{t("landing.b2cTitleAccent")}</span>
                </h2>
                <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                  {t("landing.b2cSubtitle")}
                </p>
                <Link to="/register" className="inline-flex bg-primary text-on-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  {t("landing.b2cCta")}
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
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("landing.b2cIncomingCall")}</div>
                      <div className="text-lg font-bold text-white">{t("landing.b2cCaller1")}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-surface-container-highest p-4 rounded-xl text-sm italic text-slate-400">{t("landing.b2cQuote1")}</div>
                    <div className="bg-primary p-4 rounded-xl text-on-primary font-bold text-center cursor-pointer hover:bg-primary/95 transition-colors">{t("landing.b2cLaunch")}</div>
                  </div>
                </div>

                {/* Mock 2: Conseiller bancaire (à droite, en-dessous) */}
                <div className="absolute bottom-0 right-0 w-[90%] sm:w-[325px] bg-background rounded-3xl p-6 border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500 z-0 hover:z-20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Phone className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("landing.b2cIncomingCall")}</div>
                      <div className="text-lg font-bold text-white">{t("landing.b2cCaller2")}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-surface-container-highest p-4 rounded-xl text-sm italic text-slate-400">{t("landing.b2cQuote2")}</div>
                    <div className="bg-primary p-4 rounded-xl text-on-primary font-bold text-center cursor-pointer hover:bg-primary/95 transition-colors">{t("landing.b2cLaunch")}</div>
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
                      <div className="text-xs font-bold text-on-primary/60 uppercase tracking-widest">{t("landing.b2bCertified")}</div>
                      <div className="text-lg font-bold">{t("landing.b2bCaller")}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-on-primary/10 p-4 rounded-xl">
                      <span className="text-sm font-bold">{t("landing.b2bVerified")}</span>
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="text-center text-[10px] font-bold uppercase tracking-widest opacity-60">{t("landing.b2bTrust")}</div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-on-primary/60 font-bold uppercase tracking-[0.3em] text-xs mb-6 block">{t("landing.b2bTag")}</span>
                <h2 className="font-headline font-black text-4xl sm:text-5xl md:text-7xl tracking-tight leading-none mb-8">
                  {t("landing.b2bTitle")}
                </h2>
                <p className="text-xl text-on-primary/80 mb-12 leading-relaxed">
                  {t("landing.b2bSubtitle")}
                </p>
                <Link to="/pro/register" className="inline-flex bg-on-primary text-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
                  {t("landing.b2bCta")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Enterprise Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs mb-6 block">{t("landing.entTag")}</span>
          <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight mb-12">
            {t("landing.entTitlePart1")} <br /> {t("landing.entTitleAccent")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              t("landing.entItem1"),
              t("landing.entItem2"),
              t("landing.entItem3"),
              t("landing.entItem4")
            ].map((item, i) => (
              <div key={i} className="bg-surface-container-low p-6 rounded-2xl border border-white/5 font-bold">
                {item}
              </div>
            ))}
          </div>
          <p className="text-2xl text-slate-400 mb-12 italic">"{t("landing.entQuote")}"</p>
          <Link to="/company-contact" className="bg-white text-background px-12 py-6 rounded-2xl font-headline font-black text-xl hover:bg-primary hover:text-on-primary transition-all">
            {t("landing.entCta")}
          </Link>
        </div>
      </section>

      {/* Differentiation Section */}
      <section id="differentiation" className="py-32 px-6 bg-surface-container-lowest relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-headline font-black text-5xl md:text-7xl tracking-tight mb-8">
              {t("landing.diffTitlePart1")} <span className="text-primary">{t("landing.diffTitleAccent")}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface-container-low p-12 rounded-[40px] border border-white/5">
              <h3 className="font-headline font-bold text-3xl mb-10 text-slate-500">{t("landing.diffCurrentTitle")}</h3>
              <ul className="space-y-6">
                {[
                  t("landing.diffCurrentItem1"),
                  t("landing.diffCurrentItem2"),
                  t("landing.diffCurrentItem3")
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl text-slate-500 line-through decoration-error/50">
                    <XCircle className="text-error w-6 h-6" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-12 text-error font-bold italic">{t("landing.diffCurrentFooter")}</p>
            </div>
            <div className="bg-primary/5 p-12 rounded-[40px] border border-primary/30">
              <h3 className="font-headline font-bold text-3xl mb-10 text-primary">{t("landing.diffSafeTitle")}</h3>
              <ul className="space-y-6">
                {[
                  t("landing.diffSafeItem1"),
                  t("landing.diffSafeItem2"),
                  t("landing.diffSafeItem3"),
                  t("landing.diffSafeItem4")
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl font-bold">
                    <CheckCircle className="text-primary w-6 h-6" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-12 text-primary font-bold italic">{t("landing.diffSafeFooter")}</p>
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
            {t("landing.aiTitlePart1")} <span className="text-primary">{t("landing.aiTitleAccent")}</span>
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed mb-12">
            {t("landing.aiSubtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 rounded-full bg-surface-container-low border border-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">{t("landing.aiTag1")}</span>
            <span className="px-4 py-2 rounded-full bg-surface-container-low border border-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">{t("landing.aiTag2")}</span>
            <span className="px-4 py-2 rounded-full bg-surface-container-low border border-white/5 text-xs font-bold uppercase tracking-widest text-slate-500">{t("landing.aiTag3")}</span>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 px-6 bg-primary text-on-primary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <h2 className="font-headline font-black text-5xl md:text-8xl tracking-tight leading-[0.8]">
              {t("landing.impTitlePart1")} <span className="text-on-primary/50 italic">{t("landing.impTitleAccent")}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                t("landing.impItem1"),
                t("landing.impItem2"),
                t("landing.impItem3"),
                t("landing.impItem4")
              ].map((item, i) => (
                <div key={i} className="bg-on-primary/10 p-8 rounded-3xl border border-on-primary/20 font-headline font-bold text-xl">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-20 text-center text-sm font-bold uppercase tracking-[1em] opacity-60">{t("landing.impFooter")}</p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-full pointer-events-none">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-[180px]"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="font-headline font-black text-5xl md:text-8xl tracking-tight leading-none mb-12">
            {t("landing.ctaTitlePart1")} <span className="text-primary">{t("landing.ctaTitleAccent")}</span>
          </h2>
          
          <div className="flex flex-col items-center gap-6">
            <Link to="/register" className="w-full sm:w-auto bg-primary text-on-primary px-12 py-8 rounded-[32px] font-headline font-black text-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
              {t("landing.ctaParticulier")}
              <ArrowRight className="w-8 h-8" />
            </Link>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/pro/register" className="text-sm font-bold uppercase tracking-widest bg-surface-container-low px-8 py-4 rounded-2xl border border-white/5 hover:bg-surface-container transition-all">
                {t("landing.ctaPro")}
              </Link>
              <Link to="/company-contact" className="text-sm font-bold uppercase tracking-widest bg-surface-container-low px-8 py-4 rounded-2xl border border-white/5 hover:bg-surface-container transition-all">
                {t("landing.ctaExpert")}
              </Link>
            </div>
          </div>

          <div className="mt-32 grid grid-cols-1 md:grid-cols-4 gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="text-xs font-black uppercase tracking-widest">{t("landing.ctaFooterItem1")}</div>
            <div className="text-xs font-black uppercase tracking-widest">{t("landing.ctaFooterItem2")}</div>
            <div className="text-xs font-black uppercase tracking-widest">{t("landing.ctaFooterItem3")}</div>
            <div className="text-xs font-black uppercase tracking-widest">{t("landing.ctaFooterItem4")}</div>
          </div>
        </div>
      </section>

      {/* Blog / Actualités Section */}
      <section className="py-32 px-6 border-t border-white/5 bg-[#08080a]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
                {t("landing.blogTag")}
              </span>
              <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tight text-white">
                {t("landing.blogTitlePart1")} <span className="text-primary">{t("landing.blogTitleAccent")}</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base">
                {t("landing.blogSubtitle")}
              </p>
            </div>
            <Link 
              to="/actualite" 
              className="text-sm font-bold uppercase tracking-widest text-primary hover:text-white flex items-center gap-2 transition-colors shrink-0"
            >
              {t("landing.blogAll")} <ArrowRight size={16} />
            </Link>
          </div>

          {blogLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : latestArticles.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low border border-white/5 rounded-3xl text-slate-500 text-sm">
              {t("landing.blogEmpty")}
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
                        {art.category === "grand_public" ? t("landing.blogCatPublic") : t("landing.blogCatPro")}
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
                          {t("landing.blogRead")} <ArrowRight size={10} />
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
          <AppLogo className="gap-3" />
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {t("landing.footerCopyright")}
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Link id="footer-privacy-link" to={getPrivacyPath()} className="hover:text-primary transition-colors">{t("common.privacyPolicy")}</Link>
            <a href="#" className="hover:text-primary transition-colors">{t("landing.footerConditions")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("landing.footerMentions")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
