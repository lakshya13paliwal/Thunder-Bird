import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { Button, Input } from "@/components/ui-elements";
import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Register() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ username: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/");
      },
      onError: (err: any) => {
        setError(err?.response?.data?.error || "Failed to register. Username or email might be taken.");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    registerMutation.mutate({ data: formData });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="hidden md:block flex-1 relative bg-slate-50 overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract background" 
          className="absolute inset-0 w-full h-full object-cover transform scale-105"
        />
        <div className="absolute inset-0 bg-indigo-900/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-transparent to-slate-900/80 z-20" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="font-display font-bold text-2xl text-slate-900">ThunderBill</span>
          </div>

          <h1 className="font-display text-4xl font-bold text-slate-900 mb-2">Create an account</h1>
          <p className="text-slate-500 mb-8 text-lg">Start managing your billing today.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100">
                {error}
              </div>
            )}
            
            <Input 
              label="Business/User Name" 
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            
            <Input 
              label="Email Address" 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input 
              label="Phone Number" 
              type="tel" 
              placeholder="+91"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            
            <Input 
              label="Password" 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />

            <Button 
              type="submit" 
              className="w-full mt-6" 
              size="lg"
              isLoading={registerMutation.isPending}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-500 font-medium">
            Already have an account? <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
