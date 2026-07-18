import React, { useState, useRef } from "react";
import { 
  User, 
  Building2, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Upload,
  Loader2,
  ShieldCheck,
  AlertCircle,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AppLogo from "../../components/AppLogo";
import { emailService } from "../../services/emailService";

import { handleFirestoreError, OperationType } from "../../lib/firestore-errors";

const STEPS = [
  { id: 1, label: "Personnel", icon: User },
  { id: 2, label: "Entreprise", icon: Building2 },
  { id: 3, label: "Justificatif (Désactivé)", icon: FileText },
  { id: 4, label: "Validation", icon: CheckCircle2 },
];

export default function ProRegister() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    jobTitle: "",
    companyName: "",
    companyDomain: "",
    companySiret: "",
    acceptTerms: false,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [siretFile, setSiretFile] = useState<File | null>(null);
  const [siretFileName, setSiretFileName] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const siretInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSiretFile(file);
    }
  };

  const [siretPreview, setSiretPreview] = useState<string | null>(null);

  const processSiretFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 5 Mo)");
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez PDF, JPG ou PNG.");
      return;
    }
    setSiretFile(file);
    setSiretFileName(file.name);
    setError(null);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSiretPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSiretPreview(null);
    }
  };

  const handleSiretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSiretFile(file);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        setError("Veuillez remplir tous les champs obligatoires.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Veuillez entrer une adresse email valide.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (formData.password.length < 8) {
        setError("Le mot de passe doit faire au moins 8 caractères.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.companyName || !formData.companySiret) {
        setError("Veuillez remplir les informations de l'entreprise.");
        return;
      }
      if (formData.companySiret.length !== 14 || !/^\d+$/.test(formData.companySiret)) {
        setError("Le numéro SIRET doit comporter exactement 14 chiffres.");
        return;
      }
      // Skip step 3 for demo
      setError(null);
      setCurrentStep(4);
      return;
    }
    
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    if (currentStep === 4) {
      setCurrentStep(2);
      return;
    }
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Gérer l'authentification
      let uid = "";
      
      // Si l'utilisateur est déjà connecté avec le bon email, on utilise son UID
      if (auth.currentUser && auth.currentUser.email === formData.email) {
        uid = auth.currentUser.uid;
        console.log("Utilisateur déjà connecté avec cet email, UID:", uid);
      } else {
        try {
          console.log("Tentative de création du compte Auth pour:", formData.email);
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          uid = userCredential.user.uid;
          console.log("Compte Auth créé avec succès, UID:", uid);
        } catch (authErr: any) {
          console.log("Erreur lors de la création Auth:", authErr.code, authErr.message);
          
          // Si l'email est déjà utilisé, on tente de se connecter
          if (authErr.code === "auth/email-already-in-use" || authErr.message?.includes("email-already-in-use")) {
            try {
              console.log("L'email existe déjà. Tentative de connexion...");
              const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
              uid = userCredential.user.uid;
              console.log("Connexion réussie, UID:", uid);
            } catch (loginErr: any) {
              console.error("Erreur lors de la tentative de connexion:", loginErr);
              if (loginErr.code === "auth/wrong-password" || loginErr.code === "auth/invalid-credential") {
                throw new Error("Cet email est déjà enregistré. Si c'est votre compte, merci d'utiliser le bon mot de passe. Si vous l'avez oublié, réinitialisez-le sur la page de connexion.");
              }
              throw loginErr;
            }
          } else {
            throw authErr;
          }
        }
      }

      // Vérifier si le profil existe déjà dans la collection "pros"
      let proDoc;
      try {
        proDoc = await getDoc(doc(db, "pros", uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `pros/${uid}`);
      }

      if (proDoc && proDoc.exists()) {
        const data = proDoc.data();
        if (data.status === "rejected") {
          throw new Error("Votre demande précédente a été refusée. Veuillez contacter le support.");
        }
        throw new Error("Ce compte professionnel est déjà actif ou en attente de validation. Veuillez vous connecter directement.");
      }

      let photoUrl = "";
      let siretDocUrl = "";

      // 2. Uploader la photo (Désactivé pour la démo si Storage absent)
      if (photoFile) {
        console.log("Uploading photo (skipped for demo)...");
        /* 
        try {
          const photoRef = ref(storage, `profiles/${uid}/avatar.jpg`);
          await uploadBytes(photoRef, photoFile);
          photoUrl = await getDownloadURL(photoRef);
        } catch (uploadErr) {
          console.error("Error uploading photo:", uploadErr);
        }
        */
      }

      // 3. Uploader le document SIRET (Désactivé pour la démo)
      if (siretFile) {
        console.log("Uploading SIRET document (skipped for demo)...");
      }

      // 4. Gérer l'entreprise (recherche ou création)
      let companyId = formData.companySiret; // Utiliser le SIRET comme ID pour simplifier
      const companyRef = doc(db, "companies", companyId);
      let companySnap;
      try {
        companySnap = await getDoc(companyRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `companies/${companyId}`);
      }

      if (companySnap && !companySnap.exists()) {
        console.log("Creating company document...");
        try {
          await setDoc(companyRef, {
            id: companyId,
            name: formData.companyName,
            domain: formData.companyDomain,
            siret: formData.companySiret,
            status: "pending",
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}`);
        }
      }

      // 5. Créer le doc Firestore pros/{uid}
      const proData = {
        id: uid,
        role: "pro",
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        photoUrl,
        jobTitle: formData.jobTitle,
        companyId,
        status: "pending_validation",
        verified: false,
        siretDocUrl,
        siretVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log("Creating pro document...");
      try {
        await setDoc(doc(db, "pros", uid), proData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `pros/${uid}`);
      }
      console.log("Profil Firestore créé avec succès pour UID:", uid);

      // 6. Envoyer l'email de confirmation d'inscription
      await emailService.sendProRegistrationConfirmationEmail(formData.email, formData.firstName);

      // Envoyer la notification d'inscription à l'administrateur
      await emailService.sendAdminRegistrationNotification({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        profession: formData.jobTitle,
        companyName: formData.companyName,
        siret: formData.companySiret
      }, "pro_solo");

      // 7. TODO: Appeler POST /api/set-role avec { uid, role: "pro" }
      // Mocking the API call
      console.log("Calling /api/set-role for uid:", uid);

      // Succès
      setCurrentStep(5); // Écran de confirmation finale
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-inter">
        <div className="w-full max-w-md bg-[#1e1e22] rounded-3xl shadow-2xl border border-[#2e2e34] p-10 text-center">
          <div className="w-20 h-20 bg-[#4ade80]/10 text-[#4ade80] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#4ade80]/5">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-[#e4e4e8] mb-4">Demande reçue !</h1>
          <p className="text-[#9a9a9f] mb-8 leading-relaxed">
            Merci, nous avons bien reçu votre demande, c'est en cours de validation.
          </p>
          <div className="bg-[#4ade80]/5 p-4 rounded-2xl text-[#4ade80] text-sm mb-8 border border-[#4ade80]/10">
            Vous recevrez un email de confirmation dès que votre compte sera activé (sous 24-48h).
          </div>
          <Link
            to="/pro/login"
            className="block w-full bg-[#4ade80] text-black font-bold py-4 rounded-2xl hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/20"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 font-body">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <AppLogo 
            size={48} 
            className="flex-col gap-3" 
            textClassName="text-xl font-headline" 
            iconContainerClassName="shadow-lg shadow-primary/20 rounded-xl" 
          />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 block">PRO</span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#2e2e34] -translate-y-1/2 z-0"></div>
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? "bg-primary-container text-on-primary-container" : 
                  isActive ? "bg-primary text-on-primary scale-110 shadow-lg shadow-primary/20" : 
                  step.id === 3 ? "bg-surface-container-highest/50 border-2 border-surface-container-highest/30 text-on-surface-variant/30 opacity-50" :
                  "bg-surface-container-highest border-2 border-surface-container-highest text-on-surface-variant"
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </div>
                <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${
                  isActive ? "text-primary" : "text-on-surface-variant"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-surface-container rounded-3xl shadow-2xl border border-surface-container-highest p-8 md:p-10">
          {error && (
            <div className="mb-8 p-4 bg-error-container/20 border border-error-container/30 rounded-2xl flex items-start gap-3 text-error text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold mb-6 text-on-surface">Informations personnelles</h2>
              
              <div className="flex flex-col items-center mb-8">
                <div 
                  className="relative w-24 h-24 rounded-full bg-surface-container-highest border-2 border-dashed border-surface-container-highest flex items-center justify-center overflow-hidden group cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="text-on-surface-variant group-hover:scale-110 transition-transform" size={32} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="text-white" size={20} />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={photoInputRef} 
                  onChange={handlePhotoChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <p className="text-xs text-on-surface-variant mt-3">Photo de profil (optionnel)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Prénom *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Nom *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Email professionnel *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="jean.dupont@entreprise.fr"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Mot de passe *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Confirmer *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Téléphone pro</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="06 00 00 00 00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Poste / Titre</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Conseiller clientèle"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Company Info */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold mb-6 text-on-surface">Informations entreprise</h2>
              
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Nom de l'entreprise *</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="BNP Paribas"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Domaine (ex: bnp.fr)</label>
                <input
                  type="text"
                  name="companyDomain"
                  value={formData.companyDomain}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="bnpparibas.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Numéro SIRET (14 chiffres) *</label>
                <input
                  type="text"
                  name="companySiret"
                  required
                  maxLength={14}
                  value={formData.companySiret}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="12345678901234"
                />
              </div>

              <div className="p-4 bg-surface-container-highest rounded-2xl border border-surface-container-highest">
                <p className="text-xs text-on-surface-variant italic">
                  Note : Si votre entreprise est déjà enregistrée sur SafeCallr, votre compte y sera automatiquement rattaché après vérification.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Document Upload */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold mb-6 text-on-surface">Document justificatif</h2>
              
              <p className="text-sm text-on-surface-variant mb-6">
                Pour valider votre compte professionnel, nous avons besoin d'un justificatif d'activité (SIRET ou Kbis de moins de 3 mois).
              </p>

              <div 
                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  siretFile ? "border-primary/40 bg-primary/5" : 
                  isDragging ? "border-primary bg-surface-container-highest scale-[1.02]" : "border-surface-container-highest bg-surface-container-highest hover:border-primary/50"
                }`}
                onClick={() => siretInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {siretFile ? (
                  <>
                    <div className="w-24 h-24 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 overflow-hidden border-2 border-primary/20">
                      {siretPreview ? (
                        <img src={siretPreview} alt="Siret Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={40} />
                      )}
                    </div>
                    <p className="font-bold text-primary text-center px-4 truncate max-w-xs">{siretFileName}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSiretFile(null); setSiretFileName(null); setSiretPreview(null); }}
                      className="mt-4 text-xs font-bold text-error hover:underline"
                    >
                      Supprimer et changer
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-surface-container text-on-surface-variant rounded-full flex items-center justify-center mb-4 border border-surface-container-highest">
                      <Upload size={32} />
                    </div>
                    <p className="font-bold text-on-surface">Cliquez pour uploader</p>
                    <p className="text-xs text-on-surface-variant mt-2">PDF, JPG, PNG (max 5 Mo)</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={siretInputRef} 
                  onChange={handleSiretChange} 
                  accept=".pdf,image/*" 
                  className="hidden" 
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl text-primary text-xs border border-primary/10">
                <AlertCircle size={16} className="shrink-0" />
                <p>Ce document sera vérifié manuellement par notre équipe de sécurité. Toutes les données sont cryptées et stockées de manière sécurisée.</p>
              </div>
            </div>
          )}

          {/* STEP 4: Summary */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold mb-6 text-on-surface">Récapitulatif</h2>
              
              <div className="space-y-4 divide-y divide-surface-container-highest">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-on-surface-variant">Nom complet</span>
                  <span className="text-sm font-bold text-on-surface">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-on-surface-variant">Email</span>
                  <span className="text-sm font-bold text-on-surface">{formData.email}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-on-surface-variant">Entreprise</span>
                  <span className="text-sm font-bold text-on-surface">{formData.companyName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-on-surface-variant">SIRET</span>
                  <span className="text-sm font-bold text-on-surface">{formData.companySiret}</span>
                </div>
                <div className="flex justify-between py-2 opacity-50">
                  <span className="text-sm text-on-surface-variant italic">Justificatif (Étape ignorée pour la démo)</span>
                  <span className="text-sm font-bold text-on-surface-variant italic">Non requis</span>
                </div>
              </div>

              <div className="pt-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-surface-container-highest transition-all checked:bg-primary checked:border-primary"
                    />
                    <CheckCircle2 className="absolute h-3.5 w-3.5 text-on-primary opacity-0 peer-checked:opacity-100 left-0.5" />
                  </div>
                  <span className="text-sm text-on-surface-variant leading-tight group-hover:text-on-surface transition-colors">
                    J'accepte les <Link to="/terms" className="underline font-medium text-primary">conditions d'utilisation</Link> et la politique de confidentialité de SafeCallr.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between gap-4">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-surface-container-highest font-bold text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-50"
              >
                <ArrowLeft size={20} />
                Retour
              </button>
            )}
            
            <button
              onClick={currentStep === 4 ? handleSubmit : nextStep}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                currentStep === 4 ? "bg-primary text-on-primary hover:opacity-90 shadow-primary/10" : "bg-on-surface text-surface hover:opacity-90"
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {currentStep === 4 ? "Soumettre ma demande" : "Continuer"}
                  {currentStep < 4 && <ArrowRight size={20} />}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant text-sm">
            Déjà un compte professionnel ? <Link to="/pro/login" className="text-primary font-bold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
