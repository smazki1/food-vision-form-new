// Define types for client authentication
export type ClientRecordStatus = 'loading' | 'found' | 'not-found' | 'error';

export interface ClientAuthState {
  clientId: string | null;
  userAuthId?: string | null;
  authenticating: boolean;
  isAuthenticated: boolean;
  hasLinkedClientRecord: boolean; // Existing flag to indicate if user has associated client record
  hasNoClientRecord?: boolean; // NEW: Explicit flag to mark when we've confirmed no client record exists
  clientRecordStatus: ClientRecordStatus;
  errorState: string | null; // Error state for policy errors and other auth issues
}

export interface ClientAuthContextType extends ClientAuthState {
  // Context methods would go here if needed in the future
  refreshClientAuth?: () => void; // Add refresh function
  clientId: string | null;
  userAuthId: string | null;
  restaurantName?: string | null; // Add restaurant name
  contactName?: string | null; // Add contact name
  originalLeadId?: string | null; // Add original lead ID to detect if user is a lead
}
