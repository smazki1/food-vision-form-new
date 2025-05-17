
// Define types for client authentication
export interface ClientAuthState {
  clientId: string | null;
  authenticating: boolean;
  isAuthenticated: boolean;
}

export interface ClientAuthContextType extends ClientAuthState {
  // Context methods would go here if needed in the future
}
