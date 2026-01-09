import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MCQGeneratorProps {
  subject: string;
  variant?: 'preclinical' | 'clinical';
  systemKey?: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface MCQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Context-aware placeholder examples
const placeholderExamples: Record<string, { es: string; en: string }> = {
  // Preclinical
  anatomy: { es: 'Ej: plexo braquial, irrigación del corazón', en: 'E.g.: brachial plexus, cardiac blood supply' },
  histology: { es: 'Ej: epitelio glandular, tejido óseo', en: 'E.g.: glandular epithelium, bone tissue' },
  cellBiology: { es: 'Ej: ciclo celular, transporte de membrana', en: 'E.g.: cell cycle, membrane transport' },
  biochemistry: { es: 'Ej: glucólisis, metabolismo de lípidos', en: 'E.g.: glycolysis, lipid metabolism' },
  physiology: { es: 'Ej: potencial de acción, regulación de la presión arterial', en: 'E.g.: action potential, blood pressure regulation' },
  microbiology: { es: 'Ej: mecanismos de resistencia bacteriana', en: 'E.g.: bacterial resistance mechanisms' },
  parasitology: { es: 'Ej: ciclo de Plasmodium, giardiasis', en: 'E.g.: Plasmodium cycle, giardiasis' },
  immunology: { es: 'Ej: respuesta inmune celular, hipersensibilidad', en: 'E.g.: cellular immune response, hypersensitivity' },
  biostatistics: { es: 'Ej: prueba t de Student, odds ratio', en: 'E.g.: Student t-test, odds ratio' },
  pharmacology: { es: 'Ej: farmacocinética, interacciones medicamentosas', en: 'E.g.: pharmacokinetics, drug interactions' },
  // Clinical systems
  cardiovascular: { es: 'Ej: insuficiencia cardíaca descompensada, cardiopatía isquémica', en: 'E.g.: decompensated heart failure, ischemic heart disease' },
  respiratory: { es: 'Ej: neumonía adquirida en la comunidad, crisis asmática', en: 'E.g.: community-acquired pneumonia, asthma crisis' },
  endocrine: { es: 'Ej: cetoacidosis diabética, hipotiroidismo', en: 'E.g.: diabetic ketoacidosis, hypothyroidism' },
  gastrointestinal: { es: 'Ej: enfermedad por reflujo, pancreatitis aguda', en: 'E.g.: reflux disease, acute pancreatitis' },
  neurological: { es: 'Ej: accidente cerebrovascular, meningitis', en: 'E.g.: stroke, meningitis' },
  renal: { es: 'Ej: insuficiencia renal aguda, síndrome nefrótico', en: 'E.g.: acute kidney injury, nephrotic syndrome' },
  // Clinical rotations
  internalMedicine: { es: 'Ej: hipertensión arterial, diabetes mellitus', en: 'E.g.: hypertension, diabetes mellitus' },
  surgery: { es: 'Ej: apendicitis aguda, abdomen agudo', en: 'E.g.: acute appendicitis, acute abdomen' },
  pediatrics: { es: 'Ej: fiebre en lactante menor de 3 meses, deshidratación', en: 'E.g.: fever in infant under 3 months, dehydration' },
  gynecology: { es: 'Ej: preeclampsia, hemorragia postparto', en: 'E.g.: preeclampsia, postpartum hemorrhage' },
  generalMedicine: { es: 'Ej: dengue con signos de alarma, infecciones respiratorias', en: 'E.g.: dengue with warning signs, respiratory infections' },
};

// Realistic Cuban-context MCQs
const getMedicalQuestions = (topic: string, subject: string, difficulty: Difficulty, language: 'es' | 'en'): MCQuestion => {
  const topicLower = (topic || subject).toLowerCase();
  
  // Cardiovascular questions
  if (topicLower.includes('cardio') || topicLower.includes('insuficiencia card') || topicLower.includes('heart')) {
    const questions: Record<Difficulty, MCQuestion> = {
      easy: {
        question: language === 'es' 
          ? '¿Cuál es el signo más característico de insuficiencia cardíaca izquierda?'
          : 'What is the most characteristic sign of left heart failure?',
        options: language === 'es'
          ? ['Disnea paroxística nocturna', 'Edema de miembros inferiores', 'Hepatomegalia congestiva', 'Ascitis']
          : ['Paroxysmal nocturnal dyspnea', 'Lower limb edema', 'Congestive hepatomegaly', 'Ascites'],
        correctIndex: 0,
        explanation: language === 'es'
          ? 'La disnea paroxística nocturna es característica de la insuficiencia cardíaca izquierda, causada por la redistribución de líquidos al decúbito. El edema y la hepatomegalia son más típicos de falla derecha. [Contenido educativo representativo]'
          : 'Paroxysmal nocturnal dyspnea is characteristic of left heart failure, caused by fluid redistribution when lying down. Edema and hepatomegaly are more typical of right-sided failure. [Representative educational content]',
      },
      medium: {
        question: language === 'es'
          ? 'En un paciente con insuficiencia cardíaca con fracción de eyección reducida, ¿cuál es el tratamiento de primera línea que ha demostrado reducir mortalidad?'
          : 'In a patient with heart failure with reduced ejection fraction, what is the first-line treatment proven to reduce mortality?',
        options: language === 'es'
          ? ['Digoxina', 'IECA + betabloqueador', 'Calcioantagonistas', 'Diuréticos de asa únicamente']
          : ['Digoxin', 'ACE inhibitor + beta-blocker', 'Calcium channel blockers', 'Loop diuretics only'],
        correctIndex: 1,
        explanation: language === 'es'
          ? 'Los IECA y betabloqueadores son pilares del tratamiento de IC con FE reducida, con evidencia de reducción de mortalidad. Los diuréticos alivian síntomas pero no modifican pronóstico. [Contenido representativo basado en guías internacionales]'
          : 'ACE inhibitors and beta-blockers are pillars of HFrEF treatment, with evidence of mortality reduction. Diuretics relieve symptoms but do not modify prognosis. [Representative content based on international guidelines]',
      },
      hard: {
        question: language === 'es'
          ? 'Un paciente de 68 años con IC descompensada presenta hipotensión (PA 85/60), oliguria y extremidades frías. ¿Cuál es la clasificación Forrester y el manejo inicial más apropiado?'
          : 'A 68-year-old patient with decompensated HF presents with hypotension (BP 85/60), oliguria, and cold extremities. What is the Forrester classification and most appropriate initial management?',
        options: language === 'es'
          ? ['Perfil B - Diuréticos IV', 'Perfil C - Considerar inotrópicos/vasopresores', 'Perfil L - Expansión de volumen', 'Perfil A - Solo optimizar medicación oral']
          : ['Profile B - IV diuretics', 'Profile C - Consider inotropes/vasopressors', 'Profile L - Volume expansion', 'Profile A - Only optimize oral medication'],
        correctIndex: 1,
        explanation: language === 'es'
          ? 'El perfil C (frío y húmedo) indica hipoperfusión con congestión. Requiere soporte inotrópico. La expansión de volumen empeoraría la congestión; los diuréticos solos no corrigen la hipoperfusión. [Razonamiento clínico representativo]'
          : 'Profile C (cold and wet) indicates hypoperfusion with congestion. Requires inotropic support. Volume expansion would worsen congestion; diuretics alone do not correct hypoperfusion. [Representative clinical reasoning]',
      },
    };
    return questions[difficulty];
  }
  
  // Dengue questions (common in Cuba)
  if (topicLower.includes('dengue')) {
    const questions: Record<Difficulty, MCQuestion> = {
      easy: {
        question: language === 'es' 
          ? '¿Cuál es el vector principal del virus del dengue?'
          : 'What is the main vector of the dengue virus?',
        options: language === 'es'
          ? ['Aedes aegypti', 'Anopheles gambiae', 'Culex pipiens', 'Lutzomyia longipalpis']
          : ['Aedes aegypti', 'Anopheles gambiae', 'Culex pipiens', 'Lutzomyia longipalpis'],
        correctIndex: 0,
        explanation: language === 'es'
          ? 'El Aedes aegypti es el principal vector del dengue en las Américas. También transmite Zika, chikungunya y fiebre amarilla urbana. [Contenido epidemiológico representativo]'
          : 'Aedes aegypti is the main dengue vector in the Americas. It also transmits Zika, chikungunya, and urban yellow fever. [Representative epidemiological content]',
      },
      medium: {
        question: language === 'es'
          ? '¿Cuál de los siguientes es un signo de alarma en dengue que indica progresión a dengue grave?'
          : 'Which of the following is a warning sign in dengue indicating progression to severe dengue?',
        options: language === 'es'
          ? ['Fiebre alta por 2 días', 'Dolor abdominal intenso y sostenido', 'Cefalea frontal', 'Mialgias generalizadas']
          : ['High fever for 2 days', 'Intense and sustained abdominal pain', 'Frontal headache', 'Generalized myalgia'],
        correctIndex: 1,
        explanation: language === 'es'
          ? 'El dolor abdominal intenso es un signo de alarma clave según OPS/OMS, indicando posible extravasación plasmática. Requiere hidratación IV y monitoreo estrecho. [Basado en guías OPS/OMS]'
          : 'Intense abdominal pain is a key warning sign per PAHO/WHO, indicating possible plasma leakage. Requires IV hydration and close monitoring. [Based on PAHO/WHO guidelines]',
      },
      hard: {
        question: language === 'es'
          ? 'Paciente con dengue en día 5 de enfermedad presenta hematocrito de 48% (basal 38%), plaquetas 45,000/mm³, dolor abdominal y vómitos. ¿Cuál es la conducta más apropiada?'
          : 'Patient with dengue on day 5 of illness presents hematocrit 48% (baseline 38%), platelets 45,000/mm³, abdominal pain and vomiting. What is the most appropriate management?',
        options: language === 'es'
          ? ['Alta con antipiréticos y cita en 24h', 'Hospitalización con cristaloides IV 5-7 ml/kg/hora', 'Transfusión de plaquetas inmediata', 'Iniciar corticoides IV']
          : ['Discharge with antipyretics and 24h follow-up', 'Hospitalization with IV crystalloids 5-7 ml/kg/hour', 'Immediate platelet transfusion', 'Start IV corticosteroids'],
        correctIndex: 1,
        explanation: language === 'es'
          ? 'El aumento del hematocrito >20% indica extravasación plasmática (dengue grave). Requiere hospitalización con reposición de líquidos según protocolo OPS. La transfusión de plaquetas no está indicada sin sangrado activo. [Manejo según guías regionales]'
          : 'Hematocrit increase >20% indicates plasma leakage (severe dengue). Requires hospitalization with fluid replacement per PAHO protocol. Platelet transfusion not indicated without active bleeding. [Management per regional guidelines]',
      },
    };
    return questions[difficulty];
  }
  
  // Default medical questions based on subject
  const defaultQuestions: Record<Difficulty, MCQuestion> = {
    easy: {
      question: language === 'es' 
        ? `En relación con ${topic || subject}, ¿cuál de las siguientes afirmaciones es correcta?`
        : `Regarding ${topic || subject}, which of the following statements is correct?`,
      options: language === 'es'
        ? [
            'Es un proceso que involucra múltiples mecanismos fisiológicos',
            'Solo tiene relevancia en condiciones patológicas',
            'No tiene aplicación clínica directa',
            'Es exclusivo de poblaciones pediátricas'
          ]
        : [
            'It is a process involving multiple physiological mechanisms',
            'It is only relevant in pathological conditions',
            'It has no direct clinical application',
            'It is exclusive to pediatric populations'
          ],
      correctIndex: 0,
      explanation: language === 'es'
        ? `La comprensión de ${topic || subject} requiere integrar múltiples aspectos de la fisiología y fisiopatología, lo que fundamenta su aplicación clínica. [Contenido educativo representativo]`
        : `Understanding ${topic || subject} requires integrating multiple aspects of physiology and pathophysiology, which supports its clinical application. [Representative educational content]`,
    },
    medium: {
      question: language === 'es'
        ? `¿Cuál es el mecanismo fisiopatológico principal involucrado en las manifestaciones clínicas de ${topic || subject}?`
        : `What is the main pathophysiological mechanism involved in the clinical manifestations of ${topic || subject}?`,
      options: language === 'es'
        ? [
            'Alteración de la homeostasis celular',
            'Respuesta inflamatoria desregulada',
            'Disfunción del sistema inmune',
            'Todas las anteriores pueden contribuir según el contexto'
          ]
        : [
            'Alteration of cellular homeostasis',
            'Dysregulated inflammatory response',
            'Immune system dysfunction',
            'All of the above may contribute depending on context'
          ],
      correctIndex: 3,
      explanation: language === 'es'
        ? `Los mecanismos fisiopatológicos son frecuentemente multifactoriales. En el contexto de ${topic || subject}, la integración de diferentes vías explica la variabilidad de presentaciones clínicas. [Contenido representativo]`
        : `Pathophysiological mechanisms are frequently multifactorial. In the context of ${topic || subject}, the integration of different pathways explains the variability of clinical presentations. [Representative content]`,
    },
    hard: {
      question: language === 'es'
        ? `Un paciente presenta una manifestación atípica relacionada con ${topic || subject}. Considerando recursos diagnósticos limitados, ¿cuál sería el enfoque clínico más apropiado?`
        : `A patient presents with an atypical manifestation related to ${topic || subject}. Considering limited diagnostic resources, what would be the most appropriate clinical approach?`,
      options: language === 'es'
        ? [
            'Solicitar estudios avanzados antes de cualquier intervención',
            'Priorizar la historia clínica y el examen físico detallado',
            'Iniciar tratamiento empírico sin evaluación adicional',
            'Referir inmediatamente a nivel terciario'
          ]
        : [
            'Request advanced studies before any intervention',
            'Prioritize detailed clinical history and physical examination',
            'Start empirical treatment without additional evaluation',
            'Immediately refer to tertiary level'
          ],
      correctIndex: 1,
      explanation: language === 'es'
        ? `En contextos de recursos limitados, la semiología clínica mantiene un valor diagnóstico fundamental. La historia clínica detallada y el examen físico pueden orientar el diagnóstico y el uso racional de estudios complementarios. [Enfoque para medicina en contextos de bajos recursos]`
        : `In low-resource settings, clinical semiology maintains fundamental diagnostic value. Detailed clinical history and physical examination can guide diagnosis and rational use of complementary studies. [Approach for medicine in low-resource settings]`,
    },
  };
  
  return defaultQuestions[difficulty];
};

const MCQGenerator: React.FC<MCQGeneratorProps> = ({ subject, variant = 'preclinical', systemKey }) => {
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [question, setQuestion] = useState<MCQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Get context-aware placeholder
  const getPlaceholder = () => {
    const key = systemKey || subject.toLowerCase().replace(/\s/g, '');
    const found = Object.entries(placeholderExamples).find(([k]) => 
      subject.toLowerCase().includes(t(k).toLowerCase()) || k === systemKey
    );
    return found ? found[1][language] : (language === 'es' ? 'Ej: tema específico a estudiar' : 'E.g.: specific topic to study');
  };

  const handleGenerate = () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setShowExplanation(false);
    
    setTimeout(() => {
      setQuestion(getMedicalQuestions(topic, subject, difficulty, language));
      setIsLoading(false);
    }, 1000);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  // Use same academic blue for both variants
  const colorClass = 'bg-academic';

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('topicOptional')}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('difficulty')}
          </label>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  difficulty === d
                    ? `${colorClass} text-white`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t(d)}
              </button>
            ))}
          </div>
        </div>
        
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          {isLoading ? t('generating') : t('generateQuestion')}
        </Button>
      </div>

      {/* Question Display */}
      {question && (
        <div className="space-y-4 p-4 bg-card rounded-lg border border-border animate-fade-in">
          <p className="text-foreground font-medium">{question.question}</p>
          
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const isCorrect = index === question.correctIndex;
              const isSelected = index === selectedAnswer;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3",
                    selectedAnswer === null && "hover:bg-muted cursor-pointer border-border",
                    isSelected && isCorrect && "bg-success/20 border-success",
                    isSelected && !isCorrect && "bg-destructive/20 border-destructive",
                    !isSelected && selectedAnswer !== null && isCorrect && "bg-success/10 border-success/50",
                    selectedAnswer !== null && !isSelected && !isCorrect && "opacity-50"
                  )}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-sm">{option}</span>
                  {selectedAnswer !== null && isCorrect && (
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  )}
                  {isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          
          {showExplanation && (
            <div className="p-4 bg-muted rounded-lg animate-fade-in">
              <p className="text-sm font-medium text-foreground mb-2">{t('explanation')}</p>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MCQGenerator;
