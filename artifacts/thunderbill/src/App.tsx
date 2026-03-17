import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Items from "@/pages/items";
import Invoices from "@/pages/invoices";
import InvoiceForm from "@/pages/invoices/form";
import InvoiceDetail from "@/pages/invoices/detail";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component, ...rest }: { component: any, [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component {...rest} />;
}

// Routes that require the AppLayout (Sidebar etc)
function AppRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/clients" component={() => <ProtectedRoute component={Clients} />} />
        <Route path="/items" component={() => <ProtectedRoute component={Items} />} />
        <Route path="/invoices" component={() => <ProtectedRoute component={Invoices} />} />
        <Route path="/invoices/new" component={() => <ProtectedRoute component={InvoiceForm} />} />
        <Route path="/invoices/:id/edit" component={() => <ProtectedRoute component={InvoiceForm} />} />
        <Route path="/invoices/:id" component={() => <ProtectedRoute component={InvoiceDetail} />} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

// Main Router switching between public auth pages and protected app
function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      {/* Fallback to protected routes wrapped in layout */}
      <Route path="/.*" component={AppRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
