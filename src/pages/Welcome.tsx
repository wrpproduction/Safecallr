import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ShieldCheck, Smartphone, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { requestFCMToken, auth } from '../firebase';
import { Toaster, toast } from 'sonner';

export default function Welcome() {
  const navigate = useNavigate();

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
      toast.error("Veuillez vous connecter pour activer les notifications");
      navigate('/auth');
      return;
    }

    try {
      const token = await requestFCMToken(auth.currentUser.uid);
      if (token) {
        toast.success("Notifications activées avec succès !");
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast.error("Impossible d'activer les notifications. Vérifiez les réglages de votre navigateur.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de l'activation.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1B3D] text-white flex flex-col items-center justify-center p-6 text-center">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-[#3DFFA0] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(61,255,160,0.3)]">
          <ShieldCheck size={48} className="text-[#0F1B3D]" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-extrabold mb-4 tracking-tight leading-tight"
      >
        Bienvenue sur l'App <span className="text-[#3DFFA0]">SafeCallr</span>
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/70 text-lg mb-10 max-w-sm mx-auto"
      >
        Vous avez installé avec succès le protocole de sécurité sur votre téléphone.
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
            <h3 className="font-bold mb-1">Notifications Critiques</h3>
            <p className="text-sm text-white/50">
              SafeCallr a besoin des notifications pour vous authentifier les appels en temps réel. Sans elles, le service ne peut fonctionner.
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
          className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform text-lg shadow-lg shadow-[#3DFFA0]/20"
        >
          Activer les notifications
          <ArrowRight size={20} />
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-transparent text-white/50 font-medium py-3 rounded-2xl hover:text-white transition-colors"
        >
          Remettre à plus tard
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
