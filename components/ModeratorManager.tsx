
import React, { useState } from 'react';
import { User, UserRole, Lead, Order } from '../types';
import { supabase } from '../services/supabase';

interface ModeratorManagerProps {
  moderators: User[];
  leads: Lead[];
  orders: Order[];
  onAddModerator: (moderator: User & { password?: string, is_active?: boolean }) => void;
  onDeleteModerator: (modId: string) => void;
}

const ModeratorManager: React.FC<ModeratorManagerProps> = ({ moderators, leads, orders, onAddModerator, onDeleteModerator }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Helper for Bangladesh Standard Time (UTC+6)
  const getBSTToday = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 6)).toISOString().split('T')[0];
  };

  const todayBST = getBSTToday();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    const newModerator = {
      id: `m-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: UserRole.MODERATOR,
      password: password.trim(),
      is_active: true
    };

    onAddModerator(newModerator);
    setName('');
    setEmail('');
    setPassword('');
    setIsAdding(false);
  };

  const toggleStatus = async (modId: string, currentStatus: boolean = true) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('moderators')
      .update({ is_active: newStatus })
      .eq('id', modId);
    
    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      window.location.reload(); 
    }
  };

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 90000; 
  };

  const getModPerformance = (modId: string) => {
    const modOrders = orders.filter(o => o.moderatorId === modId);
    const modLeads = leads.filter(l => l.moderatorId === modId);
    
    const todayOrders = modOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const orderUtc = orderDate.getTime() + (orderDate.getTimezoneOffset() * 60000);
      const orderBst = new Date(orderUtc + (3600000 * 6)).toISOString().split('T')[0];
      return orderBst === todayBST;
    }).length;
    
    return {
      totalOrders: modOrders.length,
      todayOrders,
      conversionRate: modLeads.length > 0 ? Math.round((modOrders.length / modLeads.length) * 100) : 0
    };
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Team Intelligence</h2>
          <p className="text-slate-500 font-medium mt-1">Live analytics and portal credential management.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
            isAdding ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
          }`}
        >
          {isAdding ? 'Close Panel' : '+ Recruit Moderator'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-500">
          <div className="mb-8 border-l-4 border-blue-600 pl-4">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Provision New Credentials</h3>
            <p className="text-sm text-slate-400 font-bold">Accounts are created in "Active" state by default.</p>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Moderator Name" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@baburchi.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Portal Password</label>
              <input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Secure Code" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-slate-950 hover:bg-black text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95">Complete Enrollment</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Member</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Control</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Orders Today (BST)</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifetime Wins</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {moderators.map((mod: any) => {
                const perf = getModPerformance(mod.id);
                const online = isOnline(mod.lastSeen);
                const isActive = mod.is_active !== false; 

                return (
                  <tr key={mod.id} className={`transition-all group ${!isActive ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50/20'}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`h-14 w-14 rounded-[1.25rem] flex items-center justify-center text-lg font-black uppercase transition-all ${!isActive ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-500 shadow-sm'}`}>
                            {mod.name.charAt(0)}
                          </div>
                          {isActive && (
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                          )}
                        </div>
                        <div>
                          <p className={`font-black text-lg leading-none ${!isActive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{mod.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{mod.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => toggleStatus(mod.id, isActive)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all active:scale-95 ${
                          isActive 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{isActive ? 'Access: Active' : 'Access: Blocked'}</span>
                      </button>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`inline-flex flex-col items-center px-4 py-2 rounded-2xl border ${perf.todayOrders > 0 ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                        <span className={`text-xl font-black ${perf.todayOrders > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{perf.todayOrders}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Done Today</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-slate-900">{perf.totalOrders}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-600" style={{ width: `${perf.conversionRate}%` }}></div>
                          </div>
                          <span className="text-[8px] font-black text-slate-400">{perf.conversionRate}% Conv.</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${online && isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {online && isActive ? '🟢 Syncing Now' : '⚪ Offline'}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {mod.lastSeen ? new Date(mod.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never Active'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModeratorManager;
