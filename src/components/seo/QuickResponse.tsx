import { Shield, CheckCircle, Smartphone } from "lucide-react";

export default function QuickResponse() {
  return (
    <div className="max-w-5xl mx-auto px-6 -mt-10 mb-20 relative z-20">
      <div className="bg-surface-container-low border border-primary/20 rounded-[32px] p-6 md:p-10 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <h2 className="text-xl md:text-2xl font-headline font-bold mb-4 flex items-center gap-3">
              <Shield className="text-primary w-6 h-6 shrink-0" />
              L'essentiel sur SafeCallr
            </h2>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
              SafeCallr est une plateforme d'authentification humaine qui permet à un professionnel de prouver son identité lors d'un appel grâce à un code à usage unique partagé en temps réel avec son client. La solution lutte efficacement contre la fraude au faux conseiller bancaire, l'usurpation téléphonique et le vishing.
            </p>
          </div>
          <div className="lg:col-span-5 border-l border-white/10 pl-0 lg:pl-10 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Smartphone className="text-primary w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest text-primary mb-1">Pour qui ?</p>
                <p className="text-sm text-slate-400">Banques, notaires, assureurs et leurs clients particuliers.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle className="text-primary w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest text-primary mb-1">Comment ?</p>
                <p className="text-sm text-slate-400">Synchronisation d'un code unique sur les deux écrans en 10 sec.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="text-primary w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest text-primary mb-1">Pourquoi ?</p>
                <p className="text-sm text-slate-400">Éradiquer les fraudes basées sur l'usurpation et les deepfakes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
