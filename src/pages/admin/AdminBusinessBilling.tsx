import React, { useState, useEffect } from "react";
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
  Trash2
} from "lucide-react";
import { db } from "../../firebase";
import { collection, onSnapshot, getDocs, doc, setDoc, query, where, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

interface BillingOrg {
  id: string;
  name: string;
  siret: string;
  status: "active" | "inactive" | "suspended" | "expired";
  adminEmail: string;
  annualFee?: number;
  licenseStart?: any;
  licenseEnd?: any;
  paymentStatus?: "paid" | "pending" | "late";
}

export default function AdminBusinessBilling() {
  const [organizations, setOrganizations] = useState<BillingOrg[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection for edit
  const [editingOrg, setEditingOrg] = useState<BillingOrg | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  useEffect(() => {
    // Real-time tracking of all business organizations & licence pricing
    const unsub = onSnapshot(collection(db, "organizations"), (snapshot) => {
      const orgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Inconnu",
          siret: data.siret || "",
          status: data.status || (data.active ? "active" : "inactive"),
          adminEmail: data.adminEmail || "",
          annualFee: data.annualFee || 1490, // default pricing for MVP
          licenseStart: data.licenseStart,
          licenseEnd: data.licenseEnd,
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
  };

  const handleSavePrice = async () => {
    if (!editingOrg) return;
    setIsSavingPrice(true);
    try {
      await updateDoc(doc(db, "organizations", editingOrg.id), {
        annualFee: Number(priceInput)
      });
      toast.success(`Prix négocié mis à jour pour ${editingOrg.name}`);
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
      toast.success(`Paiement marqué comme à jour pour ${org.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Échec.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Title Block */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestion des Licences & Facturation</h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Module de supervision exclusive super-admin (Rémi). Contrôlez les abonnements corporatifs, les prix négociés et les deactivations SafeCallr Business.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
          </div>
        ) : (
          <div className="bg-[#111113] border border-[#2e2e34] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#2e2e34] bg-[#1a1a1e]">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider">Organisations Souscrites</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e1e22]/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-[#2e2e34]">
                    <th className="px-6 py-4">Nom de l'entreprise</th>
                    <th className="px-6 py-4 text-center">Tarif annuel (€)</th>
                    <th className="px-6 py-4">Email Admin client</th>
                    <th className="px-6 py-4">Licence Statut</th>
                    <th className="px-6 py-4 text-right">Actions de contrôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e34]">
                  {organizations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#9a9a9f]">
                        Aucune organisation enregistrée actuellement.
                      </td>
                    </tr>
                  ) : (
                    organizations.map((org) => {
                      const isActive = org.status === "active";
                      return (
                        <tr key={org.id} className="hover:bg-[#1a1a1e]/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white text-sm">{org.name}</p>
                              <span className="text-[10px] text-slate-500">SIRET: {org.siret || "N/A"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleOpenPriceModal(org)}
                              className="bg-[#2e2e34] hover:bg-slate-700 text-[#4ade80] font-mono font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
                            >
                              {org.annualFee || 1490} € / an
                            </button>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                            {org.adminEmail || "Aucun email"}
                          </td>
                          <td className="px-6 py-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-[#4ade80] border border-emerald-500/20">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Suspendue
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => handleToggleStatus(org)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isActive 
                                  ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black" 
                                  : "bg-emerald-500/10 text-[#4ade80] hover:bg-[#4ade80] hover:text-black"
                              }`}
                            >
                              {isActive ? "Suspendre" : "Réactiver"}
                            </button>

                            {org.paymentStatus !== "paid" && (
                              <button 
                                onClick={() => handleMarkAsPaid(org)}
                                className="bg-[#4ade80] text-black hover:opacity-90 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
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
          </div>
        )}

        {/* Modal edit price */}
        {editingOrg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#111113] border border-[#2e2e34] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Négocier tarif : {editingOrg.name}</h3>
              <p className="text-slate-400 text-xs">Ajustez le montant de la licence annuelle SafeCallr Business négociée pour ce client.</p>
              
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono">€</span>
                <input 
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#2e2e34] text-white pl-8 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-[#4ade80]"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingOrg(null)}
                  className="flex-1 bg-[#2e2e34] hover:bg-slate-700 text-white rounded-xl py-2 font-bold text-xs"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSavePrice}
                  disabled={isSavingPrice}
                  className="flex-1 bg-[#4ade80] text-black rounded-xl py-2 font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                >
                  {isSavingPrice && <Loader2 className="w-3 h-3 animate-spin" />}
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
