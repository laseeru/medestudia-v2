/** Comisiones científicas — `slug` se usa en rutas y en Supabase (`commission_slug`). */
export interface CommissionDefinition {
  slug: string;
  title: string;
  description: string;
  whatsapp: string;
}

export const REGISTRATION_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeQ99FpSexIlYBQtbP6SJK030cvEWCdEimPlx2Z7nVoVEBZRQ/viewform?usp=publish-editor";

export const CONVENCION_COMMISSIONS: CommissionDefinition[] = [
  {
    slug: "educacion-medica",
    title: "La educación médica: retos y oportunidades",
    description:
      "Reflexión sobre formación médica, innovación pedagógica y desafíos del currículo.",
    whatsapp: "https://chat.whatsapp.com/IRceabX9nbvDCqddL8rYwK?mode=gi_t",
  },
  {
    slug: "aps-pami",
    title: "La APS y el PAMI: un espacio para la docencia médica de calidad",
    description:
      "Atención primaria de salud y PAMI como ejes de la docencia y la investigación aplicada.",
    whatsapp: "https://chat.whatsapp.com/LtjDBXIkpUsEAu1Qu0lwts?mode=gi_t",
  },
  {
    slug: "tic",
    title: "La gestión del aprendizaje basada en las TIC",
    description:
      "Tecnologías de la información en el diseño instruccional y la evaluación del aprendizaje.",
    whatsapp: "https://chat.whatsapp.com/GyVIKOwFR3cL2TdvZMR7pL?mode=gi_t",
  },
  {
    slug: "rrhh-tecnologia-salud",
    title: "La formación de recursos humanos en tecnología de la salud",
    description:
      "Capacitación y competencias digitales al servicio de los sistemas de salud.",
    whatsapp: "https://chat.whatsapp.com/FMgGyWEOBVk7Qk8d50YH30?mode=gi_t",
  },
  {
    slug: "enfermeria",
    title: "La formación de enfermería desde la investigación científica",
    description:
      "Práctica asistencial, evidencia y formación universitaria en enfermería.",
    whatsapp: "https://chat.whatsapp.com/EAALEFwJ5MGEilsXiXRN5Z?mode=gi_t",
  },
  {
    slug: "salud-mental-adicciones",
    title: "Salud mental y adicciones desde la educación médica",
    description:
      "Promoción, prevención y abordaje formativo en salud mental y sustancias.",
    whatsapp: "https://chat.whatsapp.com/HEn4wt0FcM9KGJbe50r0Uy?mode=gi_t",
  },
  {
    slug: "estomatologia",
    title: "La formación en Estomatología",
    description:
      "Líneas científico-docentes en ciencias estomatológicas.",
    whatsapp: "https://chat.whatsapp.com/GllPLDUo4sg8gWdQSlsE7c?mode=gi_t",
  },
  {
    slug: "calidad-servicios-medicos",
    title: "La calidad en los servicios médicos",
    description:
      "Indicadores, seguridad del paciente y mejora continua en la atención.",
    whatsapp: "https://chat.whatsapp.com/LcoieTPMuXk7ouRffcJVJ3?mode=gi_t",
  },
];

export function getCommissionBySlug(slug: string | undefined): CommissionDefinition | undefined {
  if (!slug) return undefined;
  return CONVENCION_COMMISSIONS.find((c) => c.slug === slug);
}

export const participationSteps = [
  { step: 1, title: "Paso 1", description: "Llenar el formulario de inscripción oficial." },
  { step: 2, title: "Paso 2", description: "Unirse al grupo de WhatsApp de su comisión científica." },
  {
    step: 3,
    title: "Paso 3",
    description: "Publicar un resumen científico (máximo 300 palabras, hasta 5 autores).",
  },
  { step: 4, title: "Paso 4", description: "Comentar al menos dos resúmenes de otros participantes." },
  {
    step: 5,
    title: "Paso 5",
    description: "Recibir certificado digital de participación, siempre que cumpla los requisitos.",
  },
] as const;

export const importantRules = [
  "Máximo 300 palabras por resumen.",
  "Máximo 5 autores.",
  "Los nombres consignados serán utilizados en el certificado digital.",
  "Cada participante debe comentar un mínimo de dos resúmenes.",
  "Los certificados digitales serán entregados con posterioridad por el comité organizador.",
] as const;
