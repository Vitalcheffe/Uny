
import React from 'react';
import { 
  FileText, Send, CheckSquare, Plus, FileInput, Percent
} from 'lucide-react';

const actions = [
  { label: 'Send an invoice', icon: FileText },
  { label: 'Draft a proposal', icon: Send },
  { label: 'Create a contract', icon: CheckSquare },
  { label: 'Add a form', icon: Plus },
  { label: 'Create a project', icon: FileInput },
  { label: 'File Tax', icon: Percent },
];

const ActionButton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action, i) => (
        <button 
          key={i}
          className="bg-white p-6 rounded-[28px] border border-slate-50 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group"
        >
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            <action.icon size={22} />
          </div>
          <span className="text-xs font-bold text-slate-600 group-hover:text-black">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ActionButton;
