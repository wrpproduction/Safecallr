import React, { useState, useRef, useEffect } from "react";
import { 
  User, 
  Building2, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Loader2, 
  ShieldCheck, 
  AlertCircle, 
  FileCheck, 
  CreditCard, 
  Trash2,
  Globe2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref } from "firebase/storage";
import AppLogo from "../../components/AppLogo";
import LanguageSelector from "../../components/LanguageSelector";
import { useLanguage } from "../../contexts/LanguageContext";
import { emailService } from "../../services/emailService";
import { uploadStorageWithTimeout } from "../../lib/imageUtils";
import { handleFirestoreError, OperationType } from "../../lib/firestore-errors";

type CountryCode = "FR" | "ES" | "GB" | "US" | "OTHER";

interface CountryConfig {
  code: CountryCode;
  name: { fr: string; en: string; es: string };
  flag: string;
  idLabel: { fr: string; en: string; es: string };
  idPlaceholder: string;
  idHint: { fr: string; en: string; es: string };
  doc1Title: { fr: string; en: string; es: string };
  doc1Subtitle: { fr: string; en: string; es: string };
  doc1Badge: { fr: string; en: string; es: string };
  doc2Title: { fr: string; en: string; es: string };
  doc2Subtitle: { fr: string; en: string; es: string };
  doc2Badge: { fr: string; en: string; es: string };
}

