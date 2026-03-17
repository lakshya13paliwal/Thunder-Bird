import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForgotPassword, useVerifyOtp } from "@workspace/api-client-react";
import { Button, Input } from "@/components/ui-elements";
import { Zap, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const forgotMutation = useForgotPassword({
    mutation: {
      onSuccess: () => {
        setStep(2);
        setError("");
        setMessage("OTP sent to your phone! (Check server console in dev)");
      },
      onError: (err: any) => setError(err?.response?.data?.error || "Phone not found")
    }
  });

  const verifyMutation = useVerifyOtp({
    mutation: {
      onSuccess: () => {
        setLocation("/login");
      },
      onError: (err: any) => setError(err?.response?.data?.error || "Invalid OTP")
    }
  });

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    forgotMutation.mutate({ data: { phone } });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    verifyMutation.mutate({ data: { phone, otp, newPassword } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
      >
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </Link>

        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
          <Zap className="w-6 h-6 fill-current" />
        </div>

        <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
        <p className="text-slate-500 mb-8">
          {step === 1 ? "Enter your phone number to receive an OTP." : "Enter the OTP sent to your phone and a new password."}
        </p>

        {error && <div className="p-4 mb-6 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100">{error}</div>}
        {message && <div className="p-4 mb-6 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100">{message}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input 
              label="Phone Number" 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Button type="submit" className="w-full mt-4" isLoading={forgotMutation.isPending}>
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <Input 
              label="OTP" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <Input 
              label="New Password" 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full mt-4" isLoading={verifyMutation.isPending}>
              Reset Password
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
