
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // States for Editing and Deleting
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !sku) return;

    const newProduct: Product = {
      id: `p-${Date.now()}`,
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      price: parseFloat(price),
      stock: 50
    };

    onAddProduct(newProduct);
    setName('');
    setSku('');
    setPrice('');
    setIsAdding(false);
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditSku(product.sku);
    setEditPrice(product.price.toString());
    setConfirmDeleteId(null); // Clear any delete confirmation
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editName || !editPrice || !editSku) return;
    onUpdateProduct({
      id,
      sku: editSku.toUpperCase().trim(),
      name: editName.trim(),
      price: parseFloat(editPrice)
    });
    setEditingId(null);
  };

  const triggerDelete = (id: string) => {
    setConfirmDeleteId(id);
    setEditingId(null); // Clear any active editing
  };

  const finalDelete = (id: string) => {
    onDeleteProduct(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Advanced Inventory</h2>
          <p className="text-sm text-slate-500 font-medium">Manage your professional product catalog and SKU codes.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`${isAdding ? 'bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/10 active:scale-95 flex items-center gap-2`}
        >
          {isAdding ? '✕ Cancel' : '＋ Add New Product'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">📦</div>
            <h3 className="text-xl font-bold text-slate-800">New Product Entry</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Product Code (SKU)</label>
              <input
                required
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold font-mono text-blue-600 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                placeholder="E.G. CHILI-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Product Display Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Describe your product here..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Price (৳)</label>
              <input
                required
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95"
              >
                Register Product
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product & Code</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Retail Price</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Inventory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic font-bold text-sm">
                    Your catalog is empty. Let's add your first product!
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-blue-50/10 transition-colors">
                  <td className="px-8 py-6">
                    {editingId === product.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editSku}
                          onChange={(e) => setEditSku(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold font-mono uppercase bg-white"
                        />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold bg-white"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <p className="font-black text-slate-800 text-base leading-tight tracking-tight">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 tracking-wider">
                            SKU: {product.sku}
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {editingId === product.id ? (
                      <div className="relative max-w-[150px]">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full pl-8 pr-4 py-2 border-2 border-blue-200 rounded-xl outline-none focus:border-blue-500 text-sm font-black bg-white"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg">
                          ৳{product.price.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Rate</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {editingId === product.id ? (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => saveEdit(product.id)}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : confirmDeleteId === product.id ? (
                      <div className="flex justify-end items-center gap-3 animate-in zoom-in-95 duration-200">
                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest mr-2">Sure?</span>
                        <button
                          onClick={() => finalDelete(product.id)}
                          className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
                        >
                          YES
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3 items-center">
                        <button
                          onClick={() => startEditing(product)}
                          className="border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => triggerDelete(product.id)}
                          className="border border-slate-200 hover:bg-rose-50 hover:border-rose-500 hover:text-rose-600 text-slate-600 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductManager;
