import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLoginUser } from "@workspace/api-client-react";
import { Button, Input } from "@/components/ui-elements";
import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/");
      },
      onError: (err: any) => {
        setError(err?.response?.data?.error || "Invalid credentials");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: formData });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="font-display font-bold text-3xl tracking-tight text-slate-900">Thunder<span className="text-indigo-600">Bill</span></span>
          </div>

          <h1 className="font-display text-4xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-500 mb-8 text-lg">Enter your details to access your account.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100">
                {error}
              </div>
            )}
            
            <Input 
              label="Username" 
              placeholder="e.g. johndoe" 
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            
            <div>
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4" 
              size="lg"
              isLoading={loginMutation.isPending}
            >
              Sign in to Dashboard
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-500 font-medium">
            Don't have an account? <Link href="/register" className="text-indigo-600 hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden md:block flex-1 relative bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5 mix-blend-multiply z-10" />
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract 3D shapes" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-20" />
        <div className="absolute bottom-12 left-12 right-12 z-30">
          <h2 className="text-3xl font-display font-bold mb-4 text-white drop-shadow-lg">Fastest way to create GST invoices.</h2>
          <p className="text-lg text-slate-200 max-w-md drop-shadow">Manage clients, track payments, and generate beautiful PDFs in seconds.</p>
        </div>
      </div>
    </div>
  );
}
