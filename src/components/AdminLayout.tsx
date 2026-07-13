import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Building2, 
  History, 
  LogOut, 
  Menu, 
  X,
  AlertCircle,
  PlusCircle,
  FileText
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Actualités / Blog", icon: FileText, path: "/admin/blog" },
  { label: "Organisations", icon: Building2, path: "/admin/organizations" },
  { label: "Utilisateurs", icon: Users, path: "/admin/users" },
  { label: "Pros", icon: ShieldCheck, path: "/admin/pros" },
  { label: "Entreprises", icon: Building2, path: "/admin/companies" },
  { label: "Demandes", icon: History, path: "/admin/requests" },
  { label: "Alertes", icon: AlertCircle, path: "/admin/alerts" },
  { label: "Business", icon: ShieldCheck, path: "/admin/business/billing" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e4e4e8] font-inter flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-[#111113] border-r border-[#2e2e34] transition-all duration-300 flex flex-col fixed h-full z-50`}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#4ade80] rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-black w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">SafeCallr</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-[#1e1e22] rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-white text-black font-semibold" 
                    : "text-[#9a9a9f] hover:bg-[#1e1e22] hover:text-white"
                }`}
              >
                <item.icon size={20} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#2e2e34]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-[#f87171] hover:bg-[#1e1e22] rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} p-8`}>
        {children}
      </main>
    </div>
  );
}
