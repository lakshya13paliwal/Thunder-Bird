import { useState } from "react";
import { useListClients, useCreateClient, useUpdateClient, useDeleteClient, Client } from "@workspace/api-client-react";
import { Button, Card, Input } from "@/components/ui-elements";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function Clients() {
  const { data: clients = [], isLoading } = useListClients();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Manage your business clients and their GST info.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Client</Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search clients..."
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
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">GSTIN</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No clients found.</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-medium text-slate-900">{client.name}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="text-slate-900">{client.email}</div>
                      <div className="text-slate-500">{client.phone}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-sm">{client.gstin || "-"}</td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => openEdit(client)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <DeleteClientButton id={client.id} />
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
          <ClientModal 
            client={editingClient} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DeleteClientButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteClient({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/clients"] })
    }
  });

  return (
    <button 
      onClick={() => {
        if(confirm("Are you sure you want to delete this client?")) {
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

function ClientModal({ client, onClose }: { client: Client | null, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    gstin: client?.gstin || "",
    address: client?.address || "",
  });

  const createMutation = useCreateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        onClose();
      }
    }
  });

  const updateMutation = useUpdateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        onClose();
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client) {
      updateMutation.mutate({ id: client.id, data: formData });
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold font-display text-slate-900">{client ? "Edit Client" : "New Client"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
            <Input label="Business Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="Phone" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <Input label="GSTIN (Optional)" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
            <div className="w-full">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address (Optional)</label>
              <textarea 
                className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 min-h-[100px] resize-y"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="client-form" isLoading={isPending}>Save Client</Button>
        </div>
      </motion.div>
    </div>
  );
}
