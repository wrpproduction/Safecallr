import React, { useState } from "react";
import { 
  User, 
  MapPin, 
  Phone, 
  Briefcase, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Lock,
  Building2,
  Mail
} from "lucide-react";
import { Member, Organization } from "../../lib/types";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage, ref, uploadBytes, getDownloadURL } from "../../firebase";

interface ProfileEditCardProps {
  member: Member;
  organization: Organization;
}

export default function ProfileEditCard({ member, organization }: ProfileEditCardProps) {
  const [jobTitle, setJobTitle] = useState(member.jobTitle || "");
  const [directPhone, setDirectPhone] = useState(member.directPhone || "");
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const hasChanges = jobTitle !== (member.jobTitle || "") || 
                     directPhone !== (member.directPhone || "") || 
                     photoUrl !== (member.photoUrl || "");

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `members/photos/${member.id}_${Date.now()}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      setPhotoUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const memberRef = doc(db, "organizations", organization.id, "members", member.id);
      await updateDoc(memberRef, {
        jobTitle,
        directPhone,
        photoUrl,
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
    <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 md:p-10 space-y-10 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <User className="text-primary" /> Mon profil professionnel
        </h3>
        {success && (
          <p className="text-success text-xs font-bold flex items-center gap-2 animate-in zoom-in">
            <CheckCircle2 size={14} /> Profil mis à jour
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[40px] bg-[#111113] border-4 border-[#2e2e34] overflow-hidden flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-slate-700" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-black rounded-xl border-4 border-[#1e1e22] flex items-center justify-center cursor-pointer hover:scale-110 transition-all">
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
            </label>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Photo de profil</p>
            <p className="text-[10px] text-slate-700 mt-1">MAX 2 MO, carré recommandé</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Read Only Section */}
          <div className="space-y-6">
            <div className="space-y-2 opacity-60">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <User size={12} /> Prénom & Nom <Lock size={10} />
              </label>
              <div className="bg-[#111113] border border-[#2e2e34] rounded-2xl py-4 px-6 text-slate-400 font-bold">
                {member.firstName} {member.lastName}
              </div>
            </div>
            <div className="space-y-2 opacity-60">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Mail size={12} /> Email professionnel <Lock size={10} />
              </label>
              <div className="bg-[#111113] border border-[#2e2e34] rounded-2xl py-4 px-6 text-slate-400 font-bold font-mono text-sm">
                {member.email}
              </div>
            </div>
            <div className="space-y-2 opacity-60">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 size={12} /> Institution <Lock size={10} />
              </label>
              <div className="bg-[#111113] border border-[#2e2e34] rounded-2xl py-4 px-6 text-slate-400 font-bold">
                {organization.name}
              </div>
            </div>
          </div>

          {/* Editable Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Briefcase size={12} /> Fonction / Titre
              </label>
              <input 
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="ex: Conseiller patrimonial senior"
                className="w-full bg-[#111113] border border-primary/20 focus:border-primary rounded-2xl py-4 px-6 text-white font-bold outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Phone size={12} /> Ligne directe
              </label>
              <input 
                type="tel"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                placeholder="01 23 45 67 89"
                className="w-full bg-[#111113] border border-primary/20 focus:border-primary rounded-2xl py-4 px-6 text-white font-bold outline-none transition-all"
              />
            </div>
            
            <div className="pt-4 flex items-end justify-end h-full">
              <button 
                onClick={handleSave}
                disabled={!hasChanges || loading}
                className="w-full bg-primary text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Enregistrer les modifications</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-[#2e2e34]">
        <p className="text-[10px] text-slate-600 italic">Note : Ces informations sont vérifiées. Pour toute modification majeure (Nom, Email), contactez votre représentant {organization.name}.</p>
      </div>
    </div>
  );
}
