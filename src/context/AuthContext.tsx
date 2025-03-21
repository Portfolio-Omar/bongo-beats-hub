
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  authenticateAdmin: (pin: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const authenticateAdmin = async (pin: string): Promise<boolean> => {
    try {
      // In a real implementation, this would be a call to Supabase
      // For now, we'll use the hardcoded PIN "1352"
      if (pin === '1352') {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        toast.success('Successfully logged in');
        return true;
      }
      toast.error('Invalid PIN');
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    toast.info('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, authenticateAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
