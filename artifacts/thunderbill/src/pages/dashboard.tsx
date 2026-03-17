import { useGetDashboard } from "@workspace/api-client-react";
import { Card, Badge } from "@/components/ui-elements";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, AlertCircle, CheckCircle2, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboard();

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Due", value: formatCurrency(stats.totalDue), icon: Wallet, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Overdue Invoices", value: stats.overdueCount, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-100" },
    { title: "Total Paid", value: formatCurrency(stats.totalPaid), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Invoices", value: stats.totalInvoices, icon: Receipt, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your billing and finances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.title}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-display font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Invoices</h2>
            <Link href="/invoices" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No invoices yet.</td>
                  </tr>
                ) : (
                  stats.recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-indigo-600 transition-colors">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{inv.clientName}</td>
                      <td className="py-4 px-6 text-slate-600">{formatDate(inv.date)}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-4 px-6">
                        <Badge status={inv.status}>{inv.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
