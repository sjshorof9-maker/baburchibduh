
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, User, UserRole, Product, CourierConfig } from '../types';
import { STATUS_COLORS } from '../constants';
import { syncOrderWithCourier } from '../services/courierService';

interface OrderListProps {
  orders: Order[];
  currentUser: User;
  products: Product[];
  moderators: User[];
  courierConfig: CourierConfig;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, courierData?: { id: string, status: string }) => void;
  logoUrl?: string | null;
}

const OrderList: React.FC<OrderListProps> = ({ orders, currentUser, products, moderators, courierConfig, onUpdateStatus, logoUrl }) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    // Moderators only see their own orders, Admins see everything
    let list = isAdmin ? [...orders] : orders.filter(o => o.moderatorId === currentUser.id);
    
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(o => o.customerPhone.includes(s) || o.customerName.toLowerCase().includes(s) || o.id.toLowerCase().includes(s));
    }
    
    if (statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, isAdmin, currentUser.id, searchTerm, statusFilter]);

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    // Strict block: Only Admins can trigger status updates or courier syncs
    if (!isAdmin) return;
    
    if (newStatus === OrderStatus.CONFIRMED && !order.steadfastId) {
       if (confirm('Create consignment in Steadfast automatically?')) {
         setSyncingId(order.id);
         try {
           const res = await syncOrderWithCourier(order, courierConfig);
           onUpdateStatus(order.id, newStatus, { id: res.consignmentId, status: res.status });
         } catch (err: any) {
           alert(err.message);
         } finally {
           setSyncingId(null);
         }
         return;
       }
    }
    onUpdateStatus(order.id, newStatus);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Order Management' : 'Order Log'}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            {isAdmin ? `Total ${filteredOrders.length} operations tracked.` : `You have ${filteredOrders.length} recorded orders.`}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search phone or name..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm shadow-sm w-full md:w-64 transition-all" 
          />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm shadow-sm transition-all"
          >
            <option value="all">All Status</option>
            {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-orange-200 transition-all">
            <div className="flex flex-col md:flex-row items-center gap-6 w-full">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ORD</span>
                <span className="text-sm font-black text-slate-800">{order.id.split('-')[1] || order.id.slice(-4)}</span>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <p className="text-lg font-black text-slate-900 leading-none">{order.customerName}</p>
                <p className="text-sm font-bold text-slate-500 mt-1">{order.customerPhone}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                  {order.items.map((it, idx) => (
                    <span key={idx} className="bg-orange-50 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-md border border-orange-100 uppercase">
                      {products.find(p => p.id === it.productId)?.sku || 'ITEM'} x{it.quantity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Courier column: Completely hidden from moderators */}
              {isAdmin && (
                <div className="text-center md:text-right md:px-10 border-x border-slate-50 hidden lg:block">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Steadfast ID</p>
                   <p className="text-xs font-mono font-bold text-blue-600">{order.steadfastId || 'NOT SYNCED'}</p>
                </div>
              )}

              <div className="flex flex-col items-center md:items-end min-w-[120px]">
                <p className="text-xl font-black text-slate-900">৳{order.totalAmount.toLocaleString()}</p>
                <span className={`mt-2 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {isAdmin ? (
                /* Admin view: Interactive status change */
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                  disabled={syncingId === order.id}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                /* Moderator view: Read-only badge */
                <div className="bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                  Locked
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
             <div className="text-4xl mb-4 opacity-20">📂</div>
             <p className="font-bold text-slate-400 italic">No orders match your current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
