
import React, { useState, useEffect } from 'react';
import { Product, Order, OrderStatus, User, OrderItem, Lead } from '../types';

interface OrderFormProps {
  products: Product[];
  currentUser: User;
  onOrderCreate: (order: Order) => Promise<void>;
  leads?: Lead[]; // Added leads for auto-fill lookup
}

const OrderForm: React.FC<OrderFormProps> = ({ products, currentUser, onOrderCreate, leads = [] }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<{productId: string, quantity: number}[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill lookup effect
  useEffect(() => {
    if (customerPhone.length >= 11) {
      const match = leads.find(l => l.phoneNumber.includes(customerPhone.trim()));
      if (match && (match.customerName || match.address)) {
        if (match.customerName && !customerName) setCustomerName(match.customerName);
        if (match.address && !customerAddress) setCustomerAddress(match.address);
        setAutoFilled(true);
        // Clear indicator after 3 seconds
        setTimeout(() => setAutoFilled(false), 3000);
      }
    }
  }, [customerPhone, leads]);

  const addItem = () => {
    if (products.length === 0) return;
    const firstProduct = products[0];
    setSelectedItems(prev => [...prev, { productId: firstProduct.id, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    const stockLimit = product?.stock ?? 9999;
    
    let finalQty = quantity;
    if (finalQty > stockLimit) {
      alert(`⚠️ Stock Alert: Only ${stockLimit} units remaining.`);
      finalQty = stockLimit;
    }

    const newItems = [...selectedItems];
    newItems[index] = { productId, quantity: Math.max(1, finalQty) };
    setSelectedItems(newItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      alert('Please add at least one product.');
      return;
    }
    if (customerPhone.trim().length < 11) {
      alert('Enter a valid phone number (min 11 digits).');
      return;
    }
    if (!customerName.trim() || !customerAddress.trim()) {
      alert('Customer name and address are required.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const items: OrderItem[] = selectedItems.map((item, idx) => {
        const product = products.find(p => p.id === item.productId)!;
        return {
          id: `oi-${Date.now()}-${idx}`,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        };
      });

      const newOrder: Order = {
        id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        moderatorId: currentUser.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items,
        totalAmount: calculateTotal(),
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        notes: notes.trim()
      };

      await onOrderCreate(newOrder);
      
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setSelectedItems([]);
      setNotes('');
      
    } catch (err: any) {
      console.error("OrderForm Component Error:", err);
      alert("❌ Submission Failed: " + (err.message || "Please check your network connection."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 text-center md:text-left flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Add New Booking</h2>
          <p className="text-slate-500 font-medium italic">Enter customer shipment details below.</p>
        </div>
        {autoFilled && (
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-bounce border border-emerald-100 shadow-sm">
            ✨ Auto-filled from Leads
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">Recipient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <div className="relative">
                   <input required type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" placeholder="017XXXXXXXX" />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">📞</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input required type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" placeholder="e.g. Kashem Ali" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Address</label>
                <textarea required rows={3} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold resize-none" placeholder="Village, Union, Post, Thana, District..." />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consignment Items</h3>
              <button type="button" onClick={addItem} className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-black transition-all shadow-lg active:scale-95">+ Add Item</button>
            </div>
            <div className="space-y-4">
              {selectedItems.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={index} className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex-1 w-full">
                      <select value={item.productId} onChange={(e) => updateItem(index, e.target.value, item.quantity)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none">
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — ৳{p.price}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button type="button" onClick={() => updateItem(index, item.productId, item.quantity - 1)} className="px-4 py-3 text-slate-400 font-bold hover:bg-slate-50">−</button>
                        <span className="px-4 font-black text-slate-800 min-w-[3ch] text-center">{item.quantity}</span>
                        <button type="button" onClick={() => updateItem(index, item.productId, item.quantity + 1)} className="px-4 py-3 text-slate-400 font-bold hover:bg-slate-50">+</button>
                      </div>
                      <button type="button" onClick={() => removeItem(index)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">🗑️</button>
                    </div>
                  </div>
                );
              })}
              {selectedItems.length === 0 && (
                <p className="text-center py-6 text-slate-400 text-sm font-bold italic">No products selected.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-950 p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl sticky top-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-10 border-b border-white/5 pb-4">Bill Details</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                <span>Total Amount</span>
                <span className="text-white font-black text-xl">৳{calculateTotal().toLocaleString()}</span>
              </div>
              
              <div className="pt-10">
                <button 
                  type="submit" 
                  disabled={isSubmitting || selectedItems.length === 0}
                  className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-sm active:scale-95 flex items-center justify-center gap-3 ${
                    isSubmitting || selectedItems.length === 0 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : 'Confirm Order'}
                </button>
              </div>
              <div className="pt-4 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Special Instruction</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-300 outline-none focus:border-orange-500 resize-none font-medium"
                  rows={2}
                  placeholder="e.g. Call before delivery"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
