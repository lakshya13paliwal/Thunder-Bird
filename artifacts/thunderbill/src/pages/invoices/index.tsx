import { useListInvoices, useDeleteInvoice } from "@workspace/api-client-react";
import { Button, Card, Badge } from "@/components/ui-elements";
import { Plus, Eye, Edit2, Trash2, Download } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function Invoices() {
  const { data: invoices = [], isLoading } = useListInvoices();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteInvoice({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/invoices"] })
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">Create and manage your billing.</p>
        </div>
        <Link href="/invoices/new">
          <Button><Plus className="w-4 h-4 mr-2" /> Create Invoice</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Number</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                      <Plus className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No invoices yet</h3>
                    <p className="text-slate-500 mb-4">Create your first invoice to get paid.</p>
                    <Link href="/invoices/new">
                      <Button variant="outline">Create Invoice</Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-medium text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-4 px-6 text-slate-600">{inv.clientName}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="text-slate-900">{formatDate(inv.date)}</div>
                      {inv.dueDate && <div className="text-slate-500 text-xs mt-0.5">Due: {formatDate(inv.dueDate)}</div>}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</td>
                    <td className="py-4 px-6">
                      <Badge status={inv.status}>{inv.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1 flex justify-end items-center">
                      <Link href={`/invoices/${inv.id}`}>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      {inv.status !== "Paid" && (
                        <Link href={`/invoices/${inv.id}/edit`}>
                          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          const w = window.open(`/api/invoices/${inv.id}/pdf`, '_blank');
                          if (w) w.addEventListener('load', () => setTimeout(() => w.print(), 500));
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Print / Save PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => confirm("Delete this invoice?") && deleteMutation.mutate({ id: inv.id })}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors" 
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
