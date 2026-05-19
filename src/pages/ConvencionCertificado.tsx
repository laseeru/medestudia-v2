import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Lock } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { applySeo } from "@/lib/seo";

const ConvencionCertificado: React.FC = () => {
  useEffect(() => {
    applySeo({
      title: "Certificado — Convención Científica 2026",
      description: "Los certificados digitales estarán disponibles al finalizar el programa de la Convención Científica Estudiantil 2026.",
      url: "https://medestudia-v2.vercel.app/convencion/certificado",
      image: "https://medestudia-v2.vercel.app/og-convencion.png",
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-2xl py-8 md:py-12 flex items-center justify-center">
        <div className="text-center">
          <Button variant="ghost" size="sm" className="mb-8 -ml-2 text-muted-foreground" asChild>
            <Link to="/convencion">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver a la convención
            </Link>
          </Button>

          <Card className="border-border/80 shadow-lg">
            <CardHeader className="pb-4 pt-8">
              <div className="mx-auto mb-4 rounded-full bg-muted p-4 w-fit text-muted-foreground">
                <Lock className="h-10 w-10" />
              </div>
              <CardTitle className="font-serif text-2xl md:text-3xl text-balance">
                Certificados no disponibles
              </CardTitle>
              <CardDescription className="mt-3 text-sm md:text-base leading-relaxed max-w-md mx-auto">
                Los certificados digitales de participación estarán disponibles una vez concluido el programa
                de la Convención Científica Estudiantil 2026.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <p className="text-xs text-muted-foreground/60">
                Los participantes que cumplan con los requisitos (mínimo 1 resumen publicado y 2 comentarios)
                podrán descargar su certificado al finalizar el evento.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ConvencionCertificado;
