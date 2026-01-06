
import React from 'react';
import { Order, OrderStatus, User, UserRole, Product, Lead } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  orders: Order[];
  products: Product[];
  leads: Lead[];
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, products, leads, currentUser }) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  const myOrders = orders.filter(o => o.moderatorId === currentUser.id);
  const myLeads = leads.filter(l => l.moderatorId === currentUser.id);
  
  const displayOrders = isAdmin ? orders : myOrders;

  // Helper to calculate total amount for a specific status
  const getStatusValue = (status: OrderStatus) => {
    return orders
      .filter(o => o.status === status)
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };

  const getStatusCount = (status: OrderStatus) => {
    return orders.filter(o => o.status === status).length;
  };

  const totalOrdersCount = displayOrders.length;
  const confirmedOrdersCount = displayOrders.filter(o => o.status === OrderStatus.CONFIRMED).length;
  const deliveredOrdersCount = displayOrders.filter(o => o.status === OrderStatus.DELIVERED).length;
  const pendingOrdersCount = displayOrders.filter(o => o.status === OrderStatus.PENDING).length;
  const cancelledOrdersCount = displayOrders.filter(o => o.status === OrderStatus.CANCELLED).length;

  const totalSuccessCount = confirmedOrdersCount + deliveredOrdersCount;
  const confirmationRate = totalOrdersCount > 0 ? Math.round((totalSuccessCount / totalOrdersCount) * 100) : 0;

  // Financial Stats (Admin Only)
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const confirmedValue = getStatusValue(OrderStatus.CONFIRMED);
  const deliveredValue = getStatusValue(OrderStatus.DELIVERED);
  const cancelledValue = getStatusValue(OrderStatus.CANCELLED);

  // Status Breakdown for Chart
  const statusData = [
    { name: 'Pending', value: pendingOrdersCount, color: '#FBBF24' },
    { name: 'Confirmed', value: confirmedOrdersCount, color: '#3B82F6' },
    { name: 'Delivered', value: deliveredOrdersCount, color: '#10B981' },
    { name: 'Cancelled', value: cancelledOrdersCount, color: '#EF4444' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Admin Intelligence' : 'Moderator Portal'}
          </h2>
          <p className="text-sm text-slate-500 font-medium italic">Assalamu Alaikum, {currentUser.name}.</p>
        </div>
      </div>

      {/* Admin Dashboard Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">📦</div>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase tracking-widest">{orders.length} Orders</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
            <p className="text-2xl font-black text-slate-800">৳{totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-emerald-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">✅</div>
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase tracking-widest">{deliveredOrdersCount} Items</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivered Amount</p>
            <p className="text-2xl font-black text-emerald-600">৳{deliveredValue.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">🚚</div>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase tracking-widest">{confirmedOrdersCount} In-Transit</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed Value</p>
            <p className="text-2xl font-black text-indigo-600">৳{confirmedValue.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-rose-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">🚫</div>
              <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-lg uppercase tracking-widest">{cancelledOrdersCount} Failed</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelled Loss</p>
            <p className="text-2xl font-black text-rose-600">৳{cancelledValue.toLocaleString()}</p>
          </div>
        </div>
      ) : (
        /* Moderator Dashboard Grid */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group transition-all">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl mb-4">📦</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Total Orders</p>
            <p className="text-2xl font-black text-slate-800">{myOrders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group transition-all">
            <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-xl mb-4">📞</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads Assigned</p>
            <p className="text-2xl font-black text-slate-800">{myLeads.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group transition-all">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl mb-4">📈</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate</p>
            <p className="text-2xl font-black text-slate-800">{confirmationRate}%</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group transition-all">
            <div className="w-12 h-12 bg-yellow-500 text-white rounded-2xl flex items-center justify-center text-xl mb-4">⏳</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Verification</p>
            <p className="text-2xl font-black text-slate-800">{pendingOrdersCount}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Operational Overview</h3>
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc', radius: 15}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center">
          <div className="relative z-10">
             <div className="text-5xl mb-4">🚀</div>
             <h3 className="text-lg font-black tracking-tight mb-2">Workspace Insight</h3>
             <p className="text-sm text-slate-400 font-medium px-4 leading-relaxed">
               {isAdmin 
                ? "Your enterprise is currently tracking " + orders.length + " total customer interactions." 
                : "Focus on your today's call list to maintain a high success rate."}
             </p>
          </div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-600/10 blur-[80px] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
