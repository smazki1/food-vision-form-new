
// Define types for client authentication
export interface ClientAuthState {
  clientId: string | null;
  authenticating: boolean;
  isAuthenticated: boolean;
  hasLinkedClientRecord: boolean; // Existing flag to indicate if user has associated client record
  hasNoClientRecord?: boolean; // NEW: Explicit flag to mark when we've confirmed no client record exists
  clientRecordStatus?: 'loading' | 'found' | 'not-found' | 'error'; // NEW: Status indicator
  errorState: string | null; // Error state for policy errors and other auth issues
}

export interface ClientAuthContextType extends ClientAuthState {
  // Context methods would go here if needed in the future
}
