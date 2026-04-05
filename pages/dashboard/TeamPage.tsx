import React from 'react';
import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400">
      <Users className="w-16 h-16 mb-4 opacity-50" />
      <h2 className="text-xl font-semibold text-slate-600">Équipe</h2>
      <p className="text-sm mt-1">Cette fonctionnalité arrive bientôt.</p>
    </div>
  );
}
