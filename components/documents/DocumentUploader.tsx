
import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { firestoreService } from '../../lib/supabase-data-layer';
import { useAuth } from '../../context/AuthContext';
import { processDocument } from '../../lib/ai-engine';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1];
      resolve(base64String || '');
    };
    reader.onerror = (error) => reject(error);
  });
};

const DocumentUploader: React.FC = () => {
  const { orgId, user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = async (file: File) => {
    if (!file || !orgId || !user) return;

    setUploading(true);
    setStatus("QUEUEING_NODE");
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      const filePath = `${orgId}/${Date.now()}_${file.name}`;
      
      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 2. Insert document metadata into Supabase via firestoreService
      const docData = {
        organization_id: orgId, 
        author_id: user.id, 
        title: file.name,
        mime_type: file.type, 
        file_url: publicUrl,
        storage_path: filePath,
        processing_status: 'PENDING',
        created_at: new Date().toISOString()
      };

      const docId = await firestoreService.addDocument('documents', orgId, docData);
      
      setStatus("PROCESSING_AI");
      
      // 3. Launch AI analysis
      await processDocument(
        docId, 
        orgId, 
        { data: base64Data, mimeType: file.type },
        profile?.metadata?.industry || 'AUTRE'
      );
      
      setStatus("COMPLETED");
      setTimeout(() => {
        setUploading(false);
        setStatus(null);
      }, 2000);

    } catch (err: any) {
      console.error("🛡️ [Kernel] Upload error:", err);
      setError("Uplink Failed");
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black italic uppercase tracking-tighter">Ingest <span className="text-blue-600">Node</span></h3>
        {uploading && <Loader2 className="animate-spin text-blue-500" size={18} />}
      </div>

      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative group border-2 border-dashed rounded-[32px] p-10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
        }`}
      >
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer" 
          onChange={handleChange}
          disabled={uploading}
        />
        
        <div className={`p-4 rounded-2xl shadow-sm transition-all ${
          uploading ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 group-hover:scale-110 group-hover:text-blue-500'
        }`}>
          <Upload size={24} />
        </div>

        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest text-slate-900">
            {uploading ? status : 'Transmit Data Payload'}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Drop PDF/IMG to initiate extraction
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[10px] font-black uppercase tracking-widest italic">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {status === 'IN_QUEUE' && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-widest italic">
          <CheckCircle2 size={16} /> Signal Intercepted
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
