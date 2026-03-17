import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentUser, getGetCurrentUserQueryKey, User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  });

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
      setLocation('/login');
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const isAuthError = error !== null;

  return (
    <AuthContext.Provider 
      value={{ 
        user: user || null, 
        isLoading, 
        isAuthenticated: !!user && !isAuthError,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
