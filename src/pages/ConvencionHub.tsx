import React, { useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { applySeo } from "@/lib/seo";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Info,
  MessageCircle,
  Monitor,
  ScrollText,
  Users,
  Award,
  ClipboardList,
  ChevronRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  CONVENCION_COMMISSIONS,
  importantRules,
  participationSteps,
  REGISTRATION_FORM_URL,
} from "@/data/convencionCommissions";

interface QuickNavItem {
  id: string;
  label: string;
}

const quickNavItems: QuickNavItem[] = [
  { id: "informacion", label: "Información" },
  { id: "comisiones", label: "Comisiones" },
  { id: "grupos-whatsapp", label: "WhatsApp" },
  { id: "participacion", label: "Participación" },
  { id: "inscripcion", label: "Inscripción" },
  { id: "certificados", label: "Certificados" },
];

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const ConvencionHub: React.FC = () => {
  const navigate = useNavigate();
  const scrollToRegistration = useCallback(() => scrollToSection("inscripcion"), []);

  useEffect(() => {
    applySeo({
      title: "Convención Científica Estudiantil 2026",
      description:
        "Evento académico para estudiantes de ciencias médicas enfocado en innovación, investigación y educación médica.",
      url: "https://medestudia-v2.vercel.app/convencion",
      image: "https://medestudia-v2.vercel.app/og-convencion.png",
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Navegación rápida — escritorio */}
      <nav
        className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 rounded-xl border border-border/80 bg-card/90 p-2 shadow-lg backdrop-blur-md md:flex lg:right-6"
        aria-label="Navegación rápida"
      >
        {quickNavItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Navegación rápida — móvil */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex gap-1 overflow-x-auto border-t border-border bg-card/95 px-2 py-2 backdrop-blur-md md:hidden"
        aria-label="Navegación rápida"
      >
        {quickNavItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className="shrink-0 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 pb-24 md:pb-12">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.25), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, hsl(var(--secondary) / 0.12), transparent 50%)",
            }}
          />
          <div className="container relative max-w-4xl py-14 md:py-20 lg:py-24">
            <motion.div {...fadeIn}>
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Evento Virtual • 2026
              </span>
              <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl text-balance">
                Convención Científica 2026
              </h1>
              <p className="mt-3 text-base font-medium text-primary md:text-lg">
                25 al 29 de mayo de 2026
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg text-pretty">
                Espacio virtual para el intercambio científico, académico e investigativo de estudiantes y
                profesionales de las ciencias médicas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={scrollToRegistration} className="font-semibold">
                  Inscribirse
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollToSection("informacion")}>
                  Ver información
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container max-w-5xl space-y-16 py-12 md:py-16 lg:space-y-20 lg:py-20">
          {/* Información del evento */}
          <motion.section id="informacion" {...fadeIn} className="scroll-mt-24">
            <div className="mb-8 flex items-end gap-3">
              <div className="rounded-lg bg-secondary/15 p-2 text-secondary">
                <Info className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Información del evento</h2>
                <p className="mt-1 text-sm text-muted-foreground">Datos generales y modalidad de participación</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Monitor,
                  label: "Modalidad",
                  value: "Virtual",
                },
                {
                  icon: Calendar,
                  label: "Fecha",
                  value: "25 al 29 de mayo de 2026",
                },
                {
                  icon: GraduationCap,
                  label: "Organización",
                  value: "Facultad de Ciencias Médicas, Julio Trigo López",
                },
                {
                  icon: Users,
                  label: "Participación",
                  value: "Mediante comisiones científicas",
                },
              ].map((item) => (
                <Card
                  key={item.label}
                  className="border-border/80 bg-gradient-to-b from-card to-card/80 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <item.icon className="h-5 w-5 text-primary" aria-hidden />
                    <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-semibold leading-snug text-foreground">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>

          <Separator className="opacity-50" />

          {/* Comisiones */}
          <motion.section id="comisiones" {...fadeIn} className="scroll-mt-24">
            <div className="mb-8 flex items-end gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Comisiones científicas</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acceda a la comisión para publicar y comentar resúmenes, o diríjase al grupo oficial de WhatsApp.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {CONVENCION_COMMISSIONS.map((c, i) => (
                <motion.div
                  key={c.slug}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-24px" }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="h-full border-border/80 shadow-sm transition-all hover:border-primary/25 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg leading-snug">{c.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">{c.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        type="button"
                        className="w-full sm:w-auto"
                        onClick={() => navigate(`/convencion/comision/${c.slug}`)}
                      >
                        Entrar a la comisión
                      </Button>
                      <Button asChild variant="outline" className="w-full sm:w-auto">
                        <a href={c.whatsapp} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <Separator className="opacity-50" />

          {/* Grupos oficiales de WhatsApp */}
          <motion.section id="grupos-whatsapp" {...fadeIn} className="scroll-mt-24">
            <div className="mb-8 flex items-end gap-3">
              <div className="rounded-lg bg-[#25D366]/10 p-2 text-[#25D366]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Grupos oficiales de WhatsApp</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Canales oficiales de cada comisión científica
                </p>
              </div>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Cada participante debe unirse al grupo oficial correspondiente a su comisión científica para recibir
              orientaciones, actualizaciones y actividades relacionadas con el evento.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {CONVENCION_COMMISSIONS.map((c, i) => (
                <motion.div
                  key={c.slug}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-24px" }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="h-full border-border/80 shadow-sm transition-all hover:border-[#25D366]/30 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="font-serif text-base leading-snug">{c.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <a href={c.whatsapp} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" />
                          Unirse al grupo
                          <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <Separator className="opacity-50" />

          {/* Cómo participar */}
          <motion.section id="participacion" {...fadeIn} className="scroll-mt-24">
            <div className="mb-8 flex items-end gap-3">
              <div className="rounded-lg bg-secondary/15 p-2 text-secondary">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Cómo participar</h2>
                <p className="mt-1 text-sm text-muted-foreground">Pasos para formar parte del intercambio científico</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-[1.125rem] top-3 bottom-3 w-px bg-border md:left-6" aria-hidden />
              <ol className="space-y-8">
                {participationSteps.map((s) => (
                  <li key={s.step} className="relative flex gap-4 md:gap-6 pl-10 md:pl-14">
                    <span
                      className={cn(
                        "absolute left-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-card font-serif text-sm font-bold text-primary md:left-1.5 md:h-10 md:w-10",
                      )}
                    >
                      {s.step}
                    </span>
                    <Card className="flex-1 border-border/80 bg-card/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-base md:text-lg">{s.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>
          </motion.section>

          <Separator className="opacity-50" />

          {/* Normas importantes */}
          <motion.section {...fadeIn} className="scroll-mt-24">
            <div className="mb-8 flex items-end gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
                <ScrollText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Normas importantes</h2>
                <p className="mt-1 text-sm text-muted-foreground">Requisitos para la validez de la participación</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {importantRules.map((rule) => (
                <Alert
                  key={rule}
                  className="border-secondary/25 bg-secondary/5 [&>svg]:text-secondary"
                >
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm leading-relaxed text-foreground [&_p]:mb-0">
                    {rule}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </motion.section>

          {/* Recordatorio importante */}
          <motion.section {...fadeIn} className="scroll-mt-16">
            <Card className="border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/8 p-2 text-primary shrink-0 mt-0.5">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="font-serif text-base font-semibold text-foreground">
                      Recordatorio Importante
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      La participación activa en los debates científicos forma parte de los requisitos para la
                      obtención del certificado. Cada participante deberá comentar y aportar criterios académicos
                      en los trabajos de otros autores dentro de su comisión correspondiente.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.section>

          <Separator className="opacity-50" />

          {/* Inscripción */}
          <motion.section id="inscripcion" {...fadeIn} className="scroll-mt-24">
            <div className="mb-8 flex items-end gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Formulario de inscripción</h2>
                <p className="mt-1 text-sm text-muted-foreground">Registro oficial al evento</p>
              </div>
            </div>
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
              <CardContent className="p-6 md:p-8">
                <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Complete el formulario para formalizar su inscripción en la Convención Científica 2026.
                  Una vez enviado, recibirá la confirmación y las indicaciones para unirse al grupo de WhatsApp
                  de su comisión.
                </p>
                <Button asChild size="lg" className="font-semibold">
                  <a href={REGISTRATION_FORM_URL} target="_blank" rel="noopener noreferrer">
                    Abrir formulario de inscripción
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.section>

          <Separator className="opacity-50" />

          {/* Certificados */}
          <motion.section id="certificados" {...fadeIn} className="scroll-mt-24">
            <div className="mb-8 flex items-end gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Certificados digitales</h2>
                <p className="mt-1 text-sm text-muted-foreground">Consulta y descarga de constancias</p>
              </div>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Los participantes que hayan publicado al menos un resumen y comentado un mínimo de dos trabajos
              podrán descargar su certificado digital de participación directamente desde la plataforma.
            </p>
            <Card className="mb-6 border-border/60 bg-muted/20 shadow-sm">
              <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 opacity-70">
                <div className="rounded-full bg-muted p-3 text-muted-foreground shrink-0">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">Certificados no disponibles</p>
                  <p className="text-sm text-muted-foreground">
                    Estarán disponibles al finalizar el programa de la Convención.
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-border/80 bg-card shadow-lg ring-1 ring-primary/10">
              <img
                src="/certificate-template.png"
                alt="Ejemplo ilustrativo de certificado digital de participación, Convención Científica 2026"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-center text-xs italic text-muted-foreground">
              Vista ilustrativa — el certificado se genera automáticamente al verificar su participación.
            </p>
          </motion.section>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/20 py-8 md:py-10">
        <div className="container text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Convención Científica 2026 • Facultad de Ciencias Médicas, Julio Trigo López
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">MedEstudia — página informativa</p>
        </div>
      </footer>
    </div>
  );
};

export default ConvencionHub;
