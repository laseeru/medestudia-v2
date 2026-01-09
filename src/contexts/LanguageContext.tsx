import React, { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'es' | 'en';

interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { es: 'Inicio', en: 'Home' },
  preclinical: { es: 'Preclínico', en: 'Preclinical' },
  clinical: { es: 'Clínico', en: 'Clinical' },
  
  // Homepage
  heroTitle: { es: 'Educación Médica para Cuba', en: 'Medical Education for Cuba' },
  heroSubtitle: { 
    es: 'Plataforma de apoyo educativo y guías clínicas impulsada por inteligencia artificial', 
    en: 'AI-powered educational support and clinical guidelines platform' 
  },
  selectPath: { es: 'Selecciona tu camino', en: 'Select your path' },
  preclinicalDesc: { es: 'Ciencias básicas y formación médica temprana', en: 'Basic sciences and early medical training' },
  clinicalDesc: { es: 'Estudio clínico y referencia de guías', en: 'Clinical study and guideline reference' },
  
  // Preclinical subjects
  anatomy: { es: 'Anatomía', en: 'Anatomy' },
  histology: { es: 'Histología y Embriología', en: 'Histology & Embryology' },
  cellBiology: { es: 'Biología Celular y Molecular', en: 'Cell & Molecular Biology' },
  biochemistry: { es: 'Bioquímica', en: 'Biochemistry' },
  physiology: { es: 'Fisiología', en: 'Physiology' },
  microbiology: { es: 'Microbiología', en: 'Microbiology' },
  parasitology: { es: 'Parasitología', en: 'Parasitology' },
  immunology: { es: 'Inmunología', en: 'Immunology' },
  biostatistics: { es: 'Bioestadística / Metodología', en: 'Biostatistics / Methodology' },
  pharmacology: { es: 'Farmacología', en: 'Pharmacology' },
  
  // Clinical modes
  clinicalStudy: { es: 'Estudio Clínico', en: 'Clinical Study' },
  clinicalGuidelines: { es: 'Guías Clínicas', en: 'Clinical Guidelines' },
  clinicalStudyDesc: { es: 'Preparación educativa para rotaciones y exámenes', en: 'Educational preparation for rotations and exams' },
  clinicalGuidelinesDesc: { es: 'Navegación estructurada de guías clínicas', en: 'Structured navigation of clinical guidelines' },
  
  // Clinical rotations
  internalMedicine: { es: 'Medicina Interna', en: 'Internal Medicine' },
  surgery: { es: 'Cirugía', en: 'Surgery' },
  pediatrics: { es: 'Pediatría', en: 'Pediatrics' },
  gynecology: { es: 'Ginecología y Obstetricia', en: 'Gynecology & Obstetrics' },
  generalMedicine: { es: 'Medicina General Integral', en: 'Comprehensive General Medicine' },
  
  // Systems
  cardiovascular: { es: 'Cardiovascular', en: 'Cardiovascular' },
  respiratory: { es: 'Respiratorio', en: 'Respiratory' },
  endocrine: { es: 'Endocrino', en: 'Endocrine' },
  gastrointestinal: { es: 'Gastrointestinal', en: 'Gastrointestinal' },
  neurological: { es: 'Neurológico', en: 'Neurological' },
  renal: { es: 'Renal', en: 'Renal' },
  
  // AI & Chat
  aiAssistant: { es: 'Asistente IA', en: 'AI Assistant' },
  typeMessage: { es: 'Escribe tu pregunta...', en: 'Type your question...' },
  send: { es: 'Enviar', en: 'Send' },
  educationalUse: { es: 'Uso educativo', en: 'Educational use' },
  educationalModeBanner: { 
    es: 'Modo educativo — no destinado a la toma de decisiones clínicas reales', 
    en: 'Educational mode — not intended for real clinical decision-making' 
  },
  
  // Guidelines gate
  guidelinesDisclaimer: { 
    es: 'Esta herramienta ofrece apoyo basado en guías clínicas. No sustituye el juicio profesional.', 
    en: 'This tool provides support based on clinical guidelines. It does not replace professional judgment.' 
  },
  understand: { es: 'Entiendo', en: 'I understand' },
  
  // Status
  online: { es: 'En línea', en: 'Online' },
  limited: { es: 'Limitado', en: 'Limited' },
  offline: { es: 'Sin conexión', en: 'Offline' },
  
  // Footer
  prototypeNotice: { 
    es: 'Este prototipo utiliza contenido representativo. Los documentos oficiales cubanos se integrarán posteriormente mediante técnicas de recuperación de información (RAG).', 
    en: 'This prototype uses representative content. Official Cuban documents will be integrated later using retrieval-augmented generation (RAG) techniques.' 
  },
  
  // Common
  back: { es: 'Volver', en: 'Back' },
  continue: { es: 'Continuar', en: 'Continue' },
  select: { es: 'Seleccionar', en: 'Select' },
  loading: { es: 'Cargando...', en: 'Loading...' },

  // Study Tools
  generateMCQ: { es: 'Generar MCQ', en: 'Generate MCQ' },
  generateMCQDesc: { es: 'Pregunta de opción múltiple', en: 'Multiple choice question' },
  quickQuiz: { es: 'Quiz Rápido', en: 'Quick Quiz' },
  quickQuizDesc: { es: '5 preguntas con puntuación', en: '5 questions with score' },
  explainTopic: { es: 'Explicar Tema', en: 'Explain Topic' },
  explainTopicDesc: { es: 'Explicación estructurada', en: 'Structured explanation' },
  viewStats: { es: 'Estadísticas', en: 'Statistics' },
  viewStatsDesc: { es: 'Tu historial de estudio', en: 'Your study history' },
  selectStudyTool: { es: 'Selecciona una herramienta de estudio', en: 'Select a study tool' },

  // MCQ Generator
  topicOptional: { es: 'Tema (opcional)', en: 'Topic (optional)' },
  topicPlaceholder: { es: 'Ej: sistema cardiovascular', en: 'E.g.: cardiovascular system' },
  difficulty: { es: 'Dificultad', en: 'Difficulty' },
  easy: { es: 'Fácil', en: 'Easy' },
  medium: { es: 'Medio', en: 'Medium' },
  hard: { es: 'Difícil', en: 'Hard' },
  generateQuestion: { es: 'Generar Pregunta', en: 'Generate Question' },
  generating: { es: 'Generando...', en: 'Generating...' },
  explanation: { es: 'Explicación', en: 'Explanation' },

  // Quick Quiz
  quickQuizIntro: { es: '5 preguntas aleatorias para evaluar tu conocimiento', en: '5 random questions to test your knowledge' },
  startQuiz: { es: 'Iniciar Quiz', en: 'Start Quiz' },
  question: { es: 'Pregunta', en: 'Question' },
  nextQuestion: { es: 'Siguiente', en: 'Next' },
  finishQuiz: { es: 'Finalizar', en: 'Finish' },
  excellent: { es: '¡Excelente!', en: 'Excellent!' },
  good: { es: '¡Buen trabajo!', en: 'Good job!' },
  keepPracticing: { es: 'Sigue practicando', en: 'Keep practicing' },
  correct: { es: 'correctas', en: 'correct' },
  tryAgain: { es: 'Intentar de nuevo', en: 'Try Again' },

  // Topic Explainer
  enterTopic: { es: 'Ingresa un tema para explicar', en: 'Enter a topic to explain' },
  topicExamplePlaceholder: { es: 'Ej: diabetes mellitus tipo 2', en: 'E.g.: type 2 diabetes mellitus' },
  definition: { es: 'Definición', en: 'Definition' },
  keyFeatures: { es: 'Características clave', en: 'Key Features' },
  diagnosticOverview: { es: 'Panorama diagnóstico', en: 'Diagnostic Overview' },
  lowResourceConsiderations: { es: 'Consideraciones para recursos limitados', en: 'Low-Resource Considerations' },
  enterTopicPrompt: { es: 'Ingresa un tema arriba para obtener una explicación estructurada', en: 'Enter a topic above to get a structured explanation' },
  representativeContent: { es: 'Contenido educativo representativo', en: 'Representative educational content' },

  // Score Stats
  noStatsYet: { es: 'Sin estadísticas aún', en: 'No stats yet' },
  completeQuizPrompt: { es: 'Completa un quiz para ver tus estadísticas aquí', en: 'Complete a quiz to see your stats here' },
  quizzesTaken: { es: 'Quizzes realizados', en: 'Quizzes taken' },
  accuracy: { es: 'Precisión', en: 'Accuracy' },
  avgScore: { es: 'Promedio', en: 'Average' },
  recentResults: { es: 'Resultados recientes', en: 'Recent Results' },
  clearHistory: { es: 'Borrar historial', en: 'Clear history' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
