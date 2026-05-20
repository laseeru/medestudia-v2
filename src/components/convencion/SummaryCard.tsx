import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Edit3, Trash2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSupabase } from "@/lib/supabase";
import { namesAreSimilar, normalizeName } from "@/lib/nameMatch";

const MIN_COMMENT = 10;
const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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

export interface SummaryCardProps {
  summary: SummaryRow;
  registeredNames: string[];
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, registeredNames }) => {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  // Edit mode for the summary itself
  const [editingSummary, setEditingSummary] = useState(false);
  const [editTitle, setEditTitle] = useState(summary.title);
  const [editSummary, setEditSummary] = useState(summary.summary);
  const [editAuthors, setEditAuthors] = useState(summary.authors);
  const [editInstitution, setEditInstitution] = useState(summary.institution);
  const [editSaving, setEditSaving] = useState(false);

  // Edit mode for comments (stores comment id being edited)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Delete confirmations
  const [confirmDeleteSummary, setConfirmDeleteSummary] = useState(false);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);

  const isWithinWindow = useCallback((createdAt: string) => {
    return Date.now() - new Date(createdAt).getTime() <= EDIT_WINDOW_MS;
  }, []);

  // Check if the claimed name (from comment form) matches the summary author
  const claimedName = name.trim();

  const isSummaryOwner = useMemo(() => {
    if (!claimedName) return false;
    const authors = summary.authors.split(";").map((a) => a.trim()).filter(Boolean);
    return authors.some((a) => namesAreSimilar(a, claimedName) || normalizeName(a) === normalizeName(claimedName));
  }, [claimedName, summary.authors]);

  const canEditSummary = isSummaryOwner && isWithinWindow(summary.created_at);

  // Check if claimed name matches a commenter
  const isCommentOwner = useCallback(
    (commenterName: string) => {
      if (!claimedName) return false;
      return namesAreSimilar(commenterName, claimedName) || normalizeName(commenterName) === normalizeName(claimedName);
    },
    [claimedName],
  );

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

    // Check commenter is registered
    const isRegistered = registeredNames.some(
      (rn) => normalizeName(rn) === normalizeName(trimmedName) || namesAreSimilar(rn, trimmedName),
    );
    if (!isRegistered) {
      toast.error("Debes estar registrado en la convención para comentar. Regístrate primero en el formulario de inscripción.");
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

  const handleEditSummary = async () => {
    const sb = getSupabase();
    if (!sb) return;
    if (!editTitle.trim() || !editSummary.trim()) {
      toast.error("El título y el contenido no pueden estar vacíos.");
      return;
    }
    if (!editAuthors.trim()) {
      toast.error("Debe haber al menos un autor.");
      return;
    }
    setEditSaving(true);
    const { error } = await sb
      .from("summaries")
      .update({
        title: editTitle.trim(),
        summary: editSummary.trim(),
        authors: editAuthors.trim(),
        institution: editInstitution.trim() || null,
      })
      .eq("id", summary.id);
    setEditSaving(false);
    if (error) {
      toast.error(error.message || "Error al actualizar.");
      return;
    }
    toast.success("Resumen actualizado.");
    setEditingSummary(false);
    // Update the summary object in place
    summary.title = editTitle.trim();
    summary.summary = editSummary.trim();
    summary.authors = editAuthors.trim();
    summary.institution = editInstitution.trim();
  };

  const handleDeleteSummary = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from("summaries").delete().eq("id", summary.id);
    if (error) {
      toast.error(error.message || "Error al eliminar.");
      return;
    }
    toast.success("Resumen eliminado.");
    setConfirmDeleteSummary(false);
    // Reload the page to remove this card (parent will pick up the change)
    window.location.reload();
  };

  const handleEditComment = async (commentId: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const trimmed = editCommentText.trim();
    if (trimmed.length < MIN_COMMENT) {
      toast.error(`El comentario debe tener al menos ${MIN_COMMENT} caracteres.`);
      return;
    }
    const { error } = await sb.from("comments").update({ comment: trimmed }).eq("id", commentId);
    if (error) {
      toast.error(error.message || "Error al actualizar.");
      return;
    }
    toast.success("Comentario actualizado.");
    setEditingCommentId(null);
    setEditCommentText("");
    await loadComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from("comments").delete().eq("id", commentId);
    if (error) {
      toast.error(error.message || "Error al eliminar.");
      return;
    }
    toast.success("Comentario eliminado.");
    setConfirmDeleteCommentId(null);
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

  const timeLeft = useMemo(() => {
    if (!isWithinWindow(summary.created_at)) return null;
    const remaining = EDIT_WINDOW_MS - (Date.now() - new Date(summary.created_at).getTime());
    const mins = Math.floor(remaining / 60000);
    if (mins <= 0) return null;
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}min`;
  }, [summary.created_at, isWithinWindow]);

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

        {/* Owner badge */}
        {canEditSummary && claimedName && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-primary/70">
              Eres autor — {timeLeft ? `${timeLeft} para editar` : "ventana de edición cerrada"}
            </span>
          </div>
        )}

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
            {/* Summary content or edit form */}
            {editingSummary ? (
              <div className="space-y-3 rounded-md border border-primary/30 bg-muted/20 p-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Autores</Label>
                  <Input
                    value={editAuthors}
                    onChange={(e) => setEditAuthors(e.target.value)}
                    placeholder="Separados por punto y coma"
                    maxLength={500}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Institución</Label>
                  <Input
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    maxLength={300}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Título</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={400} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Resumen</Label>
                  <Textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={8}
                    className="min-h-[160px] resize-y"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEditSummary} disabled={editSaving}>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    {editSaving ? "Guardando…" : "Guardar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingSummary(false);
                      setEditTitle(summary.title);
                      setEditSummary(summary.summary);
                      setEditAuthors(summary.authors);
                      setEditInstitution(summary.institution);
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm leading-relaxed text-foreground/95 whitespace-pre-wrap">
                {summary.summary}
              </div>
            )}

            {/* Summary edit/delete buttons */}
            {canEditSummary && !editingSummary && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setEditTitle(summary.title);
                    setEditSummary(summary.summary);
                    setEditAuthors(summary.authors);
                    setEditInstitution(summary.institution);
                    setEditingSummary(true);
                  }}
                >
                  <Edit3 className="mr-1 h-3 w-3" />
                  Editar
                </Button>
                {confirmDeleteSummary ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={handleDeleteSummary}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setConfirmDeleteSummary(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setConfirmDeleteSummary(true)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Eliminar
                  </Button>
                )}
              </div>
            )}

            <Separator />

            {/* Comments section */}
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
                  {comments.map((c) => {
                    const owned = isCommentOwner(c.commenter_name) && isWithinWindow(c.created_at);
                    return (
                      <li
                        key={c.id}
                        className="rounded-md border border-border/50 bg-card/80 px-3 py-2 text-xs sm:text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground">{c.commenter_name}</p>
                          {owned && !editingCommentId && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditCommentText(c.comment);
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Editar"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              {confirmDeleteCommentId === c.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="text-destructive hover:text-destructive/80 transition-colors"
                                    title="Confirmar eliminar"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteCommentId(null)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    title="Cancelar"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCommentId(c.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {editingCommentId === c.id ? (
                          <div className="mt-1 space-y-1.5">
                            <Textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              rows={3}
                              className="min-h-[60px] resize-y text-xs"
                            />
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => handleEditComment(c.id)}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditCommentText("");
                                }}
                              >
                                <X className="mr-1 h-3 w-3" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{c.comment}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground/80">
                              {new Date(c.created_at).toLocaleString("es-CU", { dateStyle: "short", timeStyle: "short" })}
                            </p>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Comment form */}
            <form onSubmit={handlePostComment} className="space-y-3 rounded-lg border border-dashed border-border/70 p-3">
              <p className="text-xs font-medium text-foreground">
                Añadir opinión
                {claimedName && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    (usuario: <span className="text-primary font-medium">{claimedName}</span>)
                  </span>
                )}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor={`cn-${summary.id}`} className="text-xs">
                  Nombre
                </Label>
                <Input
                  id={`cn-${summary.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Su nombre (para comentar y gestionar sus publicaciones)"
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
