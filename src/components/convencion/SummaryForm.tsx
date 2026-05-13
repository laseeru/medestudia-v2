import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase";

const MAX_WORDS = 300;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface SummaryFormProps {
  commissionSlug: string;
  onSubmitted: () => void;
}

export const SummaryForm: React.FC<SummaryFormProps> = ({ commissionSlug, onSubmitted }) => {
  const [authors, setAuthors] = useState("");
  const [institution, setInstitution] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const wordCount = useMemo(() => countWords(summary), [summary]);
  const overLimit = wordCount > MAX_WORDS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      toast.error("Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
      return;
    }
    if (!authors.trim() || !institution.trim() || !title.trim() || !summary.trim()) {
      toast.error("Complete todos los campos obligatorios.");
      return;
    }
    if (overLimit) {
      toast.error(`El resumen no puede superar ${MAX_WORDS} palabras.`);
      return;
    }

    setSubmitting(true);
    const { error } = await sb.from("summaries").insert({
      commission_slug: commissionSlug,
      title: title.trim(),
      authors: authors.trim(),
      institution: institution.trim(),
      summary: summary.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "No se pudo enviar el resumen.");
      return;
    }

    toast.success("Resumen publicado correctamente.");
    setAuthors("");
    setInstitution("");
    setTitle("");
    setSummary("");
    onSubmitted();
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Enviar resumen</CardTitle>
        <CardDescription>
          Máximo {MAX_WORDS} palabras. Los datos se guardan para la comisión seleccionada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authors">Nombre(s) de autor(es) *</Label>
            <Input
              id="authors"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Ej: Ana López; Carlos Pérez"
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">Institución *</Label>
            <Input
              id="institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Centro o facultad"
              maxLength={300}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título del resumen *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título breve"
              maxLength={400}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="summary">Resumen *</Label>
              <span
                className={`text-xs tabular-nums ${overLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}
              >
                {wordCount} / {MAX_WORDS} palabras
              </span>
            </div>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Texto del resumen científico..."
              rows={10}
              className="min-h-[180px] resize-y"
            />
          </div>
          <Button type="submit" disabled={submitting || overLimit}>
            {submitting ? "Enviando…" : "Enviar resumen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
