
// Define types for client authentication
export interface ClientAuthState {
  clientId: string | null;
  authenticating: boolean;
  isAuthenticated: boolean;
  hasLinkedClientRecord: boolean; // Explicit flag to indicate if user has associated client record
  errorState: string | null; // NEW: Add error state for policy errors and other auth issues
}

export interface ClientAuthContextType extends ClientAuthState {
  // Context methods would go here if needed in the future
}
