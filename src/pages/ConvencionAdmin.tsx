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
  Upload,
  Trash2,
  UserPlus,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CONVENCION_COMMISSIONS } from "@/data/convencionCommissions";
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

interface RegistrationRow {
  id: string;
  full_name: string;
  email: string | null;
  commission_slug: string;
  institution: string | null;
  registered_at: string;
}

const ADMIN_TOKEN_KEY = "medestudia_admin_auth";

async function checkPassword(input: string): Promise<boolean> {
  try {
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: input }),
    });
    return res.ok;
  } catch {
    return false;
  }
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

type AdminTab = "summaries" | "registrations";

const ConvencionAdmin: React.FC = () => {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [tab, setTab] = useState<AdminTab>("summaries");
  const [loading, setLoading] = useState(true);
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

  // Summaries data
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [filterCom, setFilterCom] = useState<string>("all");

  // Registration data
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [regFilterCom, setRegFilterCom] = useState<string>("all");

  // Add registration form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCom, setNewCom] = useState(CONVENCION_COMMISSIONS[0]?.slug ?? "");
  const [newInst, setNewInst] = useState("");

  // CSV import
  const [csvText, setCsvText] = useState("");

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      toast.error("Supabase no está configurado.");
      setLoading(false);
      return;
    }
    setLoading(true);

    const [sumRes, comRes, regRes] = await Promise.all([
      sb.from("summaries").select("*").order("created_at", { ascending: false }),
      sb.from("comments").select("*").order("created_at", { ascending: true }),
      sb.from("registrations").select("*").order("registered_at", { ascending: false }),
    ]);

    setLoading(false);

    if (sumRes.error) toast.error("Error al cargar resúmenes.");
    else setSummaries((sumRes.data as SummaryRow[]) ?? []);

    if (comRes.error) toast.error("Error al cargar comentarios.");
    else setComments((comRes.data as CommentRow[]) ?? []);

    if (regRes.error) toast.error("Error al cargar registros.");
    else setRegistrations((regRes.data as RegistrationRow[]) ?? []);
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

  const regStats = useMemo(() => {
    const byCom = new Map<string, number>();
    for (const r of registrations) {
      byCom.set(r.commission_slug, (byCom.get(r.commission_slug) ?? 0) + 1);
    }
    return {
      total: registrations.length,
      byCommission: Object.fromEntries(byCom),
    };
  }, [registrations]);

  const filteredSummaries = useMemo(() => {
    if (filterCom === "all") return summaries;
    return summaries.filter((s) => s.commission_slug === filterCom);
  }, [summaries, filterCom]);

  const filteredRegistrations = useMemo(() => {
    if (regFilterCom === "all") return registrations;
    return registrations.filter((r) => r.commission_slug === regFilterCom);
  }, [registrations, regFilterCom]);

  // --- Auth ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await checkPassword(password);
    if (ok) {
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
    setRegistrations([]);
  };

  // --- CSV export (summaries) ---

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

  const exportRegCSV = () => {
    const header = "Nombre,Email,Comisión,Institución,Fecha de registro";
    const rows = filteredRegistrations.map((r) =>
      [
        `"${r.full_name}"`,
        `"${r.email ?? ""}"`,
        `"${getCommissionTitle(r.commission_slug)}"`,
        `"${r.institution ?? ""}"`,
        `"${new Date(r.registered_at).toLocaleDateString("es-CU")}"`,
      ].join(","),
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `convencion-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV descargado.");
  };

  // --- Registration management ---

  const addRegistration = async () => {
    if (!newName.trim() || !newCom) {
      toast.error("Nombre y comisión son obligatorios.");
      return;
    }
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from("registrations").insert({
      full_name: newName.trim(),
      email: newEmail.trim() || null,
      commission_slug: newCom,
      institution: newInst.trim() || null,
    });
    if (error) {
      toast.error(error.message || "Error al añadir registro.");
      return;
    }
    toast.success("Registro añadido.");
    setNewName("");
    setNewEmail("");
    setNewInst("");
    await loadData();
  };

  const deleteRegistration = async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from("registrations").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar registro.");
      return;
    }
    toast.success("Registro eliminado.");
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
  };

  const importCSV = async () => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      toast.error("El CSV debe tener al menos un encabezado y una fila de datos.");
      return;
    }

    // Try to detect delimiter and columns
    const header = lines[0].toLowerCase();
    const delim = header.includes("\t") ? "\t" : ",";
    const cols = header.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));

    // Map common column names
    const nameIdx = cols.findIndex(
      (c) => c.includes("nombre") || c.includes("name") || c.includes("apellido"),
    );
    const emailIdx = cols.findIndex((c) => c.includes("email") || c.includes("correo") || c.includes("mail"));
    const comIdx = cols.findIndex(
      (c) => c.includes("comisión") || c.includes("comision") || c.includes("commission"),
    );
    const instIdx = cols.findIndex(
      (c) => c.includes("institución") || c.includes("institucion") || c.includes("institution") || c.includes("centro") || c.includes("facultad"),
    );

    if (nameIdx === -1) {
      toast.error("No se encontró una columna de nombre. Asegúrese de incluir 'Nombre'.");
      return;
    }

    const sb = getSupabase();
    if (!sb) return;

    let imported = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));
      const name = row[nameIdx]?.trim();
      if (!name) continue;

      const email = emailIdx >= 0 ? (row[emailIdx]?.trim() ?? "") : "";
      const inst = instIdx >= 0 ? (row[instIdx]?.trim() ?? "") : "";

      // Try to match commission from the CSV
      let comSlug = newCom || CONVENCION_COMMISSIONS[0].slug;
      if (comIdx >= 0) {
        const csvCom = row[comIdx]?.trim().toLowerCase() ?? "";
        const match = CONVENCION_COMMISSIONS.find(
          (c) =>
            c.title.toLowerCase().includes(csvCom) ||
            csvCom.includes(c.title.toLowerCase().slice(0, 10)),
        );
        if (match) comSlug = match.slug;
      }

      const { error } = await sb.from("registrations").insert({
        full_name: name,
        email: email || null,
        commission_slug: comSlug,
        institution: inst || null,
      });

      if (error) errors++;
      else imported++;
    }

    toast.success(`${imported} registros importados.${errors ? ` ${errors} errores.` : ""}`);
    setCsvText("");
    await loadData();
  };

  // --- Login screen ---

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
              <CardDescription>Ingrese la contraseña de administrador.</CardDescription>
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
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
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
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("summaries")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "summaries"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Resúmenes ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTab("registrations")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "registrations"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Registros ({regStats.total})
          </button>
        </div>

        {/* ===== SUMMARIES TAB ===== */}
        {tab === "summaries" && (
          <>
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resúmenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Comentarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{stats.comments}</p>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Comisiones activas</CardTitle>
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

            {/* Summaries */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="filter-com" className="text-sm font-medium shrink-0">
                  Filtrar:
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
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={summaries.length === 0}>
                <Download className="mr-1.5 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

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
                    <Card key={s.id} className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
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
                          {isExpanded
                            ? "Ocultar comentarios"
                            : `Ver comentarios (${comComments.length})`}
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
                                  <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                                    {c.comment}
                                  </p>
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
          </>
        )}

        {/* ===== REGISTRATIONS TAB ===== */}
        {tab === "registrations" && (
          <>
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total registrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{regStats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resúmenes publicados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Comisiones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{Object.keys(regStats.byCommission).length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Per-commission breakdown */}
            <Card className="border-border/80 shadow-sm mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg">Registros por comisión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONVENCION_COMMISSIONS.map((c) => {
                    const count = regStats.byCommission[c.slug] ?? 0;
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

            {/* Add registration form */}
            <Card className="border-border/80 shadow-sm mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Añadir registro manual
                </CardTitle>
                <CardDescription>
                  Añada participantes que se registraron vía Google Form u otros medios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name">Nombre *</Label>
                    <Input
                      id="reg-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nombre completo"
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      maxLength={300}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-com">Comisión *</Label>
                    <select
                      id="reg-com"
                      value={newCom}
                      onChange={(e) => setNewCom(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {CONVENCION_COMMISSIONS.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-inst">Institución</Label>
                    <Input
                      id="reg-inst"
                      value={newInst}
                      onChange={(e) => setNewInst(e.target.value)}
                      placeholder="Facultad"
                      maxLength={300}
                    />
                  </div>
                </div>
                <Button className="mt-4" onClick={addRegistration}>
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Añadir registro
                </Button>
              </CardContent>
            </Card>

            {/* CSV Import */}
            <Card className="border-border/80 shadow-sm mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Importar desde CSV
                </CardTitle>
                <CardDescription>
                  Copie los datos desde Google Sheets (Archivo → Descargar → CSV) y péguelos aquí.
                  La primera fila debe contener los encabezados (Nombre, Email, Comisión, Institución).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="csv-input">Datos CSV</Label>
                  <textarea
                    id="csv-input"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Nombre,Email,Comisión,Institución&#10;Ana López,ana@ejemplo.com,educacion-medica,FCM Julio Trigo&#10;Carlos Pérez,carlos@ejemplo.com,aps-pami,FCM Julio Trigo"
                    rows={5}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[100px] font-mono"
                  />
                </div>
                <Button className="mt-3" onClick={importCSV} disabled={!csvText.trim()}>
                  <Upload className="mr-1.5 h-4 w-4" />
                  Importar
                </Button>
              </CardContent>
            </Card>

            {/* Registrations table */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="reg-filter" className="text-sm font-medium shrink-0">
                  Filtrar:
                </Label>
                <select
                  id="reg-filter"
                  value={regFilterCom}
                  onChange={(e) => setRegFilterCom(e.target.value)}
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
              <Button variant="outline" size="sm" onClick={exportRegCSV} disabled={registrations.length === 0}>
                <Download className="mr-1.5 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            <section className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando registros…</p>
              ) : filteredRegistrations.length === 0 ? (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">No hay registros</CardTitle>
                    <CardDescription>
                      {regFilterCom === "all"
                        ? "Aún no se ha registrado ningún participante."
                        : "No hay registros en esta comisión."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border/80">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/30">
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Nombre</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                          Email
                        </th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                          Comisión
                        </th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">
                          Institución
                        </th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                          Fecha
                        </th>
                        <th className="px-3 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistrations.map((r) => (
                        <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20">
                          <td className="px-3 py-2.5 font-medium text-foreground">{r.full_name}</td>
                          <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">
                            {r.email ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">
                            <Badge variant="outline" className="text-xs font-normal">
                              {getCommissionTitle(r.commission_slug)}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">
                            {r.institution ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground text-xs hidden sm:table-cell">
                            {new Date(r.registered_at).toLocaleDateString("es-CU")}
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => deleteRegistration(r.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ConvencionAdmin;
