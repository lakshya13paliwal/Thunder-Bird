import { useParams, Link } from "wouter";
import { useGetInvoice, useUpdateInvoiceStatus } from "@workspace/api-client-react";
import { Button, Card, Badge } from "@/components/ui-elements";
import { ArrowLeft, Download, Send, Edit2, FileText, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id || "0");
  const { data: invoice, isLoading } = useGetInvoice(invoiceId);
  
  const queryClient = useQueryClient();
  const statusMutation = useUpdateInvoiceStatus({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] })
    }
  });

  const handleDownloadPdf = () => {
    const printWindow = window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => printWindow.print(), 500);
      });
    }
  };

  const updateStatus = (status: "Paid" | "Partial" | "Unpaid") => {
    statusMutation.mutate({ id: invoiceId, data: { status } });
  };

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-slate-900">Invoice {invoice.invoiceNumber}</h1>
            <Badge status={invoice.status}>{invoice.status}</Badge>
          </div>
        </div>
        
        <div className="flex gap-3">
          {invoice.status !== "Paid" && (
            <>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Button variant="outline" className="hidden sm:flex"><Edit2 className="w-4 h-4 mr-2" /> Edit</Button>
              </Link>
              <div className="relative group inline-block">
                <Button variant="outline"><CheckCircle2 className="w-4 h-4 mr-2" /> Mark Status</Button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <button onClick={() => updateStatus("Paid")} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium">Mark as Paid</button>
                  <button onClick={() => updateStatus("Partial")} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium">Mark as Partial</button>
                  <button onClick={() => updateStatus("Unpaid")} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium">Mark as Unpaid</button>
                </div>
              </div>
            </>
          )}
          <Button onClick={handleDownloadPdf}><Download className="w-4 h-4 mr-2" /> Print / Save PDF</Button>
        </div>
      </div>

      {/* Invoice Document Preview */}
      <Card className="p-8 sm:p-12 shadow-md">
        <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-2xl text-slate-900">TAX INVOICE</span>
            </div>
            
            <div className="text-sm text-slate-600 space-y-1">
              <p className="font-semibold text-slate-900">Billed To:</p>
              <p className="text-base text-slate-900">{invoice.client.name}</p>
              {invoice.client.address && <p className="whitespace-pre-wrap">{invoice.client.address}</p>}
              <p>Email: {invoice.client.email}</p>
              {invoice.client.gstin && <p className="font-mono mt-2">GSTIN: {invoice.client.gstin}</p>}
            </div>
          </div>
          
          <div className="text-right text-sm text-slate-600 space-y-2">
            <div>
              <p className="font-semibold text-slate-900">Invoice Number</p>
              <p className="text-base">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Date of Issue</p>
              <p>{formatDate(invoice.date)}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="font-semibold text-slate-900">Due Date</p>
                <p>{formatDate(invoice.dueDate)}</p>
              </div>
            )}
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-900">
              <th className="py-3">Description</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Rate</th>
              <th className="py-3 text-right">GST %</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="text-sm text-slate-700">
                <td className="py-4 font-medium text-slate-900">{item.description}</td>
                <td className="py-4 text-center">{item.quantity}</td>
                <td className="py-4 text-right">{formatCurrency(item.rate)}</td>
                <td className="py-4 text-right">{item.gstPercent}%</td>
                <td className="py-4 text-right font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total GST</span>
              <span className="font-medium text-slate-900">{formatCurrency(invoice.gstAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-indigo-600">{formatCurrency(invoice.grandTotal)}</span>
            </div>
            
            {/* Show breakdown of CGST/SGST assuming intra-state for simplicity on UI preview, backend handles actual computation in PDF */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Tax Breakdown</p>
              <div className="flex justify-between text-xs text-slate-500">
                <span>CGST</span>
                <span>{formatCurrency(invoice.gstAmount / 2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>SGST</span>
                <span>{formatCurrency(invoice.gstAmount / 2)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
