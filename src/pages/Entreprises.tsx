import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function Entreprises() {
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
      q: "Qu'est-ce que la fraude au président ?",
      a: "C'est une escroquerie où un fraudeur usurpe l'identité d'un dirigeant pour ordonner un virement ou une action sensible, en jouant sur l'autorité et l'urgence. SafeCallr neutralise le levier central de cette fraude : l'incapacité à vérifier l'identité de l'appelant."
    },
    {
      q: "Comment SafeCallr s'intègre-t-il à nos procédures existantes ?",
      a: "SafeCallr ajoute une étape de vérification d'identité aux moments sensibles que vous définissez (virements, accès, décisions), sans remplacer vos contrôles financiers."
    },
    {
      q: "Qui peut être authentifié ?",
      a: "Tout collaborateur enrôlé dans l'organisation, dans les deux sens — un subordonné peut vérifier un dirigeant, et inversement."
    },
    {
      q: "Le déploiement est-il lourd pour nos équipes ?",
      a: "Non. L'enrôlement est piloté de façon centralisée et la vérification se fait en un geste, au moment où elle est utile."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <SEOManager 
        title="Protéger votre entreprise contre la fraude au président & usurpation"
        description="Validez en interne l'identité de vos dirigeants et collaborateurs avant tout virement ou décision critique. SafeCallr Entreprise neutralise la fraude au président (FOVI), l'usurpation d'identité interne et l'ingénierie sociale en un geste."
        keywords={["fraude au président", "arnaque au faux dirigeant", "sécuriser virements internes", "usurpation CEO", "validation trésorerie", "fraude au faux RH", "FOVI", "ingénierie sociale", "sécurité financière entreprise", "SafeCallr Entreprise"]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Entreprises - SafeCallr Entreprise",
          "description": "Validez en interne l'identité de vos dirigeants et collaborateurs avant tout virement ou décision stratégique.",
          "inLanguage": "fr-FR",
          "publisher": {
            "@type": "Organization",
            "name": "SafeCallr"
          },
          "keywords": "fraude au président, arnaque au faux dirigeant, sécuriser virements internes, usurpation CEO, validation trésorerie, fraude au faux RH, FOVI, ingénierie sociale"
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
            <Link to="/particuliers" className="hover:text-primary transition-colors">Particuliers</Link>
            <Link to="/professionnels" className="hover:text-primary transition-colors">Professionnels</Link>
            <Link to="/entreprises" className="text-primary transition-colors">Entreprises</Link>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {/* Connexion Dropdown */}
            <div className="relative" ref={loginRef}>
              <button 
                onClick={() => { setIsLoginOpen(!isLoginOpen); setIsRegisterOpen(false); }}
                className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
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
                className="bg-primary text-on-primary px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
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
                    <Link to="/register" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Vous êtes un particulier</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Inscription gratuite</div>
                      </div>
                    </Link>
                    <Link to="/pro/register" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Vous êtes un pro</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Compte certifié</div>
                      </div>
                    </Link>
                    <Link to="/business/register" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Banknote className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold font-headline">Vous êtes une entreprise</div>
                        <div className="text-[10px] text-primary uppercase tracking-widest font-bold">Créer mon organisation en ligne</div>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Espace Entreprise</span>
            </div>
            <h1 className="font-headline font-black text-4xl md:text-7xl tracking-tight leading-[1] mb-8">
              La fraude au président commence par un appel. <br />
              <span className="text-primary font-black">Mettez-y fin.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-6 leading-relaxed text-left md:text-center">
              "C'est le PDG. J'ai besoin que tu valides ce virement, tout de suite, et de façon confidentielle." Chaque année, ce scénario coûte des sommes considérables aux entreprises. L'arme du fraudeur est simple : usurper l'identité d'un dirigeant ou d'un collègue au téléphone.
            </p>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed text-left md:text-center">
              SafeCallr Entreprise permet à vos équipes de vérifier, en un geste, que l'interlocuteur est bien celui qu'il prétend être — avant tout acte sensible.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link to="/business/register" className="w-full sm:w-auto bg-[#3DFFA0] text-[#0F1B3D] px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-2xl shadow-[#3DFFA0]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              Créer votre espace Business
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/company-contact" className="w-full sm:w-auto bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 px-10 py-5 rounded-2xl font-headline font-semibold text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              Contacter un expert
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BANDE DE CHIFFRES */}
      <section className="py-12 bg-surface-container-lowest border-y border-white/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "≈ 500 000 $", desc: "perte moyenne par incident de deepfake en entreprise", source: "Pindrop, 2025" },
              { value: "T1 2025 > 2024", desc: "les incidents de deepfake détectés sur le seul 1er trimestre 2025 dépassent déjà tout 2024", source: "Pindrop, 2025" },
              { value: "+1 633 %", desc: "vishing (usurpation vocale par IA) au T1 2025", source: "Pindrop, 2025" },
              { value: "40 Md $", desc: "fraude dopée à l'IA générative projetée en 2027, contre 12,3 Md $ en 2023", source: "Deloitte, 2024" }
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
          <span className="text-error font-bold uppercase tracking-[0.3em] text-xs mb-4 block text-center">Facteurs de Risques</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center text-error">
            Une menace qui exploite la hiérarchie et l'urgence
          </h2>
          <div className="bg-surface-container-low p-8 md:p-12 rounded-[32px] border border-white/5 space-y-6 text-slate-300 leading-relaxed text-lg">
            <p>
              La fraude au président, l'usurpation d'un membre de la direction ou d'un service support repose toujours sur le même levier : une autorité apparente, un sentiment d'urgence, et l'impossibilité de vérifier l'identité de l'appelant.
            </p>
            <p>
              Vos procédures financières peuvent être solides — elles restent vulnérables tant qu'un simple appel suffit à les contourner.
            </p>
          </div>
        </div>
      </section>

      {/* Processus Sensibles Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
            La vérification d'identité, intégrée à vos processus sensibles
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Validation des virements & trésorerie",
                desc: "Avant d'exécuter un ordre reçu par téléphone, le collaborateur confirme l'identité du demandeur. Aucune correspondance, aucune exécution."
              },
              {
                title: "Authentification entre collaborateurs",
                desc: "Direction, RH, finance, IT : chaque échange sensible peut être authentifié, dans les deux sens, entre membres de l'organisation."
              },
              {
                title: "Sécurisation support & réinitialisations",
                desc: "Les attaques par ingénierie sociale visant le helpdesk (réinitialisation de MFA, accès comptes) sont neutralisées par une vérification d'identité préalable."
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
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Déploiement simple</span>
            <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-6">
              Une architecture pensée pour l'organisation
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              SafeCallr Entreprise s'appuie sur une hiérarchie d'administration claire : un référent pilote le déploiement, les collaborateurs sont enrôlés de façon contrôlée, et l'employeur agit comme autorité de confiance pour valider les identités internes. La protection se déploie de haut en bas, sans dépendre de l'adoption volontaire de chacun.
            </p>
          </div>
          <div className="bg-surface-container-low border border-white/5 p-8 rounded-[32px] space-y-6">
            <div className="flex gap-4 items-start pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Cpu className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Contrôle centralisé</h4>
                <p className="text-slate-400 text-sm">Gestion globale de l'annuaire de vos collaborateurs et de leurs pièces certifiées.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Lock className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Preuve asymétrique</h4>
                <p className="text-slate-400 text-sm">Protocole cryptographique hautement sécurisé pour l'échange de jetons d'identité.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Au-delà de la fraude Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center">
            Au-delà de la fraude : une culture de confiance vérifiable
          </h2>
          <div className="bg-primary/5 p-8 md:p-12 rounded-[32px] border border-primary/20 space-y-6 text-slate-300 leading-relaxed text-lg text-left">
            <p>
              Donner à vos équipes le moyen de vérifier une identité, c'est aussi les autoriser à dire "je vérifie" sans crainte de froisser une hiérarchie.
            </p>
            <p>
              SafeCallr transforme la vérification en réflexe légitime plutôt qu'en marque de défiance — la meilleure protection contre l'ingénierie sociale.
            </p>
          </div>
        </div>
      </section>

      {/* UI Callout */}
      <section className="py-20 bg-gradient-to-b from-transparent to-surface-container-low px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Sécurité des Dirigeants</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight mb-6">
            Neutralisez la fraude présidentielle
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Discutez avec nos spécialistes et découvrez à quel point l'intégration de SafeCallr au sein de vos procédures financières est rapide.
          </p>
          <Link to="/company-contact" className="inline-flex bg-primary text-on-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            Contacter un expert
          </Link>
        </div>
      </section>

      {/* Questions Fréquentes Accordion */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
          Questions fréquentes (Entreprises)
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
          Vous êtes un professionnel libéral ?{" "}
          <Link to="/professionnels" className="text-primary hover:underline ml-1">Découvrez SafeCallr Pro</Link>
          <span className="mx-2 text-slate-600">|</span>
          <Link to="/particuliers" className="text-primary hover:underline">SafeCallr Particuliers</Link>
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
            <Link to="/confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            <Link to="/cgu" className="hover:text-primary transition-colors">Conditions</Link>
            <Link to="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
