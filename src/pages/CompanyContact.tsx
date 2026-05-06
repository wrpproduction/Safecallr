import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Shield, 
  ArrowLeft, 
  Send, 
  Building2, 
  User, 
  Phone, 
  Mail,
  CheckCircle2,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CompanyContact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await addDoc(collection(db, "companyContactRequests"), {
        ...formData,
        targetEmail: "contact@safecallr.com",
        status: "new",
        createdAt: serverTimestamp()
      });
      setSuccess(true);
    } catch (err: any) {
      console.error("Error submitting contact form:", err);
      setError("Une erreur est survenue lors de l'envoi du formulaire. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface-container-low p-8 md:p-12 rounded-[40px] border border-primary/20 text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-primary w-10 h-10" />
          </div>
          <h1 className="font-headline font-black text-3xl tracking-tight">Merci !</h1>
          <p className="text-slate-400">
            Votre demande a bien été envoyée. Un expert SafeCallr vous contactera très prochainement à l'adresse <span className="text-primary font-bold">{formData.email}</span>.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary/30 selection:text-primary">
      {/* Navigation Layer */}
      <nav className="p-6 md:p-10 flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="text-slate-400 group-hover:text-primary w-5 h-5" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-slate-500 group-hover:text-on-surface">Retour</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="text-on-primary w-6 h-6" />
          </div>
          <span className="font-headline font-black text-2xl tracking-tighter text-primary">SafeCallr</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:flex items-start gap-20">
        {/* Left Side: Text */}
        <div className="lg:w-1/2 mb-12 lg:mb-0">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Espace Entreprise</span>
          </div>
          <h1 className="font-headline font-black text-5xl md:text-7xl tracking-tight leading-none mb-8">
            Sécurisez vos <span className="text-primary">échanges.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-xl leading-relaxed mb-12">
            Intégrez le standard de confiance SafeCallr au sein de votre organisation. Protégez vos virements, vos clients et vos collaborateurs contre les fraudes par ingénierie sociale.
          </p>
          
          <div className="space-y-6">
            {[
              { icon: Building2, title: "Pour les Banques & Assurances", desc: "Éliminez les arnaques au faux conseiller." },
              { icon: Shield, title: "Pour les Cabinets de Conseil", desc: "Sécurisez vos instructions de paiement sensibles." },
              { icon: Users, title: "Pour les RH & Direction", desc: "Protégez vos équipes contre la fraude au président." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center shrink-0 border border-white/5">
                  <item.icon className="text-primary w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:w-1/2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-low p-8 md:p-12 rounded-[40px] border border-white/5 shadow-2xl relative"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                    <User size={12} className="text-primary" /> Prénom
                  </label>
                  <input 
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-700 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                    <User size={12} className="text-primary" /> Nom
                  </label>
                  <input 
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-700 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                  <Building2 size={12} className="text-primary" /> Nom de l'entreprise
                </label>
                <input 
                  required
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-700 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="ACME Corp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                  <Mail size={12} className="text-primary" /> Email Professionnel
                </label>
                <input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-700 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="contact@entreprise.fr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                  <Phone size={12} className="text-primary" /> Téléphone
                </label>
                <input 
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-700 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                  <Mail size={12} className="text-primary" /> Votre Message
                </label>
                <textarea 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-slate-700 focus:ring-2 focus:ring-primary transition-all min-h-[120px] resize-none"
                  placeholder="Comment pouvons-nous vous aider ?"
                />
              </div>

              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-primary text-on-primary py-6 rounded-[32px] font-headline font-black text-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {loading ? "Envoi en cours..." : "Envoyer ma demande"}
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 bg-surface-container-lowest mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="text-on-primary w-5 h-5" />
            </div>
            <span className="font-headline font-black text-xl tracking-tighter text-primary">SafeCallr</span>
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            © 2026 SafeCallr Technologies.
          </div>
        </div>
      </footer>
    </div>
  );
}
