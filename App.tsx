
import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, CourierConfig, Product, Lead, UserRole } from './types';
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

  useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.MODERATOR) return;

    const updatePresence = async () => {
      await supabase
        .from('moderators')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentUser.id);
    };

    updatePresence(); 
    const interval = setInterval(updatePresence, 60000); 
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedUser = localStorage.getItem(SESSION_KEY);
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        const [
          { data: dbProducts },
          { data: dbModerators },
          { data: dbOrders },
          { data: dbLeads },
          { data: dbSettings }
        ] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('moderators').select('*'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('leads').select('*').order('created_at', { ascending: false }),
          supabase.from('settings').select('*').maybeSingle()
        ]);

        if (dbProducts && dbProducts.length > 0) setProducts(dbProducts);
        else setProducts(INITIAL_PRODUCTS);

        const mappedOrders = (dbOrders || []).map((o: any) => ({
          id: String(o.id),
          moderatorId: String(o.moderator_id),
          customerName: String(o.customer_name || ''),
          customerPhone: String(o.customer_phone || ''),
          customerAddress: String(o.customer_address || ''),
          items: Array.isArray(o.items) ? o.items : [],
          totalAmount: Number(o.total_amount || 0),
          status: o.status as OrderStatus,
          createdAt: String(o.created_at),
          notes: String(o.notes || ''),
          steadfastId: o.steadfast_id ? String(o.steadfast_id) : undefined,
          courierStatus: o.courier_status ? String(o.courier_status) : undefined
        }));

        const mappedLeads = (dbLeads || []).map((l: any) => ({
          id: String(l.id),
          phoneNumber: String(l.phone_number || ''),
          customerName: String(l.customer_name || ''),
          address: String(l.address || ''),
          moderatorId: String(l.moderator_id || ''),
          status: l.status,
          assignedDate: String(l.assigned_date || ''),
          createdAt: String(l.created_at)
        }));

        if (dbModerators) setModerators(dbModerators.map(m => ({
          id: String(m.id),
          name: String(m.name),
          email: String(m.email),
          role: m.role as UserRole,
          lastSeen: m.last_seen,
          is_active: m.is_active !== false 
        })));

        setOrders(mappedOrders);
        setLeads(mappedLeads);
        
        if (dbSettings) {
          setCourierConfig(dbSettings.courier_config || courierConfig);
          setLogoUrl(dbSettings.logo_url);
        }
      } catch (error) {
        console.error("Init Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setActiveTab('dashboard');
  };

  const handleCreateOrder = async (newOrder: Order) => {
    try {
      const dbPayload = {
        id: newOrder.id,
        moderator_id: newOrder.moderatorId,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_address: newOrder.customerAddress,
        items: newOrder.items,
        total_amount: newOrder.totalAmount,
        status: newOrder.status,
        created_at: newOrder.createdAt,
        notes: newOrder.notes || ''
      };

      const { error: orderError } = await supabase.from('orders').insert([dbPayload]);
      if (orderError) throw new Error(orderError.message);

      setOrders(prev => [newOrder, ...prev]);
      setActiveTab('orders'); 
      alert(`🎉 Order ${newOrder.id} successfully created!`);
    } catch (err: any) {
      console.error("handleCreateOrder Error:", err);
      throw err;
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

  const handleAddModerator = async (newMod: User & { password?: string, is_active?: boolean }) => {
    const { error } = await supabase.from('moderators').insert([newMod]);
    if (!error) setModerators(prev => [...prev, newMod]);
    else alert("Error: " + error.message);
  };

  const handleDeleteModerator = async (modId: string) => {
    if (confirm('Delete this moderator?')) {
      const { error } = await supabase.from('moderators').delete().eq('id', modId);
      if (!error) setModerators(prev => prev.filter(m => m.id !== modId));
    }
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
      moderator_id: l.moderatorId,
      status: l.status,
      assigned_date: l.assignedDate,
      created_at: l.createdAt
    }));
    const { error } = await supabase.from('leads').insert(dbLeads);
    if (error) throw error;
    setLeads(prev => [...prev, ...newLeads]);
  };

  const handleBulkUpdateLeads = async (indices: number[], modId: string, date: string) => {
    const newList = [...leads];
    const updates = [];
    indices.forEach(idx => {
      if (newList[idx]) {
        const lead = newList[idx];
        newList[idx] = { ...lead, moderatorId: modId, assignedDate: date, status: 'new' };
        updates.push(supabase.from('leads').update({ moderator_id: modId, assigned_date: date, status: 'new' }).eq('id', lead.id));
      }
    });
    await Promise.all(updates);
    setLeads(newList);
  };

  const handleUpdateLeadStatus = async (leadId: string, status: 'new' | 'called') => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
    if (!error) setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
  };

  const handleDeleteLead = async (leadId: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (!error) setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-orange-500 font-black uppercase tracking-widest text-sm">Loading Workspace...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} moderators={moderators} logoUrl={logoUrl} />;
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} logoUrl={logoUrl}>
      <div className="animate-in fade-in duration-500">
        {activeTab === 'dashboard' && <Dashboard orders={orders} products={products} leads={leads} currentUser={currentUser} moderators={moderators} />}
        {activeTab === 'create' && <OrderForm products={products} currentUser={currentUser} onOrderCreate={handleCreateOrder} leads={leads} />}
        {activeTab === 'orders' && <OrderList orders={orders} currentUser={currentUser} products={products} moderators={moderators} courierConfig={courierConfig} onUpdateStatus={handleUpdateStatus} logoUrl={logoUrl} />}
        {activeTab === 'leads' && currentUser.role === UserRole.ADMIN && <LeadManager moderators={moderators} leads={leads} onAssignLeads={handleAssignLeads} onBulkUpdateLeads={handleBulkUpdateLeads} onDeleteLead={handleDeleteLead} />}
        {activeTab === 'myleads' && currentUser.role === UserRole.MODERATOR && <ModeratorLeads leads={leads.filter(l => l.moderatorId === currentUser.id)} onUpdateStatus={handleUpdateLeadStatus} />}
        {activeTab === 'moderators' && currentUser.role === UserRole.ADMIN && <ModeratorManager moderators={moderators} leads={leads} orders={orders} onAddModerator={handleAddModerator} onDeleteModerator={handleDeleteModerator} />}
        {activeTab === 'products' && currentUser.role === UserRole.ADMIN && <ProductManager products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
        {activeTab === 'settings' && currentUser.role === UserRole.ADMIN && <Settings config={courierConfig} onSave={handleUpdateConfig} logoUrl={logoUrl} onUpdateLogo={handleUpdateLogo} />}
      </div>
    </Layout>
  );
};

export default App;
