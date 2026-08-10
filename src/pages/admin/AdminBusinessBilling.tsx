import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  PlusCircle, 
  DollarSign,
  Send,
  Loader2,
  Trash2,
  ExternalLink,
  TrendingUp,
  CreditCard,
  Calendar,
  ArrowUpRight
} from "lucide-react";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

interface BillingOrg {
  id: string;
  name: string;
  siret: string;
  status: "active" | "inactive" | "suspended" | "expired";
  adminEmail: string;
  annualFee?: number;
  nextYearFee?: number;
  renewalDate?: string;
  renewalStatus?: "confirmed" | "pending" | "negotiating";
  paymentStatus?: "paid" | "pending" | "late";
}

export default function AdminBusinessBilling() {
  const [organizations, setOrganizations] = useState<BillingOrg[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection for edit price
  const [editingOrg, setEditingOrg] = useState<BillingOrg | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [nextYearPriceInput, setNextYearPriceInput] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  useEffect(() => {
    // Real-time tracking of all business organizations & licence pricing
    const unsub = onSnapshot(collection(db, "organizations"), (snapshot) => {
      const orgs = snapshot.docs.map(doc => {
        const data = doc.data();
        const fee = data.annualFee || 1490;
        const nFee = data.nextYearFee || Math.round(fee * 1.05); // Default +5% indexation or set value
        return {
          id: doc.id,
          name: data.name || "Inconnu",
          siret: data.siret || "",
          status: data.status || (data.active ? "active" : "inactive"),
          adminEmail: data.adminEmail || "",
          annualFee: fee,
          nextYearFee: nFee,
          renewalDate: data.renewalDate || `${currentYear}-12-31`,
          renewalStatus: data.renewalStatus || "confirmed",
          paymentStatus: data.paymentStatus || "paid"
        } as BillingOrg;
      });
      setOrganizations(orgs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching organizations:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleToggleStatus = async (org: BillingOrg) => {
    try {
      const nextStatus = org.status === "active" ? "suspended" : "active";
      await updateDoc(doc(db, "organizations", org.id), {
        status: nextStatus,
        active: nextStatus === "active"
      });
      toast.success(`Statut de ${org.name} modifié : ${nextStatus === "active" ? "Activé" : "Suspendu"}`);
    } catch (err) {
      console.error(err);
      toast.error("Échec de la modification du statut.");
    }
  };

  const handleOpenPriceModal = (org: BillingOrg) => {
    setEditingOrg(org);
    setPriceInput(String(org.annualFee || 1490));
    setNextYearPriceInput(String(org.nextYearFee || Math.round((org.annualFee || 1490) * 1.05)));
  };

  const handleSavePrice = async () => {
    if (!editingOrg) return;
    setIsSavingPrice(true);
    try {
      await updateDoc(doc(db, "organizations", editingOrg.id), {
        annualFee: Number(priceInput),
        nextYearFee: Number(nextYearPriceInput)
      });
      toast.success(`Tarifs mis à jour pour ${editingOrg.name}`);
      setEditingOrg(null);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de sauvegarder la licence.");
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleMarkAsPaid = async (org: BillingOrg) => {
    try {
      await updateDoc(doc(db, "organizations", org.id), {
        paymentStatus: "paid"
      });
      toast.success(`Paiement marqué comme encaissé pour ${org.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Échec de la mise à jour.");
    }
  };

  // Financial calculations
  const totalARRCurrent = organizations.reduce((acc, o) => acc + (o.status === 'active' ? (o.annualFee || 1490) : 0), 0);
  const totalARRNext = organizations.reduce((acc, o) => acc + (o.status === 'active' ? (o.nextYearFee || Math.round((o.annualFee || 1490) * 1.05)) : 0), 0);
  const growthPercent = totalARRCurrent > 0 ? (((totalARRNext - totalARRCurrent) / totalARRCurrent) * 100).toFixed(1) : "0.0";

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">Gestion des Licences & Facturation</h1>
              <span className="bg-[#3dffa0]/10 text-[#3dffa0] border border-[#3dffa0]/20 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                Business & Corporate
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              Superviser les tarifs annuels, accéder aux fiches entreprises et piloter le prévisionnel financier ({currentYear} vs {nextYear}).
            </p>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CA Récurrent ({currentYear})</span>
              <DollarSign className="text-[#3dffa0]" size={20} />
            </div>
            <p className="text-3xl font-black text-white">{totalARRCurrent.toLocaleString("fr-FR")} €</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <CheckCircle size={14} className="text-[#3dffa0]" />
              {organizations.filter(o => o.status === 'active').length} licences actives
            </p>
          </div>

          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prévisionnel {nextYear} (N+1)</span>
              <TrendingUp className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-black text-white">{totalARRNext.toLocaleString("fr-FR")} €</p>
            <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
              <ArrowUpRight size={14} />
              +{growthPercent}% de croissance projetée
            </p>
          </div>

          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entreprises Souscrites</span>
              <Building2 className="text-purple-400" size={20} />
            </div>
            <p className="text-3xl font-black text-white">{organizations.length}</p>
            <p className="text-xs text-slate-400 mt-2">Périmètre SafeCallr Business</p>
          </div>

          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Taux de Renouvellement</span>
              <ShieldCheck className="text-[#3dffa0]" size={20} />
            </div>
            <p className="text-3xl font-black text-white">100%</p>
            <p className="text-xs text-slate-400 mt-2">Reconduction tacite active</p>
          </div>
        </div>

        {/* Section 1: Table des Licences Entreprises */}
        <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-[#2e2e34] bg-[#161618] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="text-[#3dffa0]" size={20} />
              <div>
                <h3 className="font-black text-white uppercase text-xs tracking-widest">Abonnements & Licences Entreprises</h3>
                <p className="text-[11px] text-slate-500">Ajustez le tarif annuel et accédez directement aux informations de chaque entreprise.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-[#3dffa0] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111113] text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-[#2e2e34]">
                    <th className="px-6 py-4">Entreprise</th>
                    <th className="px-6 py-4 text-center">Tarif Annuel ({currentYear})</th>
                    <th className="px-6 py-4">Email Admin Client</th>
                    <th className="px-6 py-4">Statut Licence</th>
                    <th className="px-6 py-4">Fiche Entreprise</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e34]">
                  {organizations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                        Aucune entreprise souscrite pour le moment.
                      </td>
                    </tr>
                  ) : (
                    organizations.map((org) => {
                      const isActive = org.status === "active";
                      return (
                        <tr key={org.id} className="hover:bg-[#111113] transition-colors group">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white text-sm">{org.name}</p>
                              <span className="text-[10px] text-slate-500 font-mono">SIRET: {org.siret || "Non renseigné"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleOpenPriceModal(org)}
                              className="bg-[#111113] hover:bg-slate-800 text-[#3dffa0] font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-[#2e2e34] transition-all"
                              title="Modifier le tarif négocié"
                            >
                              {(org.annualFee || 1490).toLocaleString("fr-FR")} € / an
                            </button>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                            {org.adminEmail || "Non renseigné"}
                          </td>
                          <td className="px-6 py-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">
                                <ShieldCheck size={12} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <AlertTriangle size={12} /> Suspendue
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Link 
                              to={`/admin/organizations/${org.id}`}
                              className="inline-flex items-center gap-2 bg-[#111113] border border-[#2e2e34] hover:border-primary text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            >
                              <ExternalLink size={14} className="text-primary" />
                              Voir la fiche
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => handleToggleStatus(org)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isActive 
                                  ? "border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black" 
                                  : "border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black"
                              }`}
                            >
                              {isActive ? "Suspendre" : "Réactiver"}
                            </button>

                            {org.paymentStatus !== "paid" && (
                              <button 
                                onClick={() => handleMarkAsPaid(org)}
                                className="bg-[#3dffa0] text-black hover:bg-[#3dffa0]/90 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                              >
                                Encaissé
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Tableau Prévisionnel Financier (Année en cours vs N+1) */}
        <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-[#2e2e34] bg-[#161618] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-blue-400" size={20} />
              <div>
                <h3 className="font-black text-white uppercase text-xs tracking-widest">Tableau Prévisionnel Financier ({currentYear} & {nextYear})</h3>
                <p className="text-[11px] text-slate-500">Projection des renouvellements annuels et évolution du chiffre d'affaires récurrent (ARR).</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111113] text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-[#2e2e34]">
                  <th className="px-6 py-4">Entreprise</th>
                  <th className="px-6 py-4">Échéance Renouvellement</th>
                  <th className="px-6 py-4 text-center">Tarif Année en cours ({currentYear})</th>
                  <th className="px-6 py-4 text-center">Tarif Prévisionnel N+1 ({nextYear})</th>
                  <th className="px-6 py-4">Statut Renouvellement</th>
                  <th className="px-6 py-4 text-right">Informations Entreprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e34]">
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      Aucun prévisionnel disponible.
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => {
                    const currentFee = org.annualFee || 1490;
                    const nextFee = org.nextYearFee || Math.round(currentFee * 1.05);
                    return (
                      <tr key={org.id} className="hover:bg-[#111113] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm">{org.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {org.id.substring(0, 8)}...</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300 font-mono">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-500" />
                            31/12/{currentYear}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-mono text-[#3dffa0] font-bold">
                          {currentFee.toLocaleString("fr-FR")} €
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-mono text-blue-400 font-bold">
                          {nextFee.toLocaleString("fr-FR")} €
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Reconduction Tacite
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/admin/organizations/${org.id}`}
                            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                          >
                            Consulter la fiche <ExternalLink size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {organizations.length > 0 && (
                <tfoot>
                  <tr className="bg-[#161618] border-t-2 border-[#2e2e34] font-bold text-white">
                    <td className="px-6 py-4 text-xs uppercase tracking-widest font-black">Total Général ARR</td>
                    <td className="px-6 py-4">--</td>
                    <td className="px-6 py-4 text-center text-base text-[#3dffa0] font-mono font-black">
                      {totalARRCurrent.toLocaleString("fr-FR")} €
                    </td>
                    <td className="px-6 py-4 text-center text-base text-blue-400 font-mono font-black">
                      {totalARRNext.toLocaleString("fr-FR")} €
                    </td>
                    <td className="px-6 py-4 text-xs text-[#3dffa0] font-mono">
                      +{growthPercent}% croissance
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 uppercase">Projections SafeCallr</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Modal Edit Price */}
        {editingOrg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-[#2e2e34] pb-4">
                <CreditCard className="text-[#3dffa0]" size={24} />
                <div>
                  <h3 className="text-lg font-black text-white">Négociation de la Licence</h3>
                  <p className="text-xs text-slate-500">{editingOrg.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Tarif Annuel Année en Cours ({currentYear})
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-full bg-[#111113] border border-[#2e2e34] text-white pr-12 pl-4 py-3 rounded-2xl text-sm font-mono focus:outline-none focus:border-[#3dffa0]"
                    />
                    <span className="absolute right-4 top-3 text-slate-500 font-mono text-sm">€ / an</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Tarif Prévisionnel Année N+1 ({nextYear})
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={nextYearPriceInput}
                      onChange={(e) => setNextYearPriceInput(e.target.value)}
                      className="w-full bg-[#111113] border border-[#2e2e34] text-white pr-12 pl-4 py-3 rounded-2xl text-sm font-mono focus:outline-none focus:border-blue-400"
                    />
                    <span className="absolute right-4 top-3 text-slate-500 font-mono text-sm">€ / an</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setEditingOrg(null)}
                  className="flex-1 bg-[#111113] border border-[#2e2e34] hover:bg-slate-800 text-white rounded-2xl py-3 font-bold text-xs uppercase tracking-wider"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSavePrice}
                  disabled={isSavingPrice}
                  className="flex-1 bg-[#3dffa0] text-black rounded-2xl py-3 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {isSavingPrice && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
