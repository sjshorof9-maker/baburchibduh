
import React, { useMemo } from 'react';
import { Order, OrderStatus, User, UserRole, Product, Lead } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  orders: Order[];
  products: Product[];
  leads: Lead[];
  currentUser: User;
  moderators?: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders, products, leads, currentUser, moderators = [] }) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  // Bangladesh Time Helper (UTC+6)
  const getBSTDate = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 6));
  };

  const todayBST = getBSTDate().toISOString().split('T')[0];
  
  // Filter data
  const myOrders = orders.filter(o => o.moderatorId === currentUser.id);
  const myLeads = leads.filter(l => l.moderatorId === currentUser.id);
  const displayOrders = isAdmin ? orders : myOrders;

  // Global Performance Calculations (for Admin)
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const todayOrdersCount = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const orderUtc = orderDate.getTime() + (orderDate.getTimezoneOffset() * 60000);
    return new Date(orderUtc + (3600000 * 6)).toISOString().split('T')[0] === todayBST;
  }).length;

  // Personal Metrics (for Moderator)
  const myTodayOrders = myOrders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const orderUtc = orderDate.getTime() + (orderDate.getTimezoneOffset() * 60000);
    return new Date(orderUtc + (3600000 * 6)).toISOString().split('T')[0] === todayBST;
  });
  const myDeliveredOrders = myOrders.filter(o => o.status === OrderStatus.DELIVERED);
  const myCompletedCallsToday = myLeads.filter(l => l.assignedDate === todayBST && l.status === 'called').length;

  // Leaderboard Calculation (Available to both, used prominently in Mod view)
  const leaderboard = useMemo(() => {
    return moderators
      .map(mod => {
        const modOrders = orders.filter(o => o.moderatorId === mod.id);
        const modDelivered = modOrders.filter(o => o.status === OrderStatus.DELIVERED).length;
        return {
          id: mod.id,
          name: mod.name,
          orderCount: modOrders.length,
          delivered: modDelivered,
          isMe: mod.id === currentUser.id
        };
      })
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [orders, moderators, currentUser.id]);

  // STATUS COLORS FOR PIE
  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
  const statusData = useMemo(() => {
    const counts = { [OrderStatus.PENDING]: 0, [OrderStatus.CONFIRMED]: 0, [OrderStatus.DELIVERED]: 0, [OrderStatus.CANCELLED]: 0 };
    displayOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [displayOrders]);

  // --- ADMIN HOME DASHBOARD (RESTORED COMMAND CENTER) ---
  if (isAdmin) {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Executive Dashboard</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Operational Monitoring Center</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full translate-x-1/2 -translate-y-1/2"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Global Revenue</p>
             <p className="text-3xl font-black text-slate-900 mt-2 relative z-10">৳{totalRevenue.toLocaleString()}</p>
             <p className="text-[10px] font-bold text-orange-600 mt-2 uppercase">Total Sales Generated</p>
           </div>
           
           <div className="bg-slate-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-600/10 blur-3xl rounded-full"></div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Today's Activity</p>
             <p className="text-3xl font-black mt-2">{todayOrdersCount} Orders</p>
             <p className="text-[10px] font-bold text-orange-400 mt-2 uppercase tracking-widest">In Last 24 Hours</p>
           </div>

           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Size</p>
             <p className="text-3xl font-black text-slate-900 mt-2">{moderators.filter(m => m.is_active !== false).length}</p>
             <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Active Moderators</p>
           </div>

           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Health</p>
             <p className="text-3xl font-black text-emerald-500 mt-2">ACTIVE</p>
             <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Logistics Link: Secure</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6">Status Breakdown</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6">Recent Team Activity</h3>
            <div className="space-y-4">
               {orders.slice(0, 5).map((o, i) => (
                 <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-black text-slate-800 text-sm">{o.customerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{o.id}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${o.status === 'delivered' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>{o.status}</span>
                 </div>
               ))}
               {orders.length === 0 && <p className="text-center py-10 text-slate-400 italic">No activity logs yet.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MODERATOR HOME DASHBOARD (ADVANCED PERFORMANCE HUB) ---
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">আপনার রিপোর্ট, {currentUser.name.split(' ')[0]}</h2>
          <div className="flex items-center gap-2 mt-2">
             <div className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Personal Achievement Center</p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl flex items-center gap-3">
          <span className="text-xl">📅</span>
          <div>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Shift Date</p>
            <p className="text-xs font-black text-indigo-900">{new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আজকের কাজ (Today)</p>
          <p className="text-4xl font-black text-slate-900 mt-3">{myTodayOrders.length}</p>
          <p className="text-[10px] font-bold text-indigo-600 mt-2 uppercase">অর্ডার সম্পন্ন হয়েছে</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট অর্ডার (Lifetime)</p>
          <p className="text-4xl font-black text-slate-900 mt-3">{myOrders.length}</p>
          <div className="mt-4 flex items-center gap-2">
             <span className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(myDeliveredOrders.length / (myOrders.length || 1)) * 100}%` }}></div>
             </span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ডেলিভারি সাকসেস</p>
          <p className="text-4xl font-black text-emerald-600 mt-3">{myDeliveredOrders.length}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">সফলভাবে পৌঁছেছে</p>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">আপনার বর্তমান র‍্যাঙ্ক</p>
          <p className="text-4xl font-black mt-3">#{leaderboard.findIndex(l => l.isMe) + 1}</p>
          <p className="text-[10px] font-bold text-white/70 mt-2 uppercase">লিডারবোর্ডে অবস্থান</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEADERBOARD VIEW */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                 <h3 className="text-lg font-black text-slate-800">মডারেটর লিডারবোর্ড (Leaderboard)</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">টিমের সেরা পারফরমারদের তালিকা</p>
              </div>
              <span className="text-2xl">🏆</span>
           </div>
           <div className="p-8 flex-1">
              <div className="space-y-4">
                 {leaderboard.slice(0, 5).map((entry, idx) => (
                   <div key={entry.id} className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${entry.isMe ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-600' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-white text-slate-400'}`}>
                            {idx + 1}
                         </div>
                         <div>
                            <p className="font-black text-slate-800 text-base flex items-center gap-2">
                               {entry.name}
                               {entry.isMe && <span className="bg-indigo-600 text-white text-[8px] px-2 py-0.5 rounded-full">আপনি</span>}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">সফল ডেলিভারি: {entry.delivered}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-2xl font-black text-slate-900 leading-none">{entry.orderCount}</p>
                         <p className="text-[8px] font-black text-slate-400 uppercase mt-1">মোট অর্ডার</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* CALL PROGRESS FOR MODERATOR */}
        <div className="flex flex-col gap-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">আজকের কল প্রগ্রেস</h3>
              <div className="flex flex-col items-center justify-center py-6">
                 <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                       <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={440} 
                        strokeDashoffset={440 - (440 * (myCompletedCallsToday / (myLeads.filter(l => l.assignedDate === todayBST).length || 1)))} 
                        strokeLinecap="round" className="text-indigo-600 transition-all duration-1000" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                       <span className="text-3xl font-black text-slate-900">{myCompletedCallsToday}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase">Calls Done</span>
                    </div>
                 </div>
                 <div className="mt-8 grid grid-cols-2 gap-4 w-full text-center">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                       <p className="text-[8px] font-black text-slate-400 uppercase">Target</p>
                       <p className="text-lg font-black text-slate-800">{myLeads.filter(l => l.assignedDate === todayBST).length}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl">
                       <p className="text-[8px] font-black text-slate-400 uppercase">Remaining</p>
                       <p className="text-lg font-black text-rose-500">{myLeads.filter(l => l.assignedDate === todayBST && l.status === 'new').length}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* RECENT ORDERS LIST */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">আপনার সাম্প্রতিক অর্ডারসমূহ</h3>
         <div className="space-y-4">
            {myOrders.slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-50 transition-colors">📦</div>
                    <div>
                       <p className="font-black text-slate-800 text-sm">{o.customerName}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{o.customerPhone}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">৳{o.totalAmount.toLocaleString()}</p>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                       o.status === OrderStatus.DELIVERED ? 'bg-emerald-50 text-emerald-500' : 
                       o.status === OrderStatus.CANCELLED ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'
                    }`}>
                       {o.status}
                    </span>
                 </div>
              </div>
            ))}
            {myOrders.length === 0 && <p className="text-center py-10 text-slate-400 italic">No orders recorded yet.</p>}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
