import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, X, MonitorSmartphone, ChevronRight, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isForced, setIsForced] = useState(false);

  useEffect(() => {
    // Check if iOS (robust detection including modern iPads running on iPadOS in desktop-UA mode)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = 
      /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      (/macintosh/.test(userAgent) && 'ontouchend' in document);
    setIsIOS(isIOSDevice);

    // Check if Android
    const isAndroidDevice = /android/.test(userAgent);
    setIsAndroid(isAndroidDevice);

    // Check if already standalone
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Listen for native beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if dismissed recently (snoozed for 7 days)
      const dismissedTime = localStorage.getItem('install-prompt-dismissed-timestamp');
      let shouldShow = true;
      if (dismissedTime) {
        const ageInDays = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
        if (ageInDays < 7) {
          shouldShow = false;
        }
      }
      
      if (shouldShow) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Custom event to force showing the installation prompt (from custom user actions)
    const handleManualTrigger = () => {
      setIsForced(true);
      setShowPrompt(true);
    };
    window.addEventListener('trigger-safecallr-install', handleManualTrigger);

    // Auto-show logic for iOS or Android fallbacks after a short delay
    const dismissedTime = localStorage.getItem('install-prompt-dismissed-timestamp');
    let hasDismissedRecently = false;
    if (dismissedTime) {
      const ageInDays = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (ageInDays < 7) {
        hasDismissedRecently = true;
      }
    }

    if ((isIOSDevice || isAndroidDevice) && !isStandaloneMode && !hasDismissedRecently) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('trigger-safecallr-install', handleManualTrigger);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('trigger-safecallr-install', handleManualTrigger);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsForced(false);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsForced(false);
    // Snooze future auto-prompts for 7 days
    localStorage.setItem('install-prompt-dismissed-timestamp', Date.now().toString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
      >
        <div className="bg-[#0F1B3D] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          {/* Progress bar simulation for UX */}
          <div className="absolute top-0 left-0 h-1 bg-[#00E676] w-full opacity-50" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            {/* Custom mini-squircle branding logo representation */}
            <div className="bg-[#060B18] p-2 rounded-xl w-12 h-12 flex items-center justify-center shrink-0 border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" className="w-10 h-10">
                <clipPath id="shield-clip-prompt">
                  <path d="M 256,90 L 372,130 C 372,254 302,334 256,372 C 210,334 140,254 140,130 Z" />
                </clipPath>
                <g clipPath="url(#shield-clip-prompt)">
                  <rect x="50" y="50" width="206" height="180" fill="#00E676" />
                  <rect x="256" y="230" width="200" height="200" fill="#00E676" />
                </g>
                <path d="M 256,90 L 372,130 C 372,254 302,334 256,372 C 210,334 140,254 140,130 Z" stroke="#00E676" strokeWidth="24" strokeLinejoin="round" strokeLinecap="round" />
                <line x1="256" y1="95" x2="256" y2="365" stroke="#00E676" strokeWidth="24" />
                <line x1="140" y1="230" x2="372" y2="230" stroke="#00E676" strokeWidth="24" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold leading-tight text-base">Installer l'application</h3>
              <p className="text-white/60 text-xs mt-1">
                Installez SafeCallr sur votre écran d'accueil pour sécuriser vos appels professionnels en temps réel.
              </p>
            </div>
          </div>

          {/* Conditional Prompt Content based on device type and prompt availability */}
          {(!isIOS && deferredPrompt) ? (
            /* Android/Chrome with Native Support */
            <button
              onClick={handleInstallClick}
              className="w-full bg-[#00E676] text-[#0F1B3D] font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#00E676]/20"
            >
              Installer l'application
              <ChevronRight size={18} />
            </button>
          ) : isIOS ? (
            /* iOS Custom Instruction Modal */
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-3.5 space-y-3">
                <div className="flex items-start gap-3 text-xs text-white/80 leading-relaxed">
                  <div className="bg-[#00E676]/20 text-[#00E676] w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">1</div>
                  <div className="flex flex-wrap items-center gap-1">
                    Appuyez sur le bouton de partage <Share size={14} className="text-[#00E676] inline" /> dans Safari ou le menu de votre navigateur.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-white/80 leading-relaxed">
                  <div className="bg-[#00E676]/20 text-[#00E676] w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">2</div>
                  <div>
                    Défilez et sélectionnez <span className="font-bold text-white">"Sur l'écran d'accueil"</span>.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-white/80 leading-relaxed">
                  <div className="bg-[#00E676]/20 text-[#00E676] w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">3</div>
                  <div>
                    Confirmez en appuyant sur <span className="font-bold text-[#00E676]">"Ajouter"</span> en haut à droite.
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-1">
                <div className="animate-bounce">
                  <PlusSquare size={28} className="text-[#00E676]" />
                </div>
              </div>
            </div>
          ) : (
            /* Android Fallback / Manual Guide for Unsupported Browsers (or before beforeinstallprompt fires) */
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-3.5 space-y-3">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Installation manuelle</p>
                <div className="flex items-start gap-3 text-xs text-white/80 leading-relaxed">
                  <div className="bg-[#00E676]/20 text-[#00E676] w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">1</div>
                  <div className="flex flex-wrap items-center gap-1">
                    Appuyez sur le menu <MoreVertical size={14} className="text-[#00E676] inline" /> (trois points) en haut à droite de Google Chrome ou Firefox.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-white/80 leading-relaxed">
                  <div className="bg-[#00E676]/20 text-[#00E676] w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">2</div>
                  <div>
                    Sélectionnez <span className="font-bold text-white">"Installer l'application"</span> ou <span className="font-bold text-white">"Ajouter à l'écran d'accueil"</span>.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-white/80 leading-relaxed">
                  <div className="bg-[#00E676]/20 text-[#00E676] w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">3</div>
                  <div>
                    Confirmez l'installation pour créer le raccourci SafeCallr.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
