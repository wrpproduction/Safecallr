import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function Particuliers() {
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
      q: "SafeCallr écoute-t-il mes appels ?",
      a: "Non. SafeCallr ne passe pas par votre communication téléphonique et n'y accède pas. Il fournit une confirmation d'identité indépendante, en parallèle de l'appel."
    },
    {
      q: "Mes proches doivent-ils aussi installer l'application ?",
      a: "Oui. La protection repose sur un lien établi entre des personnes qui utilisent toutes SafeCallr. C'est précisément ce lien qui empêche un usurpateur de se faire passer pour l'un d'eux."
    },
    {
      q: "SafeCallr est-il vulnérable aux deepfakes voix ?",
      a: "Non. La vérification ne repose pas sur la reconnaissance de la voix — qui, elle, peut être clonée — mais sur un code unique partagé en temps réel. Un deepfake ne peut pas connaître ce code."
    },
    {
      q: "Que se passe-t-il si les codes ne correspondent pas ?",
      a: "C'est le signal qu'il faut interrompre l'échange. Une non-correspondance indique que l'interlocuteur n'est pas le proche que vous pensiez."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <SEOManager 
        title="Vérifier qu'un appel vient bien d'un proche"
        description="Et si la voix au téléphone n'était pas celle de votre proche ? SafeCallr vous permet de confirmer en un geste l'identité de vos proches lors d'un appel. Protégez votre famille contre l'usurpation et les arnaques téléphoniques."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Particuliers - SafeCallr",
          "description": "Protégez votre famille et vos proches contre le spoofing et la fraude téléphonique de faux conseillers.",
          "keywords": "arnaque téléphonique, usurpation d'identité au téléphone, vérifier un appel, protéger ses proches, fraude au faux proche, deepfake voix"
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between font-sans">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Shield className="text-on-primary w-6 h-6" />
            </div>
            <span className="font-headline font-black text-xl md:text-2xl tracking-tighter text-primary">SafeCallr</span>
          </Link>
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/particuliers" className="text-primary transition-colors">Particuliers</Link>
            <Link to="/professionnels" className="hover:text-primary transition-colors">Professionnels</Link>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Espace Particuliers</span>
            </div>
            <h1 className="font-headline font-black text-4xl md:text-7xl tracking-tight leading-[1] mb-8">
              La voix au téléphone est-elle <br />
              <span className="text-primary">vraiment celle de votre proche ?</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-6 leading-relaxed text-left md:text-center">
              Un appel pressant. La voix d'un proche, d'un enfant, d'un conseiller en qui vous avez confiance. Une demande urgente. Aujourd'hui, rien ne vous permet d'en être certain — un numéro s'usurpe, une voix s'imite, même par IA.
            </p>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed text-left md:text-center">
              SafeCallr lève le doute en un geste. Lorsqu'un proche vous appelle, vous confirmez son identité instantanément, depuis votre téléphone. Plus de tension, plus de "et si".
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center gap-4 mb-20"
          >
            <Link to="/register" className="w-full sm:w-auto bg-primary text-on-primary px-12 py-6 rounded-2xl font-headline font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              S'inscrire maintenant
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
              { value: "4,5 Md€", desc: "préjudice des escroqueries en France en 2023, soit le double de 2016", source: "SSMSI / Ministère de l'Intérieur, 2024" },
              { value: "411 700", desc: "victimes recensées en France en 2023, +7,3 %/an", source: "SSMSI, 2024" },
              { value: "1 sur 10", desc: "seule une victime sur dix porte plainte : le préjudice réel est bien supérieur", source: "SSMSI, 2024" },
              { value: "+1 633 %", desc: "explosion du vishing (hameçonnage vocal par IA) au T1 2025", source: "Pindrop, 2025" }
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
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block text-center">Sagesse & Sécurité</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center">
            Le doute n'a pas à exister
          </h2>
          <div className="bg-surface-container-low p-8 md:p-12 rounded-[32px] border border-white/5 space-y-6 text-slate-300 leading-relaxed text-lg">
            <p>
              La plupart d'entre nous y avons déjà pensé : convenir d'un mot de passe secret avec son conjoint ou ses enfants, "au cas où". Y penser est une chose. Avoir l'outil qui le rend automatique, fiable et toujours disponible en est une autre — c'est un point de tension en moins, pour de bon.
            </p>
            <p>
              SafeCallr transforme cette idée en une protection concrète, sans effort de mémoire et sans risque qu'un proche oublie le code.
            </p>
          </div>
        </div>
      </section>

      {/* Comment ça fonctionne Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
            Comment ça fonctionne
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                step: "Étape 1",
                title: "Vous reliez vos proches",
                desc: "Vous ajoutez les personnes de confiance à protéger : conjoint, enfants, parents. Ce lien s'établit avec eux directement — c'est ce qui garantit que personne ne peut s'insérer dans le cercle."
              },
              {
                step: "Étape 2",
                title: "Un appel arrive",
                desc: "Lors d'un appel sensible, l'un de vous déclenche une demande de confirmation depuis l'application."
              },
              {
                step: "Étape 3",
                title: "Vous confirmez en un geste",
                desc: "Un code unique s'affiche. Il est lu à voix haute et confirmé dans l'instant. Si les codes correspondent, c'est bien la bonne personne. Sinon, vous savez immédiatement qu'il faut raccrocher."
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
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Notre engagement</span>
            <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-6">
              Ce que SafeCallr protège vraiment
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              SafeCallr ne prétend pas filtrer les inconnus. Il fait quelque chose de plus précieux : il garantit que la personne au bout du fil est bien le proche que vous avez relié, et non quelqu'un qui usurpe son numéro ou imite sa voix. C'est la certitude sur les appels qui comptent le plus.
            </p>
          </div>
          <div className="bg-surface-container-low border border-white/5 p-8 rounded-[32px] space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Shield className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Garantie contre le Vishing (Voix IA)</h4>
                <p className="text-slate-400 text-sm">Le clonage de voix ne peut rien contre la cryptographie de codes uniques en temps réel.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Lock className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Cercle de confiance fermé</h4>
                <p className="text-slate-400 text-sm">Seuls les profils explicitement liés peuvent s'authentifier mutuellement, rendant les usurpations vaines.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pensé pour ceux qui ont le plus à perdre Section */}
      <section className="py-24 px-6 bg-surface-container-lowest border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-center">
            Pensé pour ceux qui ont le plus à perdre
          </h2>
          <div className="bg-primary/5 p-8 md:p-12 rounded-[32px] border border-primary/20 space-y-6 text-slate-300 leading-relaxed text-lg">
            <p>
              Les fraudes téléphoniques les plus dévastatrices visent les transactions importantes, les virements urgents, les décisions familiales ou patrimoniales. Plus l'enjeu est élevé, plus l'usurpation d'un proche ou d'un conseiller peut coûter cher. SafeCallr apporte cette sérénité de fond : la quasi-certitude, en continu, que vos appels importants sont protégés.
            </p>
          </div>
        </div>
      </section>

      {/* UI Callout: Accroche de section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-surface-container-low px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Démarrez maintenant</span>
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight mb-6">
            Inscrivez-vous et activez votre protection
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Ne prenez plus jamais un appel "à l'aveugle". Avec SafeCallr, vous protégez vos proches, vérifiez un conseiller bancaire et sécurisez un appel suspect.
          </p>
          <Link to="/register" className="inline-flex bg-primary text-on-primary px-10 py-5 rounded-2xl font-headline font-black text-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            S'inscrire maintenant
          </Link>
        </div>
      </section>

      {/* Questions Fréquentes Accordion */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tight text-center mb-16">
          Questions fréquentes
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
          Vous êtes un professionnel ou une entreprise ?{" "}
          <Link to="/professionnels" className="text-primary hover:underline ml-1">Découvrez SafeCallr Pro</Link>
          <span className="mx-2 text-slate-600">|</span>
          <Link to="/entreprises" className="text-primary hover:underline">SafeCallr Entreprise</Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-surface-container-lowest border-t border-white/5 text-slate-400 font-sans text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
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
            <Link to="/confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            <Link to="/cgu" className="hover:text-primary transition-colors">Conditions</Link>
            <Link to="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
