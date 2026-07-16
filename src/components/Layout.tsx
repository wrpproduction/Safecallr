import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, History, HelpCircle, PlusCircle, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { db, collection, query, where, onSnapshot } from "../firebase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "../contexts/LanguageContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ user }: { user: any }) {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    if (!user || !user.uid) return;

    const q = query(
      collection(db, "proClientConnections"),
      where("userId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const navItems = [
    { path: "/dashboard", icon: Home, label: t("navigation.home") },
    { path: "/contacts", icon: Users, label: t("navigation.contacts"), badge: pendingCount > 0 },
    { path: "/new-request", icon: PlusCircle, label: t("navigation.verify"), primary: true },
    { path: "/history", icon: History, label: t("navigation.history") },
    { path: "/how-it-works", icon: HelpCircle, label: t("navigation.help") },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body pb-24">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-low/80 backdrop-blur-xl border-b border-white/5 px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-xl">security</span>
          </div>
          <span className="font-headline font-black text-xl tracking-tighter text-primary">SafeCallr</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <Link to="/profile" className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-primary/20 hover:scale-110 transition-transform active:scale-95">
              <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Profile" />
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 max-w-lg mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-low/90 backdrop-blur-xl border-t border-white/5 px-4 pb-8 pt-2 flex justify-around items-center shadow-[0_-8px_32px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-200",
                item.primary ? "relative -top-6" : "text-slate-500",
                isActive && !item.primary && "text-primary"
              )}
            >
              {item.primary ? (
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform">
                  <item.icon className="text-on-primary w-8 h-8" />
                </div>
              ) : (
                <div className="relative">
                  <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-surface-container-low animate-pulse" />
                  )}
                  <span className="sr-only">{item.label}</span>
                </div>
              )}
              {!item.primary && (
                <span className="text-[10px] font-medium uppercase tracking-widest mt-1">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
