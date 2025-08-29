import { QueryClient, QueryClientProvider as ReactQueryProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const QueryClientProvider = ({ children }: { children: ReactNode }) => (
  <ReactQueryProvider client={queryClient}>
    {children}
  </ReactQueryProvider>
);
