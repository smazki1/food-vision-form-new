import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import "./App.css";
import { UnifiedAuthProvider } from "./providers/UnifiedAuthProvider";
import { ClientAuthProvider } from "@/providers/ClientAuthProvider";
import AdminRoute from "@/components/AdminRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UnifiedAuthProvider>
      <ClientAuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {navItems.map(({ to, page }) => {
                const element = page;
                
                // Define route protection
                if (to.startsWith('/admin')) {
                  return <Route key={to} path={to} element={<AdminRoute>{element}</AdminRoute>} />;
                }
                if (to === '/customer-login' || to === '/admin-login') {
                  return <Route key={to} path={to} element={<PublicOnlyRoute>{element}</PublicOnlyRoute>} />;
                }
                
                return <Route key={to} path={to} element={element} />;
              })}
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClientAuthProvider>
    </UnifiedAuthProvider>
  </QueryClientProvider>
);

export default App;
