import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Lock, 
  Cpu,
  BarChart3,
  ChevronDown,
  Users,
  Building2,
  Banknote,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEOManager from "../components/seo/SEOManager";
import AppLogo from "../components/AppLogo";
import LanguageSelector from "../components/LanguageSelector";

export default function Entreprises() {
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
      q: t("entreprises.faq1Q"),
      a: t("entreprises.faq1A")
    },
    {
      q: t("entreprises.faq2Q"),
      a: t("entreprises.faq2A")
    },
    {
      q: t("entreprises.faq3Q"),
      a: t("entreprises.faq3A")
    },
    {
      q: t("entreprises.faq4Q"),
      a: t("entreprises.faq4A")
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <SEOManager 
        title={t("entreprises.seoTitle")}
        description={t("entreprises.seoDesc")}
        keywords={["fraude au président", "arnaque au faux dirigeant", "sécuriser virements internes", "usurpation CEO", "validation trésorerie", "fraude au faux RH", "FOVI", "ingénierie sociale", "sécurité financière entreprise", "SafeCallr Entreprise"]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": `Entreprises - ${t("entreprises.badge")}`,
          "description": t("entreprises.seoDesc"),
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
            <Link to="/particuliers" className="hover:text-primary transition-colors">{t("navigation.particuliers") || "Particuliers"}</Link>
            <Link to="/professionnels" className="hover:text-primary transition-colors">{t("navigation.professionnels") || "Professionnels"}</Link>
            <Link to="/entreprises" className="text-primary transition-colors">{t("navigation.entreprises") || "Entreprises"}</Link>
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
                    <Link to="/business/register" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Banknote className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold font-headline">{t("navigation.youAreCompany") || "Vous êtes une entreprise"}</div>
                        <div className="text-[10px] text-primary uppercase tracking-widest font-bold">{t("navigation.createOrgOnline") || "Créer mon organisation en ligne"}</div>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("entreprises.badge")}</span>
            </div>
            <h1 className="font-headline font-black text-4xl md:text-7xl tracking-tight leading-[1] mb-8">
              {t("entreprises.heroTitle1")} <br />
              <span className="text-primary font-black">{t("entreprises.heroTitle2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-6 leading-relaxed text-left md:text-center">
              {t("entreprises.heroDesc1")}
            </p>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed text-left md:text-center">
              {t("entreprises.heroDesc2")}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link to="/business/register" className="w-full sm:w-auto bg-[#3DFFA0] text-[#0F1B3D] px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-2xl shadow-[#3DFFA0]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              {t("entreprises.ctaRegister")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/company-contact" className="w-full sm:w-auto bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 px-10 py-5 rounded-2xl font-headline font-semibold text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              {t("entreprises.ctaContact")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BANDE DE CHIFFRES */}
      <section className="py-12 bg-surface-container-lowest border-y border-white/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: t("entreprises.stat1Val"), desc: t("entreprises.stat1Desc"), source: t("entreprises.stat1Src") },
              { value: t("entreprises.stat2Val"), desc: t("entreprises.stat2Desc"), source: t("entreprises.stat2Src") },
              { value: t("entreprises.stat3Val"), desc: t("entreprises.stat3Desc"), source: t("entreprises.stat3Src") },
              { value: t("entreprises.stat4Val"), desc: t("entreprises.stat4Desc"), source: t("entreprises.stat4Src") }
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

      {/* Le problème Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <span className="text-error font-bold uppercase tracking-[0.3em] text-xs mb-4 block text-center">{t("entreprises.problemTag")}</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center text-error">
            {t("entreprises.problemTitle")}
          </h2>
          <div className="bg-surface-container-low p-8 md:p-12 rounded-[32px] border border-white/5 space-y-6 text-slate-300 leading-relaxed text-lg">
            <p>
              {t("entreprises.problemDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Processus Sensibles Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
            {t("entreprises.solutionTitle")}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                title: t("entreprises.step1Title"),
                desc: t("entreprises.step1Desc")
              },
              {
                title: t("entreprises.step2Title"),
                desc: t("entreprises.step2Desc")
              },
              {
                title: t("entreprises.step3Title"),
                desc: t("entreprises.step3Desc")
              }
            ].map((item, i) => (
              <div key={i} className="bg-surface-container-low p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <CheckCircle className="text-primary w-5 h-5" />
                  </div>
                  <h3 className="font-headline font-bold text-2xl text-white mb-4">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture pensées Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">{t("entreprises.pillarTag")}</span>
            <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-6">
              {t("entreprises.pillarTitle")}
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              {t("entreprises.pillarDesc1")}
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              {t("entreprises.pillarDesc2")}
            </p>
          </div>
          <div className="bg-surface-container-low border border-white/5 p-8 rounded-[32px] space-y-6">
            <div className="flex gap-4 items-start pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Cpu className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">{t("entreprises.bullet1Title")}</h4>
                <p className="text-slate-400 text-sm">{t("entreprises.bullet1Desc")}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Lock className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">{t("entreprises.bullet2Title")}</h4>
                <p className="text-slate-400 text-sm">{t("entreprises.bullet2Desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Au-delà de la fraude Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center">
            {t("entreprises.compTitle")}
          </h2>
          <div className="bg-primary/5 p-8 md:p-12 rounded-[32px] border border-primary/20 space-y-6 text-slate-300 leading-relaxed text-lg text-left">
            <p>
              {t("entreprises.compDesc1")}
            </p>
            <p>
              {t("entreprises.compDesc2")}
            </p>
          </div>
        </div>
      </section>

      {/* UI Callout */}
      <section className="py-20 bg-gradient-to-b from-transparent to-surface-container-low px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">{t("entreprises.ctaTag")}</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight mb-6">
            {t("entreprises.ctaTitle")}
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            {t("entreprises.ctaSub")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/business/register" className="inline-flex bg-primary text-on-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              {t("entreprises.ctaBtn")}
            </Link>
            <Link to="/company-contact" className="inline-flex bg-slate-900 border border-white/10 text-slate-300 px-10 py-5 rounded-2xl font-headline font-bold text-xl hover:scale-105 active:scale-95 transition-all">
              {t("entreprises.ctaContactBtn")}
            </Link>
          </div>
        </div>
      </section>

      {/* Questions Fréquentes Accordion */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
          {t("entreprises.faqTitle")}
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
          {t("entreprises.otherProfile")}{" "}
          <Link to="/professionnels" className="text-primary hover:underline ml-1">{t("entreprises.linkPro")}</Link>
          <span className="mx-2 text-slate-600">|</span>
          <Link to="/particuliers" className="text-primary hover:underline">{t("entreprises.linkParticuliers")}</Link>
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
