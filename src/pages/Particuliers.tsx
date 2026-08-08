import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Phone, 
  Lock, 
  Cpu,
  BarChart3,
  ChevronDown,
  Users,
  Building2,
  Banknote,
  HelpCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEOManager from "../components/seo/SEOManager";
import AppLogo from "../components/AppLogo";
import LanguageSelector from "../components/LanguageSelector";

export default function Particuliers() {
  const { lang, t } = useLanguage();
  const getPrivacyPath = () => {
    if (lang === "es") return "/privacidad";
    if (lang === "en") return "/privacy";
    return "/confidentialite";
  };
  const getLegalNoticePath = () => {
    if (lang === "es") return "/aviso-legal";
    if (lang === "en") return "/legal-notice";
    return "/mentions-legales";
  };
  const getCguPath = () => {
    if (lang === "es") return "/terminos";
    if (lang === "en") return "/terms";
    return "/cgu";
  };
  const navigate = useNavigate();
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

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: t("particuliers.faq1Q"),
      a: t("particuliers.faq1A")
    },
    {
      q: t("particuliers.faq2Q"),
      a: t("particuliers.faq2A")
    },
    {
      q: t("particuliers.faq3Q"),
      a: t("particuliers.faq3A")
    },
    {
      q: t("particuliers.faq4Q"),
      a: t("particuliers.faq4A")
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <SEOManager 
        title={t("particuliers.seoTitle")}
        description={t("particuliers.seoDesc")}
        keywords={["arnaque téléphonique", "usurpation d'identité au téléphone", "vérifier un appel", "protéger ses proches", "fraude au faux proche", "deepfake voix", "spoofing vocal", "sécurité téléphonique", "SafeCallr"]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": `Particuliers - SafeCallr`,
          "description": t("particuliers.seoDesc"),
          "inLanguage": lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US",
          "publisher": {
            "@type": "Organization",
            "name": "SafeCallr"
          }
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between font-sans">
          <Link to="/" className="flex items-center">
            <AppLogo 
              size={40} 
              textClassName="md:text-2xl" 
              className="gap-2 md:gap-3" 
              iconContainerClassName="shadow-lg shadow-primary/20 rounded-xl" 
            />
          </Link>
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/particuliers" className="text-primary transition-colors">{t("navigation.particuliers") || "Particuliers"}</Link>
            <Link to="/professionnels" className="hover:text-primary transition-colors">{t("navigation.professionnels") || "Professionnels"}</Link>
            <Link to="/entreprises" className="hover:text-primary transition-colors">{t("navigation.entreprises") || "Entreprises"}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <LanguageSelector />

            {/* Connexion Dropdown */}
            <div className="relative" ref={loginRef}>
              <button 
                onClick={() => { setIsLoginOpen(!isLoginOpen); setIsRegisterOpen(false); }}
                className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                {t("navigation.login") || "Connexion"} <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isLoginOpen ? 'rotate-180' : ''}`} />
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
                        <div className="text-sm font-bold">{t("navigation.particulier") || "Particulier"}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("navigation.personalAccess") || "Accès personnel"}</div>
                      </div>
                    </Link>
                    <Link to="/pro/login" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t("navigation.professionnel") || "Professionnel"}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("navigation.proSpace") || "Espace Pro"}</div>
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
                className="bg-primary text-on-primary px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                {t("navigation.register") || "S'inscrire"} <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isRegisterOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isRegisterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-4 w-72 bg-surface-container-low border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
                  >
                    <Link to="/register" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t("navigation.youAreIndividual") || "Vous êtes un particulier"}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("navigation.freeRegistration") || "Inscription gratuite"}</div>
                      </div>
                    </Link>
                    <Link to="/pro/register" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t("navigation.youArePro") || "Vous êtes un pro"}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("navigation.certifiedAccount") || "Compte certifié"}</div>
                      </div>
                    </Link>
                    <Link to="/company-contact" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Banknote className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t("navigation.youAreCompany") || "Vous êtes une entreprise"}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t("navigation.contactUs") || "Nous contacter"}</div>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("particuliers.badge")}</span>
            </div>
            <h1 className="font-headline font-black text-4xl md:text-7xl tracking-tight leading-[1] mb-8">
              {t("particuliers.heroTitle1")} <br />
              <span className="text-primary">{t("particuliers.heroTitle2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-6 leading-relaxed text-left md:text-center">
              {t("particuliers.heroDesc1")}
            </p>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed text-left md:text-center">
              {t("particuliers.heroDesc2")}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center gap-4 mb-20"
          >
            <Link to="/register" className="w-full sm:w-auto bg-primary text-on-primary px-12 py-6 rounded-2xl font-headline font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              {t("particuliers.ctaRegister")}
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BANDE DE CHIFFRES */}
      <section className="py-12 bg-surface-container-lowest border-y border-white/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: t("particuliers.stat1Val"), desc: t("particuliers.stat1Desc"), source: t("particuliers.stat1Src") },
              { value: t("particuliers.stat2Val"), desc: t("particuliers.stat2Desc"), source: t("particuliers.stat2Src") },
              { value: t("particuliers.stat3Val"), desc: t("particuliers.stat3Desc"), source: t("particuliers.stat3Src") },
              { value: t("particuliers.stat4Val"), desc: t("particuliers.stat4Desc"), source: t("particuliers.stat4Src") }
            ].map((stat, i) => (
              <div key={i} className="bg-surface-container-low/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <BarChart3 className="text-primary w-5 h-5 mb-3 opacity-65" />
                  <span className="text-3xl md:text-4xl font-headline font-black text-white block mb-2">{stat.value}</span>
                  <p className="text-slate-400 text-xs leading-relaxed">{stat.desc}</p>
                </div>
                <span className="text-[10px] text-slate-600 mt-4 block">{stat.source}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Le doute n'a pas à exister Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block text-center">{t("particuliers.problemTag")}</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center">
            {t("particuliers.problemTitle")}
          </h2>
          <div className="bg-surface-container-low p-8 md:p-12 rounded-[32px] border border-white/5 space-y-6 text-slate-300 leading-relaxed text-lg">
            <p>
              {t("particuliers.problemDesc1")}
            </p>
            <p>
              {t("particuliers.problemDesc2")}
            </p>
          </div>
        </div>
      </section>

      {/* Comment ça fonctionne Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
            {t("particuliers.solutionTitle")}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                step: t("particuliers.step1Tag"),
                title: t("particuliers.step1Title"),
                desc: t("particuliers.step1Desc")
              },
              {
                step: t("particuliers.step2Tag"),
                title: t("particuliers.step2Title"),
                desc: t("particuliers.step2Desc")
              },
              {
                step: t("particuliers.step3Tag"),
                title: t("particuliers.step3Title"),
                desc: t("particuliers.step3Desc")
              }
            ].map((item, i) => (
              <div key={i} className="bg-surface-container-low p-8 rounded-3xl border border-white/5 relative flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4 block">{item.step}</span>
                  <h3 className="font-headline font-bold text-2xl text-white mb-4">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ce que SafeCallr protège vraiment Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">{t("particuliers.pillarTag")}</span>
            <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-6">
              {t("particuliers.pillarTitle")}
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              {t("particuliers.pillarDesc")}
            </p>
          </div>
          <div className="bg-surface-container-low border border-white/5 p-8 rounded-[32px] space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Shield className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">{t("particuliers.bullet1Title")}</h4>
                <p className="text-slate-400 text-sm">{t("particuliers.bullet1Desc")}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Lock className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">{t("particuliers.bullet2Title")}</h4>
                <p className="text-slate-400 text-sm">{t("particuliers.bullet2Desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pensé pour ceux qui ont le plus à perdre Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center">
            {t("particuliers.compTitle")}
          </h2>
          <div className="bg-primary/5 p-8 md:p-12 rounded-[32px] border border-primary/20 space-y-6 text-slate-300 leading-relaxed text-lg">
            <p>
              {t("particuliers.compDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* UI Callout: Accroche de section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-surface-container-low px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">{t("particuliers.ctaTag")}</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight mb-6">
            {t("particuliers.ctaTitle")}
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            {t("particuliers.ctaSub")}
          </p>
          <Link to="/register" className="inline-flex bg-primary text-on-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            {t("particuliers.ctaBtn")}
          </Link>
        </div>
      </section>

      {/* Questions Fréquentes Accordion */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
          {t("particuliers.faqTitle")}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left p-6 font-bold flex justify-between items-center text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="pr-4">{faq.q}</span>
                <HelpCircle className={`w-5 h-5 text-primary shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="p-6 pt-0 text-slate-400 text-sm leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Cross Navigation */}
      <section className="py-12 bg-surface-container-low border-t border-white/5 text-center px-6">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {t("particuliers.otherProfile")}{" "}
          <Link to="/professionnels" className="text-primary hover:underline ml-1">{t("particuliers.linkPro")}</Link>
          <span className="mx-2 text-slate-600">|</span>
          <Link to="/entreprises" className="text-primary hover:underline">{t("particuliers.linkEnt")}</Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-surface-container-lowest border-t border-white/5 text-slate-400 font-sans text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <AppLogo className="gap-3" />
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            © 2026 SafeCallr Technologies. Tous droits réservés.
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Link to={getCguPath()} className="hover:text-primary transition-colors">{t("common.cgu")}</Link>
            <Link to={getPrivacyPath()} className="hover:text-primary transition-colors">{t("common.privacyPolicy")}</Link>
            <Link to={getLegalNoticePath()} className="hover:text-primary transition-colors">{t("common.legalNotice")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
