import React, { useState } from "react";
import { ShieldCheck, Mail, Lock, AlertCircle, Chrome } from "lucide-react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const checkAdminRole = async (user: any) => {
    const adminEmails = ["xdcam10@gmail.com", "ulrich.vidal@gmail.com", "contact@wrpproduction.com"];
    
    // Wrap admin profile retrieval in a 15-second timeout
    const adminDocPromise = getDoc(doc(db, "admins", user.uid));
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("La vérification de votre rôle administrateur a expiré (timeout de 15 secondes). Veuillez réessayer.")), 15000)
    );

    try {
      const adminDoc = await Promise.race([adminDocPromise, timeoutPromise]);
      if (adminEmails.includes(user.email || "") || (adminDoc.exists() && adminDoc.data().role === "admin")) {
        navigate("/admin");
      } else {
        await auth.signOut();
        setError("Accès refusé. Vous n'êtes pas administrateur.");
      }
    } catch (err: any) {
      console.error("Admin role check failed or timed out:", err);
      // Fallback: if their email is in the hardcoded list, let them log in anyway
      if (adminEmails.includes(user.email || "")) {
        navigate("/admin");
      } else {
        await auth.signOut();
        setError(err.message || "Erreur de connexion ou session expirée.");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await checkAdminRole(userCredential.user);
    } catch (err: any) {
      setError("Identifiants invalides ou erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await checkAdminRole(result.user);
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("Erreur lors de la connexion avec Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-inter">
      <div className="w-full max-w-md bg-[#1e1e22] border border-[#2e2e34] rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#4ade80] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-[#4ade80]/20">
            <ShieldCheck className="text-black w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#e4e4e8]">SafeCallr Admin</h1>
          <p className="text-[#9a9a9f] text-sm mt-1">Accès réservé au personnel autorisé</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[#f87171]/10 border border-[#f87171]/20 rounded-xl flex items-center gap-3 text-[#f87171] text-sm animate-shake">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9a9a9f] uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f] group-focus-within:text-[#4ade80] transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl py-3.5 pl-12 pr-4 text-[#e4e4e8] focus:outline-none focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] transition-all"
                placeholder="admin@safecallr.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9a9a9f] uppercase tracking-wider ml-1">Mot de passe</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f] group-focus-within:text-[#4ade80] transition-colors" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl py-3.5 pl-12 pr-4 text-[#e4e4e8] focus:outline-none focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold py-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-[#4ade80]/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Connexion...</span>
              </div>
            ) : (
              "Se connecter"
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2e2e34]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1e1e22] px-2 text-[#9a9a9f]">Ou continuer avec</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-[#111113] border border-[#2e2e34] text-[#e4e4e8] font-bold py-3.5 rounded-xl hover:bg-[#1e1e22] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Chrome size={20} className="text-[#4ade80]" />
                <span>Google Admin Access</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#9a9a9f] text-xs">
            SafeCallr Security Protocol v1.2.0
          </p>
        </div>
      </div>
    </div>
  );
}
