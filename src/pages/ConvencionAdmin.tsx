import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft,
  Download,
  FileText,
  MessageCircle,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CONVENCION_COMMISSIONS, type CommissionDefinition } from "@/data/convencionCommissions";
import { getSupabase } from "@/lib/supabase";

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

const ADMIN_TOKEN_KEY = "medestudia_admin_auth";

function checkPassword(input: string): boolean {
  const expected = import.meta.env.VITE_ADMIN_PASSWORD;
  if (!expected) return false;
  return input === expected;
}

function isAuthenticated(): boolean {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) === "true";
}

function setAuthenticated(val: boolean): void {
  if (val) {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, "true");
  } else {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

function getCommissionTitle(slug: string): string {
  return CONVENCION_COMMISSIONS.find((c) => c.slug === slug)?.title ?? slug;
}

const ConvencionAdmin: React.FC = () => {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);
  const [filterCom, setFilterCom] = useState<string>("all");

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      toast.error("Supabase no está configurado.");
      setLoading(false);
      return;
    }
    setLoading(true);

    const [sumRes, comRes] = await Promise.all([
      sb.from("summaries").select("*").order("created_at", { ascending: false }),
      sb.from("comments").select("*").order("created_at", { ascending: true }),
    ]);

    setLoading(false);

    if (sumRes.error) {
      toast.error("Error al cargar resúmenes.");
      return;
    }
    if (comRes.error) {
      toast.error("Error al cargar comentarios.");
      return;
    }

    setSummaries((sumRes.data as SummaryRow[]) ?? []);
    setComments((comRes.data as CommentRow[]) ?? []);
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  const commentsBySummary = useMemo(() => {
    const map = new Map<string, CommentRow[]>();
    for (const c of comments) {
      const list = map.get(c.summary_id);
      if (list) list.push(c);
      else map.set(c.summary_id, [c]);
    }
    return map;
  }, [comments]);

  const stats = useMemo(() => {
    const byCom = new Map<string, number>();
    for (const s of summaries) {
      byCom.set(s.commission_slug, (byCom.get(s.commission_slug) ?? 0) + 1);
    }
    return {
      total: summaries.length,
      comments: comments.length,
      byCommission: Object.fromEntries(byCom),
    };
  }, [summaries, comments]);

  const filteredSummaries = useMemo(() => {
    if (filterCom === "all") return summaries;
    return summaries.filter((s) => s.commission_slug === filterCom);
  }, [summaries, filterCom]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPassword(password)) {
      setAuthenticated(true);
      setAuthed(true);
      setPassword("");
    } else {
      toast.error("Contraseña incorrecta.");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setAuthed(false);
    setSummaries([]);
    setComments([]);
  };

  const exportCSV = () => {
    const header = "Comisión,Título,Autores,Institución,Resumen,Comentarios,Fecha";
    const rows = summaries.map((s) => {
      const comComments = commentsBySummary.get(s.id) ?? [];
      const commentsText = comComments.map((c) => `${c.commenter_name}: ${c.comment}`).join(" | ");
      const summaryShort = s.summary.replace(/"/g, '""').slice(0, 500);
      return [
        `"${getCommissionTitle(s.commission_slug)}"`,
        `"${s.title}"`,
        `"${s.authors}"`,
        `"${s.institution}"`,
        `"${summaryShort}"`,
        `"${commentsText}"`,
        `"${new Date(s.created_at).toLocaleDateString("es-CU")}"`,
      ].join(",");
    });

    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `convencion-summaries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV descargado.");
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border-border/80">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 rounded-full bg-primary/10 p-3 w-fit text-primary">
                <Shield className="h-7 w-7" />
              </div>
              <CardTitle className="font-serif text-2xl">Acceso restringido</CardTitle>
              <CardDescription>Ingrese la contraseña de administrador para acceder al panel.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-pw">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="admin-pw"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Entrar al panel
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-5xl py-8 md:py-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" asChild>
              <Link to="/convencion">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Volver a la convención
              </Link>
            </Button>
            <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
              Panel de administración
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestión de resúmenes y comentarios de la Convención Científica 2026
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={summaries.length === 0}>
              <Download className="mr-1.5 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Resúmenes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center gap-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Comentarios</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats.comments}</p>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Comisiones</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{Object.keys(stats.byCommission).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Per-commission breakdown */}
        <Card className="border-border/80 shadow-sm mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg">Resúmenes por comisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONVENCION_COMMISSIONS.map((c) => {
                const count = stats.byCommission[c.slug] ?? 0;
                return (
                  <div
                    key={c.slug}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                  >
                    <span className="text-sm text-foreground truncate mr-2">{c.title}</span>
                    <Badge variant={count > 0 ? "default" : "secondary"} className="shrink-0">
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-3">
          <Label htmlFor="filter-com" className="text-sm font-medium shrink-0">
            Filtrar por comisión:
          </Label>
          <select
            id="filter-com"
            value={filterCom}
            onChange={(e) => setFilterCom(e.target.value)}
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Todas las comisiones</option>
            {CONVENCION_COMMISSIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Summaries list */}
        <section className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando resúmenes…</p>
          ) : filteredSummaries.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base font-medium">No hay resúmenes</CardTitle>
                <CardDescription>
                  {filterCom === "all"
                    ? "Aún no se ha publicado ningún resumen."
                    : "No hay resúmenes en esta comisión."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            filteredSummaries.map((s) => {
              const comComments = commentsBySummary.get(s.id) ?? [];
              const isExpanded = expandedSummary === s.id;
              return (
                <Card
                  key={s.id}
                  className="border-border/80 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="font-serif text-base leading-snug">{s.title}</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {getCommissionTitle(s.commission_slug)} —{" "}
                          {new Date(s.created_at).toLocaleString("es-CU", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {comComments.length} comentarios
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-foreground">Autores: </span>
                      {s.authors}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Institución: </span>
                      {s.institution}
                    </p>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3 leading-relaxed text-foreground/90 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {s.summary}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedSummary(isExpanded ? null : s.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {isExpanded ? "Ocultar comentarios" : `Ver comentarios (${comComments.length})`}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 pt-2">
                        {comComments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Sin comentarios.</p>
                        ) : (
                          comComments.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-md border border-border/50 bg-card/80 px-3 py-2 text-xs"
                            >
                              <p className="font-medium text-foreground">{c.commenter_name}</p>
                              <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{c.comment}</p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                                {new Date(c.created_at).toLocaleString("es-CU", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
};

export default ConvencionAdmin;
