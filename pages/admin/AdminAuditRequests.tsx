import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X } from 'lucide-react';
import ModernLayout from '../../layouts/ModernLayout';

export default function AdminAuditRequests() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase.from('audit_requests').select('*').eq('status', 'PENDING');
      if (data) setRequests(data);
    };
    fetchRequests();
  }, []);

  const handleAccept = async (request: any) => {
    // 1. Create Organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: request.organization_name, email: request.email })
      .select()
      .single();

    if (org) {
      // 2. Update status
      await supabase.from('audit_requests').update({ status: 'ACCEPTED' }).eq('id', request.id);
      
      // 3. Trigger email (Simulated - needs real email service integration)
      console.log(`Sending registration email to ${request.email} for org ${org.id}`);
      alert(`Organization ${org.name} created. Email sent to ${request.email}`);
      setRequests(requests.filter(r => r.id !== request.id));
    }
  };

  return (
    <ModernLayout>
      <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-8">Audit Requests</h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {requests.map(req => (
          <div key={req.id} className="flex justify-between items-center p-4 border-b border-slate-100">
            <div>
              <p className="font-bold">{req.organization_name}</p>
              <p className="text-sm text-slate-500">{req.email}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAccept(req)} className="p-2 bg-green-100 text-green-700 rounded-lg"><Check size={20} /></button>
              <button className="p-2 bg-red-100 text-red-700 rounded-lg"><X size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </ModernLayout>
  );
}
