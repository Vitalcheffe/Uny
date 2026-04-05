import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Zap, FileText, Briefcase, Clock } from 'lucide-react';

export default function HomePage() {
  const { user, profile } = useAuth();
  
  const firstName = profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'utilisateur';
  
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const stats = {
    tokensUsed: 2340,
    documentsProcessed: 156,
    activeProjects: 8
  };

  const recentActivity = [
    { icon: Zap, description: 'Conversation avec l\'IA générative', time: 'Il y a 5 min' },
    { icon: FileText, description: 'Document "Rapport Q1" modifié', time: 'Il y a 2h' },
    { icon: Briefcase, description: 'Projet "Marketing Campagne" mis à jour', time: 'Il y a 4h' },
    { icon: Clock, description: 'Temps de travail enregistré: 3h45', time: 'Hier' },
    { icon: FileText, description: 'Nouveau documentUploadé', time: 'Hier' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#0A0A1A]">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-slate-500 mt-1">{today}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#2563EB]" />
            </div>
            <span className="text-sm text-slate-500">Tokens utilisés ce mois</span>
          </div>
          <p className="text-2xl font-semibold text-[#0A0A1A]">{stats.tokensUsed.toLocaleString()}</p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#10B981]" />
            </div>
            <span className="text-sm text-slate-500">Documents traités</span>
          </div>
          <p className="text-2xl font-semibold text-[#0A0A1A]">{stats.documentsProcessed}</p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <span className="text-sm text-slate-500">Projets actifs</span>
          </div>
          <p className="text-2xl font-semibold text-[#0A0A1A]">{stats.activeProjects}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-[#0A0A1A] mb-4">Activité récente</h2>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="divide-y divide-[#E2E8F0]">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0A0A1A]">{activity.description}</p>
                  </div>
                  <span className="text-sm text-slate-400">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
