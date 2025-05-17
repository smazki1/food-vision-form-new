
import { createContext } from 'react';
import { ClientAuthContextType } from '@/types/clientAuthTypes';

export const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);
