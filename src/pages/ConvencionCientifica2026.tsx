import React, { useCallback } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/** Formulario oficial de inscripción — Convención Científica 2026. */
export const REGISTRATION_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeQ99FpSexIlYBQtbP6SJK030cvEWCdEimPlx2Z7nVoVEBZRQ/viewform?usp=publish-editor";

export interface Commission {
  title: string;
  description: string;
  /** Enlace de invitación al grupo de WhatsApp de la comisión (reemplazar). */
  whatsapp: string;
}

export const commissions: Commission[] = [
  {
    title: "La educación médica: retos y oportunidades",
    description:
      "Espacio para reflexionar sobre la formación médica contemporánea, innovación pedagógica y desafíos del currículo.",
    whatsapp: "https://chat.whatsapp.com/REPLACE_COMISION_1",
  },
  {
    title: "La APS y el PAMI: espacio para la docencia médica de calidad",
    description:
      "Atención primaria de salud y Programa de Atención Médica Integral como ejes de la docencia y la investigación aplicada.",
    whatsapp: "https://chat.whatsapp.com/REPLACE_COMISION_2",
  },
  {
    title: "La gestión del aprendizaje basada en las TIC",
    description:
      "Integración de tecnologías de la información en el diseño instruccional y la evaluación del aprendizaje.",
    whatsapp: "https://chat.whatsapp.com/REPLACE_COMISION_3",
  },
  {
    title: "La formación de recursos humanos en tecnología de la salud",
    description:
      "Capacitación especializada y competencias digitales al servicio de los sistemas de salud.",
    whatsapp: "https://chat.whatsapp.com/REPLACE_COMISION_4",
  },
  {
    title: "La formación de enfermería desde la investigación científica",
    description:
      "Vínculo entre la práctica asistencial, la evidencia científica y la formación universitaria en enfermería.",
    whatsapp: "https://chat.whatsapp.com/REPLACE_COMISION_5",
  },
  {
    title: "Salud mental y adicciones desde la educación médica",
    description:
      "Enfoque interdisciplinario en promoción, prevención y abordaje formativo en salud mental y sustancias.",
    whatsapp: "https://chat.whatsapp.com/REPLACE_COMISION_6",
  },
  {
    title: "La formación en Estomatología",
    description:
      "Actualización y líneas de trabajo científico-docente en ciencias estomatológicas.",
    whatsapp: "https://chat.whatsapp.com/REPLACE_COMISION_7",
  },
  {
    title: "La calidad en los servicios médicos",
    description:
      "Indicadores, seguridad del paciente y mejora continua en la atención sanitaria.",
    whatsapp: "https://chat.whatsapp.com/REPLACE_COMISION_8",
  },
];

export interface ParticipationStep {
  step: number;
  title: string;
  description: string;
}

export const participationSteps: ParticipationStep[] = [
  {
    step: 1,
    title: "Paso 1",
    description: "Llenar el formulario de inscripción.",
  },
  {
    step: 2,
    title: "Paso 2",
    description: "Entrar al grupo de WhatsApp de su comisión científica.",
  },
  {
    step: 3,
    title: "Paso 3",
    description: "Publicar un resumen científico (máximo 300 palabras, hasta 3 autores).",
  },
  {
    step: 4,
    title: "Paso 4",
    description: "Comentar al menos dos resúmenes de otros participantes.",
  },
  {
    step: 5,
    title: "Paso 5",
    description: "Recibir certificado digital de participación si cumple los requisitos.",
  },
];

const importantRules: string[] = [
  "Máximo 300 palabras por resumen.",
  "Máximo 3 autores.",
  "Los nombres escritos serán utilizados en el certificado.",
  "Debe comentar mínimo dos trabajos.",
  "Los certificados digitales serán entregados posteriormente.",
];

interface QuickNavItem {
  id: string;
  label: string;
}

const quickNavItems: QuickNavItem[] = [
  { id: "informacion", label: "Información" },
  { id: "comisiones", label: "Comisiones" },
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

const ConvencionCientifica2026: React.FC = () => {
  const scrollToRegistration = useCallback(() => scrollToSection("inscripcion"), []);

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
                Modalidad Virtual
              </span>
              <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl text-balance">
                Convención Científica 2026
              </h1>
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
                  value: "2026",
                },
                {
                  icon: GraduationCap,
                  label: "Organiza",
                  value: "Facultad de Ciencias Médicas",
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
                  Elija su línea temática y únase al grupo de WhatsApp correspondiente
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {commissions.map((c, i) => (
                <motion.div
                  key={c.title}
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
                    <CardContent>
                      <Button asChild variant="secondary" className="w-full sm:w-auto">
                        <a href={c.whatsapp} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Unirse por WhatsApp
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
                  Complete el formulario para formalizar su participación. Conservará la confirmación del envío.
                </p>
                <Button asChild size="lg" className="font-semibold">
                  <a href={REGISTRATION_FORM_URL} target="_blank" rel="noopener noreferrer">
                    Abrir formulario
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
                <p className="mt-6 max-w-2xl border-t border-border/60 pt-6 text-sm leading-relaxed text-muted-foreground">
                  Después de completar la inscripción, recibirá acceso al grupo de WhatsApp correspondiente.
                </p>
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
                <p className="mt-1 text-sm text-muted-foreground">Entrega y consulta de constancias</p>
              </div>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Los certificados digitales de participación serán organizados alfabéticamente en Google Drive y podrán
              descargarse mediante un enlace compartido por el comité organizador.
            </p>
            <div
              className={cn(
                "relative mx-auto max-w-lg rounded-lg border-2 border-primary/30 bg-gradient-to-b from-muted/40 to-card p-8 shadow-inner",
                "before:pointer-events-none before:absolute before:inset-2 before:rounded-md before:border before:border-primary/10",
              )}
            >
              <div className="relative text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10">
                  <Award className="h-7 w-7 text-primary" aria-hidden />
                </div>
                <p className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Certificado de participación
                </p>
                <p className="mt-3 font-serif text-xl font-bold text-foreground">Convención Científica 2026</p>
                <p className="mt-2 text-sm text-muted-foreground">Facultad de Ciencias Médicas</p>
                <Separator className="my-6 opacity-40" />
                <p className="text-xs italic text-muted-foreground">
                  Vista ilustrativa — el documento oficial será emitido por el comité organizador.
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/20 py-8 md:py-10">
        <div className="container text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Convención Científica 2026 • Facultad de Ciencias Médicas
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">MedEstudia — página informativa</p>
        </div>
      </footer>
    </div>
  );
};

export default ConvencionCientifica2026;
