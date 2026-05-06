import * as React from "react";
import { AlertCircle, RefreshCcw, Home, ShieldAlert } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    let errorInfo = null;
    try {
      // Try to parse the JSON error from handleFirestoreError
      if (error.message.startsWith('{') && error.message.endsWith('}')) {
        errorInfo = JSON.parse(error.message);
      }
    } catch (e) {
      // Not a JSON error
    }
    
    return { hasError: true, error, errorInfo };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isPermissionError = this.state.errorInfo?.error?.toLowerCase().includes('permission') || 
                               this.state.error?.message?.toLowerCase().includes('permission');

      return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-2xl w-full bg-[#111113] border border-[#2e2e34] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4ade80]/10 blur-[100px] rounded-full" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                {isPermissionError ? (
                  <ShieldAlert className="text-red-500 w-10 h-10" />
                ) : (
                  <AlertCircle className="text-red-500 w-10 h-10" />
                )}
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {isPermissionError ? "Accès Refusé" : "Une erreur est survenue"}
                </h1>
                <p className="text-[#9a9a9f] max-w-md mx-auto">
                  {isPermissionError 
                    ? "Vous n'avez pas les permissions nécessaires pour accéder à ces données. Veuillez vérifier que vous êtes bien connecté avec un compte administrateur."
                    : "L'application a rencontré un problème inattendu. Nos équipes ont été informées."}
                </p>
              </div>

              {this.state.errorInfo && (
                <div className="w-full bg-[#18181b] border border-[#2e2e34] rounded-2xl p-4 text-left font-mono text-xs space-y-2 overflow-auto max-h-48">
                  <p className="text-[#4ade80] font-bold uppercase tracking-widest text-[10px]">Détails Techniques</p>
                  <div className="space-y-1 text-[#9a9a9f]">
                    <p><span className="text-white">Opération:</span> {this.state.errorInfo.operationType}</p>
                    <p><span className="text-white">Chemin:</span> {this.state.errorInfo.path}</p>
                    <p><span className="text-white">Utilisateur:</span> {this.state.errorInfo.authInfo?.email || "Non connecté"}</p>
                    <p><span className="text-white">UID:</span> {this.state.errorInfo.authInfo?.userId || "N/A"}</p>
                    <p className="mt-2 text-red-400 break-words">{this.state.errorInfo.error}</p>
                  </div>
                </div>
              )}

              {!this.state.errorInfo && this.state.error && (
                <div className="w-full bg-[#18181b] border border-[#2e2e34] rounded-2xl p-4 text-left font-mono text-xs overflow-auto max-h-32">
                  <p className="text-red-400 break-words">{this.state.error.message}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full pt-4">
                <button
                  onClick={this.handleReset}
                  className="w-full sm:flex-1 bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  <RefreshCcw size={18} />
                  Réessayer
                </button>
                <a
                  href="/"
                  className="w-full sm:flex-1 bg-[#1e1e22] text-white border border-[#2e2e34] font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2e2e34] transition-all active:scale-[0.98]"
                >
                  <Home size={18} />
                  Retour à l'accueil
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
