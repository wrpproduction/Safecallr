import { Shield, Smartphone, Bell, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

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
    <div className="space-y-12 pb-12">
      <section className="space-y-4 pt-8">
        <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface leading-tight">
          Comment ça <span className="text-primary">marche ?</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          SafeCallr utilise un protocole de confiance décentralisé pour sécuriser vos échanges téléphoniques.
        </p>
      </section>

      <div className="space-y-8">
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-6 items-start"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <step.icon className="text-primary w-6 h-6" />
              </div>
              {i < steps.length - 1 && <div className="w-0.5 h-12 bg-surface-container-highest rounded-full"></div>}
            </div>
            <div className="space-y-2 pt-2">
              <h3 className="font-headline font-bold text-lg text-on-surface">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="text-primary w-6 h-6" />
          <h3 className="font-headline font-bold text-xl text-on-surface">Sécurité Maximale</h3>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          Toutes les communications sont chiffrées de bout en bout. SafeCallr ne stocke jamais vos données personnelles en clair. Notre algorithme de détection de fraude analyse les signatures numériques pour prévenir l'usurpation d'identité.
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
