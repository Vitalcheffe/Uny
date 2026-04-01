
import React, { useMemo } from 'react';
import { 
  Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Line, ComposedChart
} from 'recharts';
import { ChevronDown, TrendingUp, Target, Database } from 'lucide-react';
import { Project } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface EarningChartProps {
  projects: Project[];
}

const EarningChart: React.FC<EarningChartProps> = ({ projects }) => {
  const { profile } = useAuth();
  
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    
    const annualGoal = profile?.metadata?.annual_revenue_goal || 0;
    const monthlyTarget = annualGoal / 12;

    const activeProjects = projects.filter(p => p.status === 'Completed' && p.created_at);

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = months[d.getMonth()];
      const year = d.getFullYear();
      
      const monthlyRevenue = activeProjects
        .reduce((sum, p) => {
          const pDate = new Date(p.created_at!);
          if (pDate.getMonth() === d.getMonth() && pDate.getFullYear() === year) {
            return sum + (p.revenue || 0);
          }
          return sum;
        }, 0);

      result.push({
        name: `${mLabel}`,
        actual: monthlyRevenue,
        target: monthlyTarget > 0 ? monthlyTarget : null
      });
    }

    return result;
  }, [projects, profile]);

  const hasData = projects.some(p => p.status === 'Completed' && p.revenue && p.revenue > 0);

  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm group relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <TrendingUp size={18} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Revenue Velocity Node</h3>
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Strategic <span className="text-blue-500">Trends</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Actual</span>
             </div>
             {profile?.metadata?.annual_revenue_goal && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-200 border-2 border-dashed border-slate-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Target Protocol</span>
                </div>
             )}
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
            Rolling 12M <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="h-[340px] w-full mt-4 relative z-10 flex items-center justify-center">
        {!hasData ? (
          <div className="text-center space-y-4 opacity-20 italic">
            <Database size={48} className="mx-auto text-slate-300" />
            <p className="text-xs font-black uppercase tracking-widest">Awaiting archived revenue nodes for projection</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: '900'}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: '900'}} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', background: '#1a1615' }}
                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="actual" stroke="transparent" fillOpacity={0.1} fill="#3b82f6" />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{ r: 8 }} />
              {profile?.metadata?.annual_revenue_goal && (
                <Line type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="8 8" dot={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
               <Target size={16} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Mode</p>
               <p className="text-[11px] font-bold text-slate-900 uppercase italic">
                 {profile?.metadata?.annual_revenue_goal 
                  ? `Synchronized on $${((profile?.metadata?.annual_revenue_goal || 0) / 1000).toFixed(0)}k USD / year`
                  : 'Goal not calibrated'
                 }
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default EarningChart;
