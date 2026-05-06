import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  FileText, 
  LogOut, 
  Camera, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { auth, db, storage } from "../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { format } from "date-fns";

export default function ProProfile() {
  const [pro, setPro] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    companyName: "",
  });
  const [companyCategory, setCompanyCategory] = useState("");

  const companyCategories = [
    { id: "banque", label: "Banque" },
    { id: "notaire", label: "Notaire" },
    { id: "avocat", label: "Avocat" },
    { id: "courtier", label: "Courtier" },
    { id: "agent immobilier", label: "Agent Immobilier" },
    { id: "autres", label: "Autres" }
  ];

  const photoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProData();
  }, []);

  const fetchProData = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const proDoc = await getDoc(doc(db, "pros", uid));
      if (proDoc.exists()) {
        const data = proDoc.data();
        setPro(data);
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          jobTitle: data.jobTitle || "",
          companyName: data.companyName || "",
        });

        if (data.companyId) {
          const companyDoc = await getDoc(doc(db, "companies", data.companyId));
          if (companyDoc.exists()) {
            const compData = companyDoc.data();
            setCompany(compData);
            setCompanyCategory(compData.category || data.companyCategory || "");
            if (compData.name) {
              setFormData(prev => ({ ...prev, companyName: compData.name }));
            }
          } else {
            // Fallback if company doc doesn't exist yet
            setCompanyCategory(data.companyCategory || "");
          }
        } else {
          setCompanyCategory(data.companyCategory || "");
        }
      }
    } catch (err) {
      console.error("Fetch pro data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "companyCategory") {
      setCompanyCategory(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const photoRef = ref(storage, `profiles/${uid}/avatar.jpg`);
      await uploadBytes(photoRef, file);
      const photoUrl = await getDownloadURL(photoRef);
      
      await updateDoc(doc(db, "pros", uid!), { photoUrl });
      setPro(prev => ({ ...prev, photoUrl }));
      setSuccess("Photo de profil mise à jour !");
    } catch (err) {
      console.error("Photo upload error:", err);
      setError("Erreur lors de l'upload de la photo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const uid = auth.currentUser?.uid;
      const proRef = doc(db, "pros", uid!);
      
      await updateDoc(proRef, {
        ...formData,
        companyCategory,
        updatedAt: serverTimestamp(),
      });

      if (pro?.companyId) {
        await updateDoc(doc(db, "companies", pro.companyId), {
          name: formData.companyName,
          category: companyCategory,
          updatedAt: serverTimestamp(),
        });
        setCompany(prev => ({ ...prev, name: formData.companyName, category: companyCategory }));
      }

      setSuccess("Profil et informations entreprise mis à jour avec succès !");
      
      // Refresh local pro state
      const updatedPro = await getDoc(proRef);
      if (updatedPro.exists()) {
        setPro(updatedPro.data());
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Erreur lors de la mise à jour du profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/pro/login");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-zinc-300 mb-4" size={40} />
        <p className="text-zinc-400 font-medium">Chargement de votre profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#e4e4e8]">Mon profil</h1>
        <p className="text-[#9a9a9f] mt-2">Gérez vos informations personnelles et professionnelles.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm p-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-[#111113] flex items-center justify-center text-[#9a9a9f] font-bold text-3xl overflow-hidden border-4 border-[#2e2e34] shadow-md">
                {pro?.photoUrl ? (
                  <img src={pro.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{pro?.firstName?.[0]}{pro?.lastName?.[0]}</span>
                )}
              </div>
              <button 
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#4ade80] text-black rounded-full flex items-center justify-center border-2 border-[#1e1e22] shadow-sm hover:scale-110 transition-transform"
              >
                <Camera size={14} />
              </button>
              <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>
            
            <h2 className="text-xl font-bold text-[#e4e4e8]">{pro?.firstName} {pro?.lastName}</h2>
            <p className="text-[#9a9a9f] text-sm font-medium">{pro?.jobTitle || "Professionnel"}</p>
            
            <div className="mt-6 flex flex-col gap-2">
              {pro?.verified ? (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#4ade80]/10 text-[#4ade80] rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#4ade80]/20">
                  <ShieldCheck size={12} />
                  Professionnel vérifié
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                  <Loader2 size={12} className="animate-spin" />
                  Vérification en cours
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#9a9a9f] uppercase tracking-widest px-2">Statut du compte</h3>
            <div className={`p-4 rounded-2xl border ${
              pro?.status === 'active' ? 'bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]' :
              pro?.status === 'suspended' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
              'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                {pro?.status === 'active' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {pro?.status === 'active' ? 'Compte actif' : 
                 pro?.status === 'pending_validation' ? 'En attente' : 
                 pro?.status === 'suspended' ? 'Suspendu' : 'Refusé'}
              </div>
              <p className="text-xs opacity-80">
                {pro?.status === 'active' ? 'Votre compte est vérifié et opérationnel.' : 
                 pro?.status === 'pending_validation' ? 'Nos équipes vérifient vos documents.' : 
                 'Contactez le support pour plus d\'informations.'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </div>

        {/* Main Profile Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#2e2e34]">
                <h3 className="text-xl font-bold text-[#e4e4e8]">Informations personnelles</h3>
              </div>
              
              <div className="p-8 space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-500 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-2xl flex items-start gap-3 text-[#4ade80] text-sm">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                    <p>{success}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1 text-[#9a9a9f]">Prénom</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1 text-[#9a9a9f]">Nom</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-[#9a9a9f]">Email professionnel</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
                    <input
                      type="email"
                      disabled
                      value={pro?.email}
                      className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 pl-12 text-[#9a9a9f] cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-[#9a9a9f] mt-2 ml-1 italic">L'email ne peut pas être modifié pour des raisons de sécurité.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1 text-[#9a9a9f]">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 pl-12 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1 text-[#9a9a9f]">Poste / Titre</label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#2e2e34]">
                <h3 className="text-xl font-bold text-[#e4e4e8]">Informations entreprise</h3>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold ml-1 text-[#9a9a9f]">Nom de l'entreprise</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Nom de votre entreprise"
                    className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold ml-1 text-[#9a9a9f]">Catégorie d'entreprise</label>
                  <div className="relative">
                    <select
                      name="companyCategory"
                      value={companyCategory}
                      onChange={handleInputChange}
                      className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-[#e4e4e8] focus:border-[#4ade80] outline-none transition-all appearance-none"
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {companyCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9a9a9f]">
                      <ChevronRight size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#9a9a9f] uppercase tracking-widest">Justificatif SIRET</h4>
                  <div className="flex items-center justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText className="text-[#9a9a9f]" size={24} />
                      <div>
                        <p className="text-sm font-bold text-[#e4e4e8]">Document SIRET / Kbis</p>
                        <p className="text-[10px] text-[#9a9a9f] uppercase tracking-widest">Uploadé le {pro?.createdAt ? format(pro.createdAt.toDate(), "dd/MM/yyyy") : "-"}</p>
                      </div>
                    </div>
                    <a 
                      href={pro?.siretDocUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-[#4ade80] hover:underline flex items-center gap-1"
                    >
                      Voir le document
                      <ChevronRight size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full md:w-auto bg-[#4ade80] text-black px-12 py-4 rounded-2xl font-bold hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
