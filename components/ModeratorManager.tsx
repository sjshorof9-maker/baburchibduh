
import React, { useState } from 'react';
import { User, UserRole, Lead } from '../types';

interface ModeratorManagerProps {
  moderators: User[];
  leads: Lead[];
  onAddModerator: (moderator: User & { password?: string }) => void;
  onDeleteModerator: (modId: string) => void;
}

const ModeratorManager: React.FC<ModeratorManagerProps> = ({ moderators, leads, onAddModerator, onDeleteModerator }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    const newModerator = {
      id: `m-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: UserRole.MODERATOR,
      password: password.trim()
    };

    onAddModerator(newModerator);
    setName('');
    setEmail('');
    setPassword('');
    setIsAdding(false);
  };

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 90000; // Online if active in last 90 seconds
  };

  const getModCallStats = (modId: string) => {
    const modLeads = leads.filter(l => l.moderatorId === modId);
    const completed = modLeads.filter(l => l.status === 'called').length;
    return {
      total: modLeads.length,
      completed,
      percentage: modLeads.length > 0 ? Math.round((completed / modLeads.length) * 100) : 0
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Team Intelligence</h2>
          <p className="text-sm text-slate-500 font-medium">Monitor real-time moderator activity and performance.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/10 active:scale-95"
        >
          {isAdding ? 'Cancel' : '+ New Moderator'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">Access Provisioning</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rahim Ahmed" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="rahim@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Password</label>
              <input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Set access password" />
            </div>
            <div className="md:col-span-3 flex justify-end pt-2">
              <button type="submit" className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95">Create Account</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Moderator & Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Call Progress</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {moderators.map((mod) => {
                const stats = getModCallStats(mod.id);
                const online = isOnline(mod.lastSeen);
                return (
                  <tr key={mod.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-sm font-black text-slate-500 uppercase">
                            {mod.name.charAt(0)}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        </div>
                        <div>
                          <p className="font-black text-slate-800 leading-none">{mod.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{mod.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2 min-w-[150px]">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Calls Handled</span>
                          <span className="text-slate-800">{stats.completed}/{stats.total}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${stats.percentage}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${online ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {online ? 'Active Now' : 'Last Active'}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {mod.lastSeen ? new Date(mod.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never logged in'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteModerator(mod.id)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {moderators.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-bold">
                    No moderators active in your team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModeratorManager;
