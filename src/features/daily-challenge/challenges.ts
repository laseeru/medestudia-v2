/**
 * Curated challenge bank.
 *
 * Authored locally for study practice. These are hypothetical teaching cases —
 * they are deliberately NOT attributed to any official guideline, and
 * `sourceNote` describes the reasoning basis rather than claiming provenance.
 * Content is kept here, separate from any component, so the bank can grow (or
 * later be replaced by retrieval) without touching UI code.
 */

export type ChallengePathway = 'preclinical' | 'clinical';

/**
 * Content-review state. Everything authored locally starts as `draft`; only
 * items a faculty member has actually checked may be marked reviewed, and the
 * UI shows a draft notice so a case is never mistaken for an official guideline.
 */
export type ChallengeReviewStatus = 'draft' | 'faculty-reviewed';

export interface DailyChallenge {
  id: string;
  pathway: ChallengePathway;
  reviewStatus: ChallengeReviewStatus;
  /** Name or role of the reviewer; only meaningful when faculty-reviewed. */
  reviewedBy?: string;
  /** Translation key for the subject or rotation, matching LanguageContext. */
  areaKey: string;
  prompt: { es: string; en: string };
  options: { es: string[]; en: string[] };
  /** Index into `options`; same position in both languages. */
  correctIndex: number;
  explanation: { es: string; en: string };
  sourceNote?: { es: string; en: string };
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'pre-frank-starling',
    pathway: 'preclinical',
    reviewStatus: 'draft',
    areaKey: 'physiology',
    prompt: {
      es: 'Según el mecanismo de Frank-Starling, ¿qué ocurre cuando aumenta el retorno venoso al ventrículo izquierdo?',
      en: 'By the Frank-Starling mechanism, what happens when venous return to the left ventricle increases?',
    },
    options: {
      es: [
        'Aumenta la fuerza de contracción por mayor longitud inicial de la fibra',
        'Disminuye el volumen sistólico por sobrecarga de presión',
        'Se reduce la precarga y cae el gasto cardíaco',
        'La frecuencia cardíaca desciende de forma refleja',
      ],
      en: [
        'Contractile force rises because initial fibre length increases',
        'Stroke volume falls due to pressure overload',
        'Preload drops and cardiac output falls',
        'Heart rate falls reflexively',
      ],
    },
    correctIndex: 0,
    explanation: {
      es: 'Un mayor retorno venoso aumenta la precarga y estira las fibras miocárdicas. Dentro del rango fisiológico, ese estiramiento mejora el solapamiento entre actina y miosina y aumenta la fuerza de contracción, elevando el volumen sistólico.',
      en: 'Greater venous return raises preload and stretches myocardial fibres. Within the physiological range that stretch improves actin–myosin overlap and increases contractile force, raising stroke volume.',
    },
    sourceNote: {
      es: 'Razonamiento basado en fisiología cardiovascular básica.',
      en: 'Reasoning based on basic cardiovascular physiology.',
    },
  },
  {
    id: 'pre-krebs-location',
    pathway: 'preclinical',
    reviewStatus: 'draft',
    areaKey: 'biochemistry',
    prompt: {
      es: '¿En qué compartimento celular ocurre el ciclo de Krebs?',
      en: 'In which cellular compartment does the Krebs cycle take place?',
    },
    options: {
      es: ['Matriz mitocondrial', 'Citosol', 'Retículo endoplasmático liso', 'Membrana mitocondrial externa'],
      en: ['Mitochondrial matrix', 'Cytosol', 'Smooth endoplasmic reticulum', 'Outer mitochondrial membrane'],
    },
    correctIndex: 0,
    explanation: {
      es: 'Las enzimas del ciclo de Krebs se localizan en la matriz mitocondrial, con excepción de la succinato deshidrogenasa, que está anclada a la membrana mitocondrial interna y participa además en la cadena respiratoria.',
      en: 'Krebs cycle enzymes sit in the mitochondrial matrix, except succinate dehydrogenase, which is anchored in the inner mitochondrial membrane and also participates in the respiratory chain.',
    },
  },
  {
    id: 'pre-epithelium',
    pathway: 'preclinical',
    reviewStatus: 'draft',
    areaKey: 'histology',
    prompt: {
      es: '¿Qué tipo de epitelio recubre normalmente la tráquea?',
      en: 'Which epithelium normally lines the trachea?',
    },
    options: {
      es: [
        'Cilíndrico pseudoestratificado ciliado con células caliciformes',
        'Plano estratificado queratinizado',
        'Cúbico simple',
        'Plano simple',
      ],
      en: [
        'Pseudostratified ciliated columnar with goblet cells',
        'Keratinised stratified squamous',
        'Simple cuboidal',
        'Simple squamous',
      ],
    },
    correctIndex: 0,
    explanation: {
      es: 'El epitelio respiratorio típico es cilíndrico pseudoestratificado ciliado con células caliciformes. Los cilios desplazan el moco hacia la faringe y las células caliciformes aportan la capa mucosa que atrapa partículas.',
      en: 'The typical respiratory epithelium is pseudostratified ciliated columnar with goblet cells. Cilia move mucus towards the pharynx and goblet cells supply the mucous layer that traps particles.',
    },
  },
  {
    id: 'pre-ace-inhibitor',
    pathway: 'preclinical',
    reviewStatus: 'draft',
    areaKey: 'pharmacology',
    prompt: {
      es: '¿Cuál es el mecanismo principal de los inhibidores de la enzima convertidora de angiotensina (IECA)?',
      en: 'What is the main mechanism of ACE inhibitors?',
    },
    options: {
      es: [
        'Bloquean la conversión de angiotensina I en angiotensina II',
        'Bloquean directamente el receptor AT1',
        'Inhiben la reabsorción de sodio en el túbulo proximal',
        'Antagonizan los receptores beta-1 cardíacos',
      ],
      en: [
        'They block conversion of angiotensin I to angiotensin II',
        'They block the AT1 receptor directly',
        'They inhibit sodium reabsorption in the proximal tubule',
        'They antagonise cardiac beta-1 receptors',
      ],
    },
    correctIndex: 0,
    explanation: {
      es: 'Los IECA inhiben la enzima convertidora, reduciendo la formación de angiotensina II y la secreción de aldosterona. La acumulación de bradicinina explica la tos seca característica, que no aparece con los ARA-II.',
      en: 'ACE inhibitors block the converting enzyme, reducing angiotensin II formation and aldosterone secretion. Bradykinin accumulation explains the characteristic dry cough, which ARBs do not cause.',
    },
  },
  {
    id: 'pre-immunoglobulin',
    pathway: 'preclinical',
    reviewStatus: 'draft',
    areaKey: 'immunology',
    prompt: {
      es: '¿Qué inmunoglobulina atraviesa la placenta y protege al recién nacido en los primeros meses?',
      en: 'Which immunoglobulin crosses the placenta and protects the newborn in the first months?',
    },
    options: {
      es: ['IgG', 'IgM', 'IgA', 'IgE'],
      en: ['IgG', 'IgM', 'IgA', 'IgE'],
    },
    correctIndex: 0,
    explanation: {
      es: 'La IgG es la única inmunoglobulina que atraviesa la placenta de forma significativa, mediante receptores FcRn. La IgA predomina en secreciones y en la leche materna, y la IgM es la primera en producirse ante una infección aguda.',
      en: 'IgG is the only immunoglobulin that crosses the placenta significantly, via FcRn receptors. IgA predominates in secretions and breast milk, and IgM is the first produced in acute infection.',
    },
  },
  {
    id: 'clin-dka-initial',
    pathway: 'clinical',
    reviewStatus: 'draft',
    areaKey: 'internalMedicine',
    prompt: {
      es: 'Paciente de 22 años con diabetes tipo 1, vómitos y respiración de Kussmaul. Glucemia 24 mmol/L, cetonuria positiva. ¿Cuál es la primera medida terapéutica?',
      en: 'A 22-year-old with type 1 diabetes presents with vomiting and Kussmaul breathing. Glucose 24 mmol/L, ketonuria positive. What is the first therapeutic step?',
    },
    options: {
      es: [
        'Reposición de volumen con solución salina isotónica',
        'Insulina rápida en bolo intravenoso antes de cualquier fluido',
        'Bicarbonato de sodio intravenoso de entrada',
        'Potasio intravenoso antes de medir la kalemia',
      ],
      en: [
        'Volume replacement with isotonic saline',
        'An intravenous rapid-insulin bolus before any fluid',
        'Intravenous sodium bicarbonate up front',
        'Intravenous potassium before measuring serum potassium',
      ],
    },
    correctIndex: 0,
    explanation: {
      es: 'La cetoacidosis diabética cursa con déficit importante de volumen, y la rehidratación es la primera prioridad porque mejora la perfusión y desciende la glucemia por sí sola. La insulina se inicia poco después, y el potasio se repone guiado por la kalemia, ya que la insulina lo desplaza al interior de la célula.',
      en: 'Diabetic ketoacidosis involves a large volume deficit, and rehydration comes first because it improves perfusion and lowers glucose on its own. Insulin follows shortly after, and potassium is replaced guided by serum levels, since insulin shifts it into cells.',
    },
    sourceNote: {
      es: 'Caso hipotético; razonamiento basado en principios generales del manejo de la cetoacidosis.',
      en: 'Hypothetical case; reasoning based on general principles of ketoacidosis management.',
    },
  },
  {
    id: 'clin-pediatric-dehydration',
    pathway: 'clinical',
    reviewStatus: 'draft',
    areaKey: 'pediatrics',
    prompt: {
      es: 'Lactante de 8 meses con diarrea de 2 días, bebe con avidez, ojos algo hundidos y pliegue cutáneo que desaparece con lentitud. ¿Qué grado de deshidratación y conducta corresponde?',
      en: 'An 8-month-old with 2 days of diarrhoea drinks eagerly, has somewhat sunken eyes and a slowly retracting skin fold. What degree of dehydration and management applies?',
    },
    options: {
      es: [
        'Deshidratación moderada: sales de rehidratación oral supervisada',
        'Sin deshidratación: solo continuar la alimentación habitual',
        'Deshidratación grave: hidratación intravenosa inmediata',
        'Deshidratación leve: antibiótico oral empírico',
      ],
      en: [
        'Moderate dehydration: supervised oral rehydration salts',
        'No dehydration: simply continue normal feeding',
        'Severe dehydration: immediate intravenous fluids',
        'Mild dehydration: empirical oral antibiotic',
      ],
    },
    correctIndex: 0,
    explanation: {
      es: 'La combinación de sed ávida, ojos hundidos y pliegue que retorna lentamente corresponde a deshidratación moderada, cuyo tratamiento de elección es la rehidratación oral supervisada. La vía intravenosa se reserva para el shock o la intolerancia oral, y los antibióticos no están indicados de rutina en la diarrea aguda.',
      en: 'Eager thirst, sunken eyes and a slowly retracting skin fold correspond to moderate dehydration, best treated with supervised oral rehydration. Intravenous fluids are reserved for shock or oral intolerance, and antibiotics are not routine in acute diarrhoea.',
    },
    sourceNote: {
      es: 'Caso hipotético con fines educativos.',
      en: 'Hypothetical case for educational purposes.',
    },
  },
  {
    id: 'clin-preeclampsia',
    pathway: 'clinical',
    reviewStatus: 'draft',
    areaKey: 'gynecology',
    prompt: {
      es: 'Gestante de 34 semanas con tensión arterial 160/105 mmHg en dos tomas y proteinuria significativa. ¿Cuál es el diagnóstico más probable?',
      en: 'A 34-week pregnant patient has blood pressure 160/105 mmHg on two readings and significant proteinuria. What is the most likely diagnosis?',
    },
    options: {
      es: [
        'Preeclampsia con criterios de gravedad',
        'Hipertensión crónica preexistente',
        'Hipertensión gestacional sin proteinuria',
        'Hipertensión de bata blanca',
      ],
      en: [
        'Pre-eclampsia with severe features',
        'Pre-existing chronic hypertension',
        'Gestational hypertension without proteinuria',
        'White-coat hypertension',
      ],
    },
    correctIndex: 0,
    explanation: {
      es: 'Hipertensión que aparece después de las 20 semanas junto con proteinuria define preeclampsia. Se considera rango grave cuando la presión sistólica es ≥160 mmHg O la diastólica es ≥110 mmHg; basta con que se cumpla uno de los dos criterios. La hipertensión crónica se reconoce antes de las 20 semanas y la gestacional cursa sin proteinuria.',
      en: 'Hypertension appearing after 20 weeks together with proteinuria defines pre-eclampsia. Severe range means systolic pressure ≥160 mmHg OR diastolic pressure ≥110 mmHg; either criterion alone is sufficient. Chronic hypertension is recognised before 20 weeks, and gestational hypertension occurs without proteinuria.',
    },
    sourceNote: {
      es: 'Caso hipotético con fines educativos.',
      en: 'Hypothetical case for educational purposes.',
    },
  },
  {
    id: 'clin-appendicitis',
    pathway: 'clinical',
    reviewStatus: 'draft',
    areaKey: 'surgery',
    prompt: {
      es: 'Varón de 19 años con dolor periumbilical que migra a fosa ilíaca derecha, anorexia y febrícula. ¿Qué hallazgo apoya más el diagnóstico de apendicitis aguda?',
      en: 'A 19-year-old has periumbilical pain migrating to the right iliac fossa, anorexia and low-grade fever. Which finding best supports acute appendicitis?',
    },
    options: {
      es: [
        'Dolor a la descompresión en el punto de McBurney',
        'Dolor que mejora por completo con la palpación profunda',
        'Timpanismo generalizado sin dolor localizado',
        'Ausencia total de leucocitosis descarta el diagnóstico',
      ],
      en: [
        'Rebound tenderness at McBurney’s point',
        'Pain that resolves completely with deep palpation',
        'Generalised tympany without localised pain',
        'A completely normal white cell count rules it out',
      ],
    },
    correctIndex: 0,
    explanation: {
      es: 'La migración del dolor y la irritación peritoneal localizada en el punto de McBurney son los datos clínicos de mayor valor. Un recuento leucocitario normal no descarta el cuadro, sobre todo en las primeras horas, por lo que el diagnóstico sigue siendo fundamentalmente clínico.',
      en: 'Pain migration and localised peritoneal irritation at McBurney’s point carry the greatest clinical value. A normal white cell count does not exclude the diagnosis, especially in the first hours, so it remains a largely clinical diagnosis.',
    },
    sourceNote: {
      es: 'Caso hipotético con fines educativos.',
      en: 'Hypothetical case for educational purposes.',
    },
  },
  {
    id: 'clin-copd-exacerbation',
    pathway: 'clinical',
    reviewStatus: 'draft',
    areaKey: 'internalMedicine',
    prompt: {
      es: 'Paciente con EPOC que acude por aumento de disnea, mayor volumen de esputo y esputo purulento. ¿Qué define mejor esta situación?',
      en: 'A patient with COPD presents with increased dyspnoea, increased sputum volume and purulent sputum. What best defines this situation?',
    },
    options: {
      es: [
        'Exacerbación con los tres criterios cardinales',
        'Neumonía adquirida en la comunidad confirmada',
        'Embolia pulmonar aguda',
        'Insuficiencia cardíaca descompensada',
      ],
      en: [
        'Exacerbation meeting all three cardinal criteria',
        'Confirmed community-acquired pneumonia',
        'Acute pulmonary embolism',
        'Decompensated heart failure',
      ],
    },
    correctIndex: 0,
    explanation: {
      es: 'El aumento de disnea, del volumen del esputo y de su purulencia constituyen los tres criterios clásicos de exacerbación de la EPOC, y su presencia conjunta orienta al uso de antibiótico. Confirmar una neumonía exigiría un infiltrado radiológico.',
      en: 'Increased dyspnoea, sputum volume and sputum purulence are the three classic criteria for a COPD exacerbation, and their combined presence supports antibiotic use. Confirming pneumonia would require a radiographic infiltrate.',
    },
    sourceNote: {
      es: 'Caso hipotético con fines educativos.',
      en: 'Hypothetical case for educational purposes.',
    },
  },
];

/**
 * Deterministic pick from the local calendar day, so every learner sees the
 * same challenge on the same date and it stays stable across reloads. Uses a
 * small FNV-style hash of the YYYY-MM-DD key rather than the day index, so
 * consecutive days do not simply walk the array in order.
 */
export function selectChallengeForDay(dayKey: string): DailyChallenge {
  let hash = 2166136261;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash ^= dayKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[index];
}
