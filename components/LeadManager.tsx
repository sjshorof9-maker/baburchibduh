
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
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
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
      phoneNumber: String(num),
      customerName: String(customerName.trim() || ""),
      address: String(address.trim() || ""),
      moderatorId: String(selectedModId),
      status: 'new',
      assignedDate: String(assignedDate),
      createdAt: new Date().toISOString()
    }));

    setTimeout(() => {
      onAssignLeads(newLeads);
      setPhoneNumbers('');
      setCustomerName('');
      setAddress('');
      setSelectedModId('');
      setIsProcessing(false);
      alert(`Success: ${newLeads.length} leads assigned with profile data.`);
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
        <p className="text-xs md:text-sm text-slate-500 font-medium">Distribute call tasks and store customer profiles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">🚀 Lead Import & Profile</h3>
            <form onSubmit={handleDirectSubmit} className="space-y-4">
              <div className="space-y-4">
                <input type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold"/>
                <select value={selectedModId} onChange={(e) => setSelectedModId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                  <option value="">Assign To Moderator...</option>
                  {moderators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                
                <div className="pt-2 border-t border-slate-50 space-y-3">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Optional CRM Data</p>
                   <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-1 focus:ring-orange-500"/>
                   <textarea rows={2} placeholder="Permanent Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-1 focus:ring-orange-500 resize-none"/>
                </div>

                <div className="pt-2 border-t border-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Phone Numbers (One per line)</p>
                  <textarea rows={4} value={phoneNumbers} onChange={(e) => setPhoneNumbers(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold font-mono outline-none focus:ring-1 focus:ring-orange-500" placeholder="017...&#10;018..."/>
                </div>
              </div>
              <button disabled={isProcessing} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-orange-500/10">Import Leads</button>
            </form>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">🎯 Range Distribute</h3>
            <form onSubmit={handleRangeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="From S.N." value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm font-black border border-white/10 outline-none"/>
                <input type="number" placeholder="To S.N." value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm font-black border border-white/10 outline-none"/>
              </div>
              <input type="date" value={rangeDate} onChange={(e) => setRangeDate(e.target.value)} className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm font-black border border-white/10 outline-none"/>
              <select value={rangeModId} onChange={(e) => setRangeModId(e.target.value)} className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm font-black border border-white/10 outline-none">
                <option value="" className="bg-slate-900">Choose Mod...</option>
                {moderators.map(m => <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>)}
              </select>
              <button disabled={isProcessing} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] transition-all active:scale-95">Apply Range Change</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Registry ({leads.length})</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">S.N.</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone & Profile</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.map((lead, idx) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-300 text-[10px]">{idx + 1}</td>
                        <td className="px-6 py-4">
                           <p className="font-black text-slate-800 text-sm font-mono">{String(lead.phoneNumber)}</p>
                           {lead.customerName && typeof lead.customerName === 'string' && (
                              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-tight">{lead.customerName}</p>
                           )}
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-[10px] font-medium text-slate-500 max-w-[150px] truncate">
                              {lead.address && typeof lead.address === 'string' ? lead.address : '—'}
                           </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-600 text-xs">{getModName(lead.moderatorId)}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{String(lead.assignedDate)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => onDeleteLead(lead.id)} className="text-rose-300 hover:text-rose-500 transition-colors">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LeadManager;
