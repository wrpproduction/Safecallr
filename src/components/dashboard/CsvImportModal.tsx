import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  FileText,
  Users,
  ShieldAlert
} from "lucide-react";
import { auth, getIdToken } from "../../firebase";
import { toast } from "sonner";

interface ParsedRow {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  fonction: string;
  isValid: boolean;
  validationError?: string;
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgName?: string;
  allowedEmailDomains?: string[];
  onSuccess?: () => void;
}

export default function CsvImportModal({
  isOpen,
  onClose,
  orgId,
  orgName,
  allowedEmailDomains = [],
  onSuccess
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [pastedText, setPastedText] = useState("");

  if (!isOpen) return null;

  // Generate example CSV template for download
  const handleDownloadTemplate = () => {
    const exampleDomain = allowedEmailDomains.length > 0 ? allowedEmailDomains[0] : "entreprise.com";
    const headers = "nom;prenom;email;telephone;fonction\n";
    const example1 = `Dupont;Jean;jean.dupont@${exampleDomain};+33612345678;Responsable Sécurité\n`;
    const example2 = `Martin;Sophie;sophie.martin@${exampleDomain};+33698765432;Conseillère Clientèle\n`;
    const example3 = `Bernard;Thomas;thomas.bernard@${exampleDomain};+33700112233;Directeur Financier\n`;

    const blob = new Blob([headers + example1 + example2 + example3], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `modele_import_collaborateurs_safecallr.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process raw text string into CSV rows
  const parseRawCsvText = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 1) {
      toast.error("Fichier CSV vide.");
      return;
    }

    // Determine delimiter (, or ;)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(";") ? ";" : ",";
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));

    // Column mapping
    const colMap = {
      nom: headers.findIndex(h => h.includes("nom") && !h.includes("prenom")),
      prenom: headers.findIndex(h => h.includes("prenom") || h.includes("prénom")),
      email: headers.findIndex(h => h.includes("email") || h.includes("mail")),
      telephone: headers.findIndex(h => h.includes("tel") || h.includes("phone") || h.includes("mobile")),
      fonction: headers.findIndex(h => h.includes("fonction") || h.includes("poste") || h.includes("titre") || h.includes("job"))
    };

    // If headers not detected on first line, assume standard order: nom;prenom;email;telephone;fonction
    const hasHeader = colMap.nom !== -1 || colMap.prenom !== -1 || colMap.email !== -1;
    const startIndex = hasHeader ? 1 : 0;

    const rows: ParsedRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length === 0 || (parts.length === 1 && !parts[0])) continue;

      let nom = "";
      let prenom = "";
      let email = "";
      let telephone = "";
      let fonction = "";

      if (hasHeader) {
        nom = colMap.nom !== -1 ? parts[colMap.nom] || "" : "";
        prenom = colMap.prenom !== -1 ? parts[colMap.prenom] || "" : "";
        email = colMap.email !== -1 ? parts[colMap.email] || "" : "";
        telephone = colMap.telephone !== -1 ? parts[colMap.telephone] || "" : "";
        fonction = colMap.fonction !== -1 ? parts[colMap.fonction] || "" : "";
      } else {
        nom = parts[0] || "";
        prenom = parts[1] || "";
        email = parts[2] || "";
        telephone = parts[3] || "";
        fonction = parts[4] || "";
      }

      // Basic validation logic
      let isValid = true;
      let validationError = "";

      if (!email || !email.includes("@")) {
        isValid = false;
        validationError = "Email invalide";
      } else if (!nom || !prenom) {
        isValid = false;
        validationError = "Nom ou Prénom manquant";
      } else if (allowedEmailDomains.length > 0) {
        const domain = email.split("@")[1];
        if (!allowedEmailDomains.includes(domain)) {
          isValid = false;
          validationError = `Domaine '@${domain}' non autorisé (autorisés: ${allowedEmailDomains.join(", ")})`;
        }
      }

      rows.push({
        nom,
        prenom,
        email,
        telephone,
        fonction,
        isValid,
        validationError
      });
    }

    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseRawCsvText(content);
    };
    reader.readAsText(selectedFile, "UTF-8");
  };

  const handlePasteParse = () => {
    if (!pastedText.trim()) {
      toast.error("Veuillez coller le contenu CSV.");
      return;
    }
    parseRawCsvText(pastedText);
  };

  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error("Aucun collaborateur valide à importer.");
      return;
    }

    setIsImporting(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Non authentifié");
      const idToken = await getIdToken(user);

      const response = await fetch("/api/dashboard/import-members-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          orgId,
          lang: localStorage.getItem("app_lang") || "fr",
          members: validRows.map(r => ({
            lastName: r.nom,
            firstName: r.prenom,
            email: r.email,
            phone: r.telephone,
            jobTitle: r.fonction
          }))
        })
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "Erreur lors de l'importation");
      }

      toast.success(`${res.importedCount} collaborateur(s) importé(s) avec succès !`);

      if (res.failedCount > 0) {
        toast.warning(`${res.failedCount} ligne(s) non importée(s) en raison d'erreurs.`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Échec de l'importation CSV.");
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1e1e22] border border-[#2e2e34] w-full max-w-4xl rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2e2e34] pb-5">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-[#3dffa0]/10 text-[#3dffa0] rounded-2xl border border-[#3dffa0]/20">
              <FileSpreadsheet size={24} />
            </span>
            <div>
              <h3 className="text-xl font-black text-white">Import Massif de Collaborateurs (CSV)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {orgName ? `Organisation : ${orgName}` : "Importer votre liste d'équipe"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Validation Criteria Info Banner */}
        <div className="bg-[#111113] border border-[#2e2e34] p-4 rounded-2xl space-y-2">
          <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert size={14} className="text-[#3dffa0]" />
            Champs requis pour la validation du fichier CSV :
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono text-slate-300 pt-1">
            <span className="bg-[#1e1e22] px-2.5 py-1 rounded-lg border border-[#2e2e34] text-center">1. Nom</span>
            <span className="bg-[#1e1e22] px-2.5 py-1 rounded-lg border border-[#2e2e34] text-center">2. Prénom</span>
            <span className="bg-[#1e1e22] px-2.5 py-1 rounded-lg border border-[#2e2e34] text-center">3. Email Pro</span>
            <span className="bg-[#1e1e22] px-2.5 py-1 rounded-lg border border-[#2e2e34] text-center">4. Téléphone</span>
            <span className="bg-[#1e1e22] px-2.5 py-1 rounded-lg border border-[#2e2e34] text-center">5. Fonction</span>
          </div>
          {allowedEmailDomains.length > 0 && (
            <p className="text-[11px] text-[#3dffa0] font-medium pt-1">
              ✓ Domaine(s) autorisé(s) : {allowedEmailDomains.map(d => `@${d}`).join(", ")}
            </p>
          )}
        </div>

        {/* Actions & Template Download */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex bg-[#111113] p-1 rounded-xl border border-[#2e2e34]">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "upload" 
                  ? "bg-[#3dffa0] text-black shadow-md" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Fichier CSV
            </button>
            <button
              onClick={() => setActiveTab("paste")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "paste" 
                  ? "bg-[#3dffa0] text-black shadow-md" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Coller du texte CSV
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center justify-center gap-2 bg-[#111113] hover:bg-slate-800 border border-[#2e2e34] text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <Download size={14} className="text-[#3dffa0]" />
            Télécharger le modèle (.CSV)
          </button>
        </div>

        {/* Upload Zone or Text Paste */}
        {activeTab === "upload" ? (
          <div className="border-2 border-dashed border-[#2e2e34] hover:border-[#3dffa0] rounded-2xl p-8 text-center transition-all bg-[#111113]/50">
            <input 
              type="file" 
              accept=".csv,text/csv" 
              onChange={handleFileChange}
              className="hidden" 
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer space-y-3 block">
              <Upload className="mx-auto text-[#3dffa0]" size={36} />
              <div>
                <p className="text-sm font-bold text-white">
                  {file ? file.name : "Cliquez ou glissez-déposez votre fichier CSV"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Séparateur recommandé : point-virgule (;) ou virgule (,)</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Exemple :&#10;nom;prenom;email;telephone;fonction&#10;Dupont;Jean;jean.dupont@banque.fr;+33612345678;Conseiller"
              className="w-full bg-[#111113] border border-[#2e2e34] text-white p-4 rounded-2xl text-xs font-mono focus:outline-none focus:border-[#3dffa0]"
            />
            <button
              onClick={handlePasteParse}
              className="bg-[#111113] hover:bg-slate-800 border border-[#2e2e34] text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              Analyser le texte collé
            </button>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Aperçu des collaborateurs détectés ({parsedRows.length})
              </h4>
              <div className="flex gap-3 text-xs font-bold">
                <span className="text-[#3dffa0] flex items-center gap-1">
                  <CheckCircle2 size={14} /> {validCount} Valides
                </span>
                {invalidCount > 0 && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle size={14} /> {invalidCount} Ignorés / Rejetés
                  </span>
                )}
              </div>
            </div>

            <div className="border border-[#2e2e34] rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111113] text-slate-500 font-mono text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5">Nom</th>
                    <th className="px-4 py-2.5">Prénom</th>
                    <th className="px-4 py-2.5">Email Pro</th>
                    <th className="px-4 py-2.5">Téléphone</th>
                    <th className="px-4 py-2.5">Fonction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e34] bg-[#161618]">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className={row.isValid ? "hover:bg-[#111113]" : "bg-red-500/5 text-slate-500"}>
                      <td className="px-4 py-2.5">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3dffa0] bg-[#3dffa0]/10 px-2 py-0.5 rounded-full border border-[#3dffa0]/20">
                            <CheckCircle2 size={12} /> Valide
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20" title={row.validationError}>
                            <AlertTriangle size={12} /> {row.validationError || "Invalide"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-white">{row.nom || "—"}</td>
                      <td className="px-4 py-2.5 font-bold text-white">{row.prenom || "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{row.email || "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">{row.telephone || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-300">{row.fonction || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex items-center justify-end gap-3 border-t border-[#2e2e34] pt-5">
          <button
            onClick={onClose}
            className="bg-[#111113] border border-[#2e2e34] hover:bg-slate-800 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider"
          >
            Annuler
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={isImporting || validCount === 0}
            className="bg-[#3dffa0] text-black hover:bg-[#3dffa0]/90 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#3dffa0]/20 transition-all"
          >
            {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
            Lancer l'importation ({validCount})
          </button>
        </div>
      </div>
    </div>
  );
}
