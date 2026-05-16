import React, { useState } from "react";
import { 
  Palette, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Upload, 
  MessageSquare,
  Save,
  Loader2,
  CheckCircle2,
  Building2,
  MapPin,
  Globe
} from "lucide-react";
import { Organization } from "../../lib/types";
import { doc, updateDoc } from "firebase/firestore";
import { db, ref, uploadBytes, getDownloadURL, storage } from "../../firebase";
import DynamicList from "../DynamicList";

interface BrandSettingsSectionProps {
  organization: Organization;
}

export default function BrandSettingsSection({ organization }: BrandSettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor);
  const [trustMessage, setTrustMessage] = useState(organization.trustMessage);
  const [officialPhones, setOfficialPhones] = useState(organization.officialPhones);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      let logoUrl = organization.logoUrl;
      if (logoFile) {
        const logoRef = ref(storage, `organizations/logos/${Date.now()}_${logoFile.name}`);
        const uploadResult = await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(uploadResult.ref);
      }

      await updateDoc(doc(db, "organizations", organization.id), {
        primaryColor,
        trustMessage,
        officialPhones,
        logoUrl,
        updatedAt: new Date()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] overflow-hidden shadow-xl">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-8 hover:bg-[#25252a] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#c084fc]/10 flex items-center justify-center text-[#c084fc]">
            <Palette size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">Paramètres de la marque</h3>
            <p className="text-xs text-[#9a9a9f]">Personnalisez votre identité visuelle SafeCallr</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
      </button>

      {isOpen && (
        <div className="p-8 border-t border-[#2e2e34] space-y-10 animate-in slide-in-from-top-4 duration-300">
          {/* Read Only Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#111113] rounded-3xl border border-[#2e2e34]">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                  <Building2 size={12} /> Nom de l'entreprise <Lock size={10} />
                </label>
                <p className="text-sm font-bold text-slate-400">{organization.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                  Siret <Lock size={10} />
                </label>
                <p className="text-sm font-bold text-slate-400 font-mono">{organization.siret}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                  <MapPin size={12} /> Adresse <Lock size={10} />
                </label>
                <p className="text-sm font-bold text-slate-400">{organization.address}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                  <Globe size={12} /> Domaines autorisés <Lock size={10} />
                </label>
                <p className="text-sm font-bold text-slate-400 font-mono">{organization.allowedEmailDomains.join(", ")}</p>
              </div>
            </div>
            <div className="col-span-full pt-4 border-t border-[#2e2e34] mt-2">
              <p className="text-[10px] text-slate-600 italic">Pour modifier ces informations, contactez le support SafeCallr.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Editable Logo */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logo de la marque</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-[#111113] border-2 border-dashed border-[#2e2e34] flex items-center justify-center overflow-hidden relative group">
                  <img src={logoPreview || ""} alt="Logo" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload size={20} className="text-white" />
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="text-[10px] text-slate-600 space-y-1">
                  <p>Format JPG, PNG ou SVG</p>
                  <p>Cliquez pour remplacer le logo actuel</p>
                </div>
              </div>
            </div>

            {/* Editable Color */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Couleur primaire</label>
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl border-4 border-[#2e2e34]" style={{ backgroundColor: primaryColor }} />
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-[#111113] border-none rounded-xl py-3 px-4 text-white font-mono font-bold" 
                  />
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-1 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Message de confiance</label>
              <span className={`text-[10px] font-black ${trustMessage.length > 200 ? "text-error" : "text-slate-600"}`}>
                {trustMessage.length}/200
              </span>
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 text-slate-600 size-4" />
              <textarea 
                value={trustMessage}
                onChange={(e) => setTrustMessage(e.target.value)}
                maxLength={200}
                rows={2}
                className="w-full bg-[#111113] border-none rounded-2xl py-4 pl-12 pr-4 text-white font-bold resize-none"
              />
            </div>
          </div>

          <DynamicList 
            label="Numéros officiels"
            items={officialPhones}
            onChange={setOfficialPhones}
            placeholder="ex: 01 23 45 67 89"
          />

          <div className="pt-6 border-t border-[#2e2e34] flex items-center justify-between">
            {success ? (
              <p className="text-success text-sm font-bold flex items-center gap-2 animate-in zoom-in duration-300">
                <CheckCircle2 size={18} /> Modifications enregistrées !
              </p>
            ) : <div />}
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-black px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Enregistrer les modifications</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
