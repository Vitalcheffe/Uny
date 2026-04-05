import React, { useState, useEffect } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  organization_id: string | null;
  organization_name?: string;
  role: string;
  created_at: string;
  status: 'active' | 'inactive';
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch all profiles (not auth.users for security)
    const { data: profilesData, error } = await (supabase
      .from('profiles' as any)
      .select('*')
      .order('created_at', { ascending: false }) as any);

    if (!error && profilesData) {
      // Fetch organization names
      const { data: orgsData } = await (supabase
        .from('organizations' as any)
        .select('id, name') as any);
      
      const orgMap = new Map((orgsData || []).map((o: any) => [o.id, o.name]));
      
      setUsers(profilesData.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email || '',
        organization_id: p.organization_id,
        organization_name: orgMap.get(p.organization_id) || 'Aucune',
        role: p.role || 'USER',
        created_at: p.created_at,
        status: p.is_active !== false ? 'active' as const : 'inactive' as const
      })));
    }
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <UsersIcon className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Aucun utilisateur</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nom</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Organisation</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rôle</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Créé le</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Statut</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-[#0A0A1A]">{user.full_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.organization_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                       user.role === 'ADMIN' ? 'Admin' : 'Membre'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm(`Se connecter en tant que ${user.email}?`)) {
                          alert(' Magic link sera envoyé à cet email');
                        }
                      }}
                      className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-medium hover:bg-[#1D4ED8]"
                    >
                      Login
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}