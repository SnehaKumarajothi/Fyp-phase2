/*import React from "react";
// Assuming necessary utilities and routing context are handled by the environment

// Import the main application component
import Index from "./pages/Index";

const App: React.FC = () => (
    // Assuming required providers (QueryClient, Toaster, etc.) are handled by the main entry point
    // or are unnecessary for this PoC. We will render Index directly.
    <Index />
);

export default App;*/
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Banking from "./pages/Banking";
import SchemeVoice from "./pages/Index";
import NotFound from "./pages/NotFound";
//import { LoanSchemeFlow } from "@/components/LoanSchemeFlow";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheme" element={<SchemeVoice />} />
          <Route path="/banking" element={<Banking />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;