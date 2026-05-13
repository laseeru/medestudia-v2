import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AIStatusProvider } from "@/contexts/AIStatusContext";
import Index from "./pages/Index";
import Preclinical from "./pages/Preclinical";
import Clinical from "./pages/Clinical";
import ClinicalStudy from "./pages/ClinicalStudy";
import ClinicalGuidelines from "./pages/ClinicalGuidelines";
import ConvencionCientifica2026 from "./pages/ConvencionCientifica2026";
import ConvencionHub from "./pages/ConvencionHub";
import ConvencionComisionPage from "./pages/ConvencionComisionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AIStatusProvider>
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
              <Route path="/convencion" element={<ConvencionHub />} />
              <Route path="/convencion/comision/:slug" element={<ConvencionComisionPage />} />
              <Route path="/convencion-cientifica-2026" element={<ConvencionCientifica2026 />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AIStatusProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
