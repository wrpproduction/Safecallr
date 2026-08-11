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
import { getApiUrl } from "../lib/api";

// Validation Schema
const schema = z.object({
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
  
  // Cumulative Capabilities and Status (Default to unchecked - user must select)
  const [enableExternal, setEnableExternal] = useState(false);
  const [enableInternal, setEnableInternal] = useState(false);
  const [initialStatus, setInitialStatus] = useState<"pending" | "active">("pending");

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
      primaryColor: "#22C55E",
      trustMessage: "Membre vérifié du réseau de confiance SafeCallr"
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

    // Validation au moins une capacité cochée
    if (!enableExternal && !enableInternal) {
      setError("Veuillez cocher au moins une capacité d'authentification (Vérification EXTERNE ou INTERNE) à activer pour cette organisation.");
      setLoading(false);
      return;
    }

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
          const logoRef = ref(storage, `organizations/logos/${Date.now()}_${logoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
          const uploadResult = await uploadBytes(logoRef, logoFile);
          logoUrl = await getDownloadURL(uploadResult.ref);
        } catch (storageErr: any) {
          console.warn("Storage Error, falling back to data URL:", storageErr);
          logoUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(logoFile);
          });
        }
      }

      // 2. Call our priviledged API
      const response = await fetch(getApiUrl("/api/admin/create-organization"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          lang: localStorage.getItem("app_lang") || "fr",
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
            active: initialStatus === "active",
            status: initialStatus,
            capabilities: {
              external: enableExternal,
              internal: enableInternal
            },
            type: enableExternal && enableInternal ? "hybrid" : enableInternal ? "business" : "institution"
          },
          repData: {
            firstName: data.repFirstName,
            lastName: data.repLastName,
            email: data.repEmail,
            directPhone: ""
          }
        })
      });

      let result: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON Response received:", text);
        throw new Error(`Le serveur d'arrière-plan a renvoyé une réponse non-JSON (Status ${response.status}). Le serveur a peut-être planté ou n'est pas joignable.`);
      }

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
          <div className="bg-error/10 border border-error/20 p-5 rounded-2xl flex flex-col gap-2 text-error animate-in zoom-in duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
            {(error.includes("permissions") || error.includes("JSON") || error.includes("403") || error.includes("non-JSON") || error.includes("planté")) && (
              <div className="pl-8 text-xs text-error/80 leading-relaxed space-y-2 mt-2">
                <p>💡 <strong>Note d'administration importante :</strong> Le serveur d'arrière-plan ou votre plateforme d'authentification a rencontré un problème d'autorisation Firebase.</p>
                
                <div className="space-y-1.5 border-l-2 border-error/30 pl-3">
                  <p className="font-bold text-white">1. Si vous testez depuis l'aperçu AI Studio :</p>
                  <p>Veuillez accorder les rôles <strong>Propriétaire Cloud Datastore</strong>, <strong>Consommateur de Service Usage</strong> et <strong>Administrateur Firebase</strong> au compte de service de la Sandbox :</p>
                  <code className="block bg-black/40 p-2 rounded mt-1 select-all font-mono text-[10px] text-white">ais-sandbox@ais-europe-west3-afdcc131abb34.iam.gserviceaccount.com</code>
                </div>

                <div className="space-y-1.5 border-l-2 border-orange-500/30 pl-3 mt-3">
                  <p className="font-bold text-orange-400">2. Si vous testez sur votre propre domaine de production ({window.location.hostname}) :</p>
                  <p>Votre service de production Cloud Run s'exécute sous le <strong>compte de service par défaut de calcul de Google Cloud</strong> de votre projet (généralement <code className="text-white select-all">N_PROJET-compute@developer.gserviceaccount.com</code>).</p>
                  <p>Vous devez également accorder ces 3 rôles (<strong>Propriétaire Cloud Datastore</strong> et <strong>Administrateur Firebase</strong>) à votre propre compte de service de production.</p>
                </div>

                <p className="text-[10px] pt-1">Configurez ces autorisations sur <a href="https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0258611834" target="_blank" rel="noopener noreferrer" className="underline font-bold text-white hover:text-primary">votre console Google Cloud IAM</a> (ID Projet: <code className="text-white">gen-lang-client-0258611834</code>).</p>
              </div>
            )}
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
          {/* SELECTION DES CAPACITES ET DU STATUT */}
          <section className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Capacités & Statut d'activation</h2>
                <p className="text-xs text-slate-400">Chaque entité juridique (un SIRET) peut cumuler les deux capacités d'authentification.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Capability External */}
              <label 
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${enableExternal ? "border-primary bg-primary/5 text-white" : "border-[#2e2e34] bg-[#111113] text-slate-500 hover:border-slate-700"}`}
              >
                <input 
                  type="checkbox" 
                  checked={enableExternal} 
                  onChange={(e) => setEnableExternal(e.target.checked)} 
                  className="mt-1 rounded border-slate-700 bg-black text-primary focus:ring-0 cursor-pointer" 
                />
                <div>
                  <span className="font-bold text-sm block mb-1 text-white">Vérification EXTERNE (Clients Finaux)</span>
                  <span className="text-[11px] leading-relaxed text-slate-400">
                    Les collaborateurs authentifient les clients finaux de l'organisation lors des appels téléphoniques sortants.
                  </span>
                </div>
              </label>

              {/* Capability Internal Business */}
              <label 
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${enableInternal ? "border-[#3dffa0] bg-[#3dffa0]/5 text-white" : "border-[#2e2e34] bg-[#111113] text-slate-500 hover:border-slate-700"}`}
              >
                <input 
                  type="checkbox" 
                  checked={enableInternal} 
                  onChange={(e) => setEnableInternal(e.target.checked)} 
                  className="mt-1 rounded border-slate-700 bg-black text-[#3dffa0] focus:ring-0 cursor-pointer" 
                />
                <div>
                  <span className="font-bold text-sm block mb-1 text-[#3dffa0]">Vérification INTERNE (SafeCallr Business)</span>
                  <span className="text-[11px] leading-relaxed text-slate-400">
                    Les collaborateurs s'authentifient entre eux en circuit fermé (lutte contre la fraude au président & usurpation).
                  </span>
                </div>
              </label>
            </div>

            {/* Statut Initial Selection */}
            <div className="pt-4 border-t border-[#2e2e34]/60 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Statut initial de l'organisation
                </label>
                <p className="text-xs text-slate-500">
                  Par sécurité, les nouvelles organisations sont 'En attente' par défaut et ne peuvent émettre aucune vérification tant qu'elles ne sont pas validées.
                </p>
              </div>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as "pending" | "active")}
                className="bg-[#111113] border border-[#2e2e34] text-white text-xs font-bold rounded-2xl p-4 outline-none focus:border-primary transition-all w-full"
              >
                <option value="pending">⏳ En attente de validation (Pending) — Par défaut</option>
                <option value="active">✅ Actif (Active) — Émission immédiate</option>
              </select>
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
