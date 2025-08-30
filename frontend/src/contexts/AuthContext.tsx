import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

export type UserType = 'CUSTOMER' | 'STORE_OWNER' | 'ADMIN';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserType;
  storeName?: string;
  address?: string;
};

type SecurityQuestion = {
  question: string;
  answer: string;
};

type RegisterData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: UserType;
  securityQuestions: SecurityQuestion[];
  enable2FA?: boolean;
  phoneFor2FA?: string;
  storeName?: string;
  address?: string;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType?: UserType) => Promise<{ user: User }>;
  register: (data: RegisterData) => Promise<{ user: User }>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed useNavigate from here to avoid router context issues

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user profile
      apiClient.get('/auth/profile')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, userType?: UserType) => {
    try {
      const response = await apiClient.post('/auth/login', { 
        email, 
        password,
        ...(userType && { userType }) // Include userType if provided
      });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      setUser(userData);
      return { user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      const { user: userData, token } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return { user: userData };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // We'll handle navigation in the component
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
