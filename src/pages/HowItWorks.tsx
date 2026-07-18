import { useState, useEffect } from "react";
import { Shield, Smartphone, Bell, CheckCircle, Share, Plus, ArrowUpSquare, Laptop } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SEOManager from "../components/seo/SEOManager";
import { useLanguage } from "../contexts/LanguageContext";

export default function HowItWorks() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyToInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsReadyToInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(t("howItWorks.pwaAlertNotSupported"));
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsReadyToInstall(false);
  };

  const steps = [
    {
      icon: Smartphone,
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Desc"),
    },
    {
      icon: Bell,
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Desc"),
    },
    {
      icon: CheckCircle,
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Desc"),
    },
    {
      icon: Shield,
      title: t("howItWorks.step4Title"),
      description: t("howItWorks.step4Desc"),
    },
  ];

  return (
    <div className="space-y-12 pb-12 w-full max-w-2xl mx-auto">
      <SEOManager 
        title={t("howItWorks.seoTitle")}
        description={t("howItWorks.seoDesc")}
      />
      
      <section className="space-y-4 pt-8">
        <h1 className="font-headline font-extrabold text-3xl md:text-5xl tracking-tight text-on-surface leading-tight">
          {t("howItWorks.titlePart1")}<span className="text-primary">{t("howItWorks.titlePart2")}</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg leading-relaxed">
          {t("howItWorks.subtitle")}
        </p>
      </section>

      <div className="space-y-12">
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-6 items-start"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <step.icon className="text-primary w-7 h-7" />
              </div>
              {i < steps.length - 1 && <div className="w-0.5 h-16 bg-surface-container-highest rounded-full"></div>}
            </div>
            <div className="space-y-3 pt-2">
              <h2 className="font-headline font-bold text-xl text-on-surface">{step.title}</h2>
              <p className="text-slate-400 text-base leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface-container-low p-8 md:p-10 rounded-[32px] border border-white/5 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="text-primary w-8 h-8" />
          <h2 className="font-headline font-bold text-2xl text-on-surface">{t("howItWorks.securityTitle")}</h2>
        </div>
        <p className="text-slate-400 text-base leading-relaxed">
          {t("howItWorks.securityDesc")}
        </p>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{t("howItWorks.securityEncryption")}</p>
            <p className="text-xl font-headline font-bold text-primary">AES-256</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{t("howItWorks.securityMethod")}</p>
            <p className="text-xl font-headline font-bold text-primary">{t("howItWorks.securityMethodValue")}</p>
          </div>
        </div>
      </div>

      {/* PWA Install Component */}
      <div className="bg-surface-container-low p-8 md:p-10 rounded-[32px] border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center shrink-0 border border-[#22c55e]/20">
            <Smartphone className="text-[#22c55e] w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="font-headline font-bold text-2xl text-on-surface text-left">{t("howItWorks.pwaTitle")}</h2>
            <p className="text-slate-400 text-sm leading-relaxed text-left">
              {t("howItWorks.pwaSubtitle")}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 bg-surface-container-highest rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'ios'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t("howItWorks.pwaIosTab")}
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'android'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Laptop className="w-4 h-4" /> {t("howItWorks.pwaAndroidTab")}
          </button>
        </div>

        {/* Dynamic Details with Motion */}
        <div className="min-h-[180px] bg-white/[0.02] border border-white/5 rounded-[24px] p-6 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'ios' ? (
              <motion.div
                key="ios-instructions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 text-left">{t("howItWorks.pwaIosTitle")}</p>
                
                <div className="space-y-3">
                  <div className="flex gap-4 items-start text-left">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white leading-none">1</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed pt-0.5">
                      {t("howItWorks.pwaIosStep1")}
                    </p>
                  </div>

                  <div className="flex gap-4 items-start text-left">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white leading-none">2</span>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed pt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>{t("howItWorks.pwaIosStep2Part1")}</span>
                      <span className="inline-flex items-center gap-1 bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white uppercase font-bold tracking-tight">
                        <Share className="w-3 h-3" /> {t("howItWorks.pwaIosStep2Part2")}
                      </span>
                      <span>{t("howItWorks.pwaIosStep2Part3")}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start text-left">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white leading-none">3</span>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed pt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>{t("howItWorks.pwaIosStep3Part1")}</span>
                      <span className="inline-flex items-center gap-1 bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-xs font-medium text-white uppercase tracking-tight">
                        <Plus className="w-3 h-3" /> {t("howItWorks.pwaIosStep3Part2")}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="android-instructions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 flex flex-col justify-between h-full"
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{t("howItWorks.pwaAndroidTitle")}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {t("howItWorks.pwaAndroidDesc")}
                  </p>
                </div>

                <div className="pt-2">
                  {isInstalled ? (
                    <div className="inline-flex items-center gap-2 text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-4 py-2.5 rounded-xl w-full justify-center">
                      <span className="text-sm font-bold">{t("howItWorks.pwaInstalled")}</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={handleInstallClick}
                        className="w-full relative flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#22c55e] hover:bg-[#22c55e]/90 text-black font-extrabold text-sm md:text-base tracking-wide transition-all duration-300 shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:scale-[1.01]"
                      >
                        <Plus className="w-5 h-5 stroke-[px]" />
                        {t("howItWorks.pwaInstallBtn")}
                      </button>

                      <div className="text-center">
                        <p className="text-[11px] text-slate-500 italic">
                          {t("howItWorks.pwaAndroidFallback")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-center text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">
        SafeCallr Documentation v4.0
      </p>
    </div>
  );
}
