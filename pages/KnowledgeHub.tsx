import React, { useState } from 'react';
import { Sparkles, Shield, Lock, FileText, ChevronRight, UploadCloud } from 'lucide-react';

const KnowledgeHub: React.FC = () => {
  const [formData, setFormData] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      {/* Panneau Gauche (Visionneuse) */}
      <div className="w-1/2 bg-[#0a0a0a] flex items-center justify-center border-r border-white/5 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }} 
        />
        <div className="text-center text-zinc-700 relative z-10">
          <FileText size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm font-black uppercase tracking-widest italic">Source Document Preview</p>
          <div className="mt-4 px-4 py-2 glass-card rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/50">
            {formData ? 'Scanning Layer Active' : 'Waiting for Document'}
          </div>
        </div>
      </div>

      {/* Panneau Droit (Extracteur IA) */}
      <div className="w-1/2 bg-[#050505] flex flex-col relative shadow-2xl">
        <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
          {!formData ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <UploadCloud size={32} className="text-zinc-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">AUCUN DOCUMENT EN COURS</h2>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Veuillez uploader un document pour lancer l'analyse cognitive.</p>
              </div>
              <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl">
                SÉLECTIONNER UN FICHIER
              </button>
            </div>
          ) : (
            <>
              {/* En-tête */}
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500/20">
                  <Sparkles size={14} />
                  IA Confidence: 98.4%
                </div>
                <h1 className="text-4xl font-[950] text-white italic uppercase tracking-tighter leading-tight">
                  Analyse <br /> <span className="text-blue-600">Cognitive</span> Terminée
                </h1>
              </div>

              {/* Formulaire */}
              <div className="space-y-8">
                {[
                  { label: "Fournisseur", name: "fournisseur" },
                  { label: "ICE (Identifiant Commun d'Entreprise)", name: "ice", secure: true },
                  { label: "Montant HT", name: "montantHT" },
                  { label: "TVA (20%)", name: "tva" },
                  { label: "Montant TTC", name: "montantTTC" },
                  { label: "Date d'échéance", name: "dateEcheance", type: "date" },
                ].map((field) => (
                  <div key={field.name} className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">{field.label}</label>
                    <div className="relative group">
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black italic uppercase text-sm focus:border-blue-500 outline-none transition-all group-hover:bg-white/[0.07]"
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-500 group-focus-within:w-full transition-all duration-500" />
                    </div>
                    {field.secure && (
                      <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-bold uppercase tracking-widest mt-2 ml-2">
                        <Shield size={12} />
                        <span>Donnée protégée par le bouclier d'anonymisation UNY</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Boutons d'Action (Sticky Bottom) */}
        {formData && (
          <div className="sticky bottom-0 bg-[#050505]/80 backdrop-blur-xl border-t border-white/5 p-8 flex justify-end gap-6">
            <button className="text-zinc-500 font-black uppercase tracking-widest text-[10px] px-8 py-4 hover:text-white transition-colors italic">
              Rejeter / Modifier
            </button>
            <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 italic glow-button">
              Valider & Injecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeHub;
