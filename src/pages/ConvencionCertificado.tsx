import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { ChevronLeft, Download, Search, Award, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CertificatePreview from "@/components/convencion/CertificatePreview";
import { getSupabase } from "@/lib/supabase";
import { applySeo } from "@/lib/seo";

interface ParticipationResult {
  summaries: { title: string; commission: string }[];
  comments: number;
  qualifies: boolean;
}

const ConvencionCertificado: React.FC = () => {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ParticipationResult | null>(null);
  const [checked, setChecked] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applySeo({
      title: "Certificado — Convención Científica 2026",
      description: "Verifique su participación y descargue su certificado digital de la Convención Científica Estudiantil 2026.",
      url: "https://medestudia-v2.vercel.app/convencion/certificado",
      image: "https://medestudia-v2.vercel.app/og-convencion.png",
    });
  }, []);

  const handleCheck = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Ingrese su nombre completo.");
      return;
    }

    setChecking(true);
    setChecked(false);
    setResult(null);

    const sb = getSupabase();
    if (!sb) {
      toast.error("Supabase no está configurado.");
      setChecking(false);
      return;
    }

    try {
      const [sumRes, comRes] = await Promise.all([
        sb.from("summaries").select("title,commission_slug"),
        sb.from("comments").select("id"),
      ]);

      if (sumRes.error || comRes.error) {
        toast.error("Error al verificar participación.");
        setChecking(false);
        return;
      }

      const allSummaries = (sumRes.data ?? []) as { title: string; commission_slug: string }[];
      const allComments = (comRes.data ?? []) as { id: string }[];

      // Find summaries where the name appears in authors
      const userSummaries = allSummaries.filter((s) => {
        // We only have title and commission_slug from a minimal select;
        // we need authors too. Let me fetch more data.
        return false; // temp
      });

      // Actually, let's fetch the data properly with a second query
      const { data: fullSummaries, error: fullErr } = await sb
        .from("summaries")
        .select("title,authors,commission_slug");

      if (fullErr) {
        toast.error("Error al verificar participación.");
        setChecking(false);
        return;
      }

      const nameLower = trimmed.toLowerCase();
      const matchedSummaries = (fullSummaries ?? []).filter((s) =>
        s.authors.toLowerCase().includes(nameLower)
      );

      const summaryTitles = matchedSummaries.map((s) => ({
        title: s.title,
        commission: s.commission_slug,
      }));

      // Count comments by this person
      const { data: userComments, error: comErr } = await sb
        .from("comments")
        .select("id")
        .ilike("commenter_name", trimmed);

      if (comErr) {
        toast.error("Error al verificar comentarios.");
        setChecking(false);
        return;
      }

      const commentCount = (userComments ?? []).length;
      const qualifies = summaryTitles.length >= 1 && commentCount >= 2;

      setResult({
        summaries: summaryTitles,
        comments: commentCount,
        qualifies,
      });
    } catch {
      toast.error("Error al verificar participación.");
    }

    setChecking(false);
    setChecked(true);
  }, [name]);

  const handleDownload = useCallback(async () => {
    if (!certRef.current) return;
    try {
      const dataUrl = await toPng(certRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `certificado-convencion-2026-${name.trim().toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Certificado descargado.");
    } catch {
      toast.error("Error al generar la imagen.");
    }
  }, [name]);

  // Fetch institution from summaries if not provided
  const matchedInstitution = institution || (result && result.summaries.length > 0 ? "Participante" : "");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl py-8 md:py-12">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground" asChild>
          <Link to="/convencion">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a la convención
          </Link>
        </Button>

        <div className="mb-8 flex items-end gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Certificado digital</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verifique su participación y descargue su certificado
            </p>
          </div>
        </div>

        <Card className="border-border/80 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Verificar participación</CardTitle>
            <CardDescription>
              Para obtener su certificado debe haber publicado al menos 1 resumen y comentado al menos 2 trabajos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="cert-name">Nombre completo *</Label>
                <Input
                  id="cert-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Ana María López Pérez"
                  maxLength={200}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                />
              </div>
              <Button onClick={handleCheck} disabled={checking || !name.trim()} className="shrink-0">
                {checking ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  <>
                    <Search className="mr-1.5 h-4 w-4" />
                    Verificar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {checked && result && (
          <>
            {result.qualifies ? (
              <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <AlertDescription className="text-sm">
                  ¡Felicidades! Ha cumplido con los requisitos. Su certificado está listo para descargar.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mb-6 border-amber-500/30 bg-amber-500/5">
                <XCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  Aún no cumple los requisitos. Necesita al menos 1 resumen publicado y 2 comentarios.
                  {result.summaries.length === 0 && (
                    <span className="block mt-1 text-muted-foreground">
                      No encontramos resúmenes asociados a este nombre.
                    </span>
                  )}
                  {result.comments < 2 && (
                    <span className="block mt-1 text-muted-foreground">
                      Ha realizado {result.comments} comentario{result.comments === 1 ? "" : "s"} (mínimo 2).
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resúmenes publicados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{result.summaries.length}</p>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Comentarios realizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{result.comments}</p>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${result.qualifies ? "text-emerald-500" : "text-amber-500"}`}>
                    {result.qualifies ? "Califica" : "Pendiente"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Certificate display */}
        {result?.qualifies && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-primary/10 scale-[0.85] md:scale-100 origin-top">
                <CertificatePreview
                  ref={certRef}
                  participantName={name.trim()}
                  institution={matchedInstitution || undefined}
                  summariesCount={result.summaries.length}
                  commentsCount={result.comments}
                />
              </div>
            </div>
            <div className="flex justify-center">
              <Button size="lg" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Descargar certificado (PNG)
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground/60">
              El certificado se genera en alta resolución. Puede imprimirlo o compartirlo directamente.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConvencionCertificado;
