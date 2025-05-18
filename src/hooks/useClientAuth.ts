import { useContext } from 'react';
import { ClientAuthContext } from '@/contexts/ClientAuthContext';
import { ClientAuthContextType } from '@/types/clientAuthTypes';

export const useClientAuth = (): ClientAuthContextType => {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}; 