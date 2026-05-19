import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase";
import { CONVENCION_COMMISSIONS } from "@/data/convencionCommissions";
import { namesAreSimilar, normalizeName } from "@/lib/nameMatch";

const MAX_WORDS = 300;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface SummaryFormProps {
  commissionSlug: string;
  commissionWhatsapp: string;
  onSubmitted: () => void;
  registeredNames: string[];
}

export const SummaryForm: React.FC<SummaryFormProps> = ({ commissionSlug, commissionWhatsapp, onSubmitted, registeredNames }) => {
  const [author1, setAuthor1] = useState("");
  const [author2, setAuthor2] = useState("");
  const [author3, setAuthor3] = useState("");
  const [author4, setAuthor4] = useState("");
  const [author5, setAuthor5] = useState("");
  const [institution, setInstitution] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const wordCount = useMemo(() => countWords(summary), [summary]);
  const overLimit = wordCount > MAX_WORDS;

  const getAuthorsString = () => {
    return [author1, author2, author3, author4, author5]
      .filter((a) => a.trim().length > 0)
      .join("; ");
  };

  const resetForm = () => {
    setAuthor1("");
    setAuthor2("");
    setAuthor3("");
    setAuthor4("");
    setAuthor5("");
    setInstitution("");
    setTitle("");
    setSummary("");
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      toast.error("Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
      return;
    }
    if (!author1.trim() || !institution.trim() || !title.trim() || !summary.trim()) {
      toast.error("Complete todos los campos obligatorios.");
      return;
    }
    if (overLimit) {
      toast.error(`El resumen no puede superar ${MAX_WORDS} palabras.`);
      return;
    }

    // Check author1 is registered
    const normAuthor1 = normalizeName(author1);
    const isRegistered = registeredNames.some(
      (rn) => normalizeName(rn) === normAuthor1 || namesAreSimilar(rn, author1),
    );
    if (!isRegistered) {
      toast.error("El autor principal debe estar registrado en la convención. Regístrate primero en el formulario de inscripción.");
      return;
    }

    const authorsStr = getAuthorsString();

    setSubmitting(true);
    const { error } = await sb.from("summaries").insert({
      commission_slug: commissionSlug,
      title: title.trim(),
      authors: authorsStr,
      institution: institution.trim(),
      summary: summary.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "No se pudo enviar el resumen.");
      return;
    }

    toast.success("Resumen publicado correctamente.");
    setSubmitted(true);
    onSubmitted();

    // Notify admins via Telegram (fire-and-forget)
    const commissionTitle =
      CONVENCION_COMMISSIONS.find((c) => c.slug === commissionSlug)?.title ?? commissionSlug;
    fetch("/api/notify-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        authors: authorsStr,
        institution: institution.trim(),
        commission: commissionTitle,
      }),
    }).catch(() => { /* silent */ });
  };

  if (submitted) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Resumen enviado</CardTitle>
          <CardDescription>
            Su resumen ha sido publicado en la comisión seleccionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">
              Únase al grupo oficial de WhatsApp de su comisión
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href={commissionWhatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" />
                Unirse al grupo
                <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
              </a>
            </Button>
          </div>
          <Button variant="secondary" onClick={resetForm}>
            Publicar otro resumen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Enviar resumen</CardTitle>
        <CardDescription>
          Máximo {MAX_WORDS} palabras, hasta 5 autores. El primer autor es obligatorio (debe estar registrado en la convención).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Autores</Label>
            <div className="space-y-2">
              <Input
                id="author1"
                value={author1}
                onChange={(e) => setAuthor1(e.target.value)}
                placeholder="Autor 1 *"
                maxLength={200}
              />
              <Input
                id="author2"
                value={author2}
                onChange={(e) => setAuthor2(e.target.value)}
                placeholder="Autor 2 (opcional)"
                maxLength={200}
                className="border-dashed border-muted-foreground/30"
              />
              <Input
                id="author3"
                value={author3}
                onChange={(e) => setAuthor3(e.target.value)}
                placeholder="Autor 3 (opcional)"
                maxLength={200}
                className="border-dashed border-muted-foreground/30"
              />
              <Input
                id="author4"
                value={author4}
                onChange={(e) => setAuthor4(e.target.value)}
                placeholder="Autor 4 (opcional)"
                maxLength={200}
                className="border-dashed border-muted-foreground/30"
              />
              <Input
                id="author5"
                value={author5}
                onChange={(e) => setAuthor5(e.target.value)}
                placeholder="Autor 5 (opcional)"
                maxLength={200}
                className="border-dashed border-muted-foreground/30"
              />
            </div>
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
