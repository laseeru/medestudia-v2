// Vercel serverless function types (inline to avoid dependency)
interface VercelRequest {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  write: (chunk: string) => void;
  end: () => void;
}

// Environment variable access helper
declare const process: {
  env: {
    DEEPSEEK_API_KEY?: string;
    DEEPSEEK_API_BASE_URL?: string;
    DEEPSEEK_MODEL?: string;
    AZURE_FOUNDRY_API_KEY?: string;
    AZURE_FOUNDRY_ENDPOINT?: string;
    AI_PROVIDER?: string;
  };
};

// Request/Response types
interface AIRequest {
  tool: 'chat' | 'mcq' | 'quiz' | 'explain' | 'guides' | 'reflect' | 'coach' | 'classify';
  mode: 'preclinico' | 'clinico_estudio' | 'clinico_guias';
  language: 'es' | 'en';
  input: string;
  session_id?: string;
  context?: {
    subject?: string;
    rotation?: string;
    system?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    topic?: string;
    questionCount?: number;
    learnerReflection?: string;
  };
}

type DetailLevel = 'brief' | 'standard' | 'deep';

// Response types for different tools
interface ChatResponse {
  type: 'chat';
  answer: string;
  note?: string;
}

interface MCQResponse {
  type: 'mcq';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizResponse {
  type: 'quiz';
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

interface ExplainResponse {
  type: 'explain';
  definition: string;
  keyFeatures: string[];
  diagnosis?: string;
  managementBasics?: string;
  lowResourceConsiderations?: string;
}

interface GuidelinesResponse {
  type: 'guides';
  steps: Array<{
    title: string;
    details: string[];
  }>;
  warnings: string[];
  sourceNote: string;
}

interface ReflectResponse {
  type: 'reflect';
  prompt: string;
}

interface CoachResponse {
  type: 'coach';
  hint: string;
  explanation: string;
}

interface ClassifyResponse {
  type: 'classify';
  label: 'new_question' | 'follow_up' | 'feedback' | 'non_medical';
}

type AIResponse = ChatResponse | MCQResponse | QuizResponse | ExplainResponse | GuidelinesResponse | ReflectResponse | CoachResponse | ClassifyResponse;

// Error response type
interface ErrorResponse {
  type: 'error';
  error: string;
  raw?: string;
}

// AI provider configuration
const MAX_INPUT_LENGTH = 2000;
// Tool-specific token limits for optimal performance
const TOKEN_LIMITS = {
  mcq: 600,      // Short question + options + explanation
  quiz: 1200,    // 5 questions with concise explanations
  explain: 850,  // Structured explanation
  chat: 950,     // Conversational responses (adaptive depth)
  guides: 1100,  // Structured guidelines
  reflect: 180,  // Short guiding reflection prompt
  coach: 700,    // Hint + corrective explanation (adaptive depth)
  classify: 40,  // Single-label intent classification
};
const DEFAULT_TEMPERATURE = 0.7;
const GUIDELINES_TEMPERATURE = 0.3; // Lower temp for more structured guidelines
const AI_REQUEST_TIMEOUT_MS = 18000;

type AIProvider = 'deepseek' | 'azure';

function getProvider(): AIProvider {
  return process.env.AI_PROVIDER === 'deepseek' ? 'deepseek' : 'azure';
}

// Get Azure endpoint from environment or use default
function getAzureEndpoint(): string {
  return process.env.AZURE_FOUNDRY_ENDPOINT || 
    'https://medestudia-deepseek-resource.cognitiveservices.azure.com/openai/deployments/DeepSeek-V3.1/chat/completions?api-version=2024-05-01-preview';
}

function getDeepSeekEndpoint(): string {
  const baseUrl = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com';
  return `${baseUrl}/chat/completions`;
}

// Helper to build system prompt based on tool and mode
function buildSystemPrompt(tool: AIRequest['tool'], mode: AIRequest['mode'], language: AIRequest['language']): string {
  const lang = language === 'es' ? 'español' : 'English';
  const isES = language === 'es';

  const baseInstructions = isES
    ? `Eres un asistente médico educativo especializado para estudiantes de medicina en Cuba. 
Responde SIEMPRE en ${lang} y usa terminología médica precisa. 
NUNCA uses placeholders como "Opción A/B" o "Option A/B" en las opciones de respuesta.
Tus respuestas deben ser específicas al tema consultado por el usuario.`
    : `You are an educational medical assistant specialized for medical students in Cuba.
Always respond in ${lang} and use precise medical terminology.
NEVER use placeholders like "Option A/B" in response options.
Your responses must be specific to the topic consulted by the user.`;

  if (tool === 'reflect') {
    return `You are a medical educator. Given a student's question, generate a short reflection prompt that encourages thinking before answering.

Rules:
- Do NOT answer the question
- Ask a guiding question
- Keep it concise (1-2 sentences)
- Focus on key concept behind the question
- Match the language of the user
- Do NOT include greetings
- Return only the reflection prompt text`;
  } else if (tool === 'classify') {
    return `You are a classifier. Classify the user's message into ONE of the following:

- new_question (a new academic or medical question)
- follow_up (requesting more detail, clarification, or expansion)
- feedback (acknowledgement like 'ok', 'dale', 'gracias')
- non_medical

Respond with ONE word only.`;
  } else if (tool === 'coach') {
    return `You are a medical educator. Given the student's question and reflection, produce guidance in the same language as the student.

Rules:
- Do NOT include greetings
- Keep output concise and educational
- Address the student's reflection directly
- If the reflection is off-topic or incorrect, acknowledge respectfully and redirect to the key concept
- The hint must guide thinking without giving the full answer
- The explanation must clarify the concept and correct misunderstandings respectfully
- Return ONLY valid JSON with this exact structure:
{
  "hint": "short guiding hint",
  "explanation": "clear corrective explanation"
}`;
  } else if (tool === 'chat') {
    if (mode === 'preclinico') {
      return isES
        ? `${baseInstructions}
Enfócate en explicar conceptos básicos de ciencias preclínicas, ayudando a comprender la teoría y su relevancia para la práctica clínica futura. 
Siempre referencia explícitamente el tema o pregunta del usuario en tu respuesta.
Si la pregunta no está relacionada con medicina, ciencias de la salud o contenidos académicos biomédicos, responde de forma breve que este asistente es solo para preguntas médicas y de ciencias de la salud.
Si la pregunta no es médica, responde EXACTAMENTE con este texto y nada más: "Este asistente está diseñado para aprendizaje médico. Reformula tu pregunta en un contexto clínico o académico."
Cuando la pregunta sí sea médica, organiza SIEMPRE tu respuesta en tres apartados y en este orden exacto:
🧠 Reflexiona primero: (1-2 frases para guiar pensamiento)
📌 Pista: (1-2 frases con una pista dirigida)
📖 Explicación: (explicación clara y educativa)
Responde en formato de texto natural, estructurado pero conversacional.`
        : `${baseInstructions}
Focus on explaining basic concepts of preclinical sciences, helping understand theory and its relevance for future clinical practice.
Always explicitly reference the user's topic or question in your response.
If the query is not related to medicine, health sciences, or biomedical academic content, reply briefly that this assistant is for medical and health-science questions only.
When the query is medical, ALWAYS structure the answer into three sections in this exact order:
🧠 Think first: (1-2 guiding sentences)
📌 Hint: (1-2 directed hints)
📖 Explanation: (clear educational explanation)
Respond in natural text format, structured but conversational.`;
    } else if (mode === 'clinico_estudio') {
      return isES
        ? `${baseInstructions}
Proporciona explicaciones educativas sobre razonamiento clínico, manifestaciones de enfermedades, y enfoques diagnósticos.
Usa casos hipotéticos para fines educativos. SIEMPRE menciona que es contenido educativo representativo.
Siempre referencia explícitamente el tema o pregunta del usuario en tu respuesta.
Responde en formato de texto natural, estructurado pero conversacional.`
        : `${baseInstructions}
Provide educational explanations about clinical reasoning, disease manifestations, and diagnostic approaches.
Use hypothetical cases for educational purposes. ALWAYS mention it is representative educational content.
Always explicitly reference the user's topic or question in your response.
Respond in natural text format, structured but conversational.`;
    } else {
      // clinico_guias
      return isES
        ? `${baseInstructions}
Proporciona información estructurada basada en guías clínicas representativas.
Siempre referencia explícitamente el tema o condición consultada por el usuario.
Sé cauteloso y estructurado. Prioriza protocolos paso a paso.
IMPORTANTE: Al final de tu respuesta, incluye una nota indicando que es contenido representativo y que las guías oficiales cubanas se integrarán posteriormente mediante RAG tras aprobación institucional.
Responde SOLO en formato JSON válido (sin markdown, sin código envolvente).`
        : `${baseInstructions}
Provide structured information based on representative clinical guidelines.
Always explicitly reference the topic or condition consulted by the user.
Be cautious and structured. Prioritize step-by-step protocols.
IMPORTANT: At the end of your response, include a note indicating it is representative content and that official Cuban guidelines will be integrated later via RAG after institutional approval.
Respond ONLY in valid JSON format (no markdown, no wrapping code).`;
    }
  } else if (tool === 'mcq') {
    return isES
      ? `${baseInstructions}
Genera una pregunta de opción múltiple médica relevante y específica al tema proporcionado.
Las opciones deben ser REALES respuestas médicas (nunca placeholders). 1 correcta y 3 distractores plausibles.
Incluye una explicación detallada que referencia explícitamente el tema.
Responde SOLO en formato JSON válido (sin markdown, sin código envolvente) con esta estructura exacta:
{
  "question": "pregunta específica al tema",
  "options": ["opción real 1", "opción real 2", "opción real 3", "opción real 4"],
  "correctIndex": 0,
  "explanation": "explicación que menciona el tema",
  "difficulty": "easy|medium|hard"
}`
      : `${baseInstructions}
Generate a relevant and topic-specific medical multiple choice question.
Options must be REAL medical answers (never placeholders). 1 correct and 3 plausible distractors.
Include a detailed explanation that explicitly references the topic.
Respond ONLY in valid JSON format (no markdown, no wrapping code) with this exact structure:
{
  "question": "topic-specific question",
  "options": ["real option 1", "real option 2", "real option 3", "real option 4"],
  "correctIndex": 0,
  "explanation": "explanation mentioning the topic",
  "difficulty": "easy|medium|hard"
}`;
  } else if (tool === 'quiz') {
    return isES
      ? `${baseInstructions}
Genera exactamente el número de preguntas solicitado en el prompt del usuario sobre el tema proporcionado.
Cada pregunta debe tener 4 opciones REALES (nunca placeholders). Incluye explicaciones.
Las preguntas deben cubrir diferentes aspectos del tema.
EVITA repetir enunciados o variantes muy similares entre preguntas del mismo quiz.
Cada pregunta debe evaluar un ángulo distinto (definición, fisiopatología, diagnóstico, manejo, complicaciones, prevención o epidemiología).
Responde SOLO en formato JSON válido (sin markdown, sin código envolvente) con esta estructura exacta:
{
  "questions": [
    {
      "question": "pregunta específica al tema",
      "options": ["opción real 1", "opción real 2", "opción real 3", "opción real 4"],
      "correctIndex": 0,
      "explanation": "explicación que menciona el tema"
    }
  ]
}`
      : `${baseInstructions}
Generate exactly the number of medical multiple choice questions requested in the user prompt about the provided topic.
Each question must have 4 REAL options (never placeholders). Include explanations.
Questions should cover different aspects of the topic.
AVOID repeating stems or very similar variants across questions in the same quiz.
Each question must test a different angle (definition, pathophysiology, diagnosis, management, complications, prevention, or epidemiology).
Respond ONLY in valid JSON format (no markdown, no wrapping code) with this exact structure:
{
  "questions": [
    {
      "question": "topic-specific question",
      "options": ["real option 1", "real option 2", "real option 3", "real option 4"],
      "correctIndex": 0,
      "explanation": "explanation mentioning the topic"
    }
  ]
}`;
  } else if (tool === 'explain') {
    return isES
      ? `${baseInstructions}
Proporciona una explicación estructurada y completa del tema médico proporcionado.
Siempre referencia explícitamente el tema del usuario en cada sección.
Responde SOLO en formato JSON válido (sin markdown, sin código envolvente) con esta estructura exacta:
{
  "definition": "definición que menciona el tema específicamente",
  "keyFeatures": ["característica 1 relacionada al tema", "característica 2", ...],
  "diagnosis": "enfoque diagnóstico específico al tema (opcional, solo si aplica)",
  "managementBasics": "aspectos básicos de manejo específicos al tema (opcional)",
  "lowResourceConsiderations": "consideraciones para recursos limitados específicas al tema"
}`
      : `${baseInstructions}
Provide a structured and complete explanation of the provided medical topic.
Always explicitly reference the user's topic in each section.
Respond ONLY in valid JSON format (no markdown, no wrapping code) with this exact structure:
{
  "definition": "definition specifically mentioning the topic",
  "keyFeatures": ["topic-related feature 1", "feature 2", ...],
  "diagnosis": "topic-specific diagnostic approach (optional, only if applicable)",
  "managementBasics": "topic-specific management basics (optional)",
  "lowResourceConsiderations": "topic-specific low-resource considerations"
}`;
  } else {
    // guides
    return isES
      ? `${baseInstructions}
Proporciona una guía clínica estructurada paso a paso sobre la condición o procedimiento consultado.
Siempre referencia explícitamente la condición/procedimiento del usuario.
Sé protocolario, cauteloso y estructurado. Prioriza pasos claros y advertencias importantes.
Responde SOLO en formato JSON válido (sin markdown, sin código envolvente) con esta estructura exacta:
{
  "steps": [
    {
      "title": "título del paso que referencia la condición",
      "details": ["detalle 1 específico", "detalle 2", ...]
    }
  ],
  "warnings": ["advertencia 1 relevante", "advertencia 2", ...],
  "sourceNote": "Esta es información basada en guías clínicas representativas. Las guías oficiales cubanas se integrarán posteriormente mediante técnicas de recuperación aumentada de generación (RAG) tras la aprobación institucional correspondiente."
}`
      : `${baseInstructions}
Provide a structured step-by-step clinical guideline about the consulted condition or procedure.
Always explicitly reference the user's condition/procedure.
Be protocol-based, cautious and structured. Prioritize clear steps and important warnings.
Respond ONLY in valid JSON format (no markdown, no wrapping code) with this exact structure:
{
  "steps": [
    {
      "title": "step title referencing the condition",
      "details": ["specific detail 1", "detail 2", ...]
    }
  ],
  "warnings": ["relevant warning 1", "warning 2", ...],
  "sourceNote": "This is information based on representative clinical guidelines. Official Cuban guidelines will be integrated later using retrieval-augmented generation (RAG) techniques after corresponding institutional approval."
}`;
  }
}

// Helper to build user prompt based on tool and context
function buildUserPrompt(req: AIRequest): string {
  const { tool, input, context, language } = req;
  const isES = language === 'es';

  const topic = context?.topic || input;
  const subject = context?.subject || context?.rotation || context?.system;
  const difficulty = context?.difficulty || 'medium';
  const questionCount = Math.max(3, Math.min(context?.questionCount || 5, 15));
  const difficultyInstruction = isES
    ? difficulty === 'easy'
      ? 'Nivel de dificultad: básico. Evalúa definiciones, conceptos fundamentales y reconocimiento simple.'
      : difficulty === 'medium'
        ? 'Nivel de dificultad: intermedio. Evalúa aplicación de conceptos, comparación y razonamiento clínico/preclínico moderado.'
        : 'Nivel de dificultad: difícil. Evalúa integración de múltiples conceptos, discriminación fina entre opciones plausibles y razonamiento avanzado.'
    : difficulty === 'easy'
      ? 'Difficulty level: basic. Test definitions, core concepts, and simple recognition.'
      : difficulty === 'medium'
        ? 'Difficulty level: intermediate. Test concept application, comparison, and moderate clinical/preclinical reasoning.'
        : 'Difficulty level: hard. Test integration of multiple concepts, fine discrimination among plausible options, and advanced reasoning.';

  const inferDetailLevel = (texts: string[]): DetailLevel => {
    const haystack = texts.join(' ').toLowerCase();
    const deepPatterns = [
      /más detalle|mas detalle|explica más|explica mas|más profundo|mas profundo|a profundidad|detallado|detallada|amplia|ampliar|thorough|in depth|deeper|more detail|detailed|expand/,
    ];
    const briefPatterns = [
      /resumen|breve|corto|rápido|rapido|conciso|short|brief|quick|summary/,
    ];

    if (deepPatterns.some((p) => p.test(haystack))) return 'deep';
    if (briefPatterns.some((p) => p.test(haystack))) return 'brief';
    return 'standard';
  };

  const detailLevel = inferDetailLevel([input, context?.learnerReflection || '']);
  const detailInstruction = isES
    ? detailLevel === 'deep'
      ? 'Profundidad solicitada: alta. Ofrece una explicación más extensa y estructurada, con razonamiento paso a paso y conexiones clínicas/preclínicas relevantes.'
      : detailLevel === 'brief'
        ? 'Profundidad solicitada: breve. Mantén la explicación corta y directa.'
        : 'Profundidad solicitada: estándar. Balancea claridad y profundidad.'
    : detailLevel === 'deep'
      ? 'Requested depth: high. Provide a more thorough, structured explanation with step-by-step reasoning and relevant clinical/preclinical links.'
      : detailLevel === 'brief'
        ? 'Requested depth: brief. Keep the explanation short and direct.'
        : 'Requested depth: standard. Balance clarity and depth.';

  if (tool === 'reflect') {
    return input.trim();
  } else if (tool === 'classify') {
    return input.trim();
  } else if (tool === 'coach') {
    const reflection = context?.learnerReflection?.trim();
    return isES
      ? `Pregunta del estudiante: "${input}"\nReflexión del estudiante: "${reflection || 'Sin reflexión escrita'}"\n${detailInstruction}\nGenera una pista y una explicación correctiva respetuosa.`
      : `Student question: "${input}"\nStudent reflection: "${reflection || 'No written reflection'}"\n${detailInstruction}\nGenerate a hint and a respectful corrective explanation.`;
  } else if (tool === 'chat') {
    let prompt = isES
      ? `Usuario pregunta sobre: "${input}"`
      : `User asks about: "${input}"`;
    
    if (subject) {
      prompt += isES
        ? `\nContexto: ${subject}`
        : `\nContext: ${subject}`;
    }
    
    if (req.mode === 'clinico_guias') {
      prompt += isES
        ? `\n\nProporciona una respuesta estructurada basada en guías clínicas representativas, organizada en pasos claros con advertencias relevantes. Al final, incluye la nota sobre contenido representativo y futura integración de guías oficiales cubanas.`
        : `\n\nProvide a structured response based on representative clinical guidelines, organized in clear steps with relevant warnings. At the end, include the note about representative content and future integration of official Cuban guidelines.`;
    }
    prompt += isES ? `\n\n${detailInstruction}` : `\n\n${detailInstruction}`;
    
    return prompt;
  } else if (tool === 'mcq') {
    return isES
      ? `Genera una pregunta de opción múltiple de dificultad ${difficulty} sobre "${topic}". ${subject ? `Contexto: ${subject}.` : ''}
${difficultyInstruction}
Las opciones deben ser respuestas médicas reales y específicas, NO placeholders. La pregunta debe mencionar explícitamente "${topic}".`
      : `Generate a ${difficulty} difficulty multiple choice question about "${topic}". ${subject ? `Context: ${subject}.` : ''}
${difficultyInstruction}
Options must be real and specific medical answers, NOT placeholders. The question must explicitly mention "${topic}".`;
  } else if (tool === 'quiz') {
    return isES
      ? `Genera exactamente ${questionCount} preguntas de opción múltiple médicas sobre "${topic}". ${subject ? `Contexto: ${subject}.` : ''}
${difficultyInstruction}
Las preguntas deben cubrir diferentes aspectos del tema y mencionar explícitamente "${topic}" o conceptos relacionados. Las opciones deben ser respuestas médicas reales.
Evita enunciados repetidos o casi repetidos en el mismo resultado.`
      : `Generate exactly ${questionCount} medical multiple choice questions about "${topic}". ${subject ? `Context: ${subject}.` : ''}
${difficultyInstruction}
Questions should cover different aspects of the topic and explicitly mention "${topic}" or related concepts. Options must be real medical answers.
Avoid repeated or near-duplicate stems within the same result.`;
  } else if (tool === 'explain') {
    return isES
      ? `Explica en detalle: "${topic}". ${subject ? `Contexto: ${subject}.` : ''}
Asegúrate de mencionar explícitamente "${topic}" en la definición y en cada sección. Incluye consideraciones para recursos limitados relevantes para Cuba.`
      : `Explain in detail: "${topic}". ${subject ? `Context: ${subject}.` : ''}
Make sure to explicitly mention "${topic}" in the definition and in each section. Include low-resource considerations relevant for Cuba.`;
  } else {
    // guides
    return isES
      ? `Consulta sobre guía clínica para: "${input}". ${subject ? `Contexto: ${subject}.` : ''}
Proporciona una guía estructurada paso a paso. Menciona explícitamente "${input}" en los pasos. Incluye advertencias relevantes y la nota sobre contenido representativo.`
      : `Consultation about clinical guideline for: "${input}". ${subject ? `Context: ${subject}.` : ''}
Provide a structured step-by-step guideline. Explicitly mention "${input}" in the steps. Include relevant warnings and the note about representative content.`;
  }
}

// Helper to parse and validate JSON response
function parseJSONResponse(text: string): AIResponse | null {
  try {
    // Remove markdown code blocks if present
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    return JSON.parse(cleaned) as AIResponse;
  } catch (e) {
    return null;
  }
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ type: 'error', error: 'Method not allowed' });
  }

  // Validate request body
  const body = req.body as AIRequest;
  if (!body.tool || !body.mode || !body.language || !body.input) {
    return res.status(400).json({ 
      type: 'error', 
      error: 'Missing required fields: tool, mode, language, input' 
    });
  }
  if (body.tool === 'chat' && !body.session_id) {
    return res.status(400).json({
      type: 'error',
      error: 'Missing required field: session_id for chat requests',
    });
  }

  // Clamp input length
  if (body.input.length > MAX_INPUT_LENGTH) {
    body.input = body.input.substring(0, MAX_INPUT_LENGTH);
  }

  const provider = getProvider();

  // Resolve API key based on selected provider
  const apiKey =
    provider === 'deepseek'
      ? process.env.DEEPSEEK_API_KEY
      : process.env.AZURE_FOUNDRY_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('API key not configured');
    return res.status(500).json({ 
      type: 'error', 
      error:
        provider === 'deepseek'
          ? 'AI service not configured. Please set DEEPSEEK_API_KEY environment variable.'
          : 'AI service not configured. Please set AZURE_FOUNDRY_API_KEY or DEEPSEEK_API_KEY environment variable.'
    });
  }

  try {
    // Build prompts
    const systemPrompt = buildSystemPrompt(body.tool, body.mode, body.language);
    const userPrompt = buildUserPrompt(body);

    // Determine temperature and token limit based on tool
    const temperature = body.tool === 'guides' ? GUIDELINES_TEMPERATURE : DEFAULT_TEMPERATURE;
    const maxTokens = TOKEN_LIMITS[body.tool] || TOKEN_LIMITS.chat;

    // Enable streaming only when explicitly requested.
    // Default JSON responses are faster to integrate and easier to handle consistently.
    const shouldStream = body.tool === 'chat' && body.mode !== 'clinico_guias';
    const useStreaming = shouldStream && req.query?.stream === '1';

    // Resolve endpoint based on selected provider
    const endpoint = provider === 'deepseek' ? getDeepSeekEndpoint() : getAzureEndpoint();
    const requestBody: any = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(body.session_id ? { user: body.session_id } : {}),
    };

    if (provider === 'deepseek') {
      requestBody.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    }

    // Only use JSON mode for non-streaming structured responses
    if (!useStreaming && (body.tool === 'guides' || body.tool === 'mcq' || body.tool === 'quiz' || body.tool === 'explain')) {
      requestBody.response_format = { type: 'json_object' };
    }

    // Enable streaming for chat and explain
    if (useStreaming) {
      requestBody.stream = true;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider === 'deepseek'
          ? { Authorization: `Bearer ${apiKey}` }
          : { 'api-key': apiKey }),
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          type: 'error', 
          error:
            provider === 'deepseek'
              ? 'Invalid API key. Please check DEEPSEEK_API_KEY configuration.'
              : 'Invalid API key. Please check AZURE_FOUNDRY_API_KEY configuration.'
        });
      }
      
      return res.status(500).json({ 
        type: 'error', 
        error: `AI service error: ${response.statusText}`,
        raw: errorText.substring(0, 1000)
      });
    }

    // Handle streaming response
    if (useStreaming && response.body) {
      console.log('Starting streaming response');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(200);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                res.write('data: [DONE]\n\n');
                res.end();
                return;
              }

              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;
                if (delta?.content) {
                  res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data !== '[DONE]') {
                try {
                  const json = JSON.parse(data);
                  const delta = json.choices?.[0]?.delta;
                  if (delta?.content) {
                    res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (error: any) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming error' })}\n\n`);
        res.end();
        return;
      }
    }

    // Non-streaming response (existing logic)
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      return res.status(500).json({ 
        type: 'error', 
        error: 'Empty response from AI service' 
      });
    }

    // Parse JSON response
    let parsedResponse: AIResponse | null = null;

    if (body.tool === 'chat' && body.mode !== 'clinico_guias') {
      // For chat (non-guidelines), return as text
      return res.status(200).json({
        type: 'chat',
        answer: content,
        note: body.mode === 'clinico_estudio' 
          ? (body.language === 'es' 
            ? 'Modo educativo — caso hipotético para fines de aprendizaje' 
            : 'Educational mode — hypothetical case for learning purposes')
          : undefined
      } as ChatResponse);
    }
    if (body.tool === 'reflect') {
      return res.status(200).json({
        type: 'reflect',
        prompt: content.trim(),
      } as ReflectResponse);
    }
    if (body.tool === 'classify') {
      const raw = content.trim().toLowerCase();
      const match = raw.match(/new_question|follow_up|feedback|non_medical/);
      const label = (match?.[0] || 'new_question') as ClassifyResponse['label'];
      return res.status(200).json({
        type: 'classify',
        label,
      } as ClassifyResponse);
    }
    if (body.tool === 'coach') {
      const coachParsed = parseJSONResponse(content) as CoachResponse | null;
      if (!coachParsed || typeof coachParsed.hint !== 'string' || typeof coachParsed.explanation !== 'string') {
        return res.status(200).json({
          type: 'error',
          error: 'Invalid coach structure',
          raw: content.substring(0, 1000)
        } as ErrorResponse);
      }
      return res.status(200).json({
        type: 'coach',
        hint: coachParsed.hint.trim(),
        explanation: coachParsed.explanation.trim(),
      } as CoachResponse);
    }

    // For all other tools, parse as JSON
    parsedResponse = parseJSONResponse(content);

    if (!parsedResponse) {
      // Try to extract JSON from content if it's wrapped
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = parseJSONResponse(jsonMatch[0]);
      }
    }

    if (!parsedResponse) {
      return res.status(200).json({
        type: 'error',
        error: 'Model returned non-JSON',
        raw: content.substring(0, 1000)
      } as ErrorResponse);
    }

    // Add type if missing (for backwards compatibility)
    if (!('type' in parsedResponse) || !parsedResponse.type) {
      (parsedResponse as any).type = body.tool;
    }

    // Validate response structure based on tool
    if (body.tool === 'mcq') {
      const mcq = parsedResponse as MCQResponse;
      if (!mcq.question || !Array.isArray(mcq.options) || mcq.options.length !== 4 || 
          typeof mcq.correctIndex !== 'number' || !mcq.explanation) {
        return res.status(200).json({
          type: 'error',
          error: 'Invalid MCQ structure',
          raw: content.substring(0, 1000)
        } as ErrorResponse);
      }
    } else if (body.tool === 'quiz') {
      const quiz = parsedResponse as QuizResponse;
      if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        return res.status(200).json({
          type: 'error',
          error: 'Invalid quiz structure',
          raw: content.substring(0, 1000)
        } as ErrorResponse);
      }
    } else if (body.tool === 'explain') {
      const explain = parsedResponse as ExplainResponse;
      if (!explain.definition || !Array.isArray(explain.keyFeatures)) {
        return res.status(200).json({
          type: 'error',
          error: 'Invalid explain structure',
          raw: content.substring(0, 1000)
        } as ErrorResponse);
      }
    } else if (body.tool === 'guides') {
      const guides = parsedResponse as GuidelinesResponse;
      if (!Array.isArray(guides.steps) || !Array.isArray(guides.warnings) || !guides.sourceNote) {
        return res.status(200).json({
          type: 'error',
          error: 'Invalid guidelines structure',
          raw: content.substring(0, 1000)
        } as ErrorResponse);
      }
    }

    return res.status(200).json(parsedResponse);

  } catch (error: any) {
    console.error('Error calling DeepSeek API:', error);
    return res.status(500).json({ 
      type: 'error', 
      error: error.message || 'Internal server error' 
    });
  }
}

