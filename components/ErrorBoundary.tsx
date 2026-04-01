
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Une erreur inattendue est survenue.";
      let isSecurityError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error?.includes('Missing or insufficient permissions')) {
            isSecurityError = true;
            errorMessage = `Accès refusé : Vous n'avez pas les permissions nécessaires pour effectuer cette opération (${parsed.operationType} sur ${parsed.path}).`;
          }
        }
      } catch (e) {
        // Not a JSON error message, use default
      }

      return (
        <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[48px] p-12 shadow-2xl border border-slate-100 text-center space-y-8">
            <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center ${isSecurityError ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
              {isSecurityError ? <ShieldAlert size={40} /> : <AlertCircle size={40} />}
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
                {isSecurityError ? 'SÉCURITÉ GATED' : 'ERREUR SYSTÈME'}
              </h2>
              <p className="text-sm font-bold text-slate-500 leading-relaxed italic">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
            >
              <RefreshCcw size={18} />
              REDÉMARRER LE NOYAU
            </button>
            
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
              UNY HUB SENTINEL v4.2
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
