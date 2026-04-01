import React from 'react';
import ModernLayout from '../layouts/ModernLayout';
import { THEME } from '../constants/theme';

const DataRow = ({ id, name, status, value }: { id: string; name: string; status: string; value: string }) => (
  <div 
    className="data-row grid grid-cols-[40px_1.5fr_1fr_1fr] border-b border-slate-900/10 hover:bg-slate-900 hover:text-[#E4E3E0] transition-colors cursor-pointer"
    style={{
      padding: THEME.spacing.md,
    }}
  >
    <span className="text-slate-500 font-mono text-sm">{id}</span>
    <span className="font-medium">{name}</span>
    <span className="text-sm uppercase tracking-wider opacity-70">{status}</span>
    <span className="data-value font-mono text-right">{value}</span>
  </div>
);

export default function ModernDashboard() {
  return (
    <ModernLayout>
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <h1 
            className="font-black italic uppercase tracking-tighter"
            style={{
              fontSize: THEME.typography.fontSize['4xl'],
            }}
          >
            Dashboard
          </h1>
          <div className="col-header">Overview / System Status</div>
        </header>

        <section 
          className="bg-white shadow-sm border border-slate-200"
          style={{
            padding: THEME.spacing.lg,
            borderRadius: THEME.borderRadius.xl,
          }}
        >
          <div 
            className="grid grid-cols-[40px_1.5fr_1fr_1fr] border-b border-slate-900/10"
            style={{
              paddingLeft: THEME.spacing.md,
              paddingRight: THEME.spacing.md,
              paddingBottom: THEME.spacing.md,
              marginBottom: THEME.spacing.sm,
            }}
          >
            <div className="col-header">ID</div>
            <div className="col-header">Entity</div>
            <div className="col-header">Status</div>
            <div className="col-header text-right">Value</div>
          </div>
          <DataRow id="01" name="Project Alpha" status="Active" value="$125,000" />
          <DataRow id="02" name="Client Beta" status="Lead" value="$45,000" />
          <DataRow id="03" name="Contract Gamma" status="Pending" value="$89,000" />
        </section>
      </div>
    </ModernLayout>
  );
}
