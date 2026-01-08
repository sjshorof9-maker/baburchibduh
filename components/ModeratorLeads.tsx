
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '../types';

interface ModeratorLeadsProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
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
    pendingToday: leads.filter(l => l.assignedDate === todayStr && l.status === 'pending').length,
    tomorrow: leads.filter(l => l.assignedDate === tomorrowStr).length,
    total: leads.length
  };

  const getStatusDisplay = (status: LeadStatus) => {
    const base = "text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-2";
    switch (status) {
      case 'confirmed': return <span className={`${base} text-emerald-500`}><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Sales Success</span>;
      case 'communication': return <span className={`${base} text-blue-500 animate-pulse`}><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>In Process...</span>;
      case 'no-response': return <span className={`${base} text-rose-500`}><span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>No Answer</span>;
      default: return <span className={`${base} text-slate-400`}><span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>Waiting Call</span>;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">Calling Queue</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Operational Unit Calling Protocol</p>
          </div>
        </div>
        
        <div className="flex bg-white p-2 rounded-[2rem] border border-slate-200 shadow-xl w-full md:w-auto overflow-x-auto">
          {['today', 'tomorrow', 'all'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setDateFilter(tab as any)}
              className={`flex-1 md:flex-none px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${dateFilter === tab ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab === 'today' ? `Today (${stats.pendingToday})` : tab === 'tomorrow' ? `Tomorrow (${stats.tomorrow})` : `Lifetime (${stats.total})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Call Target</p>
               <p className="text-4xl font-black mt-2">{stats.pendingToday}</p>
               <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-4 leading-relaxed">Complete these calls to maintain conversion target.</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
               <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-emerald-100">🏆</div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Sales</p>
               <p className="text-3xl font-black text-slate-800">{leads.filter(l => l.assignedDate === todayStr && l.status === 'confirmed').length}</p>
            </div>
         </div>

         <div className="md:col-span-3">
           {filteredLeads.length === 0 ? (
             <div className="py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
               <div className="text-7xl mb-6 opacity-20">📞</div>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Queue is empty. Relax or check "All History".</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {filteredLeads.slice().sort((a,b) => b.assignedDate.localeCompare(a.assignedDate)).map((lead) => (
                 <div key={lead.id} className={`group relative bg-white p-8 rounded-[3rem] border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${lead.status !== 'pending' ? 'border-slate-100 bg-slate-50/30' : 'border-indigo-100 bg-white'}`}>
                   
                   <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Operational Status</p>
                        {getStatusDisplay(lead.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Schedule</p>
                        <p className={`text-[11px] font-black px-4 py-1 rounded-full border ${lead.assignedDate === todayStr ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {lead.assignedDate === todayStr ? '● TARGET TODAY' : lead.assignedDate}
                        </p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-6 mb-10">
                      <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center font-black text-2xl shadow-xl transition-transform group-hover:scale-110">
                        {lead.customerName ? lead.customerName.charAt(0) : 'P'}
                      </div>
                      <div className="overflow-hidden">
                         <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter leading-none truncate">{lead.phoneNumber}</p>
                         <p className="text-[11px] font-black text-indigo-500 uppercase mt-2 tracking-widest truncate">{lead.customerName || 'Potential Client'}</p>
                         <p className="text-[9px] text-slate-400 font-bold mt-1 truncate">{lead.address || 'Address not listed'}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-3 mb-8">
                      <a href={`tel:${lead.phoneNumber}`} className="flex flex-col items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl shadow-lg transition-all active:scale-95 group/call">
                        <span className="text-xl mb-1 group-hover/call:scale-125 transition-transform">📞</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter">Direct Call</span>
                      </a>
                      <button onClick={() => handleCopy(lead.phoneNumber, lead.id)} className={`flex flex-col items-center justify-center py-5 rounded-2xl border transition-all active:scale-95 ${copiedId === lead.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-600 shadow-sm'}`}>
                        <span className="text-xl mb-1">{copiedId === lead.id ? '✓' : '📋'}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter">{copiedId === lead.id ? 'Copied' : 'Copy Num'}</span>
                      </button>
                      <button onClick={() => onUpdateStatus(lead.id, 'communication')} className={`flex flex-col items-center justify-center py-5 rounded-2xl border transition-all active:scale-95 ${lead.status === 'communication' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50 shadow-sm'}`}>
                         <span className="text-xl mb-1">💬</span>
                         <span className="text-[8px] font-black uppercase tracking-tighter">Talking</span>
                      </button>
                   </div>

                   <div className="pt-6 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button 
                        onClick={() => onUpdateStatus(lead.id, 'confirmed')}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${lead.status === 'confirmed' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-transparent'}`}
                      >
                        ✓ Confirm
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(lead.id, 'communication')}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${lead.status === 'communication' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-transparent'}`}
                      >
                        💬 Comm
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(lead.id, 'no-response')}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${lead.status === 'no-response' ? 'bg-rose-600 text-white shadow-rose-500/20' : 'bg-slate-50 text-rose-500 hover:bg-rose-600 hover:text-white border border-transparent'}`}
                      >
                        📵 Reject
                      </button>
                   </div>

                </div>
               ))}
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default ModeratorLeads;
