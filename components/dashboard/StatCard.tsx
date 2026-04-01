
import React from 'react';
import { StatItem } from '../../types';
import { THEME } from '../../constants/theme';

const StatCard: React.FC<StatItem> = ({ label, value, change, isPositive, icon }) => {
  return (
    <div 
      className="bg-white transition-all group"
      style={{
        padding: THEME.spacing.xl,
        borderRadius: THEME.borderRadius['4xl'],
        border: `1px solid ${THEME.colors.text.secondary}05`, // Subtle border
        boxShadow: THEME.shadows.sm,
      }}
    >
      <div 
        className="flex items-center justify-center text-slate-400 group-hover:bg-[#1a1615] group-hover:text-white transition-all shadow-inner"
        style={{
          width: THEME.spacing['3xl'],
          height: THEME.spacing['3xl'],
          backgroundColor: '#f8fafc', // slate-50
          borderRadius: THEME.borderRadius.xl,
          marginBottom: THEME.spacing.xl,
        }}
      >
        {icon}
      </div>
      <p 
        className="font-black text-slate-400 uppercase leading-none"
        style={{
          fontSize: THEME.typography.fontSize['2xs'],
          letterSpacing: THEME.typography.letterSpacing.ultra,
          marginBottom: THEME.spacing.sm,
        }}
      >
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h3 
          className="font-black italic tracking-tighter uppercase"
          style={{
            fontSize: THEME.typography.fontSize['4xl'],
            color: THEME.colors.surface,
          }}
        >
          {value}
        </h3>
        <div 
          className={`flex items-center gap-1 px-2 py-1 rounded-full font-black border transition-all ${
            isPositive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
          }`}
          style={{
            fontSize: THEME.typography.fontSize['3xs'],
          }}
        >
          {isPositive ? '▲' : '▼'} {change}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
