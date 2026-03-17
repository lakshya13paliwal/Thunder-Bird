import { useState } from "react";
import { useListItems, useCreateItem, useUpdateItem, useDeleteItem, Item } from "@workspace/api-client-react";
import { Button, Card, Input } from "@/components/ui-elements";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export default function Items() {
  const { data: items = [], isLoading } = useListItems();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.hsnCode && i.hsnCode.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Items & Products</h1>
          <p className="text-slate-500 mt-1">Manage your catalog for quick invoicing.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search items..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Item Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">HSN/SAC</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Rate</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">GST %</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">No items found.</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-medium text-slate-900">{item.name}</td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-sm">{item.hsnCode || "-"}</td>
                    <td className="py-4 px-6 text-right font-medium text-slate-900">{formatCurrency(item.rate)}</td>
                    <td className="py-4 px-6 text-right text-slate-600">{item.gstPercent}%</td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <DeleteItemButton id={item.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <ItemModal 
            item={editingItem} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DeleteItemButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteItem({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/items"] })
    }
  });

  return (
    <button 
      onClick={() => {
        if(confirm("Are you sure you want to delete this item?")) {
          deleteMutation.mutate({ id });
        }
      }} 
      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
      disabled={deleteMutation.isPending}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function ItemModal({ item, onClose }: { item: Item | null, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: item?.name || "",
    hsnCode: item?.hsnCode || "",
    rate: item?.rate || 0,
    gstPercent: item?.gstPercent || 18,
  });

  const createMutation = useCreateItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/items"] });
        onClose();
      }
    }
  });

  const updateMutation = useUpdateItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/items"] });
        onClose();
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateMutation.mutate({ id: item.id, data: formData });
    } else {
      createMutation.mutate({ data: formData });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold font-display text-slate-900">{item ? "Edit Item" : "New Item"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <form id="item-form" onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Item Name / Description" 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <Input 
              label="HSN/SAC Code (Optional)" 
              value={formData.hsnCode} 
              onChange={e => setFormData({...formData, hsnCode: e.target.value})} 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Rate (₹)" 
                type="number" 
                step="0.01" 
                required 
                value={formData.rate || ""} 
                onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || 0})} 
              />
              <Input 
                label="GST Percentage (%)" 
                type="number" 
                required 
                value={formData.gstPercent} 
                onChange={e => setFormData({...formData, gstPercent: parseInt(e.target.value) || 0})} 
              />
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="item-form" isLoading={isPending}>Save Item</Button>
        </div>
      </motion.div>
    </div>
  );
}
