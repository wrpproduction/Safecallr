import { Shield, Smartphone, Bell, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import SEOManager from "../components/seo/SEOManager";

export default function HowItWorks() {
  const steps = [
    {
      icon: Smartphone,
      title: "Demandez une vérification",
      description: "Saisissez le numéro de téléphone de votre interlocuteur et le type d'échange (Banque, Immobilier, etc.).",
    },
    {
      icon: Bell,
      title: "Notification instantanée",
      description: "Votre interlocuteur reçoit une notification push sécurisée sur son téléphone via l'application SafeCallr.",
    },
    {
      icon: CheckCircle,
      title: "Confirmation d'identité",
      description: "L'interlocuteur ouvre la demande et confirme officiellement son identité en un clic.",
    },
    {
      icon: Shield,
      title: "Statut en temps réel",
      description: "Vous recevez instantanément le statut de vérification : Vérifié, Refusé ou Vigilance.",
    },
  ];

  return (
    <div className="space-y-12 pb-12 w-full max-w-2xl mx-auto">
      <SEOManager 
        title="Comment ça marche ? | Authentification Humaine"
        description="Découvrez comment SafeCallr sécurise vos communications en 10 secondes. Un protocole simple et infaillible contre les deepfakes."
      />
      
      <section className="space-y-4 pt-8">
        <h1 className="font-headline font-extrabold text-3xl md:text-5xl tracking-tight text-on-surface leading-tight">
          Comment ça <span className="text-primary">marche ?</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg leading-relaxed">
          Découvrez le protocole SafeCallr : une solution d'authentification hors-bande qui permet de vérifier l'identité d'un appelant professionnel en moins de 10 secondes.
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
          <h2 className="font-headline font-bold text-2xl text-on-surface">Sécurité & Conformité Bancaire</h2>
        </div>
        <p className="text-slate-400 text-base leading-relaxed">
          Le protocole SafeCallr repose sur un chiffrement de bout en bout conforme aux exigences de l'ACPR et de la Banque de France. Contrairement aux solutions basées sur la voix, notre authentification par code dynamique est immunisée contre l'intelligence artificielle et les deepfakes vocaux.
        </p>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Chiffrement</p>
            <p className="text-xl font-headline font-bold text-primary">AES-256</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Score Sécurité</p>
            <p className="text-xl font-headline font-bold text-primary">A+++</p>
          </div>
        </div>
      </div>

      <p className="text-center text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">
        SafeCallr Documentation v4.0
      </p>
    </div>
  );
}
