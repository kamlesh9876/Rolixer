import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { apiClient } from '../api/apiClient';

export type UserType = 'CUSTOMER' | 'STORE_OWNER' | 'ADMIN';

// Enhanced error type
type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message: string;
};

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
} & (
  | { userType: 'STORE_OWNER'; storeName: string; address: string }
  | { userType: 'CUSTOMER' | 'ADMIN' }
);

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
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, userType?: UserType) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { 
        email, 
        password,
        ...(userType && { userType })
      });
      
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      
      // Set default auth header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(userData);
      return { user: userData };
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 
                          apiError.response?.data?.error || 
                          'Login failed. Please try again.';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/register', data);
      const { access_token, user: userData } = response.data;
      
      if (!access_token || !userData) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      return { user: userData };
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { data, status } = error.response;
        
        if (status === 400) {
          errorMessage = data.message || 'Invalid registration data';
        } else if (status === 409) {
          errorMessage = data.message || 'User with this email already exists';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      console.error('Registration error:', error);
      setError(errorMessage);
      // We'll throw the error to be caught by the form
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    // Use window.location for navigation to avoid Router context issues
    window.location.href = '/login';
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading ? children : <div>Loading...</div>}
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
