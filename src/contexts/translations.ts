/**
 * Translation table.
 *
 * Kept in its own module so LanguageContext exports only components and hooks —
 * mixing constant exports into that file breaks React Fast Refresh.
 */

export interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navigation
  home: { es: 'Inicio', en: 'Home' },
  preclinical: { es: 'Preclínico', en: 'Preclinical' },
  clinical: { es: 'Clínico', en: 'Clinical' },
  
  // Homepage
  heroTitle: { es: 'Educación Médica para Cuba', en: 'Medical Education for Cuba' },
  heroSubtitle: {
    es: 'Preguntas de examen, explicaciones y guías clínicas para ciencias básicas y rotaciones.',
    en: 'Exam questions, explanations and clinical guidelines for basic sciences and rotations.'
  },
  selectPath: { es: 'Selecciona tu camino', en: 'Select your path' },
  pathwayStart: { es: 'Comenzar', en: 'Get started' },
  skipToContent: { es: 'Saltar al contenido', en: 'Skip to content' },
  studyPath: { es: 'Ruta de estudio', en: 'Study path' },
  rotationsSection: { es: 'Rotaciones clínicas', en: 'Clinical rotations' },
  rotationsSectionDesc: {
    es: 'Elige la rotación que estás cursando.',
    en: 'Choose the rotation you are studying.'
  },
  systemsSection: { es: 'Sistemas y áreas', en: 'Systems and areas' },
  systemsSectionDesc: {
    es: 'Acota el tema dentro de la rotación.',
    en: 'Narrow the topic within the rotation.'
  },
  conventionHomeTitle: { es: 'Convención Científica 2026', en: 'Scientific Convention 2026' },
  conventionHomeDesc: {
    es: 'Inscripción, comisiones científicas e información del evento de la facultad.',
    en: 'Registration, scientific commissions, and faculty event information.',
  },
  conventionHomeButton: { es: 'Ir al evento', en: 'Go to event' },
  convention2026Badge: { es: 'Evento', en: 'Event' },
  conventionEndedBadge: { es: 'Evento concluido', en: 'Event concluded' },
  conventionEndedTitle: {
    es: 'Convención Científica 2026 — finalizada',
    en: 'Scientific Convention 2026 — concluded',
  },
  conventionEndedDesc: {
    es: 'Gracias a quienes participaron. Los certificados digitales siguen disponibles. La próxima edición se anunciará aquí.',
    en: 'Thanks to everyone who took part. Digital certificates are still available. The next edition will be announced here.',
  },
  conventionEndedCertButton: { es: 'Descargar certificado', en: 'Download certificate' },
  conventionEndedArchiveButton: { es: 'Ver los resúmenes', en: 'Browse the abstracts' },
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
  beforeYouStart: { es: 'Antes de comenzar', en: 'Before you start' },
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
  
  // ---- Study loop: continue, sessions, errors, weekly, daily challenge ----
  continueStudying: { es: 'Continúa estudiando', en: 'Continue studying' },
  continueAction: { es: 'Continuar', en: 'Continue' },
  continueDismiss: { es: 'Descartar', en: 'Dismiss' },
  lastTool: { es: 'Última herramienta', en: 'Last tool' },

  quickSession: { es: 'Sesión rápida', en: 'Quick session' },
  quickSessionDesc: {
    es: 'Un repaso corto con lo que ya tienes a mano.',
    en: 'A short review using what you already have.'
  },
  sessionDuration: { es: 'Duración', en: 'Duration' },
  sessionGoal: { es: 'Objetivo', en: 'Goal' },
  goalReview: { es: 'Repasar conceptos', en: 'Review concepts' },
  goalPractice: { es: 'Practicar preguntas', en: 'Practice questions' },
  goalMixed: { es: 'Sesión mixta', en: 'Mixed session' },
  minutesShort: { es: 'min', en: 'min' },
  startSession: { es: 'Empezar sesión', en: 'Start session' },
  resumeSession: { es: 'Retomar sesión', en: 'Resume session' },
  discardSession: { es: 'Descartar sesión', en: 'Discard session' },
  sessionStep: { es: 'Paso', en: 'Step' },
  sessionOf: { es: 'de', en: 'of' },
  sessionComplete: { es: 'Sesión completada', en: 'Session complete' },
  sessionAnswered: { es: 'Preguntas respondidas', en: 'Questions answered' },
  sessionCorrect: { es: 'Respuestas correctas', en: 'Correct answers' },
  sessionToReview: { es: 'Para repasar', en: 'To review' },
  sessionNext: { es: 'Siguiente paso', en: 'Next step' },
  sessionFinish: { es: 'Terminar', en: 'Finish' },
  sessionPickTopic: { es: 'Elige un tema', en: 'Choose a topic' },
  sessionUnfinished: { es: 'Sesión sin terminar', en: 'Unfinished session' },
  sessionLockedExplain: {
    es: 'Genera una explicación para continuar.',
    en: 'Load an explanation to continue.'
  },
  sessionLockedQuestions: {
    es: 'Responde las preguntas para continuar.',
    en: 'Answer the questions to continue.'
  },
  sessionDiscardConfirm: { es: '¿Descartar esta sesión?', en: 'Discard this session?' },
  sessionDiscardYes: { es: 'Sí, descartar', en: 'Yes, discard' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  sessionReplacePrompt: {
    es: 'Ya tienes una sesión sin terminar. ¿Reemplazarla?',
    en: 'You already have an unfinished session. Replace it?'
  },
  sessionReplaceYes: { es: 'Reemplazar', en: 'Replace' },
  sessionAccuracy: { es: 'Precisión', en: 'Accuracy' },
  sessionMistakes: { es: 'Errores añadidos al cuaderno', en: 'Mistakes added to notebook' },
  sessionTopicStudied: { es: 'Tema estudiado', en: 'Topic studied' },
  sessionReviewMistakes: { es: 'Repasar estos errores', en: 'Review these mistakes' },
  sessionIncomplete: { es: 'Sesión incompleta', en: 'Session incomplete' },
  sessionNothingAnswered: {
    es: 'No respondiste preguntas en esta sesión.',
    en: 'You did not answer any questions in this session.'
  },

  errorNotebook: { es: 'Cuaderno de errores', en: 'Error notebook' },
  errorNotebookDesc: {
    es: 'Las preguntas que fallaste, guardadas solo en este navegador.',
    en: 'The questions you missed, stored only in this browser.'
  },
  errorsPendingOne: { es: 'error pendiente de repaso', en: 'question to review' },
  errorsPendingMany: { es: 'errores pendientes de repaso', en: 'questions to review' },
  reviewErrors: { es: 'Repasar', en: 'Review' },
  errorStatusUnreviewed: { es: 'Sin repasar', en: 'Not reviewed' },
  errorStatusReviewing: { es: 'En repaso', en: 'In review' },
  errorStatusMastered: { es: 'Dominado', en: 'Mastered' },
  filterAll: { es: 'Todos', en: 'All' },
  filterSubject: { es: 'Asignatura', en: 'Subject' },
  filterStatus: { es: 'Estado', en: 'Status' },
  retryQuestion: { es: 'Intentar de nuevo', en: 'Try again' },
  markMastered: { es: 'Marcar como dominado', en: 'Mark as mastered' },
  removeEntry: { es: 'Eliminar', en: 'Remove' },
  yourAnswer: { es: 'Tu respuesta', en: 'Your answer' },
  correctAnswerLabel: { es: 'Respuesta correcta', en: 'Correct answer' },
  timesMissed: { es: 'Veces fallada', en: 'Times missed' },
  emptyNotebook: { es: 'Todavía no hay errores guardados.', en: 'No saved mistakes yet.' },
  emptyNotebookDesc: {
    es: 'Cuando falles una pregunta aparecerá aquí para repasarla.',
    en: 'When you miss a question it will appear here for review.'
  },
  notebookRetention: {
    es: 'Se conservan las 300 preguntas más recientes en este navegador.',
    en: 'The 300 most recent questions are kept in this browser.'
  },

  thisWeek: { es: 'Esta semana', en: 'This week' },
  weekQuestions: { es: 'preguntas', en: 'questions' },
  weekQuestionOne: { es: 'pregunta', en: 'question' },
  weekTopicOne: { es: 'tema estudiado', en: 'topic studied' },
  weekAccuracy: { es: 'de precisión', en: 'accuracy' },
  weekTopics: { es: 'temas estudiados', en: 'topics studied' },
  weekErrors: { es: 'errores por repasar', en: 'errors to review' },
  weekEmpty: {
    es: 'Aún no has estudiado esta semana.',
    en: 'You have not studied yet this week.'
  },
  weekEmptyAction: { es: 'Empieza con una sesión rápida.', en: 'Start with a quick session.' },

  dailyChallenge: { es: 'La Guardia de Hoy', en: "Today's Round" },
  dailyChallengeDesc: {
    es: 'Un caso corto para practicar cada día.',
    en: 'A short case to practise each day.'
  },
  dailyChallengeDone: { es: 'Completado hoy', en: 'Completed today' },
  dailyChallengeStart: { es: 'Responder', en: 'Answer' },
  dailyChallengeCorrect: { es: '¡Correcto!', en: 'Correct.' },
  dailyChallengeIncorrect: { es: 'No es la opción correcta.', en: 'Not the right option.' },
  dailyChallengeSavedToNotebook: {
    es: 'Guardado en tu cuaderno de errores.',
    en: 'Saved to your error notebook.'
  },
  hypotheticalCase: {
    es: 'Caso hipotético con fines educativos.',
    en: 'Hypothetical case for educational purposes.'
  },
  challengeDraftNotice: {
    es: 'Contenido educativo en borrador, no revisado por la facultad. No es una guía oficial.',
    en: 'Draft educational content, not faculty-reviewed. Not an official guideline.'
  },
  challengeFacultyReviewed: { es: 'Revisado por la facultad', en: 'Faculty reviewed' },

  // Common
  back: { es: 'Volver', en: 'Back' },
  continue: { es: 'Continuar', en: 'Continue' },
  select: { es: 'Seleccionar', en: 'Select' },
  loading: { es: 'Cargando...', en: 'Loading...' },

  // Study Tools
  studyToolsSection: { es: 'Herramientas de estudio', en: 'Study Tools' },
  studyToolsSectionDesc: { es: 'Explora o estudia con IA', en: 'Explore or study with AI' },
  medicalAssistant: { es: 'Asistente Médico', en: 'Medical Assistant' },
  medicalAssistantDesc: { es: 'Explora conceptos médicos, resuelve dudas y desarrolla tu razonamiento clínico', en: 'Explore medical concepts, resolve doubts, and develop your clinical reasoning' },
  medicalAssistantInputPlaceholder: { es: 'Escribe tu pregunta médica...', en: 'Write your medical question...' },
  medicalAssistantExample: { es: 'Ej: ¿Por qué la anemia causa fatiga?', en: 'E.g.: Why does anemia cause fatigue?' },
  askAssistant: { es: 'Preguntar', en: 'Ask' },
  subjectsSection: { es: 'Asignaturas', en: 'Subjects' },
  subjectsSectionDesc: { es: 'Selecciona qué contenido quieres estudiar', en: 'Select what content you want to study' },
  generateMCQ: { es: 'Practicar', en: 'Practice' },
  generateMCQDesc: { es: 'Practica con preguntas generadas dinámicamente', en: 'Practice with dynamically generated questions' },
  quickQuiz: { es: 'Evaluación Rápida', en: 'Rapid Assessment' },
  quickQuizDesc: { es: 'Prueba tu conocimiento con un test corto', en: 'Test your knowledge with a short assessment' },
  explainTopic: { es: 'Estudiar', en: 'Study' },
  explainTopicDesc: { es: 'Comprende temas con explicaciones estructuradas', en: 'Understand topics with structured explanations' },
  viewStats: { es: 'Progreso', en: 'Progress' },
  viewStatsDesc: { es: 'Revisa tu desempeño y áreas de mejora', en: 'Review your performance and weak areas' },
  selectStudyTool: { es: 'Selecciona una forma de aprendizaje', en: 'Select a learning section' },
  basic: { es: 'Básico', en: 'Basic' },
  intermediate: { es: 'Intermedio', en: 'Intermediate' },
  clinicalLevel: { es: 'Difícil', en: 'Hard' },

  // MCQ Generator
  topicOptional: { es: 'Tema (opcional)', en: 'Topic (optional)' },
  topicPlaceholder: { es: 'Ej: sistema cardiovascular', en: 'E.g.: cardiovascular system' },
  difficulty: { es: 'Dificultad', en: 'Difficulty' },
  easy: { es: 'Fácil', en: 'Easy' },
  medium: { es: 'Medio', en: 'Medium' },
  hard: { es: 'Difícil', en: 'Hard' },
  startPractice: { es: 'Iniciar práctica', en: 'Start practice' },
  generateQuestion: { es: 'Generar Pregunta', en: 'Generate Question' },
  generating: { es: 'Generando...', en: 'Generating...' },
  explanation: { es: 'Explicación', en: 'Explanation' },

  // Quick Quiz
  quickQuizIntro: { es: '5 preguntas aleatorias para evaluar tu conocimiento', en: '5 random questions to test your knowledge' },
  startQuiz: { es: 'Iniciar Quiz', en: 'Start Quiz' },
  question: { es: 'Pregunta', en: 'Question' },
  elapsedTime: { es: 'Tiempo transcurrido', en: 'Elapsed time' },
  recommendedPace: { es: 'Ritmo sugerido', en: 'Suggested pace' },
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
