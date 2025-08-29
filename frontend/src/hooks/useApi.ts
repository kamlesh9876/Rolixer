import { useMutation, useQuery, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import axios, { AxiosError, AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

type ApiFunction<T> = () => Promise<AxiosResponse<T>>;

export function useApiQuery<T>(
  queryKey: string | unknown[], 
  apiCall: ApiFunction<T>, 
  options?: Omit<UseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, AxiosError>(
    Array.isArray(queryKey) ? queryKey : [queryKey],
    async () => {
      const { data } = await apiCall();
      return data;
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      ...options,
    }
  );
}

export function useApiMutation<T, V = any>(
  mutationFn: (data: V) => Promise<AxiosResponse<T>>,
  options?: Omit<UseMutationOptions<T, AxiosError, V>, 'mutationFn'>
) {
  return useMutation<T, AxiosError, V>(
    async (data: V) => {
      const response = await mutationFn(data);
      return response.data;
    },
    {
      retry: 1,
      ...options,
    }
  );
}

export default api;
