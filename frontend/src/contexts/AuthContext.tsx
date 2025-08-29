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

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      
      // Redirect based on user role
      if (userData.role === 'STORE_OWNER') {
        navigate('/store/dashboard');
      } else if (userData.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      throw new Error('Invalid email or password');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { name, email, password, userType, phone, storeName, address } = data;
      
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        phone,
        password,
        confirmPassword: password,
        role: userType,
        ...(userType === 'STORE_OWNER' && { storeName, address })
      });
      
      // Auto-login after successful registration
      await login(email, password, userType);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
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
