import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({ 
  className, 
  variant = "primary", 
  size = "md", 
  isLoading, 
  children, 
  disabled, 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 hover:text-slate-900 hover:border-slate-300",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20",
    ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-14 px-8 text-lg",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string, children: ReactNode }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function Input({ className, label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>}
      <input 
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

export function Badge({ children, status }: { children: ReactNode, status?: "Paid" | "Partial" | "Unpaid" | string }) {
  const styles = {
    Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Partial: "bg-amber-100 text-amber-700 border-amber-200",
    Unpaid: "bg-rose-100 text-rose-700 border-rose-200",
    default: "bg-slate-100 text-slate-700 border-slate-200"
  };
  
  const style = styles[status as keyof typeof styles] || styles.default;
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", style)}>
      {children}
    </span>
  );
}
