import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Download, Search, XCircle, Loader2, FileText } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { applySeo } from "@/lib/seo";
import { levenshtein } from "@/lib/nameMatch";

interface CertEntry {
  name: string;
  title: string;
  file: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isNameMatch(search: string, entryName: string): boolean {
  const s = normalize(search);
  const e = normalize(entryName);

  // Exact match
  if (s === e) return true;

  // All search words appear in entry name (partial match)
  const sWords = s.split(" ").filter(Boolean);
  const eWords = e.split(" ").filter(Boolean);
  if (sWords.length > 0 && sWords.every((sw) => eWords.some((ew) => ew === sw || ew.startsWith(sw) || sw.startsWith(ew)))) {
    return true;
  }

  // Whole-name Levenshtein (generous ≤40%)
  const maxLen = Math.max(s.length, e.length);
  if (maxLen > 0 && levenshtein(s, e) / maxLen <= 0.4) return true;

  // Per-word Levenshtein (≥ half of search words match within 30%)
  let wordMatches = 0;
  for (const sw of sWords) {
    for (const ew of eWords) {
      const maxW = Math.max(sw.length, ew.length);
      if (maxW > 0 && levenshtein(sw, ew) / maxW <= 0.3) {
        wordMatches++;
        break;
      }
    }
  }
  return sWords.length > 0 && wordMatches >= Math.ceil(sWords.length / 2);
}

interface CertEntry {
  name: string;
  title: string;
  file: string;
}

const ConvencionCertificado: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<CertEntry[] | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [entries, setEntries] = useState<CertEntry[]>([]);
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
    fetch("/cert-mapping.json")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data as CertEntry[]);
        setLoading(false);
      })
      .catch(() => {
        setErrorMsg("Error al cargar los datos de certificados.");
        setLoading(false);
      });
  }, []);

  const handleSearch = useCallback(() => {
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    setChecking(true);
    setResults(null);
    setSuggestions([]);
    setErrorMsg(null);

    setTimeout(() => {
      const matched = entries.filter((e) => isNameMatch(trimmed, e.name));

      if (matched.length > 0) {
        setResults(matched);
      } else {
        const norm = normalize(trimmed);
        const close = [...new Set(entries
          .map((e) => e.name)
          .filter((n) => {
            const nn = normalize(n);
            if (nn === norm) return false;
            const sWords = norm.split(" ").filter(Boolean);
            const eWords = nn.split(" ").filter(Boolean);
            const allWordsMatch = sWords.every((sw) => eWords.some((ew) => ew.startsWith(sw) || sw.startsWith(ew)));
            if (allWordsMatch) return true;
            const maxLen = Math.max(norm.length, nn.length);
            return maxLen > 0 && levenshtein(norm, nn) / maxLen <= 0.5;
          })
        )].slice(0, 5);
        setSuggestions(close);
      }
      setChecking(false);
    }, 400);
  }, [searchValue, entries]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const handleSuggestion = useCallback(
    (name: string) => {
      setSearchValue(name);
      setResults(entries.filter((e) => e.name === name || isNameMatch(name, e.name)));
      setSuggestions([]);
    },
    [entries],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-xl py-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Cargando datos de certificados…</p>
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
            Ingresa tu nombre completo para descargar tu certificado digital.
          </p>
        </div>

        {/* Search form */}
        <Card className="border-border/80 shadow-sm mb-8 max-w-lg mx-auto">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg">Buscar participante</CardTitle>
            <CardDescription>
              Recibirás un certificado por cada resumen en el que figures como autor.
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
        {errorMsg && !results && (
          <Alert variant="destructive" className="max-w-lg mx-auto mb-8">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !results && (
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
                    onClick={() => handleSuggestion(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No match */}
        {!results && suggestions.length === 0 && searchValue && !checking && (
          <Card className="border-dashed max-w-lg mx-auto mb-8">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                Sin resultados
              </CardTitle>
              <CardDescription>
                No encontramos ningún certificado con ese nombre. Verifica que el nombre coincida con el que usaste al publicar tu resumen.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-xl font-semibold text-center mb-2">
              {results[0].name}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {results.length} {results.length === 1 ? "certificado disponible" : "certificados disponibles"}
            </p>
            {results.map((r, i) => (
              <Card key={i} className="border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{r.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={`/certs/${encodeURIComponent(r.file)}`}
                    download={r.file}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="h-4 w-4" />
                      Descargar certificado (PDF)
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info card */}
        {!results && !searchValue && (
          <Card className="border-dashed max-w-lg mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                ¿Cómo funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Publica un resumen en cualquiera de las comisiones.</p>
              <p>2. Ingresa tu nombre aquí y descarga tu certificado digital.</p>
              <p className="pt-2 text-xs">
                Recibirás un certificado por cada resumen en el que figures como autor.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ConvencionCertificado;
