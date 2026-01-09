
import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, CourierConfig, Product, Lead, UserRole, LeadStatus, Message } from './types';
import { INITIAL_PRODUCTS, ADMIN_USER } from './constants';
import { supabase } from './services/supabase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import Login from './components/Login';
import ModeratorManager from './components/ModeratorManager';
import Settings from './components/Settings';
import ProductManager from './components/ProductManager';
import LeadManager from './components/LeadManager';
import ModeratorLeads from './components/ModeratorLeads';
import CustomerManager from './components/CustomerManager';
import Messenger from './components/Messenger';

const SESSION_KEY = 'baburchi_user_session';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [moderators, setModerators] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courierConfig, setCourierConfig] = useState<CourierConfig>({
    apiKey: '',
    secretKey: '',
    baseUrl: 'https://portal.steadfast.com.bd/api/v1',
    webhookUrl: '',
    accountEmail: '',
    accountPassword: ''
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{sender: string, text: string} | null>(null);

  // Global Message Listener for Notifications
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('global_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, async (payload) => {
        const msg = payload.new as Message;
        
        // Only notify if the message is for the current user and we are NOT in the messages tab
        if (msg.receiver_id === currentUser.id && activeTab !== 'messages') {
          // Fetch sender name
          let senderName = "Someone";
          if (msg.sender_id === ADMIN_USER.id) {
            senderName = "Admin";
          } else {
            const { data } = await supabase.from('moderators').select('name').eq('id', msg.sender_id).single();
            if (data) senderName = data.name;
          }

          setNotification({
            sender: senderName,
            text: msg.content.length > 40 ? msg.content.substring(0, 40) + '...' : msg.content
          });

          // Play a subtle notification sound (optional, browser permitting)
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.volume = 0.3;
            audio.play();
          } catch (e) {}

          // Auto-hide notification
          setTimeout(() => setNotification(null), 5000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, activeTab]);

  // Redirect Moderator away from dashboard if they land on it
  useEffect(() => {
    if (currentUser && currentUser.role === UserRole.MODERATOR && activeTab === 'dashboard') {
      setActiveTab('myleads');
    }
  }, [currentUser, activeTab]);

  const fetchModerators = async () => {
    try {
      const { data, error } = await supabase.from('moderators').select('*');
      if (error) throw error;
      if (data) {
        setModerators(data.map(m => ({
          id: String(m.id),
          name: String(m.name),
          email: String(m.email),
          role: m.role as UserRole,
          lastSeen: m.last_seen,
          is_active: m.is_active !== false 
        })));
      }
    } catch (err) {
      console.error("Fetch Moderators Error:", err);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedUser = localStorage.getItem(SESSION_KEY);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setCurrentUser({ ...parsed, id: String(parsed.id) });
        }

        const [
          { data: dbProducts },
          { data: dbOrders, error: ordersError },
          { data: dbLeads, error: leadsError },
          { data: dbSettings }
        ] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('leads').select('*').order('created_at', { ascending: false }),
          supabase.from('settings').select('*').maybeSingle()
        ]);

        if (ordersError) console.error("Database Fetch Error (Orders):", ordersError);
        if (leadsError) console.error("Database Fetch Error (Leads):", leadsError);

        await fetchModerators();

        if (dbProducts && dbProducts.length > 0) setProducts(dbProducts);
        else setProducts(INITIAL_PRODUCTS);

        if (dbOrders) {
          const mappedOrders = dbOrders.map((o: any) => ({
            id: String(o.id),
            moderatorId: String(o.moderator_id),
            customerName: String(o.customer_name || ''),
            customerPhone: String(o.customer_phone || ''),
            customerAddress: String(o.customer_address || ''),
            deliveryRegion: o.delivery_region || 'inside',
            deliveryCharge: Number(o.delivery_charge || 0),
            items: Array.isArray(o.items) ? o.items : [],
            totalAmount: Number(o.total_amount || 0),
            advanceAmount: Number(o.advance_amount || 0),
            grandTotal: Number(o.grand_total || o.total_amount || 0),
            status: o.status as OrderStatus,
            createdAt: String(o.created_at),
            steadfastId: o.steadfast_id ? String(o.steadfast_id) : undefined,
            courierStatus: o.courier_status || undefined,
            notes: o.notes || undefined
          }));
          setOrders(mappedOrders);
        }

        if (dbLeads) {
          const mappedLeads = dbLeads.map((l: any) => ({
            id: String(l.id),
            phoneNumber: String(l.phone_number || ''),
            customerName: String(l.customer_name || ''),
            address: String(l.address || ''),
            moderatorId: String(l.moderator_id || ''),
            status: (l.status as LeadStatus) || 'pending',
            assignedDate: String(l.assigned_date || ''),
            createdAt: String(l.created_at)
          }));
          setLeads(mappedLeads);
        }
        
        if (dbSettings) {
          setCourierConfig(dbSettings.courier_config || courierConfig);
          setLogoUrl(dbSettings.logo_url);
        }
      } catch (error) {
        console.error("Initialization Critical Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  const handleCreateOrder = async (newOrder: Order) => {
    try {
      // 1. Prepare Database Payload
      const dbPayload = {
        id: newOrder.id,
        moderator_id: String(newOrder.moderatorId),
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_address: newOrder.customerAddress,
        delivery_region: newOrder.deliveryRegion,
        delivery_charge: newOrder.deliveryCharge,
        items: newOrder.items,
        total_amount: newOrder.totalAmount,
        advance_amount: newOrder.advanceAmount,
        grand_total: newOrder.grandTotal,
        status: newOrder.status,
        created_at: newOrder.createdAt,
        notes: newOrder.notes || ''
      };

      // 2. Optimistic local update
      const formattedOrder: Order = {
        ...newOrder,
        moderatorId: String(newOrder.moderatorId)
      };
      setOrders(prev => [formattedOrder, ...prev]);
      setActiveTab('orders'); 

      // 3. Update Inventory (locally and remote)
      const updatedProducts = [...products];
      for (const item of newOrder.items) {
        const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
        if (prodIdx !== -1) {
          updatedProducts[prodIdx].stock -= item.quantity;
          await supabase.from('products').update({ stock: updatedProducts[prodIdx].stock }).eq('id', item.productId);
        }
      }
      setProducts(updatedProducts);

      // 4. Remote database insert
      const { error } = await supabase.from('orders').insert([dbPayload]);
      if (error) {
        console.error("Supabase Order Insert Error:", error);
        throw new Error(error.message);
      }
    } catch (err: any) {
      alert("⚠️ Database Sync Failed: " + err.message);
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) {
        setOrders(data.map((o: any) => ({
          ...o,
          id: String(o.id),
          moderatorId: String(o.moderator_id),
          totalAmount: Number(o.total_amount),
          grandTotal: Number(o.grand_total),
          deliveryCharge: Number(o.delivery_charge),
          advanceAmount: Number(o.advance_amount || 0)
        })));
      }
    }
  };

  const handleAddModerator = async (newMod: User & { password?: string }) => {
    try {
      const generatedId = Math.floor(100000 + Math.random() * 899999);
      const { data, error } = await supabase
        .from('moderators')
        .insert([{
          id: generatedId,
          name: newMod.name,
          email: newMod.email,
          role: newMod.role,
          password: newMod.password,
          is_active: true
        }])
        .select();

      if (error) throw new Error(error.message);

      if (data && data.length > 0) {
        const added = data[0];
        const formattedMod: User = {
          id: String(added.id),
          name: added.name,
          email: added.email,
          role: added.role as UserRole,
          is_active: added.is_active !== false
        };
        setModerators(prev => [...prev, formattedMod]);
        return true;
      }
    } catch (err: any) {
      alert("Recruitment Error: " + (err.message || "Could not save moderator."));
      return false;
    }
  };

  const handleDeleteModerator = async (modId: string) => {
    const idToDelete = String(modId);
    const hasOrders = orders.some(o => String(o.moderatorId) === idToDelete);
    const hasLeads = leads.some(l => String(l.moderatorId) === idToDelete);
    if (hasOrders || hasLeads) {
      alert("⚠️ মডারেটর ডিলিট করা সম্ভব নয়!\nএই মডারেটরের নামে ডাটাবেসে অর্ডার অথবা লিড রেকর্ড রয়েছে।");
      return;
    }
    const backupModerators = [...moderators];
    setModerators(prev => prev.filter(m => String(m.id) !== idToDelete));
    try {
      const { error } = await supabase.from('moderators').delete().eq('id', idToDelete);
      if (error) {
        setModerators(backupModerators);
        alert(`❌ Delete Failed: ${error.message}`);
      }
    } catch (err: any) {
      setModerators(backupModerators);
      alert("❌ Network Error: Could not reach server.");
    }
  };

  const handleToggleModeratorStatus = async (modId: string, newActiveState: boolean) => {
    const idStr = String(modId);
    const { error } = await supabase.from('moderators').update({ is_active: newActiveState }).eq('id', idStr);
    if (!error) {
      setModerators(prev => prev.map(m => String(m.id) === idStr ? { ...m, is_active: newActiveState } : m));
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, courierData?: { id: string, status: string }) => {
    const updateObj = { 
      status: newStatus,
      ...(courierData ? { steadfast_id: courierData.id, courier_status: courierData.status } : {})
    };
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...(courierData ? { steadfastId: courierData.id, courierStatus: courierData.status } : {}) } : o));
    await supabase.from('orders').update(updateObj).eq('id', orderId);
  };

  const handleBulkStatusUpdate = async (orderIds: string[], newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).in('id', orderIds);
  };

  const handleUpdateConfig = async (newConfig: CourierConfig) => {
    setCourierConfig(newConfig);
    await supabase.from('settings').upsert({ id: 1, courier_config: newConfig });
  };

  const handleUpdateLogo = async (url: string | null) => {
    setLogoUrl(url);
    await supabase.from('settings').upsert({ id: 1, logo_url: url });
  };

  const handleAddProduct = async (newProduct: Product) => {
    const { error } = await supabase.from('products').insert([newProduct]);
    if (!error) setProducts(prev => [...prev, newProduct]);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const { error } = await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id);
    if (!error) setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleAssignLeads = async (newLeads: Lead[]) => {
    const dbLeads = newLeads.map(l => ({
      id: l.id,
      phone_number: l.phoneNumber,
      customer_name: l.customerName || '',
      address: l.address || '',
      moderator_id: String(l.moderatorId),
      status: l.status,
      assigned_date: l.assignedDate,
      created_at: l.createdAt
    }));
    const { error } = await supabase.from('leads').insert(dbLeads);
    if (error) throw error;
    setLeads(prev => [...prev, ...newLeads]);
  };

  const handleBulkUpdateLeads = async (leadIds: string[], modId: string, date: string) => {
    if (leadIds.length === 0) return;
    setLeads(prev => prev.map(l => leadIds.includes(l.id) ? { ...l, moderatorId: String(modId), assignedDate: date, status: 'pending' as LeadStatus } : l));
    try {
      const { error } = await supabase
        .from('leads')
        .update({ moderator_id: String(modId), assigned_date: date, status: 'pending' })
        .in('id', leadIds);
      if (error) throw error;
    } catch (err: any) {
      console.error("Bulk Assignment Error:", err);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
    if (!error) setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
  };

  const handleDeleteLead = async (leadId: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (!error) setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  const handleLogin = (user: User) => {
    const sanitizedUser = { ...user, id: String(user.id) };
    setCurrentUser(sanitizedUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sanitizedUser));
    
    if (sanitizedUser.role === UserRole.MODERATOR) {
      setActiveTab('myleads');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setActiveTab('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} moderators={moderators} logoUrl={logoUrl} />;
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} logoUrl={logoUrl}>
      {notification && (
        <div 
          onClick={() => { setActiveTab('messages'); setNotification(null); }}
          className="fixed top-6 right-6 z-[999] bg-slate-900 border border-white/10 text-white p-6 rounded-[2rem] shadow-2xl cursor-pointer animate-in slide-in-from-right-10 duration-500 flex items-center gap-5 hover:bg-slate-800"
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">💬</div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">New Transmission</p>
            <h4 className="font-black text-sm">{notification.sender}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{notification.text}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setNotification(null); }} className="ml-4 text-slate-500 hover:text-white">✕</button>
        </div>
      )}

      <div className="animate-in fade-in duration-500">
        {activeTab === 'dashboard' && currentUser.role === UserRole.ADMIN && <Dashboard orders={orders} products={products} leads={leads} currentUser={currentUser} moderators={moderators} />}
        {activeTab === 'create' && <OrderForm products={products} currentUser={currentUser} onOrderCreate={handleCreateOrder} leads={leads} allOrders={orders} />}
        {activeTab === 'orders' && <OrderList orders={orders} currentUser={currentUser} products={products} moderators={moderators} courierConfig={courierConfig} onUpdateStatus={handleUpdateStatus} onBulkUpdateStatus={handleBulkStatusUpdate} logoUrl={logoUrl} />}
        {activeTab === 'leads' && currentUser.role === UserRole.ADMIN && <LeadManager moderators={moderators} leads={leads} orders={orders} onAssignLeads={handleAssignLeads} onBulkUpdateLeads={handleBulkUpdateLeads} onDeleteLead={handleDeleteLead} />}
        {activeTab === 'customers' && currentUser.role === UserRole.ADMIN && <CustomerManager orders={orders} leads={leads} />}
        {activeTab === 'messages' && <Messenger currentUser={currentUser} moderators={moderators} />}
        {activeTab === 'myleads' && currentUser.role === UserRole.MODERATOR && <ModeratorLeads leads={leads.filter(l => String(l.moderatorId) === String(currentUser.id))} onUpdateStatus={handleUpdateLeadStatus} />}
        {activeTab === 'moderators' && currentUser.role === UserRole.ADMIN && <ModeratorManager moderators={moderators} leads={leads} orders={orders} onAddModerator={handleAddModerator} onDeleteModerator={handleDeleteModerator} onToggleStatus={handleToggleModeratorStatus} />}
        {activeTab === 'products' && currentUser.role === UserRole.ADMIN && <ProductManager products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
        {activeTab === 'settings' && currentUser.role === UserRole.ADMIN && <Settings config={courierConfig} onSave={handleUpdateConfig} logoUrl={logoUrl} onUpdateLogo={handleUpdateLogo} />}
      </div>
    </Layout>
  );
};

export default App;
