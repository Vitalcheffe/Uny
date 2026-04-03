/**
 * ⚡ UNY PROTOCOL: ORG CHART UPLOADER
 * 
 * Upload organizational chart image → Gemini Vision → Interactive Mind Map
 * System prompt: Extract all people visible in this organizational chart or document.
 * For each person, return JSON array: { "name": string, "role": string, "department": string|null, "reportsTo": string|null }
 */

import React, { useState, useRef } from 'react';
import { Upload, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNodesState, useEdgesState, Node, Edge, addEdge, MarkerType } from 'reactflow';
import { PIIMasker } from '../../lib/pii-masker';

interface Employee {
  name: string;
  role: string;
  department: string | null;
  reportsTo: string | null;
}

interface OrgChartUploaderProps {
  onNodesGenerated: (nodes: Node[], edges: Edge[]) => void;
}

export const OrgChartUploader: React.FC<OrgChartUploaderProps> = ({ onNodesGenerated }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (PNG, JPG, PDF)');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      // 1. Convert to base64
      const base64 = await fileToBase64(selectedFile);
      
      // 2. Send to Gemini Vision via server API
      const response = await fetch('/api/gemini/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: selectedFile.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Vision API failed');
      }

      const data = await response.json();
      const employees: Employee[] = data.employees || [];

      if (employees.length === 0) {
        toast.error('Aucun employé détecté dans l\'image');
        return;
      }

      // 3. Generate ReactFlow nodes and edges
      const { nodes, edges } = generateOrgGraph(employees);
      onNodesGenerated(nodes, edges);

      toast.success(`${employees.length} employés détectés!`);
      
      // Reset
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du traitement. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateOrgGraph = (employees: Employee[]): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create nodes
    employees.forEach((emp, index) => {
      const level = emp.reportsTo ? 1 : 0;
      const yOffset = level * 150;
      const xOffset = (index - (employees.length - 1) / 2) * 200;

      nodes.push({
        id: emp.name,
        data: { 
          label: `${emp.name}\n${emp.role}${emp.department ? ` (${emp.department})` : ''}` 
        },
        position: { x: 400 + xOffset, y: 100 + yOffset },
        style: {
          background: '#fff',
          color: '#1a1615',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '12px 20px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      });

      // Create edges for reportsTo
      if (emp.reportsTo) {
        edges.push({
          id: `${emp.reportsTo}-${emp.name}`,
          source: emp.reportsTo,
          target: emp.name,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.Arrow },
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
      }
    });

    return { nodes, edges };
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Import Org Chart
        </h3>
        {selectedFile && (
          <button 
            onClick={() => { setSelectedFile(null); setPreview(null); }}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {!selectedFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
        >
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            Cliquez pour télécharger une image
          </p>
          <p className="text-slate-400 text-sm mt-1">
            PNG, JPG ou PDF (max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {preview && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <img 
                src={preview} 
                alt="Org chart preview" 
                className="w-full max-h-64 object-contain bg-slate-50"
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={processImage}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyser l'image
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgChartUploader;