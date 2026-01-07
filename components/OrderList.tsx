
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, User, Product, CourierConfig, UserRole } from '../types';
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

  // Export States
  const [exportStart, setExportStart] = useState(new Date().toISOString().split('T')[0]);
  const [exportEnd, setExportEnd] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  const filteredOrders = useMemo(() => {
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

  const handleManualSync = async (order: Order) => {
    if (!isAdmin || order.steadfastId) return;
    
    setSyncingId(order.id);
    try {
      const res = await syncOrderWithCourier(order, courierConfig);
      onUpdateStatus(order.id, OrderStatus.CONFIRMED, { id: res.consignmentId, status: res.status });
    } catch (err: any) {
      alert("Courier Sync Failed: " + err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (!isAdmin) return;
    onUpdateStatus(orderId, newStatus);
  };

  const downloadCSV = () => {
    setIsExporting(true);
    
    // Filter orders by selected date range
    const start = new Date(exportStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(exportEnd);
    end.setHours(23, 59, 59, 999);

    const exportData = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    if (exportData.length === 0) {
      alert("No orders found for the selected date range.");
      setIsExporting(false);
      return;
    }

    // CSV Headers
    const headers = ["Order ID", "Date", "Customer Name", "Phone", "Address", "Items Ordered", "Total Amount", "Status", "Steadfast ID", "Moderator"];
    
    // Map data to rows - Using double quotes for cells containing commas or special characters
    const rows = exportData.map(o => {
      const modName = moderators.find(m => m.id === o.moderatorId)?.name || 'Unknown';
      const itemSummary = o.items.map(it => {
        const p = products.find(prod => prod.id === it.productId);
        // Removing emojis or commas from product names for clean CSV
        const cleanName = (p?.name || 'Item').replace(/,/g, '');
        return `${cleanName} [${p?.sku || 'N/A'}] (x${it.quantity})`;
      }).join(' | ');

      return [
        o.id,
        new Date(o.createdAt).toLocaleDateString('en-GB'),
        `"${o.customerName.replace(/"/g, '""')}"`,
        `'${o.customerPhone}`, // Prefix with apostrophe for Excel string treatment
        `"${o.customerAddress.replace(/"/g, '""')}"`,
        `"${itemSummary}"`,
        o.totalAmount,
        o.status.toUpperCase(),
        o.steadfastId || 'NOT_SYNCED',
        `"${modName}"`
      ];
    });

    // CRITICAL: Add UTF-8 Byte Order Mark (BOM) so Excel detects Bengali/Unicode correctly
    const BOM = "\uFEFF";
    const csvContent = BOM + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Orders_${exportStart}_to_${exportEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsExporting(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Header & Standard Filters */}
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

      {/* Admin Export Control Panel */}
      {isAdmin && (
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">📁</div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Advanced CSV Export</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Unicode (Bengali) support enabled for Excel/Sheets.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-full sm:w-auto">
                   <div className="px-3 py-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Start Date</p>
                      <input type="date" value={exportStart} onChange={(e) => setExportStart(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
                   </div>
                   <div className="w-px h-8 bg-white/10"></div>
                   <div className="px-3 py-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase">End Date</p>
                      <input type="date" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
                   </div>
                </div>
                
                <button 
                  onClick={downloadCSV}
                  disabled={isExporting}
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>📥 Download Order Sheet</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-orange-200 transition-all">
            <div className="flex flex-col md:flex-row items-center gap-6 w-full">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ORD</span>
                <span className="text-sm font-black text-slate-800">{order.id.split('-')[1] || order.id.slice(-4)}</span>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <p className="text-lg font-black text-slate-900 leading-none">{order.customerName}</p>
                  <p className="text-sm font-bold text-slate-400">{order.customerPhone}</p>
                </div>
                
                <p className="text-xs font-medium text-slate-500 mt-2 flex items-center justify-center md:justify-start gap-1">
                  <span className="text-slate-400 shrink-0">📍</span>
                  {order.customerAddress}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                  {order.items.map((it, idx) => (
                    <span key={idx} className="bg-orange-50 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-md border border-orange-100 uppercase">
                      {products.find(p => p.id === it.productId)?.sku || 'ITEM'} x{it.quantity}
                    </span>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="text-center md:text-right md:px-10 border-x border-slate-50 hidden lg:block">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Steadfast ID</p>
                   {order.steadfastId ? (
                     <div className="flex items-center justify-end gap-1.5">
                       <span className="text-emerald-500">✓</span>
                       <p className="text-xs font-mono font-bold text-slate-700">{order.steadfastId}</p>
                     </div>
                   ) : (
                     <button 
                       onClick={() => handleManualSync(order)}
                       disabled={syncingId === order.id}
                       className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors group/sync"
                     >
                       <span className={`text-base transition-transform group-hover/sync:rotate-180 duration-500 ${syncingId === order.id ? 'animate-spin' : ''}`}>🔄</span>
                       {syncingId === order.id ? 'Syncing...' : 'Sync Now'}
                     </button>
                   )}
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
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
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
