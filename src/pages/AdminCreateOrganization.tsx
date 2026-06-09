import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Building2, 
  MapPin, 
  Globe, 
  Palette, 
  MessageSquare, 
  Phone, 
  User, 
  Mail, 
  ArrowRight, 
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth, getIdToken, ref, uploadBytes, getDownloadURL, storage } from "../firebase";
import AdminLayout from "../components/AdminLayout";
import DynamicList from "../components/DynamicList";

// Validation Schema
const schema = z.object({
  type: z.enum(["institution", "business"]),
  name: z.string().min(1, "Nom requis"),
  siret: z.string().length(14, "Le SIRET doit faire 14 chiffres").regex(/^[0-9]+$/, "Chiffres uniquement"),
  streetNumber: z.string().optional(),
  address: z.string().min(1, "Adresse requise"),
  zipCode: z.string().min(5, "Code postal invalide").max(5, "Code postal invalide").regex(/^[0-9]+$/, "Chiffres uniquement"),
  city: z.string().min(1, "Ville requise"),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Format Hex requis (ex: #AA0000)"),
  trustMessage: z.string().max(200, "Maximum 200 caractères").min(1, "Message requis"),
  repFirstName: z.string().min(1, "Prénom requis"),
  repLastName: z.string().min(1, "Nom requis"),
  repEmail: z.string().email("Email invalide"),
});

type FormData = z.infer<typeof schema>;

export default function AdminCreateOrganization() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Custom states for lists and media
  const [allowedDomains, setAllowedDomains] = useState<string[]>([""]);
  const [officialPhones, setOfficialPhones] = useState<string[]>([""]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [activationLink, setActivationLink] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      type: "institution",
      primaryColor: "#22C55E",
      trustMessage: "Le Crédit Mutuel ne vous demandera jamais vos codes par téléphone"
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Le logo est trop lourd (max 2 Mo)");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setActivationLink(null);

    // Validation email domain
    const emailDomain = data.repEmail.split("@")[1].toLowerCase().trim();
    const trimmedDomains = allowedDomains.map(d => d.toLowerCase().trim());
    
    if (!trimmedDomains.includes(emailDomain)) {
      setError(`L'email du représentant doit appartenir à l'un des domaines autorisés : ${trimmedDomains.join(", ")}`);
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Non authentifié");
      const idToken = await getIdToken(user);

      // 1. Upload Logo
      let logoUrl = "";
      if (logoFile) {
        try {
          const logoRef = ref(storage, `organizations/logos/${Date.now()}_${logoFile.name}`);
          const uploadResult = await uploadBytes(logoRef, logoFile);
          logoUrl = await getDownloadURL(uploadResult.ref);
        } catch (storageErr: any) {
          console.error("Storage Error:", storageErr);
          throw new Error("Erreur lors de l'envoi du logo. Vérifiez les permissions de stockage.");
        }
      }

      // 2. Call our priviledged API
      const response = await fetch("/api/admin/create-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          orgData: {
            name: data.name,
            siret: data.siret,
            address: data.address,
            streetNumber: data.streetNumber || "",
            zipCode: data.zipCode,
            city: data.city,
            logoUrl,
            primaryColor: data.primaryColor,
            trustMessage: data.trustMessage,
            officialPhones: officialPhones.filter(p => p.trim() !== ""),
            allowedEmailDomains: allowedDomains.filter(d => d.trim() !== ""),
            active: true,
            type: data.type
          },
          repData: {
            firstName: data.repFirstName,
            lastName: data.repLastName,
            email: data.repEmail,
            directPhone: ""
          }
        })
      });

      const result = await response.json();
      console.log("Create Org Response:", result);

      if (!response.ok) {
        throw new Error(result.error || result.message || "Erreur lors de la création");
      }

      setActivationLink(result.activationLink);
      setSuccess("Organisation créée avec succès !");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">Créer une organisation cliente</h1>
            <p className="text-[#9a9a9f]">Enregistrez une nouvelle institution sur le protocole SafeCallr.</p>
          </div>
        </header>

        {error && (
          <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 text-error animate-in zoom-in duration-300">
            <AlertCircle size={20} />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] space-y-4 animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 size={24} />
              <p className="text-lg font-black">{success}</p>
            </div>
            
            {activationLink && (
              <div className="bg-[#111113] p-6 rounded-2xl border border-primary/20 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Lien d'activation (à transmettre au représentant) :</p>
                <div className="flex items-center gap-3">
                  <input 
                    readOnly 
                    value={activationLink}
                    className="flex-1 bg-black border-none text-primary font-mono text-xs p-3 rounded-lg truncate"
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(activationLink)}
                    className="px-4 py-2 bg-primary text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    Copier
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 italic">Note : Puisque nous sommes en environnement de test, l'email automatique peut ne pas être délivré. Veuillez transmettre ce lien manuellement au représentant.</p>
              </div>
            )}

            <button 
              onClick={() => navigate("/admin/organizations")}
              className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Retour à la liste des organisations
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* SELECTION DU TYPE */}
          <section className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Usage & modèle de protection</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex flex-col p-6 rounded-2xl border-2 cursor-pointer transition-all ${watch("type") === "institution" ? "border-primary bg-primary/5 text-white" : "border-[#2e2e34] bg-[#111113] text-slate-400 hover:border-slate-700"}`}>
                <input 
                  type="radio" 
                  value="institution" 
                  {...register("type")} 
                  className="sr-only" 
                />
                <span className="font-extrabold text-sm block mb-1">Institution Publique (Vérification Externe)</span>
                <span className="text-[11px] leading-relaxed text-slate-400">
                  Idéal pour les banques, assurances ou marques (ex: Crédit Mutuel). Les clients finaux utilisent l'application grand public pour authentifier vos conseillers lors d'un appel téléphonique.
                </span>
              </label>

              <label className={`flex flex-col p-6 rounded-2xl border-2 cursor-pointer transition-all ${watch("type") === "business" ? "border-primary bg-primary/5 text-white" : "border-[#2e2e34] bg-[#111113] text-slate-400 hover:border-slate-700"}`}>
                <input 
                  type="radio" 
                  value="business" 
                  {...register("type")} 
                  className="sr-only" 
                />
                <span className="font-extrabold text-sm block mb-1 text-[#3dffa0] flex items-center gap-2">
                  Espace Business (Sécurité Interne)
                </span>
                <span className="text-[11px] leading-relaxed text-slate-400">
                  Idéal pour les entreprises voulant protéger leurs collaborateurs en interne. Solution confidentielle opérée en circuit fermé : les salariés s'identifient mutuellement pour faire échec au spoofing et fraude au président.
                </span>
              </label>
            </div>
          </section>

          {/* SECTION 1: LEGAL */}
          <section className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Section 1 — Informations légales</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Nom de l'entreprise</label>
                <input 
                  {...register("name")}
                  placeholder="Ex: Banque de France"
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                />
                {errors.name && <p className="text-error text-[10px] font-bold px-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">SIRET (14 chiffres)</label>
                <input 
                  {...register("siret")}
                  placeholder="12345678901234"
                  maxLength={14}
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-mono font-bold"
                />
                {errors.siret && <p className="text-error text-[10px] font-bold px-1">{errors.siret.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">N°</label>
                <input 
                  {...register("streetNumber")}
                  placeholder="ex: 25"
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                />
                {errors.streetNumber && <p className="text-error text-[10px] font-bold px-1">{errors.streetNumber.message}</p>}
              </div>

              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Nom de la rue / Avenue</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                  <input 
                    {...register("address")}
                    placeholder="ex: Rue du Terrage (sans le numéro)"
                    className="w-full bg-[#111113] border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                  />
                </div>
                {errors.address && <p className="text-error text-[10px] font-bold px-1">{errors.address.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Code Postal</label>
                <input 
                  {...register("zipCode")}
                  placeholder="75010"
                  maxLength={5}
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                />
                {errors.zipCode && <p className="text-error text-[10px] font-bold px-1">{errors.zipCode.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Ville</label>
                <input 
                  {...register("city")}
                  placeholder="Paris"
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                />
                {errors.city && <p className="text-error text-[10px] font-bold px-1">{errors.city.message}</p>}
              </div>
            </div>

            <DynamicList 
              label="Domaines email autorisés" 
              items={allowedDomains} 
              onChange={setAllowedDomains}
              placeholder="ex: creditmutuel.fr"
            />
          </section>

          {/* SECTION 2: BRANDING */}
          <section className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#60a5fa]/10 flex items-center justify-center text-[#60a5fa]">
                <Palette size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Section 2 — Identité visuelle</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Logo de la marque</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-[#111113] border-2 border-dashed border-[#2e2e34] flex items-center justify-center overflow-hidden relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Upload className="text-[#2e2e34] group-hover:text-primary transition-colors" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-1">
                    <p>Format JPG, PNG ou SVG</p>
                    <p>Max 2 Mo</p>
                    <p>Recommandé : Format carré</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Couleur primaire</label>
                <div className="flex gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl border-4 border-[#2e2e34] shadow-inner"
                    style={{ backgroundColor: watch("primaryColor") }}
                  />
                  <div className="flex-1 space-y-2">
                    <input 
                      {...register("primaryColor")}
                      type="text"
                      className="w-full bg-[#111113] border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-mono font-bold"
                    />
                    <input 
                      type="color" 
                      onChange={(e) => setValue("primaryColor", e.target.value)}
                      value={watch("primaryColor")}
                      className="w-full h-2 rounded-full cursor-pointer appearance-none bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Message de confiance</label>
                <span className={`text-[10px] font-black ${watch("trustMessage")?.length > 200 ? "text-error" : "text-slate-600"}`}>
                  {watch("trustMessage")?.length || 0}/200
                </span>
              </div>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 text-slate-600 size-4" />
                <textarea 
                  {...register("trustMessage")}
                  placeholder="Message affiché aux clients lors de l'appel..."
                  rows={2}
                  maxLength={200}
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold resize-none"
                />
              </div>
              {errors.trustMessage && <p className="text-error text-[10px] font-bold px-1">{errors.trustMessage.message}</p>}
            </div>

            <DynamicList 
              label="Numéros officiels" 
              items={officialPhones} 
              onChange={setOfficialPhones}
              placeholder="ex: 01 23 45 67 89"
              type="tel"
            />
          </section>

          {/* SECTION 3: REPRESENTATIVE */}
          <section className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 flex items-center justify-center text-[#c084fc]">
                <User size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Section 3 — Représentant du compte</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Prénom</label>
                <input 
                  {...register("repFirstName")}
                  placeholder="Jean"
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                />
                {errors.repFirstName && <p className="text-error text-[10px] font-bold px-1">{errors.repFirstName.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Nom</label>
                <input 
                  {...register("repLastName")}
                  placeholder="Dupont"
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                />
                {errors.repLastName && <p className="text-error text-[10px] font-bold px-1">{errors.repLastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                <input 
                  {...register("repEmail")}
                  placeholder="jean.dupont@banque.fr"
                  className="w-full bg-[#111113] border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary transition-all font-bold"
                />
              </div>
              {errors.repEmail && <p className="text-error text-[10px] font-bold px-1">{errors.repEmail.message}</p>}
              <p className="text-[10px] text-[#c084fc] font-bold bg-[#c084fc]/10 p-4 rounded-xl flex items-start gap-3 mt-4">
                <AlertCircle size={14} className="shrink-0" />
                Un email d'activation sera envoyé à cette adresse. Le représentant définira son mot de passe et pourra ensuite ajouter ses collaborateurs.
              </p>
            </div>
          </section>

          <button 
            type="submit"
            disabled={!isValid || loading}
            className="w-full bg-primary text-on-primary py-5 rounded-[24px] font-headline font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Création en cours...
              </>
            ) : (
              <>
                Créer l'organisation et envoyer l'invitation
                <ArrowRight size={24} />
              </>
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
