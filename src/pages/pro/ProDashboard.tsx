import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  ArrowRight,
  Plus,
  UserPlus,
  Clock,
  Check,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";

export default function ProDashboard() {
  const [stats, setStats] = useState([
    { label: "Demandes aujourd'hui", value: "0", icon: TrendingUp, color: "text-[#4ade80]", bg: "bg-[#4ade80]/10" },
    { label: "Demandes ce mois", value: "0", icon: CheckCircle2, color: "text-[#4ade80]", bg: "bg-[#4ade80]/10" },
    { label: "Clients connectés", value: "0", icon: ShieldCheck, color: "text-[#4ade80]", bg: "bg-[#4ade80]/10" },
    { label: "Fraudes évitées", value: "0", icon: AlertCircle, color: "text-[#f87171]", bg: "bg-[#f87171]/10" },
  ]);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingConnections, setPendingConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Activité récente (authRequests)
    const qAuth = query(
      collection(db, "authRequests"),
      where("proId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubAuth = onSnapshot(qAuth, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: "Récemment" // On pourrait formater la date ici
      }));
      setRecentActivity(activities);
    });

    // 2. Mises en relation en attente (proClientConnections)
    const qConn = query(
      collection(db, "proClientConnections"),
      where("proId", "==", user.uid),
      where("status", "==", "pending"),
      limit(5)
    );

    const unsubConn = onSnapshot(qConn, (snapshot) => {
      setPendingConnections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // 3. Stats (Simplifié pour le test)
    const qStats = query(collection(db, "proClientConnections"), where("proId", "==", user.uid), where("status", "==", "connected"));
    const unsubStats = onSnapshot(qStats, (snapshot) => {
      setStats(prev => {
        const newStats = [...prev];
        newStats[2].value = snapshot.size.toString();
        return newStats;
      });
    });

    return () => {
      unsubAuth();
      unsubConn();
      unsubStats();
    };
  }, []);

  const handleCancelConnection = async (id: string) => {
    try {
      await updateDoc(doc(db, "proClientConnections", id), {
        status: "cancelled"
      });
    } catch (error) {
      console.error("Error cancelling connection:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1e1e22] border border-[#2e2e34] flex items-center justify-center text-2xl font-bold text-[#4ade80] shadow-lg shadow-[#4ade80]/5">
            {auth.currentUser?.displayName?.substring(0, 2).toUpperCase() || "PR"}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#e4e4e8]">Bonjour, {auth.currentUser?.displayName || "Professionnel"} 👋</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#9a9a9f] font-medium">Espace Professionnel SafeCallr</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#4ade80]/10 text-[#4ade80] rounded-full text-[11px] font-bold border border-[#4ade80]/20">
                <ShieldCheck size={12} />
                Professionnel vérifié
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/pro/clients"
            className="bg-[#1e1e22] text-[#e4e4e8] border border-[#2e2e34] px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#2e2e34] transition-colors"
          >
            <UserPlus size={20} />
            Mes Clients
          </Link>
          <Link 
            to="/pro/search"
            className="bg-[#4ade80] text-black px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-[#4ade80]/10 hover:scale-[1.02] transition-transform active:scale-95"
          >
            <Plus size={20} />
            Nouvelle vérification
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#1e1e22] p-6 rounded-3xl border border-[#2e2e34] shadow-sm hover:border-[#4ade80]/30 transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[#9a9a9f] text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1 text-[#e4e4e8]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Pending Connections */}
        <section className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#2e2e34] flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#e4e4e8]">Mises en relation en attente</h2>
            <Link to="/pro/clients" className="text-sm font-bold text-[#9a9a9f] hover:text-[#4ade80] flex items-center gap-1 transition-colors">
              Gérer
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-[#2e2e34]">
            {pendingConnections.length === 0 ? (
              <div className="p-10 text-center">
                <UserPlus className="mx-auto text-[#2e2e34] mb-4" size={48} />
                <p className="text-[#9a9a9f]">Aucune invitation en attente</p>
              </div>
            ) : (
              pendingConnections.map((conn) => (
                <div key={conn.id} className="p-6 flex items-center justify-between hover:bg-[#2e2e34]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/20">
                      {conn.clientName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#e4e4e8]">{conn.clientName || "Client inconnu"}</p>
                      <p className="text-xs text-[#9a9a9f]">{conn.clientPhone || conn.clientEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-bold">
                      <Clock size={12} />
                      En attente
                    </div>
                    <button 
                      onClick={() => handleCancelConnection(conn.id)}
                      className="p-2 text-[#9a9a9f] hover:text-[#f87171] transition-colors"
                      title="Annuler l'invitation"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#2e2e34] flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#e4e4e8]">Vérifications récentes</h2>
            <Link to="/pro/history" className="text-sm font-bold text-[#9a9a9f] hover:text-[#4ade80] flex items-center gap-1 transition-colors">
              Historique
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-[#2e2e34]">
            {recentActivity.length === 0 ? (
              <div className="p-10 text-center">
                <ShieldCheck className="mx-auto text-[#2e2e34] mb-4" size={48} />
                <p className="text-[#9a9a9f]">Aucune vérification récente</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-[#2e2e34]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#2e2e34] flex items-center justify-center text-[#9a9a9f] font-bold text-sm border border-[#3e3e44]">
                      {activity.toUserPhone?.substring(0, 2) || "CL"}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#e4e4e8]">{activity.toUserPhone}</p>
                      <p className="text-xs text-[#9a9a9f]">Code: {activity.code || "---"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      activity.status === 'validated' ? 'bg-[#4ade80]/10 text-[#4ade80]' :
                      activity.status === 'code_generated' ? 'bg-blue-500/10 text-blue-400' :
                      activity.status === 'refused' ? 'bg-[#f87171]/10 text-[#f87171]' :
                      'bg-[#2e2e34] text-[#9a9a9f]'
                    }`}>
                      {activity.status === 'validated' ? 'Validé' :
                       activity.status === 'code_generated' ? 'Code envoyé' :
                       activity.status === 'pending' ? 'En attente' :
                       activity.status === 'refused' ? 'Refusé' :
                       'Expiré'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
