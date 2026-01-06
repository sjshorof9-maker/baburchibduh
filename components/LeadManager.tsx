
import React, { useState } from 'react';
import { User, Lead } from '../types';

interface LeadManagerProps {
  moderators: User[];
  leads: Lead[];
  onAssignLeads: (leads: Lead[]) => void;
  onBulkUpdateLeads: (indices: number[], modId: string, date: string) => void;
  onDeleteLead: (id: string) => void;
}

const LeadManager: React.FC<LeadManagerProps> = ({ moderators, leads, onAssignLeads, onBulkUpdateLeads, onDeleteLead }) => {
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [selectedModId, setSelectedModId] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeModId, setRangeModId] = useState('');
  const [rangeDate, setRangeDate] = useState(new Date().toISOString().split('T')[0]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumbers.trim() || !selectedModId || !assignedDate) return;
    setIsProcessing(true);
    const numberList = phoneNumbers.split(/[\n,]/).map(n => n.trim()).filter(n => n.length >= 10);
    const newLeads: Lead[] = numberList.map(num => ({
      id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phoneNumber: num,
      moderatorId: selectedModId,
      status: 'new',
      assignedDate: assignedDate,
      createdAt: new Date().toISOString()
    }));
    setTimeout(() => {
      onAssignLeads(newLeads);
      setPhoneNumbers('');
      setSelectedModId('');
      setIsProcessing(false);
      alert(`Success: ${newLeads.length} leads assigned.`);
    }, 500);
  };

  const handleRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    if (isNaN(start) || isNaN(end) || start < 1 || end < start || !rangeModId) return;
    setIsProcessing(true);
    const indicesToUpdate = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
    setTimeout(() => {
      onBulkUpdateLeads(indicesToUpdate, rangeModId, rangeDate);
      setIsProcessing(false);
      setRangeStart('');
      setRangeEnd('');
      alert(`Range ${start}-${end} re-assigned.`);
    }, 500);
  };

  const getModName = (id: string) => moderators.find(m => m.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Master Lead Log</h2>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Distribute call tasks across your team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Mobile will stack these */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">🚀 Bulk Upload</h3>
            <form onSubmit={handleDirectSubmit} className="space-y-4">
              <input type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold"/>
              <select value={selectedModId} onChange={(e) => setSelectedModId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                <option value="">Select Mod...</option>
                {moderators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <textarea rows={4} value={phoneNumbers} onChange={(e) => setPhoneNumbers(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold font-mono" placeholder="Paste numbers here..."/>
              <button disabled={isProcessing} className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]">Import Leads</button>
            </form>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">🎯 Range Distribute</h3>
            <form onSubmit={handleRangeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="From S.N." value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm font-black border border-white/10"/>
                <input type="number" placeholder="To S.N." value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm font-black border border-white/10"/>
              </div>
              <input type="date" value={rangeDate} onChange={(e) => setRangeDate(e.target.value)} className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm font-black border border-white/10"/>
              <select value={rangeModId} onChange={(e) => setRangeModId(e.target.value)} className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm font-black border border-white/10">
                <option value="" className="bg-slate-900">Choose Mod...</option>
                {moderators.map(m => <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>)}
              </select>
              <button disabled={isProcessing} className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]">Apply Range Change</button>
            </form>
          </div>
        </div>

        {/* Right Column: Lead Log List */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Registry ({leads.length})</h3>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">S.N.</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Moderator</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.map((lead, idx) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-300 text-[10px]">{idx + 1}</td>
                        <td className="px-6 py-4 font-black text-slate-800 text-sm font-mono">{lead.phoneNumber}</td>
                        <td className="px-6 py-4 font-bold text-slate-600 text-xs">{getModName(lead.moderatorId)}</td>
                        <td className="px-6 py-4 font-bold text-slate-400 text-[10px]">{lead.assignedDate}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => onDeleteLead(lead.id)} className="text-rose-300 hover:text-rose-500">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-slate-50">
                 {leads.map((lead, idx) => (
                   <div key={lead.id} className="p-4 flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <span className="text-[10px] font-black text-slate-300">{idx+1}</span>
                        <div>
                          <p className="font-black text-slate-800 text-sm font-mono tracking-tight">{lead.phoneNumber}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{getModName(lead.moderatorId)} • {lead.assignedDate}</p>
                        </div>
                      </div>
                      <button onClick={() => onDeleteLead(lead.id)} className="p-2 text-rose-300">🗑️</button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LeadManager;
