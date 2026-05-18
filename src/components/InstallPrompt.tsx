import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, X, MonitorSmartphone, ChevronRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if already standalone
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Skip if already installed
    if (isStandaloneMode) return;

    // Check if dismissed before
    const isDismissed = localStorage.getItem('install-prompt-dismissed');
    if (isDismissed) return;

    // Listen for Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show after a short delay
    if (isIOSDevice && !isStandaloneMode) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
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
          <div className="absolute top-0 left-0 h-1 bg-[#3DFFA0] w-full opacity-50" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="bg-[#1A2C5A] p-3 rounded-xl">
              <MonitorSmartphone className="text-[#3DFFA0]" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold leading-tight">Installer SafeCallr</h3>
              <p className="text-white/60 text-sm mt-1">
                Accédez instantanément à la sécurité et recevez vos notifications d'authentification.
              </p>
            </div>
          </div>

          {!isIOS ? (
            <button
              onClick={handleInstallClick}
              className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Installer maintenant
              <ChevronRight size={18} />
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <div className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div className="flex items-center gap-1">
                    Appuyez sur <Share size={16} className="text-blue-400" /> dans le menu Safari
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <div className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div className="flex items-center gap-1">
                    Choisissez <span className="font-bold">"Sur l'écran d'accueil"</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <div className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div className="flex items-center gap-1">
                    Validez avec <span className="font-bold text-[#3DFFA0]">"Ajouter"</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="animate-bounce">
                  <PlusSquare size={32} className="text-[#3DFFA0]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
