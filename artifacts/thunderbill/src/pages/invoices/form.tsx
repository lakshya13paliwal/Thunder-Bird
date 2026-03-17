import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useListClients, 
  useCreateInvoice, 
  useUpdateInvoice, 
  useGetInvoice,
  CreateInvoiceLineItem
} from "@workspace/api-client-react";
import { Button, Card, Input } from "@/components/ui-elements";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function InvoiceForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const [, setLocation] = useLocation();
  const { data: clients = [] } = useListClients();
  const { data: invoice } = useGetInvoice(isEditing ? parseInt(id) : 0, { query: { enabled: isEditing }});
  
  const createMutation = useCreateInvoice({ mutation: { onSuccess: (res) => setLocation(`/invoices/${res.id}`) } });
  const updateMutation = useUpdateInvoice({ mutation: { onSuccess: (res) => setLocation(`/invoices/${res.id}`) } });

  const [formData, setFormData] = useState({
    clientId: 0,
    date: new Date().toISOString().split('T')[0],
    dueDate: "",
  });

  const [lineItems, setLineItems] = useState<CreateInvoiceLineItem[]>([
    { description: "", quantity: 1, rate: 0, gstPercent: 18 }
  ]);

  // Pre-fill form when editing
  useEffect(() => {
    if (invoice) {
      setFormData({
        clientId: invoice.clientId,
        date: invoice.date.split('T')[0],
        dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : "",
      });
      setLineItems(invoice.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        gstPercent: item.gstPercent
      })));
    }
  }, [invoice]);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, rate: 0, gstPercent: 18 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof CreateInvoiceLineItem, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  // Calculations for preview
  const totals = lineItems.reduce((acc, item) => {
    const amount = item.quantity * item.rate;
    const gst = amount * (item.gstPercent / 100);
    return {
      subtotal: acc.subtotal + amount,
      gstAmount: acc.gstAmount + gst,
      grandTotal: acc.grandTotal + amount + gst
    };
  }, { subtotal: 0, gstAmount: 0, grandTotal: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.clientId === 0) return alert("Please select a client");
    
    const payload = {
      clientId: formData.clientId,
      date: formData.date,
      dueDate: formData.dueDate || undefined,
      lineItems: lineItems.filter(item => item.description.trim() !== "" && item.rate > 0)
    };

    if (payload.lineItems.length === 0) return alert("Please add at least one valid line item");

    if (isEditing) {
      updateMutation.mutate({ id: parseInt(id), data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => setLocation("/invoices")} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">{isEditing ? "Edit Invoice" : "Create Invoice"}</h1>
          <p className="text-slate-500 mt-1">Fill in the details to generate a new GST invoice.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
              <select 
                className="flex h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                value={formData.clientId}
                onChange={e => setFormData({...formData, clientId: parseInt(e.target.value)})}
                required
              >
                <option value={0} disabled>Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input 
              label="Invoice Date" 
              type="date" 
              required 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
            <Input 
              label="Due Date (Optional)" 
              type="date" 
              value={formData.dueDate}
              onChange={e => setFormData({...formData, dueDate: e.target.value})}
            />
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="w-4 h-4 mr-2" /> Add Row
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase w-2/5">Description</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase w-1/6">Qty</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase w-1/6">Rate (₹)</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase w-1/6">GST %</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase w-1/6 text-right">Amount</th>
                  <th className="py-3 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-6">
                      <input 
                        type="text" 
                        placeholder="Item description"
                        className="w-full bg-transparent border-b-2 border-transparent focus:border-indigo-500 focus:outline-none py-1 transition-colors font-medium text-slate-900"
                        value={item.description}
                        onChange={e => updateLineItem(index, 'description', e.target.value)}
                        required
                      />
                    </td>
                    <td className="py-3 px-6">
                      <input 
                        type="number" 
                        min="1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={item.quantity}
                        onChange={e => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td className="py-3 px-6">
                      <input 
                        type="number" 
                        min="0" step="0.01"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={item.rate || ""}
                        onChange={e => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td className="py-3 px-6">
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={item.gstPercent}
                        onChange={e => updateLineItem(index, 'gstPercent', parseInt(e.target.value))}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="py-3 px-6 text-right font-medium text-slate-900">
                      {formatCurrency(item.quantity * item.rate)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center border-t border-slate-200 gap-6">
            <div className="text-sm text-slate-500">
              Make sure to select the correct GST percentages.
            </div>
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Total GST</span>
                <span>{formatCurrency(totals.gstAmount)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-lg font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-indigo-600">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => setLocation("/invoices")}>Cancel</Button>
          <Button type="submit" size="lg" isLoading={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? "Update Invoice" : "Save Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
