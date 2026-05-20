import React, { forwardRef } from "react";

interface CertificatePreviewProps {
  participantName: string;
  summaryTitle?: string;
  institution?: string;
  summariesCount: number;
  commentsCount: number;
}

const CertificatePreview = forwardRef<HTMLDivElement, CertificatePreviewProps>(
  ({ participantName, summaryTitle, institution, summariesCount, commentsCount }, ref) => {
    const certNumber = `MC-${String(new Date().getFullYear())}-${String(participantName.length * 73).padStart(4, "0")}`;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden rounded-xl shadow-2xl"
        style={{
          width: "800px",
          aspectRatio: "977 / 731",
          backgroundImage: "url(/certificate-template.png)",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
        }}
      >
        {/* Text overlays — positions relative to the template */}
        <div
          className="absolute text-center"
          style={{
            top: "55%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
          }}
        >
          <p
            className="text-sm tracking-wide"
            style={{
              color: "#4a5568",
              fontFamily: "Georgia, 'Times New Roman', serif",
              marginBottom: "0",
            }}
          >
            Se otorga el presente a:
          </p>
          <h2
            className="font-bold mt-1"
            style={{
              color: "#1a202c",
              fontSize: "clamp(1.2rem, 2.8vw, 2.2rem)",
              fontFamily: "Georgia, 'Times New Roman', serif",
              lineHeight: 1.2,
            }}
          >
            {participantName}
          </h2>
          {institution && (
            <p
              className="mt-1 text-xs"
              style={{
                color: "#718096",
                fontFamily: "Arial, sans-serif",
              }}
            >
              {institution}
            </p>
          )}
        </div>

        {summaryTitle && (
          <div
            className="absolute text-center"
            style={{
              bottom: "22%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "75%",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{
                color: "#4a5568",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Título:
            </p>
            <p
              className="text-sm mt-0.5 leading-snug"
              style={{
                color: "#2d3748",
                fontFamily: "Arial, sans-serif",
              }}
            >
              {summaryTitle}
            </p>
          </div>
        )}

        {/* Bottom info */}
        <div
          className="absolute flex items-center gap-4"
          style={{
            bottom: "6%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <p
            className="text-[10px]"
            style={{
              color: "#a0aec0",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {certNumber}
          </p>
          <span
            className="text-[10px]"
            style={{
              color: "#cbd5e0",
            }}
          >
            |
          </span>
          <p
            className="text-[10px]"
            style={{
              color: "#a0aec0",
              fontFamily: "Arial, sans-serif",
            }}
          >
            25 – 29 de mayo de 2026
          </p>
        </div>
      </div>
    );
  }
);

CertificatePreview.displayName = "CertificatePreview";

export default CertificatePreview;