const COUNTRIES: Record<CountryCode, CountryConfig> = {
  FR: {
    code: "FR",
    name: { fr: "France", en: "France", es: "Francia" },
    flag: "🇫🇷",
    idLabel: { 
      fr: "Numéro SIRET (14 chiffres) ou SIREN (9 chiffres) *", 
      en: "SIRET (14 digits) or SIREN (9 digits) number *", 
      es: "Número SIRET (14 dígitos) o SIREN (9 dígitos) *" 
    },
    idPlaceholder: "Ex: 83948291000024 ou 839482910",
    idHint: {
      fr: "Le SIRET/SIREN sera vérifié avec le document KBIS / SIRENE.",
      en: "The SIRET/SIREN will be matched against the official KBIS/SIRENE certificate.",
      es: "El SIRET/SIREN se verificará con el documento KBIS / SIRENE."
    },
    doc1Title: { 
      fr: "Extrait KBIS ou avis SIRENE *", 
      en: "KBIS Extract or SIRENE Certificate *", 
      es: "Extracto KBIS o Certificado SIRENE *" 
    },
    doc1Subtitle: { 
      fr: "Kbis officiel de moins de 3 mois de la société (ou avis de situation INSEE / SIRENE récent).", 
      en: "Official company KBIS extract (< 3 months) or recent INSEE/SIRENE registration notice.", 
      es: "Extracto oficial KBIS de menos de 3 meses o certificado de registro INSEE/SIRENE reciente." 
    },
    doc1Badge: { fr: "KBIS / SIRENE", en: "KBIS / SIRENE", es: "KBIS / SIRENE" },
    doc2Title: { 
      fr: "Pièce d'identité du gérant *", 
      en: "Director / Representative Photo ID *", 
      es: "Documento de identidad del administrador *" 
    },
    doc2Subtitle: { 
      fr: "Carte Nationale d'Identité (recto/verso) ou Passeport en cours de validité du dirigeant légal.", 
      en: "Valid National ID Card (front/back) or Passport of the legal director or manager.", 
      es: "DNI (anverso/reverso) o Pasaporte en vigor del administrador o representante legal." 
    },
    doc2Badge: { fr: "Identité Gérant", en: "Director ID", es: "Identidad Administrador" }
  },
  ES: {
    code: "ES",
    name: { fr: "Espagne", en: "Spain", es: "España" },
    flag: "🇪🇸",
    idLabel: { 
      fr: "Numéro CIF / NIF de l'entreprise *", 
      en: "Company Tax Identification Number (CIF / NIF) *", 
      es: "Número CIF / NIF de la empresa *" 
    },
    idPlaceholder: "Ex: B12345678 o A87654321",
    idHint: {
      fr: "Le CIF/NIF sera vérifié avec le certificat du Registro Mercantil ou l'acte d'incorporation.",
      en: "The CIF/NIF will be verified against the Mercantile Registry certificate or tax card.",
      es: "El CIF/NIF se verificará con el certificado del Registro Mercantil o tarjeta NIF definitiva."
    },
    doc1Title: { 
      fr: "Certificat Registre du Commerce / CIF *", 
      en: "Mercantile Registry Certificate / CIF Tax Card *", 
      es: "Certificado de Registro Mercantil / CIF definitivo *" 
    },
    doc1Subtitle: { 
      fr: "Certificat du Registro Mercantil, carte NIF/CIF définitive ou extrait d'acte de constitution de la société.", 
      en: "Official certificate from the Mercantile Registry (Registro Mercantil), definitive CIF/NIF or deed of incorporation.", 
      es: "Certificado oficial del Registro Mercantil, tarjeta del CIF/NIF definitivo o escritura de constitución." 
    },
    doc1Badge: { fr: "Registro Mercantil", en: "Commercial Registry", es: "Registro Mercantil" },
    doc2Title: { 
      fr: "Pièce d'identité du représentant légal (DNI / NIE / Passeport) *", 
      en: "Legal Representative ID (DNI / NIE / Passport) *", 
      es: "DNI / NIE / Pasaporte del representante legal *" 
    },
    doc2Subtitle: { 
      fr: "DNI, NIE ou Passeport en cours de validité de l'administrateur ou fondé de pouvoir de la structure.", 
      en: "Valid DNI, NIE or Passport of the legal director, administrator or authorized signatory.", 
      es: "DNI, NIE o Pasaporte en vigor del administrador o apoderado legal de la entidad." 
    },
    doc2Badge: { fr: "DNI / NIE Gérant", en: "DNI / NIE Director", es: "DNI / NIE Administrador" }
  },
  GB: {
    code: "GB",
    name: { fr: "Royaume-Uni (UK)", en: "United Kingdom", es: "Reino Unido" },
    flag: "🇬🇧",
    idLabel: { 
      fr: "Numéro Companies House (CRN) / VAT *", 
      en: "Companies House Registration Number (CRN) / VAT *", 
      es: "Número Companies House (CRN) / VAT *" 
    },
    idPlaceholder: "Ex: 01234567 or SC123456",
    idHint: {
      fr: "Le numéro d'immatriculation Companies House sera vérifié avec le certificat d'incorporation.",
      en: "The CRN will be matched with the official Certificate of Incorporation from Companies House.",
      es: "El número de registro se verificará con el Certificado de Constitución oficial."
    },
    doc1Title: { 
      fr: "Certificate of Incorporation *", 
      en: "Certificate of Incorporation *", 
      es: "Certificado de Constitución (Certificate of Incorporation) *" 
    },
    doc1Subtitle: { 
      fr: "Certificat officiel d'enregistrement Companies House ou extrait récent du Confirmation Statement.", 
      en: "Official Companies House Certificate of Incorporation or recent Confirmation Statement document.", 
      es: "Certificado oficial de Companies House (Certificate of Incorporation) o confirmación registral reciente." 
    },
    doc1Badge: { fr: "Incorporation Doc", en: "Incorporation Doc", es: "Incorporation Doc" },
    doc2Title: { 
      fr: "Passeport / Pièce d'identité du Directeur *", 
      en: "Director's Passport / National Photo ID *", 
      es: "Pasaporte / Documento de Identidad del Director *" 
    },
    doc2Subtitle: { 
      fr: "Passeport ou permis de conduire / pièce d'identité en cours de validité du Director officiel.", 
      en: "Valid Passport, UK Driving Licence or Government-issued Photo ID of the registered Director.", 
      es: "Pasaporte en vigor, carnet de conducir o documento oficial de identidad con foto del Director." 
    },
    doc2Badge: { fr: "Director ID", en: "Director ID", es: "Director ID" }
  },
  US: {
    code: "US",
    name: { fr: "États-Unis (USA)", en: "United States", es: "Estados Unidos" },
    flag: "🇺🇸",
    idLabel: { 
      fr: "Numéro EIN (Federal Tax ID) / State Filing # *", 
      en: "EIN (Employer Identification Number / Federal Tax ID) *", 
      es: "Número EIN (Federal Tax ID / Identificación Fiscal) *" 
    },
    idPlaceholder: "Ex: 12-3456789 or State ID",
    idHint: {
      fr: "L'EIN ou le numéro d'enregistrement de l'État sera vérifié avec le document officiel.",
      en: "The EIN or State Entity Number will be matched against your official filing documents.",
      es: "El EIN o número de registro estatal se verificará con los documentos oficiales."
    },
    doc1Title: { 
      fr: "Articles of Organization / IRS EIN Letter *", 
      en: "Articles of Incorporation / IRS EIN Confirmation *", 
      es: "Articles of Incorporation / Confirmación IRS EIN *" 
    },
    doc1Subtitle: { 
      fr: "Copie des Articles of Organization/Incorporation, lettre IRS CP575 ou Certificate of Good Standing.", 
      en: "Articles of Organization/Incorporation, IRS CP575 EIN confirmation letter, or Certificate of Good Standing.", 
      es: "Articles of Incorporation/Organization, carta de confirmación del IRS (CP575) o Certificate of Good Standing." 
    },
    doc1Badge: { fr: "EIN / Articles", en: "EIN / Articles", es: "EIN / Articles" },
    doc2Title: { 
      fr: "Passeport / Driver's License de l'Officer / Owner *", 
      en: "Director / Owner Government Photo ID or Passport *", 
      es: "Documento de Identidad Oficial / Pasaporte del Propietario *" 
    },
    doc2Subtitle: { 
      fr: "Permis de conduire américain officiel ou Passeport en cours de validité du dirigeant ou signataire autorisé.", 
      en: "Valid US Driver's License, State ID, or Passport of the company officer, director or owner.", 
      es: "Licencia de conducir oficial, ID estatal o Pasaporte en vigor del director o signatario autorizado." 
    },
    doc2Badge: { fr: "Owner / Director ID", en: "Owner / Director ID", es: "Owner / Director ID" }
  },
  OTHER: {
    code: "OTHER",
    name: { fr: "Autre pays / International", en: "Other Country / International", es: "Otro país / Internacional" },
    flag: "🌐",
    idLabel: { 
      fr: "Numéro d'enregistrement d'entreprise / Tax ID *", 
      en: "Business Registration / Tax ID Number *", 
      es: "Número de Registro Empresarial / Identificación Fiscal *" 
    },
    idPlaceholder: "Ex: REG-98765432",
    idHint: {
      fr: "Renseignez le numéro légal d'identification commerciale dans votre pays.",
      en: "Enter the legal business identification or company registration number in your jurisdiction.",
      es: "Introduzca el número legal de identificación comercial en su país."
    },
    doc1Title: { 
      fr: "Justificatif officiel d'enregistrement de l'entreprise *", 
      en: "Official Business Registration Document *", 
      es: "Certificado Oficial de Registro Empresarial *" 
    },
    doc1Subtitle: { 
      fr: "Certificat d'incorporation officiel, extrait du registre du commerce ou licence d'exploitation valide.", 
      en: "Official certificate of incorporation, commercial register extract, or government business license.", 
      es: "Certificado oficial de constitución, extracto del registro mercantil o licencia de actividad comercial en vigor." 
    },
    doc1Badge: { fr: "Doc Entreprise", en: "Business Doc", es: "Doc Empresa" },
    doc2Title: { 
      fr: "Passeport / Pièce d'identité officielle du représentant *", 
      en: "Authorized Representative Passport / Official Photo ID *", 
      es: "Pasaporte / Documento de Identidad Oficial del Representante *" 
    },
    doc2Subtitle: { 
      fr: "Passeport international en cours de validité ou pièce d'identité nationale du dirigeant légal.", 
      en: "Valid international passport or national government photo ID of the legal representative.", 
      es: "Pasaporte internacional en vigor o documento nacional de identidad del representante legal." 
    },
    doc2Badge: { fr: "Identité Représentant", en: "Representative ID", es: "Identidad Representante" }
  }
};

