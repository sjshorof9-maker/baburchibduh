
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';

interface ModeratorLeadsProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: 'new' | 'called') => void;
}

const ModeratorLeads: React.FC<ModeratorLeadsProps> = ({ leads, onUpdateStatus }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all'>('today');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const handleCopy = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const filteredLeads = useMemo(() => {
    if (dateFilter === 'today') return leads.filter(l => l.assignedDate === todayStr);
    if (dateFilter === 'tomorrow') return leads.filter(l => l.assignedDate === tomorrowStr);
    return leads;
  }, [leads, dateFilter, todayStr, tomorrowStr]);

  const stats = {
    today: leads.filter(l => l.assignedDate === todayStr && l.status === 'new').length,
    tomorrow: leads.filter(l => l.assignedDate === tomorrowStr).length,
    total: leads.length
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Daily Agenda</h2>
          <p className="text-sm text-slate-500 font-medium">Follow your scheduled calling path for maximum efficiency.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setDateFilter('today')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === 'today' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Today ({stats.today})
          </button>
          <button 
            onClick={() => setDateFilter('tomorrow')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === 'tomorrow' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Tomorrow ({stats.tomorrow})
          </button>
          <button 
            onClick={() => setDateFilter('all')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            All History
          </button>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
            {dateFilter === 'today' ? "Your schedule is clear for today!" : 
             dateFilter === 'tomorrow' ? "Nothing scheduled for tomorrow yet." : 
             "No leads assigned to your account."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.slice().sort((a,b) => b.assignedDate.localeCompare(a.assignedDate)).map((lead) => (
            <div key={lead.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border transition-all duration-300 ${lead.status === 'called' ? 'opacity-60 grayscale-[0.5] border-slate-100' : 'border-blue-100 shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${lead.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {lead.status === 'new' ? '🆕 Pending' : '✅ Done'}
                  </span>
                  {lead.assignedDate === todayStr && lead.status === 'new' && (
                    <span className="bg-rose-500 w-1.5 h-1.5 rounded-full animate-ping"></span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Scheduled For</p>
                  <p className="text-[11px] font-black text-slate-800">{lead.assignedDate === todayStr ? 'Today' : lead.assignedDate}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group transition-all">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Call Target</p>
                    <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{lead.phoneNumber}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(lead.phoneNumber, lead.id)}
                    className={`p-3 rounded-xl border transition-all active:scale-90 flex items-center gap-2 shadow-sm ${
                      copiedId === lead.id 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600'
                    }`}
                  >
                    {copiedId === lead.id ? (
                      <span className="text-[10px] font-black uppercase tracking-widest px-1">Copied!</span>
                    ) : (
                      <span className="text-lg">📋</span>
                    )}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => onUpdateStatus(lead.id, lead.status === 'new' ? 'called' : 'new')}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      lead.status === 'new' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lead.status === 'new' ? 'Complete Call' : 'Re-open Task'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeratorLeads;
