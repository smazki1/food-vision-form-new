import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeadsTestComponent from '@/components/admin/leads/LeadsTestComponent';

const queryClient = new QueryClient();

const LeadsTestPage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800">Leads System Test Page</h1>
          <p className="mt-2 text-lg text-gray-600">
            This page is designed to test the new leads management system components and hooks.
          </p>
        </header>
        
        <main className="max-w-7xl mx-auto">
          <LeadsTestComponent />
        </main>
        
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Food Vision System. For testing purposes only.</p>
        </footer>
      </div>
    </QueryClientProvider>
  );
};

export default LeadsTestPage; 