import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A0A1A]">Paramètres</h1>
        <p className="text-slate-500 mt-1">Gérez les paramètres de la plateforme</p>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#2563EB]/10 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#0A0A1A]">Paramètres généraux</h2>
            <p className="text-sm text-slate-500">Configuration de la plateforme</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
            <h3 className="font-medium text-[#0A0A1A] mb-2">Nom de la plateforme</h3>
            <p className="text-slate-600">UNY</p>
          </div>
          
          <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
            <h3 className="font-medium text-[#0A0A1A] mb-2">Version</h3>
            <p className="text-slate-600">1.0.0</p>
          </div>
          
          <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
            <h3 className="font-medium text-[#0A0A1A] mb-2">Date de création</h3>
            <p className="text-slate-600">Janvier 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}