export default function ProRegister() {
  const { lang } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Selected Country / Jurisdiction
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() => {
    if (lang === "es") return "ES";
    if (lang === "en") return "US";
    return "FR";
  });

  // Keep country in sync when user toggles language initially
  useEffect(() => {
    if (currentStep === 1) {
      if (lang === "es" && selectedCountry === "FR") setSelectedCountry("ES");
      if (lang === "en" && selectedCountry === "FR") setSelectedCountry("US");
      if (lang === "fr" && (selectedCountry === "ES" || selectedCountry === "US")) setSelectedCountry("FR");
    }
  }, [lang]);

  const activeCountry = COUNTRIES[selectedCountry] || COUNTRIES.FR;
  const currentLang = (lang === "es" || lang === "en") ? lang : "fr";

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

  // 1. Business Registration Document State (KBIS / CIF / Articles of Incorporation)
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [kbisFileName, setKbisFileName] = useState<string | null>(null);
  const [kbisFileSize, setKbisFileSize] = useState<string | null>(null);
  const [kbisPreview, setKbisPreview] = useState<string | null>(null);
  const [isDraggingKbis, setIsDraggingKbis] = useState(false);
  const kbisInputRef = useRef<HTMLInputElement>(null);

  // 2. Identity Document State (Director / Representative Photo ID)
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [identityFileName, setIdentityFileName] = useState<string | null>(null);
  const [identityFileSize, setIdentityFileSize] = useState<string | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [isDraggingIdentity, setIsDraggingIdentity] = useState(false);
  const identityInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.value;
    const isCheckbox = target.type === "checkbox";
    const checked = (target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // KBIS / Business Document Handlers
  const processKbisFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError(
        currentLang === "en" ? "Company document is too large (max 5 MB)." :
        currentLang === "es" ? "El documento de la empresa es demasiado grande (máx. 5 MB)." :
        "Le document de l'entreprise est trop volumineux (maximum 5 Mo)."
      );
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        currentLang === "en" ? "Unsupported format. Please upload a PDF, JPG or PNG file." :
        currentLang === "es" ? "Formato no compatible. Por favor suba un archivo PDF, JPG o PNG." :
        "Format non supporté. Veuillez utiliser un fichier PDF, JPG ou PNG."
      );
      return;
    }
    setKbisFile(file);
    setKbisFileName(file.name);
    setKbisFileSize(formatFileSize(file.size));
    setError(null);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKbisPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setKbisPreview(null);
    }
  };

  const handleKbisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processKbisFile(file);
    }
  };

  const removeKbisFile = () => {
    setKbisFile(null);
    setKbisFileName(null);
    setKbisFileSize(null);
    setKbisPreview(null);
    if (kbisInputRef.current) kbisInputRef.current.value = "";
  };

  // IDENTITY Handlers
  const processIdentityFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError(
        currentLang === "en" ? "Identity document is too large (max 5 MB)." :
        currentLang === "es" ? "El documento de identidad es demasiado grande (máx. 5 MB)." :
        "La pièce d'identité est trop volumineuse (maximum 5 Mo)."
      );
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        currentLang === "en" ? "Unsupported format. Please upload a PDF, JPG or PNG file." :
        currentLang === "es" ? "Formato no compatible. Por favor suba un archivo PDF, JPG o PNG." :
        "Format de la pièce d'identité non supporté. Veuillez utiliser un fichier PDF, JPG ou PNG."
      );
      return;
    }
    setIdentityFile(file);
    setIdentityFileName(file.name);
    setIdentityFileSize(formatFileSize(file.size));
    setError(null);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentityPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIdentityPreview(null);
    }
  };

  const handleIdentityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processIdentityFile(file);
    }
  };

  const removeIdentityFile = () => {
    setIdentityFile(null);
    setIdentityFileName(null);
    setIdentityFileSize(null);
    setIdentityPreview(null);
    if (identityInputRef.current) identityInputRef.current.value = "";
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        setError(
          currentLang === "en" ? "Please fill in all mandatory fields." :
          currentLang === "es" ? "Por favor complete todos los campos obligatorios." :
          "Veuillez remplir tous les champs obligatoires."
        );
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError(
          currentLang === "en" ? "Please enter a valid email address." :
          currentLang === "es" ? "Por favor introduzca un correo electrónico válido." :
          "Veuillez entrer une adresse email valide."
        );
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(
          currentLang === "en" ? "Passwords do not match." :
          currentLang === "es" ? "Las contraseñas no coinciden." :
          "Les mots de passe ne correspondent pas."
        );
        return;
      }
      if (formData.password.length < 8) {
        setError(
          currentLang === "en" ? "Password must be at least 8 characters." :
          currentLang === "es" ? "La contraseña debe tener al menos 8 caracteres." :
          "Le mot de passe doit faire au moins 8 caractères."
        );
        return;
      }
      setError(null);
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!formData.companyName || !formData.companySiret) {
        setError(
          currentLang === "en" ? "Please fill in your company name and registration/tax number." :
          currentLang === "es" ? "Por favor introduzca el nombre y número de registro/CIF de la empresa." :
          "Veuillez remplir les informations obligatoires de l'entreprise (Nom et numéro d'immatriculation)."
        );
        return;
      }

      // Check specific country format if France
      if (selectedCountry === "FR") {
        const cleanVal = formData.companySiret.replace(/\s+/g, "");
        if (!/^\d{9}$|^\d{14}$/.test(cleanVal)) {
          setError("Le numéro SIREN/SIRET français doit comporter 9 ou 14 chiffres.");
          return;
        }
      } else if (formData.companySiret.trim().length < 3) {
        setError(
          currentLang === "en" ? "Please enter a valid company registration or tax number." :
          currentLang === "es" ? "Por favor introduzca un número de identificación fiscal o registro válido." :
          "Veuillez saisir un numéro d'enregistrement valide."
        );
        return;
      }

      setError(null);
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!kbisFile && !identityFile) {
        setError(
          currentLang === "en" ? "Please upload both required documents (Company registration certificate & Director ID)." :
          currentLang === "es" ? "Por favor suba ambos documentos requeridos (Certificado de la empresa y DNI/Pasaporte del administrador)." :
          "Veuillez charger les 2 documents requis (Justificatif d'entreprise et pièce d'identité du gérant)."
        );
        return;
      }
      if (!kbisFile) {
        setError(
          currentLang === "en" ? "Please upload your official company registration document." :
          currentLang === "es" ? "Por favor suba el documento oficial de registro de la empresa." :
          "Veuillez charger le document officiel d'immatriculation de l'entreprise."
        );
        return;
      }
      if (!identityFile) {
        setError(
          currentLang === "en" ? "Please upload the Director / Legal Representative's ID document." :
          currentLang === "es" ? "Por favor suba el documento de identidad del representante legal." :
          "Veuillez charger la pièce d'identité ou le passeport du gérant."
        );
        return;
      }
      setError(null);
      setCurrentStep(4);
      return;
    }
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsDataURL(file);
    });
  };

  const uploadFileWithFallback = async (file: File, storagePath: string): Promise<string> => {
    try {
      const storageRef = ref(storage, storagePath);
      return await uploadStorageWithTimeout(storageRef, file, 3000);
    } catch (storageErr) {
      console.warn(`[SafeCallr] Storage upload failed for ${storagePath}, using Data URL fallback:`, storageErr);
      return await convertFileToDataUrl(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      setError(
        currentLang === "en" ? "You must accept the terms of service to continue." :
        currentLang === "es" ? "Debe aceptar los términos y condiciones para continuar." :
        "Vous devez accepter les conditions d'utilisation."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Authentification Firebase
      let uid = "";
      
      if (auth.currentUser && auth.currentUser.email === formData.email) {
        uid = auth.currentUser.uid;
      } else {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          uid = userCredential.user.uid;
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use" || authErr.message?.includes("email-already-in-use")) {
            try {
              const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
              uid = userCredential.user.uid;
            } catch (loginErr: any) {
              if (loginErr.code === "auth/wrong-password" || loginErr.code === "auth/invalid-credential") {
                throw new Error(
                  currentLang === "en" ? "This email is already registered. If it belongs to you, please use the correct password." :
                  currentLang === "es" ? "Este correo ya está registrado. Si es su cuenta, introduzca la contraseña correcta." :
                  "Cet email est déjà enregistré. Si c'est votre compte, merci d'utiliser le bon mot de passe."
                );
              }
              throw loginErr;
            }
          } else {
            throw authErr;
          }
        }
      }

      // Check existing pro status
      let proDoc;
      try {
        proDoc = await getDoc(doc(db, "pros", uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `pros/${uid}`);
      }

      if (proDoc && proDoc.exists()) {
        const data = proDoc.data();
        if (data.status === "rejected") {
          throw new Error(
            currentLang === "en" ? "Your previous application was rejected. Please contact support." :
            currentLang === "es" ? "Su solicitud anterior fue rechazada. Póngase en contacto con soporte." :
            "Votre demande précédente a été refusée. Veuillez contacter le support."
          );
        }
        throw new Error(
          currentLang === "en" ? "This professional account is already active or awaiting validation. Please sign in." :
          currentLang === "es" ? "Esta cuenta profesional ya está activa o pendiente de validación. Inicie sesión." :
          "Ce compte professionnel est déjà actif ou en attente de validation. Veuillez vous connecter directement."
        );
      }

      // 2. Upload Business Document
      let kbisDocUrl = "";
      if (kbisFile) {
        const ext = kbisFile.name.split(".").pop() || "pdf";
        kbisDocUrl = await uploadFileWithFallback(kbisFile, `pros/${uid}/business_doc_${Date.now()}.${ext}`);
      }

      // 3. Upload Identity Document
      let identityDocUrl = "";
      if (identityFile) {
        const ext = identityFile.name.split(".").pop() || "pdf";
        identityDocUrl = await uploadFileWithFallback(identityFile, `pros/${uid}/identity_${Date.now()}.${ext}`);
      }

      // 4. Manage Company in Firestore
      const companyCleanId = formData.companySiret.replace(/\s+/g, "").toUpperCase();
      let companyId = `${selectedCountry}_${companyCleanId}`;
      const companyRef = doc(db, "companies", companyId);
      let companySnap;
      try {
        companySnap = await getDoc(companyRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `companies/${companyId}`);
      }

      if (!companySnap || !companySnap.exists()) {
        try {
          await setDoc(companyRef, {
            id: companyId,
            name: formData.companyName,
            domain: formData.companyDomain,
            country: selectedCountry,
            countryName: activeCountry.name[currentLang],
            siret: formData.companySiret,
            registrationNumber: formData.companySiret,
            kbisDocUrl: kbisDocUrl || "",
            siretDocUrl: kbisDocUrl || "",
            status: "pending",
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}`);
        }
      }

      // 5. Create Pro document in `pros/{uid}`
      const proData = {
        id: uid,
        role: "pro",
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        photoUrl: "",
        photoURL: "",
        jobTitle: formData.jobTitle,
        country: selectedCountry,
        countryName: activeCountry.name[currentLang],
        companyId,
        companyName: formData.companyName,
        companySiret: formData.companySiret,
        companyRegistrationNumber: formData.companySiret,
        status: "pending_validation",
        verified: false,
        // Business document
        kbisDocUrl,
        siretDocUrl: kbisDocUrl,
        kbisFileName: kbisFileName || "business_document.pdf",
        kbisFileSize: kbisFileSize || "",
        // Representative Identity document
        identityDocUrl,
        idCardDocUrl: identityDocUrl,
        identityFileName: identityFileName || "representative_id.pdf",
        identityFileSize: identityFileSize || "",
        documentsSubmitted: true,
        siretVerified: false,
        registeredLanguage: currentLang,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, "pros", uid), proData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `pros/${uid}`);
      }

      // 6. Emails
      try {
        await emailService.sendProRegistrationConfirmationEmail(formData.email, formData.firstName, uid);
      } catch (emailErr) {
        console.warn("Pro confirmation email warning:", emailErr);
      }

      try {
        await emailService.sendAdminRegistrationNotification({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          profession: formData.jobTitle,
          companyName: formData.companyName,
          siret: formData.companySiret
        }, "pro_solo");
      } catch (adminEmailErr) {
        console.warn("Admin email notification warning:", adminEmailErr);
      }

      // Succès -> écran de confirmation finale
      setCurrentStep(5);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || (
        currentLang === "en" ? "An error occurred during registration." :
        currentLang === "es" ? "Se produjo un error durante el registro." :
        "Une erreur est survenue lors de l'inscription."
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const STEPS = [
    { 
      id: 1, 
      label: currentLang === "en" ? "Personal" : currentLang === "es" ? "Personal" : "Personnel", 
      icon: User 
    },
    { 
      id: 2, 
      label: currentLang === "en" ? "Company" : currentLang === "es" ? "Empresa" : "Entreprise", 
      icon: Building2 
    },
    { 
      id: 3, 
      label: currentLang === "en" ? "Documents" : currentLang === "es" ? "Documentos" : "Justificatifs", 
      icon: FileText 
    },
    { 
      id: 4, 
      label: currentLang === "en" ? "Review" : currentLang === "es" ? "Revisión" : "Validation", 
      icon: CheckCircle2 
    },
  ];

  // Success Step Screen
  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-body">
        <div className="w-full max-w-md bg-surface-container rounded-3xl shadow-2xl border border-surface-container-highest p-8 md:p-10 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-4">
            {currentLang === "en" ? "Application Submitted Successfully!" :
             currentLang === "es" ? "¡Solicitud Enviada con Éxito!" :
             "Demande reçue avec succès !"}
          </h1>
          <p className="text-on-surface-variant mb-6 leading-relaxed text-sm">
            {currentLang === "en" ? (
              <>Thank you! Your application and official verification documents have been received by our compliance team.</>
            ) : currentLang === "es" ? (
              <>¡Muchas gracias! Su expediente de registro y los documentos oficiales han sido transmitidos a nuestro equipo de conformidad.</>
            ) : (
              <>Merci ! Votre dossier d'inscription ainsi que vos justificatifs officiels ont bien été transmis à notre équipe de conformité.</>
            )}
          </p>
          <div className="bg-primary/5 p-4 rounded-2xl text-primary text-xs mb-8 border border-primary/15 text-left space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} /> 
              {currentLang === "en" ? "Verification in progress" :
               currentLang === "es" ? "Verificación en curso" :
               "Vérification en cours"}
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              {currentLang === "en" ? "You will receive an email notification once your documents are validated (usually within 24 business hours)." :
               currentLang === "es" ? "Recibirá una notificación por correo electrónico tan pronto como se validen sus documentos (habitualmente en 24h laborables)." :
               "Vous recevrez une notification par email dès la validation de vos pièces (généralement sous 24h ouvrées)."}
            </p>
          </div>
          <Link
            to="/pro/login"
            className="block w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 text-center text-sm"
          >
            {currentLang === "en" ? "Back to Login" :
             currentLang === "es" ? "Volver al inicio de sesión" :
             "Retour à la connexion"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4 font-body">
      <div className="w-full max-w-3xl">
        
        {/* Top bar with Logo and Language Selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-10"></div>
          <div className="flex flex-col items-center">
            <AppLogo 
              size={44} 
              className="flex-col gap-2" 
              textClassName="text-xl font-headline" 
              iconContainerClassName="shadow-lg shadow-primary/20 rounded-xl" 
            />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5 block">PRO</span>
          </div>
          <div className="flex items-center justify-end">
            <LanguageSelector />
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-10 relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-highest -translate-y-1/2 z-0"></div>
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? "bg-primary-container text-on-primary-container" : 
                  isActive ? "bg-primary text-on-primary scale-110 shadow-lg shadow-primary/20" : 
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
        <div className="bg-surface-container rounded-3xl shadow-2xl border border-surface-container-highest p-7 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-error-container/20 border border-error-container/30 rounded-2xl flex items-start gap-3 text-error text-sm animate-in fade-in duration-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: Personal Info (No photo requested as per instructions) */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  {currentLang === "en" ? "Personal Information" :
                   currentLang === "es" ? "Información personal" :
                   "Informations personnelles"}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {currentLang === "en" ? "Enter your professional contact information." :
                   currentLang === "es" ? "Rellene sus datos de contacto profesional." :
                   "Renseignez vos coordonnées de contact professionnel."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                    {currentLang === "en" ? "First Name *" : currentLang === "es" ? "Nombre *" : "Prénom *"}
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                    {currentLang === "en" ? "Last Name *" : currentLang === "es" ? "Apellidos *" : "Nom *"}
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                  {currentLang === "en" ? "Professional Email *" : currentLang === "es" ? "Correo electrónico profesional *" : "Email professionnel *"}
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="contact@entreprise.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                    {currentLang === "en" ? "Password (8+ chars) *" : currentLang === "es" ? "Contraseña (8+ car.) *" : "Mot de passe (8+ car.) *"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                    {currentLang === "en" ? "Confirm Password *" : currentLang === "es" ? "Confirmar Contraseña *" : "Confirmer mot de passe *"}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                    {currentLang === "en" ? "Phone Number" : currentLang === "es" ? "Teléfono de contacto" : "Téléphone professionnel"}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="+33 6 00 00 00 00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                    {currentLang === "en" ? "Job Title / Role" : currentLang === "es" ? "Cargo / Función" : "Poste / Fonction"}
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    placeholder={currentLang === "en" ? "Director, Manager, Consultant..." : currentLang === "es" ? "Director, Gerente, Consultor..." : "Gérant, Conseiller, Directeur..."}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Company Info with Country / Jurisdiction Selector */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  {currentLang === "en" ? "Company Information" :
                   currentLang === "es" ? "Información de la empresa" :
                   "Informations de l'entreprise"}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {currentLang === "en" ? "Identify the legal structure and jurisdiction of your business." :
                   currentLang === "es" ? "Identifique la estructura legal y país de registro de su empresa." :
                   "Identifiez la structure légale et le pays d'enregistrement de votre entreprise."}
                </p>
              </div>

              {/* Country Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant flex items-center gap-1.5">
                  <Globe2 size={16} className="text-primary" />
                  {currentLang === "en" ? "Country of Company Registration *" :
                   currentLang === "es" ? "País de registro de la empresa *" :
                   "Pays d'enregistrement de l'entreprise *"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {(Object.keys(COUNTRIES) as CountryCode[]).map((cCode) => {
                    const c = COUNTRIES[cCode];
                    const isSelected = selectedCountry === cCode;
                    return (
                      <button
                        key={cCode}
                        type="button"
                        onClick={() => setSelectedCountry(cCode)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-bold shadow-md shadow-primary/10 scale-[1.02]"
                            : "bg-surface-container-highest border-surface-container-highest text-on-surface-variant hover:border-primary/30"
                        }`}
                      >
                        <span className="text-2xl mb-1">{c.flag}</span>
                        <span className="text-xs leading-tight line-clamp-1">{c.name[currentLang]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                  {currentLang === "en" ? "Legal Company Name *" :
                   currentLang === "es" ? "Razón Social / Nombre de la empresa *" :
                   "Raison sociale / Nom de l'entreprise *"}
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="Ex: Atlas Group LLC, Santander, BNP..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                  {currentLang === "en" ? "Website / Domain (optional)" :
                   currentLang === "es" ? "Sitio Web / Dominio (opcional)" :
                   "Site web / Domaine (optionnel)"}
                </label>
                <input
                  type="text"
                  name="companyDomain"
                  value={formData.companyDomain}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="company.com"
                />
              </div>

              {/* Dynamic Registration Number Field based on Country */}
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">
                  {activeCountry.idLabel[currentLang]}
                </label>
                <input
                  type="text"
                  name="companySiret"
                  required
                  value={formData.companySiret}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest border border-surface-container-highest rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono tracking-wider text-sm"
                  placeholder={activeCountry.idPlaceholder}
                />
                <p className="text-[11px] text-on-surface-variant mt-1.5 ml-1">
                  {activeCountry.idHint[currentLang]}
                </p>
              </div>

              <div className="p-4 bg-surface-container-highest rounded-2xl border border-surface-container-highest flex items-start gap-3">
                <Building2 className="text-primary shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {currentLang === "en"
                    ? "If your organization is already registered on SafeCallr, your account will be linked automatically once your credentials and documents are verified."
                    : currentLang === "es"
                    ? "Si su empresa ya está registrada en SafeCallr, su cuenta se vinculará automáticamente tras la validación de los documentos."
                    : "Si votre entreprise est déjà enregistrée sur SafeCallr, votre compte y sera automatiquement rattaché après validation des justificatifs."}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Mandatory Documents adapted to Country */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{activeCountry.flag}</span>
                  <h2 className="text-xl font-bold text-on-surface">
                    {currentLang === "en" ? "Mandatory Verification Documents" :
                     currentLang === "es" ? "Documentos justificativos obligatorios" :
                     "Documents justificatifs obligatoires"}
                  </h2>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {currentLang === "en"
                    ? `Requirements for ${activeCountry.name[currentLang]}: Please upload the 2 official verification documents below to guarantee trust and safety.`
                    : currentLang === "es"
                    ? `Requisitos para ${activeCountry.name[currentLang]}: Suba los 2 documentos oficiales requeridos para garantizar la seguridad de la red.`
                    : `Exigences pour ${activeCountry.name[currentLang]} : Veuillez charger les 2 documents officiels requis ci-dessous pour prévenir toute usurpation.`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. BUSINESS REGISTRATION DOCUMENT */}
                <div className="bg-surface-container-highest/40 border border-surface-container-highest rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Building2 size={18} />
                        </div>
                        <span className="font-bold text-sm text-on-surface">
                          {activeCountry.doc1Title[currentLang]}
                        </span>
                      </div>
                      {kbisFile && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {currentLang === "en" ? "Uploaded" : currentLang === "es" ? "Cargado" : "Chargé"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant leading-snug">
                      {activeCountry.doc1Subtitle[currentLang]}
                    </p>
                  </div>

                  {/* Zone Upload Business Doc */}
                  <div
                    className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer text-center min-h-[160px] ${
                      kbisFile 
                        ? "border-primary/40 bg-primary/5" 
                        : isDraggingKbis 
                          ? "border-primary bg-primary/10 scale-[1.02]" 
                          : "border-surface-container-highest bg-surface-container-highest hover:border-primary/40"
                    }`}
                    onClick={() => kbisInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingKbis(true); }}
                    onDragLeave={() => setIsDraggingKbis(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingKbis(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processKbisFile(file);
                    }}
                  >
                    {kbisFile ? (
                      <div className="w-full flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center overflow-hidden border border-primary/20">
                          {kbisPreview ? (
                            <img src={kbisPreview} alt="Business Doc" className="w-full h-full object-cover" />
                          ) : (
                            <FileCheck size={24} />
                          )}
                        </div>
                        <div className="max-w-[200px]">
                          <p className="font-bold text-xs text-on-surface truncate">{kbisFileName}</p>
                          <p className="text-[10px] text-on-surface-variant">{kbisFileSize}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeKbisFile(); }}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-error hover:underline"
                        >
                          <Trash2 size={12} /> 
                          {currentLang === "en" ? "Remove" : currentLang === "es" ? "Eliminar" : "Supprimer"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center border border-surface-container-highest">
                          <Upload size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">
                            {currentLang === "en" ? "Upload Company Document" : currentLang === "es" ? "Subir documento de empresa" : "Uploader le document"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">PDF, JPG, PNG (max 5 MB)</p>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={kbisInputRef}
                      onChange={handleKbisChange}
                      accept=".pdf,image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* 2. REPRESENTATIVE / DIRECTOR IDENTITY DOCUMENT */}
                <div className="bg-surface-container-highest/40 border border-surface-container-highest rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <CreditCard size={18} />
                        </div>
                        <span className="font-bold text-sm text-on-surface">
                          {activeCountry.doc2Title[currentLang]}
                        </span>
                      </div>
                      {identityFile && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {currentLang === "en" ? "Uploaded" : currentLang === "es" ? "Cargado" : "Chargé"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant leading-snug">
                      {activeCountry.doc2Subtitle[currentLang]}
                    </p>
                  </div>

                  {/* Zone Upload Identity Doc */}
                  <div
                    className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer text-center min-h-[160px] ${
                      identityFile 
                        ? "border-primary/40 bg-primary/5" 
                        : isDraggingIdentity 
                          ? "border-primary bg-primary/10 scale-[1.02]" 
                          : "border-surface-container-highest bg-surface-container-highest hover:border-primary/40"
                    }`}
                    onClick={() => identityInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingIdentity(true); }}
                    onDragLeave={() => setIsDraggingIdentity(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingIdentity(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processIdentityFile(file);
                    }}
                  >
                    {identityFile ? (
                      <div className="w-full flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center overflow-hidden border border-primary/20">
                          {identityPreview ? (
                            <img src={identityPreview} alt="Identity Doc" className="w-full h-full object-cover" />
                          ) : (
                            <FileCheck size={24} />
                          )}
                        </div>
                        <div className="max-w-[200px]">
                          <p className="font-bold text-xs text-on-surface truncate">{identityFileName}</p>
                          <p className="text-[10px] text-on-surface-variant">{identityFileSize}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeIdentityFile(); }}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-error hover:underline"
                        >
                          <Trash2 size={12} />
                          {currentLang === "en" ? "Remove" : currentLang === "es" ? "Eliminar" : "Supprimer"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center border border-surface-container-highest">
                          <Upload size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">
                            {currentLang === "en" ? "Upload Photo ID / Passport" : currentLang === "es" ? "Subir DNI / Pasaporte" : "Uploader la pièce d'identité"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">PDF, JPG, PNG (max 5 MB)</p>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={identityInputRef}
                      onChange={handleIdentityChange}
                      accept=".pdf,image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Confidentiality & Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl text-primary text-xs border border-primary/15">
                <ShieldCheck size={18} className="shrink-0 mt-0.5 text-primary" />
                <div className="space-y-1">
                  <p className="font-bold">
                    {currentLang === "en" ? "Encrypted & GDPR Compliant" :
                     currentLang === "es" ? "Cifrado y Conformidad RGPD" :
                     "Confidentialité et conformité RGPD"}
                  </p>
                  <p className="text-on-surface-variant leading-relaxed">
                    {currentLang === "en"
                      ? "All verification documents are transmitted over an encrypted connection and used exclusively by the SafeCallr verification team. They are never published or shared with third parties."
                      : currentLang === "es"
                      ? "Todos los documentos se transmiten a través de un canal cifrado y son exclusivos para el equipo de verificación de SafeCallr. Nunca se comparten con terceros."
                      : "Ces pièces sont transmises via un canal chiffré et sont strictement réservées à la vérification de conformité par l'équipe SafeCallr. Elles ne sont jamais partagées à des tiers."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Summary & Terms */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  {currentLang === "en" ? "Application Review" :
                   currentLang === "es" ? "Resumen de su solicitud" :
                   "Récapitulatif de votre demande"}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {currentLang === "en" ? "Please verify all information before submitting." :
                   currentLang === "es" ? "Por favor verifique la información antes de enviar." :
                   "Veuillez vérifier vos informations avant de soumettre."}
                </p>
              </div>
              
              <div className="space-y-3 bg-surface-container-highest/30 rounded-2xl p-5 border border-surface-container-highest divide-y divide-surface-container-highest">
                <div className="flex justify-between py-2">
                  <span className="text-xs text-on-surface-variant">
                    {currentLang === "en" ? "Full Name" : currentLang === "es" ? "Nombre y apellidos" : "Nom et prénom"}
                  </span>
                  <span className="text-xs font-bold text-on-surface">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-on-surface-variant">
                    {currentLang === "en" ? "Professional Email" : currentLang === "es" ? "Correo profesional" : "Email professionnel"}
                  </span>
                  <span className="text-xs font-bold text-on-surface">{formData.email}</span>
                </div>
                {formData.phone && (
                  <div className="flex justify-between py-2">
                    <span className="text-xs text-on-surface-variant">
                      {currentLang === "en" ? "Phone" : currentLang === "es" ? "Teléfono" : "Téléphone"}
                    </span>
                    <span className="text-xs font-bold text-on-surface">{formData.phone}</span>
                  </div>
                )}
                {formData.jobTitle && (
                  <div className="flex justify-between py-2">
                    <span className="text-xs text-on-surface-variant">
                      {currentLang === "en" ? "Job Title" : currentLang === "es" ? "Cargo" : "Fonction / Titre"}
                    </span>
                    <span className="text-xs font-bold text-on-surface">{formData.jobTitle}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-xs text-on-surface-variant">
                    {currentLang === "en" ? "Country" : currentLang === "es" ? "País" : "Pays"}
                  </span>
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span>{activeCountry.flag}</span>
                    <span>{activeCountry.name[currentLang]}</span>
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-on-surface-variant">
                    {currentLang === "en" ? "Company" : currentLang === "es" ? "Empresa" : "Entreprise"}
                  </span>
                  <span className="text-xs font-bold text-on-surface">{formData.companyName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-on-surface-variant">
                    {currentLang === "en" ? "Tax ID / Registration #" : currentLang === "es" ? "CIF / NIF / Registro" : "Numéro SIRET / Enregistrement"}
                  </span>
                  <span className="text-xs font-mono font-bold text-on-surface">{formData.companySiret}</span>
                </div>

                {/* Uploaded Documents */}
                <div className="flex justify-between py-2 items-center">
                  <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <Building2 size={14} className="text-primary" /> 
                    {activeCountry.doc1Badge[currentLang]}
                  </span>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    <CheckCircle2 size={13} /> {kbisFileName || "business_document.pdf"}
                  </span>
                </div>

                <div className="flex justify-between py-2 items-center">
                  <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <CreditCard size={14} className="text-primary" /> 
                    {activeCountry.doc2Badge[currentLang]}
                  </span>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    <CheckCircle2 size={13} /> {identityFileName || "representative_id.pdf"}
                  </span>
                </div>
              </div>

              <div className="pt-4">
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
                  <span className="text-xs text-on-surface-variant leading-tight group-hover:text-on-surface transition-colors">
                    {currentLang === "en" ? (
                      <>I accept the <Link to="/terms" className="underline font-medium text-primary">Terms of Service</Link> and certify on my honor that all information and documents provided are genuine and accurate.</>
                    ) : currentLang === "es" ? (
                      <>Acepto las <Link to="/terms" className="underline font-medium text-primary">condiciones generales de uso</Link> y declaro bajo juramento la veracidad de la información y documentos aportados.</>
                    ) : (
                      <>J'accepte les <Link to="/terms" className="underline font-medium text-primary">conditions générales d'utilisation</Link> et certifie sur l'honneur l'exactitude des informations et justificatifs fournis.</>
                    )}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between gap-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-surface-container-highest font-bold text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-50 text-sm"
              >
                <ArrowLeft size={18} />
                {currentLang === "en" ? "Back" : currentLang === "es" ? "Atrás" : "Retour"}
              </button>
            )}
            
            <button
              type="button"
              onClick={currentStep === 4 ? handleSubmit : nextStep}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg text-sm ${
                currentStep === 4 ? "bg-primary text-on-primary hover:opacity-90 shadow-primary/20" : "bg-on-surface text-surface hover:opacity-90"
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>
                    {currentLang === "en" ? "Processing application..." :
                     currentLang === "es" ? "Procesando solicitud..." :
                     "Traitement en cours..."}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {currentStep === 4 ? (
                      currentLang === "en" ? "Submit Professional Application" :
                      currentLang === "es" ? "Enviar mi solicitud profesional" :
                      "Soumettre mon dossier professionnel"
                    ) : (
                      currentLang === "en" ? "Continue" :
                      currentLang === "es" ? "Continuar" :
                      "Continuer"
                    )}
                  </span>
                  {currentStep < 4 && <ArrowRight size={18} />}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant text-xs">
            {currentLang === "en" ? (
              <>Already have a verified professional account? <Link to="/pro/login" className="text-primary font-bold hover:underline">Sign In</Link></>
            ) : currentLang === "es" ? (
              <>¿Ya tiene una cuenta profesional validada? <Link to="/pro/login" className="text-primary font-bold hover:underline">Iniciar sesión</Link></>
            ) : (
              <>Déjà un compte professionnel validé ? <Link to="/pro/login" className="text-primary font-bold hover:underline">Se connecter</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
