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
    AZURE_FOUNDRY_API_KEY?: string;
    AZURE_FOUNDRY_ENDPOINT?: string;
    AI_PROVIDER?: string;
  };
};

// Request/Response types
interface AIRequest {
  tool: 'chat' | 'mcq' | 'quiz' | 'explain' | 'guides';
  mode: 'preclinico' | 'clinico_estudio' | 'clinico_guias';
  language: 'es' | 'en';
  input: string;
  context?: {
    subject?: string;
    rotation?: string;
    system?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    topic?: string;
  };
}

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

type AIResponse = ChatResponse | MCQResponse | QuizResponse | ExplainResponse | GuidelinesResponse;

// Error response type
interface ErrorResponse {
  type: 'error';
  error: string;
  raw?: string;
}

// Azure DeepSeek API configuration
const MAX_INPUT_LENGTH = 2000;
// Tool-specific token limits for optimal performance
const TOKEN_LIMITS = {
  mcq: 800,      // Short question + options + explanation
  quiz: 1500,    // 5 questions with explanations
  explain: 1200, // Structured explanation
  chat: 1000,    // Conversational responses
  guides: 1500,  // Structured guidelines
};
const DEFAULT_TEMPERATURE = 0.7;
const GUIDELINES_TEMPERATURE = 0.3; // Lower temp for more structured guidelines

// Get Azure endpoint from environment or use default
function getAzureEndpoint(): string {
  return process.env.AZURE_FOUNDRY_ENDPOINT || 
    'https://medestudia-deepseek-resource.cognitiveservices.azure.com/openai/deployments/DeepSeek-V3.1/chat/completions?api-version=2024-05-01-preview';
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

  if (tool === 'chat') {
    if (mode === 'preclinico') {
      return isES
        ? `${baseInstructions}
Enfócate en explicar conceptos básicos de ciencias preclínicas, ayudando a comprender la teoría y su relevancia para la práctica clínica futura. 
Siempre referencia explícitamente el tema o pregunta del usuario en tu respuesta.
Responde en formato de texto natural, estructurado pero conversacional.`
        : `${baseInstructions}
Focus on explaining basic concepts of preclinical sciences, helping understand theory and its relevance for future clinical practice.
Always explicitly reference the user's topic or question in your response.
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
Genera exactamente 5 preguntas de opción múltiple médicas sobre el tema proporcionado.
Cada pregunta debe tener 4 opciones REALES (nunca placeholders). Incluye explicaciones.
Las preguntas deben cubrir diferentes aspectos del tema.
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
Generate exactly 5 medical multiple choice questions about the provided topic.
Each question must have 4 REAL options (never placeholders). Include explanations.
Questions should cover different aspects of the topic.
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

  if (tool === 'chat') {
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
    
    return prompt;
  } else if (tool === 'mcq') {
    return isES
      ? `Genera una pregunta de opción múltiple de dificultad ${difficulty} sobre "${topic}". ${subject ? `Contexto: ${subject}.` : ''}
Las opciones deben ser respuestas médicas reales y específicas, NO placeholders. La pregunta debe mencionar explícitamente "${topic}".`
      : `Generate a ${difficulty} difficulty multiple choice question about "${topic}". ${subject ? `Context: ${subject}.` : ''}
Options must be real and specific medical answers, NOT placeholders. The question must explicitly mention "${topic}".`;
  } else if (tool === 'quiz') {
    return isES
      ? `Genera exactamente 5 preguntas de opción múltiple médicas sobre "${topic}". ${subject ? `Contexto: ${subject}.` : ''}
Las preguntas deben cubrir diferentes aspectos del tema y mencionar explícitamente "${topic}" o conceptos relacionados. Las opciones deben ser respuestas médicas reales.`
      : `Generate exactly 5 medical multiple choice questions about "${topic}". ${subject ? `Context: ${subject}.` : ''}
Questions should cover different aspects of the topic and explicitly mention "${topic}" or related concepts. Options must be real medical answers.`;
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

  // Clamp input length
  if (body.input.length > MAX_INPUT_LENGTH) {
    body.input = body.input.substring(0, MAX_INPUT_LENGTH);
  }

  // Check for API key (support both old and new variable names)
  const apiKey = process.env.AZURE_FOUNDRY_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('API key not configured');
    return res.status(500).json({ 
      type: 'error', 
      error: 'AI service not configured. Please set AZURE_FOUNDRY_API_KEY or DEEPSEEK_API_KEY environment variable.' 
    });
  }

  try {
    // Build prompts
    const systemPrompt = buildSystemPrompt(body.tool, body.mode, body.language);
    const userPrompt = buildUserPrompt(body);

    // Determine temperature and token limit based on tool
    const temperature = body.tool === 'guides' ? GUIDELINES_TEMPERATURE : DEFAULT_TEMPERATURE;
    const maxTokens = TOKEN_LIMITS[body.tool] || TOKEN_LIMITS.chat;

    // Check if streaming is requested (only for chat tool, not explain since it needs JSON)
    const shouldStream = body.tool === 'chat' && body.mode !== 'clinico_guias';
    const useStreaming = shouldStream && !req.query?.noStream; // Allow opt-out via query param

    // Call Azure DeepSeek API
    const endpoint = getAzureEndpoint();
    const requestBody: any = {
      // Model is already specified in the URL path (DeepSeek-V3.1)
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    };

    // Only use JSON mode for non-streaming structured responses
    if (!useStreaming && (body.tool === 'guides' || body.tool === 'mcq' || body.tool === 'quiz' || body.tool === 'explain')) {
      requestBody.response_format = { type: 'json_object' };
    }

    // Enable streaming for chat and explain
    if (useStreaming) {
      requestBody.stream = true;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey, // Azure uses api-key header instead of Authorization Bearer
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          type: 'error', 
          error: 'Invalid API key. Please check AZURE_FOUNDRY_API_KEY configuration.' 
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

