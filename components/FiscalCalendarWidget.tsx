import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { getUpcomingFiscalDeadlines, FiscalEvent } from '../lib/local-adaptation';
import { THEME } from '../constants/theme';

export const FiscalCalendarWidget: React.FC = () => {
  const [deadlines, setDeadlines] = useState<FiscalEvent[]>([]);

  useEffect(() => {
    setDeadlines(getUpcomingFiscalDeadlines());
  }, []);

  if (deadlines.length === 0) return null;

  return (
    <div 
      className="glass-card shadow-sm relative overflow-hidden group"
      style={{
        borderRadius: THEME.borderRadius['3xl'],
        padding: THEME.spacing.xl,
      }}
    >
      <div 
        className="flex items-center justify-between"
        style={{ marginBottom: THEME.spacing.xl }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-500">
            <Calendar size={16} />
            <span 
              className="font-black uppercase tracking-widest"
              style={{ fontSize: THEME.typography.fontSize['2xs'] }}
            >
              Calendrier Fiscal (MA)
            </span>
          </div>
          <h3 
            className="italic tracking-tighter text-white uppercase"
            style={{
              fontSize: THEME.typography.fontSize.xl,
              fontWeight: 950,
            }}
          >
            Échéances
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        {deadlines.slice(0, 3).map((deadline) => (
          <div 
            key={deadline.id} 
            className={`flex items-start gap-4 border transition-all ${
              deadline.isUrgent 
                ? 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
            style={{
              padding: THEME.spacing.md,
              borderRadius: THEME.borderRadius.xl,
            }}
          >
            <div 
              className={`rounded-xl ${deadline.isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}
              style={{ padding: THEME.spacing.sm }}
            >
              {deadline.isUrgent ? <AlertCircle size={18} /> : <Clock size={18} />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 
                  className="font-bold text-white"
                  style={{ fontSize: THEME.typography.fontSize.sm }}
                >
                  {deadline.title}
                </h4>
                <span 
                  className={`font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                    deadline.isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-zinc-400'
                  }`}
                  style={{ fontSize: THEME.typography.fontSize['3xs'] }}
                >
                  {deadline.dueDate.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <p 
                className="text-zinc-400 mt-1 line-clamp-2"
                style={{ fontSize: THEME.typography.fontSize.xs }}
              >
                {deadline.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
