import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileDown, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CertificatePreview from "@/components/convencion/CertificatePreview";
import { applySeo } from "@/lib/seo";
import { getSupabase } from "@/lib/supabase";
import { namesAreSimilar, normalizeName } from "@/lib/nameMatch";

interface SummaryRow {
  id: string;
  commission_slug: string;
  title: string;
  authors: string;
  institution: string;
  summary: string;
  created_at: string;
}

interface CommentRow {
  id: string;
  summary_id: string;
  commenter_name: string;
  comment: string;
  created_at: string;
}

interface ParticipantResult {
  name: string;
  summariesCount: number;
  commentsCount: number;
  qualifies: boolean;
  institution: string | null;
  summaries: { title: string; commission: string }[];
}

const ConvencionCertificado: React.FC = () => {
  const certRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [result, setResult] = useState<ParticipantResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: "Certificado — Convención Científica 2026",
      description:
        "Descarga tu certificado de participación de la Convención Científica Estudiantil 2026.",
      url: "https://medestudia-v2.vercel.app/convencion/certificado",
      image: "https://medestudia-v2.vercel.app/og-convencion.png",
    });
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setErrorMsg("No se pudo conectar con la base de datos.");
      setLoading(false);
      return;
    }
    Promise.all([
      sb.from("summaries").select("*"),
      sb.from("comments").select("*"),
    ]).then(([sumRes, comRes]) => {
      setLoading(false);
      if (sumRes.error) setErrorMsg("Error al cargar datos.");
      else setSummaries((sumRes.data as SummaryRow[]) ?? []);
      if (comRes.error) setErrorMsg("Error al cargar datos.");
      else setComments((comRes.data as CommentRow[]) ?? []);
    });
  }, []);

  const lookupParticipant = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      // Look for exact and fuzzy matches
      const norm = normalizeName(trimmed);
      let matchedVariants: string[] = [];

      // Collect all unique raw names
      const rawNames = new Set<string>();
      for (const s of summaries) {
        for (const n of s.authors.split(";").map((x) => x.trim()).filter(Boolean)) {
          rawNames.add(n);
        }
      }
      for (const c of comments) {
        rawNames.add(c.commenter_name.trim());
      }

      // Exact match
      const exact = [...rawNames].find((rn) => normalizeName(rn) === norm);
      if (exact) matchedVariants = [exact];
      else {
        // Fuzzy match
        const fuzzy = [...rawNames].filter((rn) => namesAreSimilar(rn, trimmed));
        if (fuzzy.length > 0) matchedVariants = fuzzy;
      }

      if (matchedVariants.length === 0) return null;

      // Aggregate data across all matched variants
      let summariesCount = 0;
      let commentsCount = 0;
      let institution: string | null = null;
      const summariesList: { title: string; commission: string }[] = [];

      for (const s of summaries) {
        const authors = s.authors.split(";").map((n) => n.trim()).filter(Boolean);
        if (authors.some((a) => matchedVariants.includes(a))) {
          summariesCount++;
          summariesList.push({ title: s.title, commission: s.commission_slug });
          if (s.institution && !institution) institution = s.institution;
        }
      }

      for (const c of comments) {
        if (matchedVariants.includes(c.commenter_name.trim())) {
          commentsCount++;
        }
      }

      return {
        name: matchedVariants[0],
        summariesCount,
        commentsCount,
        qualifies: summariesCount >= 1 && commentsCount >= 2,
        institution,
        summaries: summariesList,
      };
    },
    [summaries, comments],
  );

  const handleSearch = useCallback(() => {
    setChecking(true);
    setResult(null);
    setSuggestions([]);
    setErrorMsg(null);

    // Small delay so user sees the spinner
    setTimeout(() => {
      const found = lookupParticipant(searchValue);
      if (found) {
        setResult(found);
      } else {
        // Check for close suggestions
        const norm = normalizeName(searchValue);
        const rawNames = new Set<string>();
        for (const s of summaries) {
          for (const n of s.authors.split(";").map((x) => x.trim()).filter(Boolean)) {
            rawNames.add(n);
          }
        }
        for (const c of comments) {
          rawNames.add(c.commenter_name.trim());
        }
        const close = [...rawNames]
          .filter((rn) => namesAreSimilar(rn, searchValue))
          .slice(0, 5);
        setSuggestions(close);
      }
      setChecking(false);
    }, 400);
  }, [searchValue, lookupParticipant, summaries, comments]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const statCards = useMemo(() => {
    if (!result) return null;
    return (
      <div className="flex flex-wrap justify-center gap-3 mb-6 print:hidden">
        <Badge variant={result.summariesCount >= 1 ? "default" : "secondary"} className="text-sm px-3 py-1">
          {result.summariesCount} {result.summariesCount === 1 ? "resumen" : "resúmenes"}
        </Badge>
        <Badge variant={result.commentsCount >= 2 ? "default" : "secondary"} className="text-sm px-3 py-1">
          {result.commentsCount} {result.commentsCount === 1 ? "comentario" : "comentarios"}
        </Badge>
        <Badge
          variant={result.qualifies ? "default" : "secondary"}
          className={`text-sm px-3 py-1 ${result.qualifies ? "bg-emerald-500 hover:bg-emerald-500" : ""}`}
        >
          {result.qualifies ? "✓ Califica" : "No califica"}
        </Badge>
      </div>
    );
  }, [result]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-xl py-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Cargando datos de participación…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl py-8 md:py-12">
        <Button variant="ghost" size="sm" className="mb-8 -ml-2 text-muted-foreground" asChild>
          <Link to="/convencion">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a la convención
          </Link>
        </Button>

        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Certificado de Participación
          </h1>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Ingresa tu nombre completo para verificar y descargar tu certificado digital.
          </p>
        </div>

        {/* Search form */}
        <Card className="border-border/80 shadow-sm mb-8 max-w-lg mx-auto">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg">Buscar participante</CardTitle>
            <CardDescription>
              Requisitos: haber publicado al menos 1 resumen y realizado al menos 2 comentarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Ionmara Tadeo Oropeza"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={checking}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={checking || !searchValue.trim()}>
                {checking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">Buscar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {errorMsg && !result && (
          <Alert variant="destructive" className="max-w-lg mx-auto mb-8">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !result && (
          <Card className="border-amber-500/40 shadow-sm max-w-lg mx-auto mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-600">
                No encontramos ese nombre exacto
              </CardTitle>
              <CardDescription>
                ¿Quizás quisiste decir uno de estos?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchValue(s);
                      setChecking(true);
                      setTimeout(() => {
                        const found = lookupParticipant(s);
                        setResult(found);
                        setSuggestions([]);
                        setChecking(false);
                      }, 300);
                    }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No match */}
        {!result && suggestions.length === 0 && searchValue && !checking && (
          <Card className="border-dashed max-w-lg mx-auto mb-8">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                Sin resultados
              </CardTitle>
              <CardDescription>
                No encontramos ningún participante con ese nombre. Verifica que el nombre ingresado coincida
                con el que usaste al publicar tu resumen o comentario.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Found - not qualifying */}
        {result && !result.qualifies && (
          <Card className="border-amber-500/40 shadow-sm max-w-lg mx-auto mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-amber-500" />
                No cumples los requisitos
              </CardTitle>
              <CardDescription>
                Para obtener el certificado necesitas al menos 1 resumen publicado y 2 comentarios realizados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statCards}
              <p className="text-sm text-muted-foreground">
                Tu participación registrada: {result.summariesCount} resumen(es) y {result.commentsCount}{" "}
                comentario(s). Sigue participando para completar los requisitos.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Found - qualifying */}
        {result && result.qualifies && (
          <>
            {statCards}

            {/* Download/print button (hidden when printing) */}
            <div className="text-center mb-6 print:hidden">
              <Button onClick={handlePrint} size="lg" className="gap-2">
                <FileDown className="h-5 w-5" />
                Guardar como PDF / Imprimir
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Se abrirá el diálogo de impresión del navegador. Selecciona "Guardar como PDF" para
                descargarlo.
              </p>
            </div>

            {/* Certificate */}
            <div className="flex justify-center">
              <div className="overflow-x-auto" style={{ maxWidth: "100%" }}>
                <CertificatePreview
                  ref={certRef}
                  participantName={result.name}
                  summaryTitle={result.summaries[0]?.title}
                  institution={result.institution ?? undefined}
                  summariesCount={result.summariesCount}
                  commentsCount={result.commentsCount}
                />
              </div>
            </div>
          </>
        )}

        {/* Info card */}
        {!result && !searchValue && (
          <Card className="border-dashed max-w-lg mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                ¿Cómo funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                1. Publica al menos un resumen en cualquiera de las comisiones.
              </p>
              <p>2. Realiza al menos dos comentarios en resúmenes de otros participantes.</p>
              <p>3. Ingresa tu nombre aquí y descarga tu certificado digital.</p>
              <p className="pt-2 text-xs">
                El certificado se genera automáticamente con los datos registrados en la plataforma.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ConvencionCertificado;
