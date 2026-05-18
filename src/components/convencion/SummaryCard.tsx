import React, { useCallback, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSupabase } from "@/lib/supabase";

export interface SummaryRow {
  id: string;
  commission_slug: string;
  title: string;
  authors: string;
  institution: string;
  summary: string;
  created_at: string;
}

export interface CommentRow {
  id: string;
  summary_id: string;
  commenter_name: string;
  comment: string;
  created_at: string;
}

const MIN_COMMENT = 10;

export interface SummaryCardProps {
  summary: SummaryRow;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const loadComments = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setComments([]);
      setLoadingComments(false);
      return;
    }
    setLoadingComments(true);
    const { data, error } = await sb
      .from("comments")
      .select("id,summary_id,commenter_name,comment,created_at")
      .eq("summary_id", summary.id)
      .order("created_at", { ascending: true });
    setLoadingComments(false);
    if (error) {
      toast.error("No se pudieron cargar los comentarios.");
      setComments([]);
      return;
    }
    setComments((data as CommentRow[]) ?? []);
  }, [summary.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      toast.error("Supabase no está configurado.");
      return;
    }
    const trimmedName = name.trim();
    const trimmed = text.trim();
    if (!trimmedName) {
      toast.error("Indique su nombre.");
      return;
    }
    if (trimmed.length < MIN_COMMENT) {
      toast.error(`El comentario debe tener al menos ${MIN_COMMENT} caracteres.`);
      return;
    }

    setPosting(true);
    const { error } = await sb.from("comments").insert({
      summary_id: summary.id,
      commenter_name: trimmedName,
      comment: trimmed,
    });
    setPosting(false);

    if (error) {
      toast.error(error.message || "No se pudo publicar el comentario.");
      return;
    }

    toast.success("Opinión publicada.");
    setText("");
    await loadComments();
  };

  const dateLabel = new Date(summary.created_at).toLocaleString("es-CU", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && comments.length === 0 && !loadingComments) {
      setLoadingComments(true);
      loadComments().finally(() => setLoadingComments(false));
    }
  };

  return (
    <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="font-serif text-lg leading-snug">{summary.title}</CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground">{dateLabel}</CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="shrink-0 mt-0.5"
            aria-label={expanded ? "Contraer resumen" : "Leer resumen"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-foreground">Autor(es): </span>
            {summary.authors}
          </p>
          <p>
            <span className="font-medium text-foreground">Institución: </span>
            {summary.institution}
          </p>
        </div>

        {!expanded && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleToggle}
            className="mt-2 h-auto px-0 text-xs text-primary"
          >
            Leer resumen completo
          </Button>
        )}

        {expanded && (
          <div className="mt-3 space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm leading-relaxed text-foreground/95 whitespace-pre-wrap">
              {summary.summary}
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comentarios
              </p>
              {loadingComments ? (
                <p className="text-xs text-muted-foreground">Cargando…</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aún no hay comentarios. Sea el primero en opinar.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-md border border-border/50 bg-card/80 px-3 py-2 text-xs sm:text-sm"
                    >
                      <p className="font-medium text-foreground">{c.commenter_name}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{c.comment}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/80">
                        {new Date(c.created_at).toLocaleString("es-CU", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handlePostComment} className="space-y-3 rounded-lg border border-dashed border-border/70 p-3">
              <p className="text-xs font-medium text-foreground">Añadir opinión</p>
              <div className="space-y-1.5">
                <Label htmlFor={`cn-${summary.id}`} className="text-xs">
                  Nombre
                </Label>
                <Input
                  id={`cn-${summary.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Su nombre"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`ct-${summary.id}`} className="text-xs">
                  Comentario
                </Label>
                <Textarea
                  id={`ct-${summary.id}`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Mínimo 10 caracteres"
                  rows={3}
                  className="resize-y min-h-[72px]"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" disabled={posting}>
                {posting ? "Publicando…" : "Publicar opinión"}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
