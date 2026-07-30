import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Smartphone, Bell, Volume2, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AppLogo from "./AppLogo";

export default function AppOnboarding() {
  const [step, setStep] = useState<number>(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const navigate = useNavigate();

  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && step < 3) {
      setStep((prev) => prev + 1);
    }
    if (isRightSwipe && step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setStep(3);
  };

  return (
    <div
      className="h-[100dvh] w-full bg-[#0F1B3D] text-white flex flex-col justify-between select-none overflow-hidden"
      style={{
        paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-12 shrink-0">
        <AppLogo showText={true} textClassName="text-white font-headline text-lg" />
        {step < 3 ? (
          <button
            onClick={handleSkip}
            className="text-xs font-bold uppercase tracking-widest text-[#3DFFA0] hover:opacity-80 transition-opacity px-3 py-1.5 rounded-full bg-white/5 border border-[#3DFFA0]/20"
          >
            Passer
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* Slide Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col items-center text-center max-w-xs mx-auto my-auto"
            >
              <div className="w-20 h-20 rounded-3xl bg-[#3DFFA0]/10 border border-[#3DFFA0]/30 flex items-center justify-center mb-8 shadow-xl shadow-[#3DFFA0]/10">
                <Shield className="w-10 h-10 text-[#3DFFA0]" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-headline font-black text-white leading-tight mb-4">
                On ne sait plus à qui{" "}
                <span className="text-[#3DFFA0]">faire confiance.</span>
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                SafeCallr vérifie l'identité de votre interlocuteur en temps réel.
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col items-center max-w-xs mx-auto w-full my-auto"
            >
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-xl bg-[#3DFFA0]/10 border border-[#3DFFA0]/20 flex items-center justify-center shrink-0 text-[#3DFFA0]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-white leading-snug">
                    Le professionnel déclenche la vérification
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-xl bg-[#3DFFA0]/10 border border-[#3DFFA0]/20 flex items-center justify-center shrink-0 text-[#3DFFA0]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-white leading-snug">
                    Vous recevez une notification en direct
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-xl bg-[#3DFFA0]/10 border border-[#3DFFA0]/20 flex items-center justify-center shrink-0 text-[#3DFFA0]">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-white leading-snug">
                    Il vous donne le code de vive voix
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col items-center text-center max-w-xs mx-auto w-full my-auto"
            >
              <div className="w-full space-y-3 mb-8">
                <button
                  onClick={() => navigate("/register")}
                  className="w-full bg-[#3DFFA0] text-[#0F1B3D] font-headline font-black text-sm py-3.5 rounded-2xl shadow-xl shadow-[#3DFFA0]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Créer un compte
                </button>

                <button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-white/5 border border-white/15 text-white font-headline font-bold text-sm py-3.5 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <LogIn className="w-4 h-4 text-[#3DFFA0]" />
                  J'ai déjà un compte
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <Link to="/cgu" className="hover:text-white transition-colors underline">
                  CGU
                </Link>
                <span>•</span>
                <Link to="/confidentialite" className="hover:text-white transition-colors underline">
                  Confidentialité
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Controls */}
      <div className="shrink-0 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === i ? "w-6 bg-[#3DFFA0]" : "w-2 bg-white/20"
              }`}
              aria-label={`Aller à l'étape ${i}`}
            />
          ))}
        </div>

        {step < 3 ? (
          <button
            onClick={handleNext}
            className="bg-[#3DFFA0] text-[#0F1B3D] font-headline font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-[#3DFFA0]/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Suivant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>
    </div>
  );
}

