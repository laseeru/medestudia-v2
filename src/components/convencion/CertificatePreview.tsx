import React, { forwardRef } from "react";

interface CertificatePreviewProps {
  participantName: string;
  institution?: string;
  summariesCount: number;
  commentsCount: number;
}

const CertificatePreview = forwardRef<HTMLDivElement, CertificatePreviewProps>(
  ({ participantName, institution, summariesCount, commentsCount }, ref) => {
    const certNumber = `MC-${String(new Date().getFullYear())}-${String(participantName.length * 73).padStart(4, "0")}`;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden rounded-xl border-4 border-double border-primary/40 bg-white shadow-2xl"
        style={{
          width: "800px",
          minHeight: "560px",
          aspectRatio: "1.414 / 1",
        }}
      >
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-primary/70 to-primary" />

        {/* Background watermark */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(var(--primary)) 0%, transparent 50%)",
          }}
        />

        <div className="relative flex flex-col items-center justify-between p-12 h-full">
          {/* Top section */}
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/60">
              Facultad de Ciencias Médicas
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/60 mt-0.5">
              Julio Trigo López
            </p>
            <div className="mt-4 mb-3 mx-auto h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary/70">
              Certificado de Participación
            </p>
          </div>

          {/* Middle section */}
          <div className="text-center max-w-lg">
            <p className="text-sm text-muted-foreground/60 mb-2">
              El comité organizador otorga el presente certificado a:
            </p>
            <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">
              {participantName}
            </h2>
            {institution && (
              <p className="mt-2 text-sm text-muted-foreground/70">
                {institution}
              </p>
            )}
            <div className="mt-4 mx-auto h-px w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground/80">
              Por su participación activa en la{" "}
              <span className="font-semibold text-foreground">
                Convención Científica Estudiantil 2026
              </span>
              , incluyendo la publicación de{" "}
              <span className="font-semibold text-foreground">{summariesCount}</span>
              {summariesCount === 1 ? " resumen" : " resúmenes"} y{" "}
              <span className="font-semibold text-foreground">{commentsCount}</span>
              {commentsCount === 1 ? " comentario" : " comentarios"}.
            </p>
          </div>

          {/* Bottom section */}
          <div className="w-full text-center">
            <div className="mx-auto h-px w-full max-w-xs bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="mt-5 flex items-center justify-center gap-8 text-xs text-muted-foreground/60">
              <div className="text-center">
                <p className="font-semibold text-foreground/80">25 – 29 de mayo de 2026</p>
                <p>Fecha del evento</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="font-semibold text-foreground/80">{certNumber}</p>
                <p>Certificado N.º</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="font-semibold text-foreground/80">Comité Organizador</p>
                <p>Firma digital</p>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground/40">
              MedEstudia · Convención Científica Estudiantil 2026 · Modalidad Virtual
            </p>
          </div>
        </div>
      </div>
    );
  }
);

CertificatePreview.displayName = "CertificatePreview";

export default CertificatePreview;
