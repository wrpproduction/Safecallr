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

export default function Professionnels() {
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
      q: "En quoi SafeCallr est différent d'un outil d'authentification client ?",
      a: "La plupart des outils vérifient que le client est bien le client. SafeCallr vérifie que le professionnel est bien le professionnel — c'est l'angle que les fraudes au faux conseiller exploitent."
    },
    {
      q: "Un fraudeur peut-il créer un faux compte professionnel ?",
      a: "Non. L'accès professionnel n'est ouvert qu'après vérification auprès d'autorités officielles (KBIS, chambres, registres). C'est la barrière centrale du dispositif."
    },
    {
      q: "Comment se passe l'inscription ?",
      a: "Vous créez votre compte Pro en ligne. Votre statut professionnel est ensuite vérifié manuellement avant activation — c'est cette étape qui garantit qu'aucune identité professionnelle ne peut être usurpée."
    },
    {
      q: "Est-ce compatible avec nos obligations de conformité ?",
      a: "SafeCallr s'inscrit dans une démarche de protection du client et de lutte contre la fraude, en complément des dispositifs réglementaires existants. Nous accompagnons chaque déploiement institutionnel."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <SEOManager 
        title="Prouver votre identité professionnelle à vos clients au téléphone"
        description="Banquiers, notaires, gestionnaires de patrimoine et conseillers : prouvez en temps réel à vos clients que c'est bien vous au téléphone. SafeCallr Pro élimine l'usurpation de votre identité professionnelle."
        keywords={["usurpation conseiller bancaire", "fraude au faux conseiller", "authentification professionnelle téléphone", "spoofing notaire", "vishing", "sécuriser appels clients", "conseiller financier", "gérant de patrimoine", "SafeCallr Pro"]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Professionnels - SafeCallr Pro",
          "description": "Banquiers, notaires, gestionnaires de patrimoine : prouvez à vos clients de manière infalsifiable que c'est bien vous qui les appelez.",
          "inLanguage": "fr-FR",
          "publisher": {
            "@type": "Organization",
            "name": "SafeCallr"
          },
          "keywords": "usurpation conseiller bancaire, fraude au faux conseiller, authentification professionnelle téléphone, spoofing notaire, vishing, sécuriser appels clients"
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
            <Link to="/professionnels" className="text-primary transition-colors">Professionnels</Link>
            <Link to="/entreprises" className="hover:text-primary transition-colors">Entreprises</Link>
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
                    <Link to="/company-contact" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Banknote className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Vous êtes une entreprise</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Nous contacter</div>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Espace Professionnel (Pro)</span>
            </div>
            <h1 className="font-headline font-black text-4xl md:text-7xl tracking-tight leading-[1] mb-8">
              Prouvez à vos clients <br />
              <span className="text-primary">que c'est bien vous</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-6 leading-relaxed text-left md:text-center">
              Vos clients reçoivent des appels d'escrocs se faisant passer pour vous — leur banquier, leur notaire, leur conseiller. Les conséquences sont lourdes : virements frauduleux, perte de confiance, responsabilité engagée.
            </p>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed text-left md:text-center">
              SafeCallr Pro inverse la logique de la fraude. Lors d'un appel, vous prouvez votre identité professionnelle à votre client en un geste. L'usurpation de votre identité devient impossible.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center gap-4 mb-20"
          >
            <Link to="/pro/register" className="w-full sm:w-auto bg-primary text-on-primary px-12 py-6 rounded-2xl font-headline font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              Créer votre compte Pro
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
              { value: "4,5 Md€", desc: "préjudice des escroqueries en France en 2023, ×2 depuis 2016", source: "SSMSI, 2024" },
              { value: "Plus gros montants", desc: "l'usurpation (faux conseiller, faux support) concentre, avec l'investissement, les pertes unitaires les plus élevées", source: "FTC, 2024" },
              { value: "+1 633 %", desc: "vishing (usurpation vocale par IA) au T1 2025", source: "Pindrop, 2025" },
              { value: "4 %", desc: "seule fraction des fonds escroqués qui est récupérée", source: "GASA, 2024" }
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
          <span className="text-error font-bold uppercase tracking-[0.3em] text-xs mb-4 block text-center">Le Constat d'Urgence</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center text-error">
            Le problème : tout le monde peut se faire passer pour vous
          </h2>
          <div className="bg-surface-container-low p-8 md:p-12 rounded-[32px] border border-white/5 space-y-6 text-slate-300 leading-relaxed text-lg">
            <p>
              Un numéro affiché se falsifie. Un nom s'annonce. Aujourd'hui, votre client n'a aucun moyen fiable de vérifier que l'appel "de sa banque" vient réellement de sa banque. Les fraudeurs l'exploitent — et c'est vous, et votre établissement, qui en portez les conséquences.
            </p>
          </div>
        </div>
      </section>

      {/* La solution Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
            La solution : une preuve d'identité que le fraudeur ne peut pas reproduire
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                step: "Étape 1",
                title: "Vous déclenchez la vérification",
                desc: "Pendant l'appel, vous lancez une demande de confirmation depuis votre tableau de bord."
              },
              {
                step: "Étape 2",
                title: "Votre client reçoit un code",
                desc: "Une notification arrive sur l'application de votre client, avec un code unique."
              },
              {
                step: "Étape 3",
                title: "Vous lisez le code à voix haute",
                desc: "Le code que vous annoncez correspond à celui reçu par le client. La preuve est faite, instantanément. Un usurpateur, lui, n'a jamais accès à ce code."
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

      {/* Le cœur du dispositif Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Notre piliers</span>
            <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-6">
              Le cœur du dispositif : un statut professionnel non usurpable
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              La force de SafeCallr ne réside pas dans le code lui-même, mais dans la rigueur de l'enrôlement. Votre statut professionnel est vérifié auprès d'autorités réelles — extrait KBIS, chambres professionnelles, registres réglementés, employeur bancaire.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              Résultat : il est structurellement impossible pour un fraudeur de se créer une identité professionnelle SafeCallr. C'est ce qui distingue une vraie preuve d'identité d'un simple gadget technique.
            </p>
          </div>
          <div className="bg-surface-container-low border border-white/5 p-8 rounded-[32px] space-y-6">
            <div className="flex gap-4 items-start pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Rigueur d'enrôlement</h4>
                <p className="text-slate-400 text-sm">Contrôle strict des pièces officielles Kbis, RPT, SIRET ou appartenance aux chambres.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Lock className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Protection de Marque</h4>
                <p className="text-slate-400 text-sm">Vos conseillers et collaborateurs sont rattachés à votre espace d'entreprise sécurisé.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complémentaire à vos dispositifs Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center">
            Complémentaire à vos dispositifs existants
          </h2>
          <div className="bg-primary/5 p-8 md:p-12 rounded-[32px] border border-primary/20 space-y-6 text-slate-300 leading-relaxed text-lg text-left">
            <p>
              SafeCallr ne remplace pas vos outils — il comble un angle mort. Des solutions comme Sécur'Pass authentifient le client auprès du professionnel.
            </p>
            <p>
              SafeCallr fait l'inverse : il authentifie le professionnel auprès du client. Les deux logiques se complètent et couvrent ensemble les deux sens de la relation téléphonique.
            </p>
          </div>
        </div>
      </section>

      {/* Pensé pour les secteurs exposés Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8">
            Pensé pour les secteurs exposés
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed max-w-3xl mx-auto mb-10">
            Banques, notaires, gestion de patrimoine, assurance, expertise comptable, cabinets d'avocats : partout où un appel peut déclencher une décision financière, l'usurpation de votre identité est une menace. SafeCallr Pro s'adresse aux professions où la confiance dans l'identité de l'appelant a une valeur directe.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Banques", "Notaires", "Gestion de Patrimoine", "Assurances", "Expertise Comptable", "Avocats"].map((tag, idx) => (
              <span key={idx} className="px-5 py-3 rounded-xl bg-surface-container-low border border-white/5 text-sm font-bold text-slate-300">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* UI Callout */}
      <section className="py-20 bg-gradient-to-b from-transparent to-surface-container-low px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Protégez votre marque</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight mb-6">
            Rassurez vos clients dès aujourd'hui
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Sécurisez vos transactions sensibles. Offrez un bouclier anti-spoofing d'une efficacité structurelle éprouvée.
          </p>
          <Link to="/pro/register" className="inline-flex bg-primary text-on-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            Créer votre compte Pro
          </Link>
        </div>
      </section>

      {/* Questions Fréquentes Accordion */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
          Questions fréquentes (Professionnels)
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
          Autre profil ?{" "}
          <Link to="/particuliers" className="text-primary hover:underline ml-1">Découvrez SafeCallr Particuliers</Link>
          <span className="mx-2 text-slate-600">|</span>
          <Link to="/entreprises" className="text-primary hover:underline">SafeCallr Entreprise</Link>
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
