import React, { useEffect, useState } from "react";
import { X, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthCodeDisplayProps {
  code: string;
  onCancel: () => void;
  expiresInSeconds?: number;
}

export default function AuthCodeDisplay({ code, onCancel, expiresInSeconds = 60 }: AuthCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);
  const digits = code.split("");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isExpiringSoon = timeLeft < 15;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0d0d0f]/95 backdrop-blur-2xl flex items-center justify-center p-6"
    >
      <div className="max-w-xl w-full text-center space-y-12">
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8"
          >
            <ShieldCheck size={40} />
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tight">Code d'authentification</h2>
          <p className="text-slate-400 font-medium">
            Communiquez ce code à voix haute à votre client.<br />
            Il doit le voir apparaître dans son application SafeCallr.
          </p>
        </div>

        <div className="flex justify-center gap-4 md:gap-6">
          {digits.map((digit, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
              className="w-16 h-24 md:w-24 md:h-36 bg-[#1e1e22] border-2 border-[#2e2e34] rounded-[24px] flex items-center justify-center text-5xl md:text-7xl font-black text-white shadow-2xl"
            >
              {digit}
            </motion.div>
          ))}
        </div>

        <div className="space-y-8">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full font-black text-sm transition-colors ${isExpiringSoon ? "bg-error/10 text-error animate-pulse" : "bg-slate-800 text-slate-400"}`}>
            <Clock size={18} />
            Expire dans {formatTime(timeLeft)}
          </div>

          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={onCancel}
              className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors py-4 px-8"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="font-bold text-sm tracking-widest uppercase">Annuler l'authentification</span>
            </button>
          </div>
        </div>
        
        {timeLeft === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-error font-bold"
          >
            <AlertCircle size={18} />
            Le code a expiré. Veuillez réessayer.
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
