import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, 
  Loader2, ChevronRight, Search, Filter, Database,
  Zap, ArrowRight, ShieldCheck, Download, MoreHorizontal,
  Clock, Activity, Trash2, Upload, Brain, ShieldAlert,
  Server, Cpu, Wifi
} from 'lucide-react';
import { firestoreService } from '../lib/supabase-data-layer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { neuralExtractor } from '../lib/neuralExtractor';

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'failed';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Verified': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Pending Scan': 'bg-blue-50 text-blue-600 border-blue-100',
    'Anomaly Detected': 'bg-rose-50 text-rose-600 border-rose-100',
    'COMPLETED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'PROCESSING': 'bg-blue-50 text-blue-600 border-blue-100',
    'FAILED': 'bg-rose-50 text-rose-600 border-rose-100',
  };
  
  const translatedStatus: Record<string, string> = {
    'Verified': 'Vérifié',
    'Pending Scan': 'Analyse en attente',
    'Anomaly Detected': 'Anomalie Détectée',
    'COMPLETED': 'TERMINÉ',
    'PROCESSING': 'EN TRAITEMENT',
    'FAILED': 'ÉCHEC',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      {translatedStatus[status] || status}
    </span>
  );
};

const DocumentsPage: React.FC = () => {
  const { orgId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [docs, setDocs] = useState<any[]>([]);
  const [isRegistryLoading, setIsRegistryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [extractionProgress, setExtractionProgress] = useState('');
  const [diagnostics, setDiagnostics] = useState<{ bucket: string, ai: string, db: string } | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!orgId) return;
    setIsRegistryLoading(true);
    try {
      const data = await firestoreService.getCollection('documents', orgId, [], 'created_at', 'desc');
      setDocs(data || []);
    } catch (err) {
      console.error("Vault access fault:", err);
    } finally {
      setIsRegistryLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    if (!orgId) return;
    setUploadStatus('uploading');
    setExtractionProgress('Envoi de la charge utile au nœud [documents]...');
    setDiagnostics(null);
    
    try {
      // 1. Upload to primary storage (Supabase Storage)
      const fileName = `${orgId}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      setExtractionProgress('Charge utile sécurisée. Initiation de la Matrice Légale Profonde...');
      
      // 2. Create document record
      const docId = await firestoreService.addDocument('documents', orgId, {
        file_name: file.name,
        file_type: file.type,
        storage_path: fileName,
        processing_status: 'PROCESSING',
        file_size: file.size,
        created_at: new Date().toISOString()
      });
      
      setUploadStatus('analyzing');
      setExtractionProgress('Gemini 3 Pro : Audit légal haute fidélité...');
      
      // 3. NEURAL EXTRACTION (THE MAGIC)
      try {
        const extraction = await neuralExtractor.processDocument(
          docId!,
          publicUrl,
          file.type,
          orgId
        );
        
        setExtractionProgress(`SUCCÈS DE LA FUSION : ${extraction.atoms.length} Atomes de Connaissance validés.`);
        setUploadStatus('complete');
        
        setTimeout(() => {
          setUploadStatus('idle');
          setExtractionProgress('');
          fetchDocuments();
        }, 3000);
      } catch (extErr: any) {
        console.error("Forensic Error:", extErr);
        setUploadStatus('failed');
        setExtractionProgress('Protocole d\'extraction avorté. Méta-récupération active.');
        
        // System Diagnostics
        setDiagnostics({
          bucket: extErr.message.includes('analytics') ? 'ERROR' : 'OK',
          ai: 'OK',
          db: 'OK'
        });
        
        fetchDocuments();
      }
      
    } catch (err: any) {
      console.error('Critical Upload Failure:', err);
      setUploadStatus('failed');
      setDiagnostics({
        bucket: 'OFFLINE',
        ai: 'STANDBY',
        db: 'OK'
      });
      fetchDocuments();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-600 font-sans selection:bg-blue-100">
      <div className="max-w-[1600px] mx-auto space-y-12 p-8 pb-32">
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-10 border-b border-slate-100">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-blue-600">
              <Database size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Unité d'Archivage</span>
            </div>
            <h1 className="text-5xl font-[950] italic uppercase tracking-tighter text-slate-900 leading-none">
              Coffre de <span className="text-slate-400">Connaissances</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic ml-1">
              Moteur d'Ingestion Neural v15.5 // Titan Light
            </p>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={() => window.location.href = '/#/dashboard/knowledge'}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all flex items-center gap-3 shadow-sm"
             >
                <Brain size={14} /> Registre des Connaissances
             </button>
             <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sécurité : Nameinale</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12 space-y-8">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
            />
            <div 
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => uploadStatus === 'idle' && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[48px] p-20 flex flex-col items-center justify-center text-center transition-all duration-500 group shadow-sm ${
                uploadStatus !== 'idle' ? 'border-blue-500 bg-blue-50/50' : 
                'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer'
              }`}
            >
              {uploadStatus === 'idle' ? (
                <>
                  <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 text-slate-300 group-hover:scale-110 group-hover:text-blue-500 transition-all shadow-inner">
                    <UploadCloud size={64} strokeWidth={1.5} />
                  </div>
                  <div className="mt-10 space-y-4">
                    <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 leading-none">
                      Glisser & Déposer <span className="text-blue-600">Charge Utile</span>
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed italic">
                      Cartographie Légale Automatisée pour Invoices, Contracts et Nœuds de Données.
                    </p>
                  </div>
                </>
              ) : uploadStatus === 'failed' ? (
                <div className="space-y-8 max-w-md">
                  <div className="p-8 bg-rose-50 rounded-[40px] border border-rose-100 text-rose-600 mx-auto w-fit">
                    <ShieldAlert size={64} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black italic uppercase text-slate-900">Arrêt de Synchronisation du Noyau</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Failure du protocole de poignée de main. Consultez le diagnostic système ci-dessous.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     {[
                       { label: 'Nœud de Stockage', status: diagnostics?.bucket || 'FAIL', icon: Server },
                       { label: 'Oracle IA', status: diagnostics?.ai || 'FAIL', icon: Cpu },
                       { label: 'Database', status: diagnostics?.db || 'OK', icon: Database }
                     ].map((diag, i) => (
                       <div key={i} className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-2">
                          <diag.icon size={16} className={diag.status === 'OK' ? 'text-emerald-500' : 'text-rose-500'} />
                          <p className="text-[8px] font-black uppercase text-slate-400 leading-none">{diag.label}</p>
                          <p className={`text-[10px] font-black uppercase italic ${diag.status === 'OK' ? 'text-emerald-600' : 'text-rose-600'}`}>{diag.status}</p>
                       </div>
                     ))}
                  </div>
                  <button onClick={() => setUploadStatus('idle')} className="px-10 py-4 bg-[#1a1615] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl italic">
                    Ignorer et Réessayer
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                   <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 border-[3px] border-slate-100 border-t-blue-600 rounded-[32px] shadow-2xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Brain size={32} className="text-blue-600 animate-pulse" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 animate-pulse">{extractionProgress}</p>
                      <div className="w-48 h-0.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                         <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="h-full w-1/3 bg-blue-600"
                         />
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4">
              <div className="flex items-center gap-4 text-slate-900">
                <Wifi size={18} className="text-blue-600" />
                <h2 className="text-sm font-black uppercase tracking-widest italic leading-none">Flux d'Archivage</h2>
              </div>
              <div className="relative flex-1 md:w-80 group">
                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search...s nœuds..." 
                  className="w-full bg-white border border-slate-200 rounded-full py-3.5 pl-12 pr-6 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 font-bold italic"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
           </div>

           <div className="bg-white rounded-[56px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
             {isRegistryLoading ? (
                <div className="py-32 flex flex-col items-center gap-6 opacity-30">
                   <Loader2 size={40} className="animate-spin text-blue-600" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Synchronisation du Registre...</p>
                </div>
             ) : docs.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center text-center space-y-8 opacity-20 italic">
                   <FileText size={64} className="text-slate-300" />
                   <p className="text-xs font-black uppercase tracking-widest">Aucun nœud d'archivage détecté dans ce secteur.</p>
                </div>
             ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-12 py-8">Identifiant du Nœud</th>
                        <th className="px-12 py-8">Schéma</th>
                        <th className="px-12 py-8">État du Signal</th>
                        <th className="px-12 py-8 text-right">Magnitude</th>
                        <th className="px-12 py-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold text-slate-800">
                      {docs.filter(d => d.file_name.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-12 py-10">
                             <div className="flex items-center gap-5">
                                <div className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl shadow-sm">
                                   <FileText size={20} />
                                </div>
                                <div className="min-w-0">
                                   <span className="text-lg italic uppercase tracking-tight block truncate">{doc.file_name}</span>
                                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">ID_0X{doc.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-12 py-10 uppercase text-[10px] text-slate-400">{doc.file_type.split('/')[1] || 'DATA'}</td>
                          <td className="px-12 py-10">
                            <StatusBadge status={doc.processing_status} />
                          </td>
                          <td className="px-12 py-10 text-right font-mono text-sm text-slate-500">
                             {Math.round((doc.file_size || 0) / 1024)} KB
                          </td>
                          <td className="px-12 py-10 text-right">
                             <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-slate-900 transition-all shadow-sm">
                               <MoreHorizontal size={18} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;