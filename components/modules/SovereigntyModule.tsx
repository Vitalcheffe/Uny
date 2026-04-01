
import React from 'react';
import { ShieldCheck, ShieldAlert, Globe, Server, Database, Activity, Lock } from 'lucide-react';

export const SovereigntyModule: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h2 className="text-5xl font-heading italic titanium-text uppercase tracking-tighter">Souveraineté</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.5em] mt-4">Kernel de Conformité & Juridiction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-surgical p-12 border-brand-cobalt/20 bg-brand-cobalt/5 rounded-[3.5rem] space-y-10">
           <div className="flex items-center gap-4 text-brand-cobalt">
              <ShieldCheck size={32} />
              <h3 className="text-2xl font-heading uppercase italic">Serment Local</h3>
           </div>
           <p className="text-sm text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
              L'Empire UNY garantit que <span className="text-white">100% des bases de données transactionnelles</span> sont hébergées sur des nodes physiques dans la juridiction choisie.
           </p>
           <div className="p-8 border border-white/5 bg-black/40 rounded-3xl space-y-6">
              <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                 <span>Statut de Localisation</span>
                 <span className="text-brand-emerald">CONFIRMÉ</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="w-full h-full bg-brand-emerald" />
              </div>
           </div>
        </div>

        <div className="glass-surgical p-12 border-brand-ruby/20 bg-brand-ruby/5 rounded-[3.5rem] space-y-10">
           <div className="flex items-center gap-4 text-brand-ruby">
              <ShieldAlert size={32} />
              <h3 className="text-2xl font-heading uppercase italic">Détection de Fuite</h3>
           </div>
           
           {/* Problème 4 : Disclosure de Google Gemini */}
           <div className="p-8 bg-brand-ruby/10 border border-brand-ruby/30 rounded-3xl space-y-6">
              <p className="text-[10px] font-black text-brand-ruby uppercase tracking-[0.4em] flex items-center gap-3">
                 <Globe size={14} /> ALERTE SOUVERAINETÉ IA
              </p>
              <p className="text-[11px] text-gray-300 font-bold leading-relaxed uppercase tracking-widest italic">
                 Les fonctionnalités IA (Terminal, Sentinel) utilisent actuellement <span className="text-brand-ruby underline">Google Gemini (USA)</span>. 
                 Certaines métadonnées de commandes sont traitées hors juridiction.
              </p>
              <div className="flex gap-4">
                 <button className="flex-1 py-3 bg-brand-ruby text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-brand-obsidian transition-all">Désactiver l'IA</button>
                 <button className="flex-1 py-3 border border-brand-ruby/30 text-brand-ruby text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-ruby hover:text-white transition-all">Migrer vers HSM Local</button>
              </div>
           </div>

           <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest leading-relaxed">
              ROADMAP SENTINEL : Intégration d'un proxy de masquage HSM N4 pour anonymiser les requêtes Gemini avant T3-25.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
         {[
           { icon: Server, label: "Nodes Physiques", value: "3/3 Actifs" },
           { icon: Database, label: "Data Residency", value: "Locked" },
           { icon: Lock, label: "Encryption HSM", value: "Hardware Level" }
         ].map((item, i) => (
           <div key={i} className="glass-surgical p-8 border-white/5 bg-brand-anthracite/20 rounded-[2.5rem] flex items-center gap-6">
              <div className="p-3 bg-white/5 rounded-xl text-brand-cobalt">
                <item.icon size={20} />
              </div>
              <div>
                 <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{item.label}</div>
                 <div className="text-sm font-bold text-white uppercase">{item.value}</div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
