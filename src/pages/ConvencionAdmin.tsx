import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Merge,
  MessageCircle,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  Users,
  Upload,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CONVENCION_COMMISSIONS } from "@/data/convencionCommissions";
import { getSupabase } from "@/lib/supabase";
import { levenshtein, namesAreSimilar } from "@/lib/nameMatch";

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

type AdminTab = "summaries" | "registrations" | "certificates";

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
  const [regError, setRegError] = useState<string | null>(null);
  const [regFilterCom, setRegFilterCom] = useState<string>("all");

  // Add registration form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCom, setNewCom] = useState(CONVENCION_COMMISSIONS[0]?.slug ?? "");
  const [newInst, setNewInst] = useState("");

  // CSV import
  const [csvText, setCsvText] = useState("");
  const [sheetsUrl, setSheetsUrl] = useState(() => localStorage.getItem("medestudia_sheets_url") ?? "");
  const [fetchingFromSheets, setFetchingFromSheets] = useState(false);
  const [syncingRegistrations, setSyncingRegistrations] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem("medestudia_last_sync"));

  // Name merging for certificate analysis (alias → canonical)
  const [nameMerges, setNameMerges] = useState<Map<string, string>>(new Map());
  const [mergesExpanded, setMergesExpanded] = useState(false);
  const [expandedCertRow, setExpandedCertRow] = useState<string | null>(null);

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

    if (regRes.error) {
      setRegError(regRes.error.message);
      setRegistrations([]);
    } else {
      setRegError(null);
      setRegistrations((regRes.data as RegistrationRow[]) ?? []);
    }

    // Load name merges from Supabase (with localStorage fallback migration)
    if (sb) {
      const { data: mergeRows } = await sb
        .from("name_merges")
        .select("alias, canonical");
      if (mergeRows && mergeRows.length > 0) {
        setNameMerges(new Map(mergeRows.map((r: { alias: string; canonical: string }) => [r.alias, r.canonical])));
      } else {
        // Migrate from localStorage if Supabase is empty
        const legacyRaw = localStorage.getItem("medestudia_name_merges");
        if (legacyRaw) {
          try {
            const legacy = new Map(JSON.parse(legacyRaw));
            if (legacy.size > 0) {
              setNameMerges(legacy);
              // Push to Supabase
              const rows = [...legacy.entries()].map(([alias, canonical]) => ({ alias, canonical }));
              const { error: migErr } = await sb.from("name_merges").upsert(rows, { onConflict: "alias" });
              if (!migErr) localStorage.removeItem("medestudia_name_merges");
            }
          } catch { /* ignore */ }
        }
      }
    }
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

  const certAnalysis = useMemo(() => {
    // Resolve a name to its canonical form using merges
    const resolve = (n: string): string => {
      const trimmed = n.trim();
      return nameMerges.get(trimmed) ?? trimmed;
    };

    const authorMap = new Map<
      string,
      { summaries: { title: string; commission: string }[]; institutions: Set<string> }
    >();

    for (const s of summaries) {
      const names = s.authors.split(";").map((n) => n.trim()).filter(Boolean);
      for (const raw of names) {
        const name = resolve(raw);
        if (!authorMap.has(name)) {
          authorMap.set(name, { summaries: [], institutions: new Set() });
        }
        const entry = authorMap.get(name)!;
        entry.summaries.push({ title: s.title, commission: s.commission_slug });
        if (s.institution) entry.institutions.add(s.institution);
      }
    }

    const commentCountMap = new Map<string, number>();
    for (const c of comments) {
      const name = resolve(c.commenter_name);
      commentCountMap.set(name, (commentCountMap.get(name) ?? 0) + 1);
    }

    // A participant is anyone who appears as author OR commenter
    const allNames = new Set([...authorMap.keys(), ...commentCountMap.keys()]);
    const results: {
      name: string;
      summariesCount: number;
      commentsCount: number;
      qualifies: boolean;
      summaries: { title: string; commission: string }[];
      institutions: string[];
    }[] = [];

    for (const name of allNames) {
      const authorData = authorMap.get(name);
      const sc = authorData?.summaries.length ?? 0;
      const cc = commentCountMap.get(name) ?? 0;
      if (sc === 0 && cc === 0) continue;
      results.push({
        name,
        summariesCount: sc,
        commentsCount: cc,
        qualifies: sc >= 1 && cc >= 2,
        summaries: authorData?.summaries ?? [],
        institutions: [...(authorData?.institutions ?? [])],
      });
    }

    results.sort((a, b) => {
      if (a.qualifies !== b.qualifies) return a.qualifies ? -1 : 1;
      return b.summariesCount + b.commentsCount - (a.summariesCount + a.commentsCount);
    });

    return results;
  }, [summaries, comments, nameMerges]);

  const certStats = useMemo(() => {
    const qualified = certAnalysis.filter((p) => p.qualifies);
    return {
      total: certAnalysis.length,
      qualified: qualified.length,
      pending: certAnalysis.length - qualified.length,
    };
  }, [certAnalysis]);

  /** Detect potential duplicate names not yet merged */
  const potentialDuplicates = useMemo(() => {
    const all: { nameA: string; nameB: string }[] = [];
    // Collect all raw names (pre-merge)
    const rawNames = new Set<string>();
    for (const s of summaries) {
      for (const n of s.authors.split(";").map((x) => x.trim()).filter(Boolean)) {
        rawNames.add(n);
      }
    }
    for (const c of comments) {
      rawNames.add(c.commenter_name.trim());
    }
    const list = [...rawNames].sort();
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (nameMerges.has(a) || nameMerges.has(b)) continue; // already merged
        const resolvedA = nameMerges.get(a) ?? a;
        const resolvedB = nameMerges.get(b) ?? b;
        if (resolvedA === resolvedB) continue; // same canonical already
        if (namesAreSimilar(a, b)) {
          all.push({ nameA: a, nameB: b });
        }
      }
    }
    return all;
  }, [summaries, comments, nameMerges]);

  const handleMerge = useCallback(async (alias: string, canonical: string) => {
    const sb = getSupabase();
    if (sb) {
      await sb.from("name_merges").upsert({ alias, canonical }, { onConflict: "alias" });
    }
    setNameMerges((prev) => {
      const next = new Map(prev);
      next.set(alias, canonical);
      return next;
    });
    toast.success(`"${alias}" fusionado → "${canonical}"`);
  }, []);

  const handleUnmerge = useCallback(async (alias: string) => {
    const sb = getSupabase();
    if (sb) {
      await sb.from("name_merges").delete().eq("alias", alias);
    }
    setNameMerges((prev) => {
      const next = new Map(prev);
      next.delete(alias);
      return next;
    });
    toast.success(`Fusión revertida para "${alias}"`);
  }, []);

  const handleClearAllMerges = useCallback(async () => {
    const sb = getSupabase();
    if (sb) {
      await sb.from("name_merges").delete().neq("alias", "__nonexistent__");
    }
    setNameMerges(new Map());
    toast.success("Todas las fusiones de nombres han sido revertidas.");
  }, []);

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

    // Check for duplicate
    const { data: existing } = await sb
      .from("registrations")
      .select("id, full_name, email")
      .eq("full_name", newName.trim())
      .eq("commission_slug", newCom)
      .limit(1);
    if (existing && existing.length > 0) {
      toast.warning(`Ya existe un registro para "${newName.trim()}" en esta comisión. Se ha omitido.`);
      return;
    }

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
    let skipped = 0;

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

      // Skip duplicate
      const { data: dup } = await sb
        .from("registrations")
        .select("id")
        .eq("full_name", name)
        .eq("commission_slug", comSlug)
        .limit(1);
      if (dup && dup.length > 0) {
        skipped++;
        continue;
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

    toast.success(
      `${imported} registros importados.${skipped ? ` ${skipped} duplicados omitidos.` : ""}${errors ? ` ${errors} errores.` : ""}`,
    );
    setCsvText("");
    await loadData();
  };

  const fetchFromSheets = async () => {
    const url = sheetsUrl.trim();
    if (!url) {
      toast.error("Pega la URL de la hoja publicada.");
      return;
    }
    setFetchingFromSheets(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      setCsvText(csv);
      toast.success("Datos cargados desde Google Sheets. Revisa e importa abajo.");
    } catch {
      toast.error("No se pudo obtener el CSV. Asegúrate de que la hoja esté publicada.");
    }
    setFetchingFromSheets(false);
  };

  const syncRegistrations = async () => {
    const url = sheetsUrl.trim();
    if (!url) {
      toast.error("Primero pega la URL de Google Sheets arriba.");
      return;
    }
    setSyncingRegistrations(true);
    try {
      const res = await fetch(`/api/sync-registrations?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al sincronizar.");
      } else {
        toast.success(
          `Sincronización completada: ${data.imported} importados, ${data.skipped} duplicados omitidos.`,
        );
        localStorage.setItem("medestudia_sheets_url", url);
        const now = new Date().toLocaleString("es-CU", { dateStyle: "short", timeStyle: "short" });
        localStorage.setItem("medestudia_last_sync", now);
        setLastSyncTime(now);
        await loadData();
      }
    } catch {
      toast.error("Error de conexión al sincronizar.");
    }
    setSyncingRegistrations(false);
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
          <button
            type="button"
            onClick={() => setTab("certificates")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "certificates"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Certificados ({certStats.qualified}/{certStats.total})
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
            {regError && (
              <Alert className="mb-6 border-amber-500/30 bg-amber-500/5">
                <AlertDescription className="text-sm">
                  La tabla de registros no existe en Supabase.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  commission_slug text not null,
  institution text,
  registered_at timestamptz not null default now()
);

create index if not exists registrations_commission_slug_idx on public.registrations (commission_slug);
create index if not exists registrations_name_idx on public.registrations (full_name);

alter table public.registrations enable row level security;

drop policy if exists "registrations_select_anon" on public.registrations;
drop policy if exists "registrations_insert_anon" on public.registrations;
drop policy if exists "registrations_delete_anon" on public.registrations;

create policy "registrations_select_anon" on public.registrations for select using (true);
create policy "registrations_insert_anon" on public.registrations for insert with check (true);
create policy "registrations_delete_anon" on public.registrations for delete using (true);`);
                      toast.success("SQL copiado. Pégalo en Supabase SQL Editor y ejecútalo.");
                    }}
                    className="underline text-primary hover:text-primary/80 font-medium"
                  >
                    Copiar SQL
                  </button>{" "}
                  y ejecútalo en Supabase Dashboard → SQL Editor.
                </AlertDescription>
              </Alert>
            )}

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

            {/* Google Sheets auto-import */}
            <Card className="border-border/80 shadow-sm mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Importar desde Google Sheets
                </CardTitle>
                <CardDescription>
                  Publica la hoja de respuestas del formulario como CSV y pega la URL aquí.
                  En Google Sheets: Archivo → Compartir → Publicar en web → CSV.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="sheets-url">URL pública de la hoja (CSV)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sheets-url"
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      variant="secondary"
                      onClick={fetchFromSheets}
                      disabled={fetchingFromSheets || !sheetsUrl.trim()}
                    >
                      {fetchingFromSheets ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-4 w-4" />
                      )}
                      Obtener
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Los datos se cargarán en el campo CSV de abajo. Luego haz clic en "Importar".
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={syncRegistrations}
                      disabled={syncingRegistrations || !sheetsUrl.trim()}
                    >
                      {syncingRegistrations ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-1.5 h-4 w-4" />
                      )}
                      Sincronizar ahora
                    </Button>
                    {lastSyncTime && (
                      <span className="text-xs text-muted-foreground">
                        Última sincronización: {lastSyncTime}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    La URL se guarda automáticamente. Para sincronización automática, configura una tarea
                    periódica (cron-job.org) que haga GET a{" "}
                    <code className="rounded bg-muted px-1 text-[10px]">
                      /api/sync-registrations?url=...
                    </code>
                  </p>
                </div>
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

        {/* ===== CERTIFICATES TAB ===== */}
        {tab === "certificates" && (
          <>
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total participantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{certStats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Califican para certificado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-500">{certStats.qualified}</p>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <XCircle className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-500">{certStats.pending}</p>
                </CardContent>
              </Card>
            </div>

            {/* Potential duplicates */}
            {potentialDuplicates.length > 0 && (
              <Card className="border-amber-500/40 shadow-sm mb-8">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Posibles duplicados detectados
                  </CardTitle>
                  <CardDescription>
                    Los siguientes nombres podrían pertenecer a la misma persona. Fusiónalos para unificar su
                    participación en el análisis de certificados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {potentialDuplicates.slice(0, 50).map((dup, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-foreground truncate">{dup.nameA}</span>
                          <span className="text-muted-foreground shrink-0">≈</span>
                          <span className="font-medium text-foreground truncate">{dup.nameB}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleMerge(dup.nameB, dup.nameA)}
                          >
                            ← Fusión
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleMerge(dup.nameA, dup.nameB)}
                          >
                            Fusión →
                          </Button>
                        </div>
                      </div>
                    ))}
                    {potentialDuplicates.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        ... y {potentialDuplicates.length - 50} más. Las primeras 50 sugerencias se muestran
                        arriba.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active merges indicator */}
            {nameMerges.size > 0 && (
              <Card className="border-border/80 shadow-sm mb-8">
                <button
                  type="button"
                  onClick={() => setMergesExpanded(!mergesExpanded)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Merge className="h-5 w-5 text-primary" />
                      Fusiones activas ({nameMerges.size})
                      <ChevronDown
                        className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${
                          mergesExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </CardTitle>
                    <CardDescription>
                      Nombres que se están tratando como la misma persona. Revierte individualmente o limpia todas.
                    </CardDescription>
                  </CardHeader>
                </button>
                {mergesExpanded && (
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[...nameMerges.entries()].map(([alias, canonical]) => (
                      <Badge key={alias} variant="secondary" className="gap-1.5 pl-2 pr-1.5 py-1 text-xs">
                        <span className="text-muted-foreground">{alias}</span>
                        <span className="text-muted-foreground/50">→</span>
                        <span className="text-foreground">{canonical}</span>
                        <button
                          type="button"
                          onClick={() => handleUnmerge(alias)}
                          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Revertir fusión"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleClearAllMerges}>
                    Limpiar todas las fusiones
                  </Button>
                </CardContent>
              )}
              </Card>
            )}

            {/* Commission breakdown for certificates */}
            <Card className="border-border/80 shadow-sm mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg">Análisis por comisión</CardTitle>
                <CardDescription>
                  Participantes que califican para certificado desglosados por comisión donde publicaron.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONVENCION_COMMISSIONS.map((c) => {
                    const count = certAnalysis.filter(
                      (p) => p.qualifies && p.summaries.some((s) => s.commission === c.slug),
                    ).length;
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

            {/* Export */}
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const resolve = (n: string): string =>
                    nameMerges.get(n.trim()) ?? n.trim();

                  const commentCount = new Map<string, number>();
                  for (const c of comments) {
                    const name = resolve(c.commenter_name);
                    commentCount.set(name, (commentCount.get(name) ?? 0) + 1);
                  }

                  const rows: string[] = [];
                  for (const s of summaries) {
                    const authors = s.authors
                      .split(";")
                      .map((a) => a.trim())
                      .filter(Boolean);

                    // Author1 always included
                    const author1 = resolve(authors[0] ?? "");
                    if (author1) {
                      rows.push(`"${author1}","${s.title}"`);
                    }

                    // Co-authors only if they have ≥2 comments
                    for (let i = 1; i < authors.length; i++) {
                      const name = resolve(authors[i]);
                      if (name && (commentCount.get(name) ?? 0) >= 2) {
                        rows.push(`"${name}","${s.title}"`);
                      }
                    }
                  }

                  const header = "Participante,Título del Resumen";
                  const blob = new Blob([header + "\n" + rows.join("\n")], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `participantes-por-resumen-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success(`${rows.length} filas exportadas.`);
                }}
                disabled={summaries.length === 0}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Participantes por resumen (CSV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const qualified = certAnalysis.filter((p) => p.qualifies);
                  const header = "Nombre,Resúmenes,Comentarios,Comisiones,Institución";
                  const rows = qualified.map((p) =>
                    [
                      `"${p.name}"`,
                      p.summariesCount,
                      p.commentsCount,
                      `"${[...new Set(p.summaries.map((s) => getCommissionTitle(s.commission)))].join("; ")}"`,
                      `"${p.institutions.join("; ")}"`,
                    ].join(","),
                  );
                  const blob = new Blob([header + "\n" + rows.join("\n")], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `convencion-qualified-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("CSV exportado.");
                }}
                disabled={certStats.qualified === 0}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Exportar calificados (CSV)
              </Button>
            </div>

            {/* Results table */}
            <section className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Analizando participación…</p>
              ) : certAnalysis.length === 0 ? (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Sin datos</CardTitle>
                    <CardDescription>
                      Aún no hay resúmenes ni comentarios publicados. Los resultados aparecerán aquí
                      automáticamente.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border/80">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/30">
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground min-w-[100px]">
                          Participante
                        </th>
                        <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-[90px]">
                          Resúmenes
                        </th>
                        <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-[100px]">
                          Comentarios
                        </th>
                        <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-[70px]">Estado</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                          Títulos
                        </th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                          Comisiones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {certAnalysis.map((p) => (
                        <React.Fragment key={p.name}>
                          <tr
                            className={`border-b border-border/40 hover:bg-muted/20 cursor-pointer ${
                              p.qualifies ? "" : "opacity-60"
                            }`}
                            onClick={() =>
                              setExpandedCertRow(expandedCertRow === p.name ? null : p.name)
                            }
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <ChevronDown
                                  className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                                    expandedCertRow === p.name ? "rotate-0" : "-rotate-90"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate max-w-[200px]">
                                    {p.name}
                                  </p>
                                  {p.institutions.length > 0 && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {p.institutions.join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              variant={p.summariesCount >= 1 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {p.summariesCount}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              variant={p.commentsCount >= 2 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {p.commentsCount}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {p.qualifies ? (
                              <CheckCircle2 className="inline h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="inline h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[280px]">
                            {p.summaries.length > 0 ? (
                              <ul className="list-disc list-inside space-y-0.5">
                                {p.summaries.map((s, i) => (
                                  <li key={i} className="truncate" title={s.title}>
                                    {s.title}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">
                            {[...new Set(p.summaries.map((s) => getCommissionTitle(s.commission)))].join("; ") ||
                              "—"}
                          </td>
                        </tr>
                        {expandedCertRow === p.name && (
                          <tr className="border-b border-border/40 bg-muted/10">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="space-y-2 text-sm">
                                <p className="font-medium text-foreground mb-1">Resúmenes</p>
                                {p.summaries.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">Ninguno.</p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {p.summaries.map((s, i) => (
                                      <li key={i} className="text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">
                                          {getCommissionTitle(s.commission)}
                                        </span>
                                        : {s.title}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                <p className="font-medium text-foreground mb-1 mt-3">Comentarios</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.commentsCount}{" "}
                                  {p.commentsCount === 1 ? "comentario realizado" : "comentarios realizados"}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
