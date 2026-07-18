import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ShieldCheck, Smartphone, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { requestFCMToken, auth } from '../firebase';
import { setupNotifications } from '../services/notifications';
import { Capacitor } from '@capacitor/core';
import { Toaster, toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import AppLogo from '../components/AppLogo';

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    if (!isStandalone && process.env.NODE_ENV === 'production') {
      // Small feedback for dev, but in prod we might want to stay
      console.log('Not in standalone mode');
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!auth.currentUser) {
      toast.error(t("auth.noAccount"));
      navigate('/auth');
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        await setupNotifications(auth.currentUser.uid, navigate);
        toast.success(t("welcome.enableBtn") + "...");
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        const token = await requestFCMToken(auth.currentUser.uid);
        if (token) {
          toast.success(t("common.success"));
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          toast.error(t("welcome.deniedDesc"));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1B3D] text-white flex flex-col items-center justify-center p-6 text-center">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-center"
      >
        <AppLogo 
          size={96} 
          showText={false} 
          iconContainerClassName="shadow-[0_0_40px_rgba(61,255,160,0.3)] rounded-3xl" 
        />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-extrabold mb-4 tracking-tight leading-tight flex items-center justify-center gap-2 flex-wrap"
      >
        {t("welcome.title")} <AppLogo size={32} showText={true} className="inline-flex" />
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/70 text-lg mb-10 max-w-sm mx-auto"
      >
        {t("welcome.sub")}
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm space-y-4 mb-8"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4 text-left">
          <div className="bg-[#3DFFA0]/10 p-2 rounded-lg">
            <Bell size={24} className="text-[#3DFFA0]" />
          </div>
          <div>
            <h3 className="font-bold mb-1">{t("welcome.notifTitle")}</h3>
            <p className="text-sm text-white/50">
              {t("welcome.notifDesc")}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm space-y-4"
      >
        <button
          onClick={handleEnableNotifications}
          className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform text-lg shadow-lg shadow-[#3DFFA0]/20 cursor-pointer"
        >
          {t("welcome.enableBtn")}
          <ArrowRight size={20} />
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-transparent text-white/50 font-medium py-3 rounded-2xl hover:text-white transition-colors cursor-pointer"
        >
          {t("welcome.skipBtn")}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 flex items-center gap-2 text-white/30 text-xs uppercase tracking-widest font-bold"
      >
        <Smartphone size={14} />
        <span>Expérience Standalone Activée</span>
      </motion.div>
    </div>
  );
}
