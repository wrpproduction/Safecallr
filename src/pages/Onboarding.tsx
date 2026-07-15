import { Link } from "react-router-dom";
import { Shield, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function Onboarding() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background Tonal Texture */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center text-center space-y-12">
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="text-on-primary w-8 h-8" />
          </div>
          <h1 className="font-headline font-black text-3xl tracking-tighter text-primary">SafeCallr</h1>
        </motion.div>

        {/* Hero Text */}
        <div className="space-y-4">
          <h2 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface leading-tight">
            Ne faites plus confiance <span className="text-primary">aveuglément.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Vérifiez instantanément l'identité de vos interlocuteurs grâce à notre protocole de confiance sécurisé.
          </p>
        </div>

        {/* Features Bento */}
        <div className="grid grid-cols-1 gap-4 w-full">
          {[
            { icon: CheckCircle, text: "Vérification en temps réel", color: "text-primary" },
            { icon: Shield, text: "Données chiffrées de bout en bout", color: "text-primary" },
            { icon: AlertTriangle, text: "Détection de fraude et vigilance", color: "text-tertiary-container" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex items-center gap-4"
            >
              <item.icon className={`${item.color} w-6 h-6`} />
              <span className="text-sm font-semibold text-on-surface">{item.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="w-full space-y-4 pt-8">
          <Link to="/register" className="w-full bg-primary text-on-primary font-headline font-bold text-xl py-5 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            Commencer
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold">
            Sécurisé par SafeCallr Biometric Protocol 4.0
          </p>
        </div>
      </div>
    </div>
  );
}
