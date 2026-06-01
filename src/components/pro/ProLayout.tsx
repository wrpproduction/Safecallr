import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  History, 
  UserCircle, 
  LogOut,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/pro" },
  { label: "Vérification", icon: Search, path: "/pro/search", highlight: true },
  { label: "Mes clients", icon: Users, path: "/pro/clients" },
  { label: "Historique", icon: History, path: "/pro/history" },
  { label: "Mon profil", icon: UserCircle, path: "/pro/profile" },
];

export default function ProLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [proData, setProData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const proDoc = await getDoc(doc(db, "pros", user.uid));
          if (proDoc.exists()) {
            setProData(proDoc.data());
          }
        } catch (error) {
          console.error("Error fetching pro data for sidebar:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/pro/login");
  };

  const activeItem = navItems.find(item => item.path === location.pathname) || navItems[0];
  const proName = proData ? `${proData.firstName} ${proData.lastName}` : "Chargement...";
  const proInitials = proData ? `${proData.firstName?.[0] || ""}${proData.lastName?.[0] || ""}`.toUpperCase() : "??";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e4e4e8] font-inter flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-[220px] bg-[#1e1e22] flex-col fixed h-full z-50 border-r border-[#2e2e34]">
        <div className="p-6">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-[#4ade80] rounded-lg flex items-center justify-center shadow-lg shadow-[#4ade80]/20">
              <ShieldCheck className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">SafeCallr <span className="text-xs font-normal text-[#9a9a9f] uppercase tracking-widest">PRO</span></span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-[#4ade80] text-black font-semibold shadow-lg shadow-[#4ade80]/10" 
                    : "text-[#9a9a9f] hover:text-[#e4e4e8] hover:bg-[#2e2e34]"
                } ${item.highlight && !isActive ? "border border-[#2e2e34]" : ""}`}
              >
                <item.icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2e2e34]">
          <div className="flex items-center gap-3 p-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#2e2e34] flex items-center justify-center text-[#e4e4e8] font-bold border border-[#3e3e44]">
              {proInitials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-[#e4e4e8] truncate">{proName}</p>
              <p className="text-xs text-[#9a9a9f] truncate">Conseiller</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-[#9a9a9f] hover:text-[#f87171] hover:bg-red-500/10 rounded-xl transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-[#1e1e22] text-[#e4e4e8] p-4 flex items-center justify-between sticky top-0 z-50 border-b border-[#2e2e34]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-[#4ade80] w-6 h-6" />
          <span className="font-bold text-lg">SafeCallr PRO</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#0a0a0a] z-40 pt-20 px-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 p-4 rounded-2xl text-lg ${
                location.pathname === item.path ? "bg-[#4ade80] text-black font-bold" : "text-[#9a9a9f]"
              }`}
            >
              <item.icon size={24} />
              <span>{item.label}</span>
            </Link>
          ))}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-[#f87171] text-lg"
          >
            <LogOut size={24} />
            <span>Déconnexion</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-[220px] p-4 md:p-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e1e22] border-t border-[#2e2e34] flex justify-around p-2 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive ? "text-[#4ade80]" : "text-[#9a9a9f]"
              }`}
            >
              <item.icon size={20} className={isActive ? "stroke-[2.5px]" : ""} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
