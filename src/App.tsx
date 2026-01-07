import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Preclinical from "./pages/Preclinical";
import Clinical from "./pages/Clinical";
import ClinicalStudy from "./pages/ClinicalStudy";
import ClinicalGuidelines from "./pages/ClinicalGuidelines";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/preclinico" element={<Preclinical />} />
            <Route path="/clinico" element={<Clinical />} />
            <Route path="/clinico/estudio" element={<ClinicalStudy />} />
            <Route path="/clinico/guias" element={<ClinicalGuidelines />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
