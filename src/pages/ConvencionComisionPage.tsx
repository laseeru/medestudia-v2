import React, { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import { applySeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SummaryForm } from "@/components/convencion/SummaryForm";
import { SummaryCard, type SummaryRow } from "@/components/convencion/SummaryCard";
import { getCommissionBySlug } from "@/data/convencionCommissions";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const ConvencionComisionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const commission = getCommissionBySlug(slug);
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applySeo({
      title: commission ? `${commission.title} — Convención Científica 2026` : "Convención Científica 2026",
      description: commission
        ? `${commission.description} Publique su resumen y participe en la Convención Científica Estudiantil 2026.`
        : "Evento académico para estudiantes de ciencias médicas enfocado en innovación, investigación y educación médica.",
      url: `https://medestudia-v2.vercel.app/convencion/comision/${slug}`,
      image: "https://medestudia-v2.vercel.app/og-convencion.png",
    });
  }, [commission, slug]);

  const loadSummaries = useCallback(async () => {
    if (!commission || !isSupabaseConfigured()) {
      setSummaries([]);
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await sb
      .from("summaries")
      .select("id,commission_slug,title,authors,institution,summary,created_at")
      .eq("commission_slug", commission.slug)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message || "No se pudieron cargar los resúmenes.");
      setSummaries([]);
      return;
    }
    setSummaries((data as SummaryRow[]) ?? []);
  }, [commission]);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  if (!slug || !commission) {
    return <Navigate to="/convencion" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 container max-w-3xl py-8 md:py-12">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground" asChild>
          <Link to="/convencion">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a la convención
          </Link>
        </Button>

        <div className="mb-8 flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl text-balance">
              {commission.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {commission.description} Participe publicando su resumen científico y comentando los trabajos de
              otros autores. Su actividad queda registrada a efectos de certificación.
            </p>
            <Button asChild variant="link" className="mt-1 h-auto px-0 text-xs text-primary">
              <a href={commission.whatsapp} target="_blank" rel="noopener noreferrer">
                Grupo oficial de WhatsApp de la comisión
              </a>
            </Button>
          </div>
        </div>

        {!isSupabaseConfigured() && (
          <Alert className="mb-8 border-amber-500/40 bg-amber-500/10">
            <AlertDescription>
              Para usar envío de resúmenes y comentarios, configure{" "}
              <code className="rounded bg-muted px-1">VITE_SUPABASE_URL</code> y{" "}
              <code className="rounded bg-muted px-1">VITE_SUPABASE_ANON_KEY</code> y ejecute el SQL en Supabase (ver{" "}
              <code className="rounded bg-muted px-1">supabase/README.md</code>).
            </AlertDescription>
          </Alert>
        )}

        <section className="mb-12 space-y-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Nuevo resumen</h2>
          <SummaryForm commissionSlug={commission.slug} commissionWhatsapp={commission.whatsapp} onSubmitted={loadSummaries} />
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Resúmenes publicados</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando resúmenes…</p>
          ) : summaries.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base font-medium">Aún no hay resúmenes</CardTitle>
                <CardDescription>Sea el primero en publicar en esta comisión.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-6">
              {summaries.map((s) => (
                <li key={s.id}>
                  <SummaryCard summary={s} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default ConvencionComisionPage;
