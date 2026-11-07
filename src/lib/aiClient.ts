/**
 * AI Client - Frontend helper for calling the DeepSeek backend API
 */

export type Tool = 'chat' | 'mcq' | 'quiz' | 'explain' | 'guides' | 'reflect' | 'coach' | 'classify';
export type Mode = 'preclinico' | 'clinico_estudio' | 'clinico_guias';
export type Language = 'es' | 'en';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AIContext {
  subject?: string;
  rotation?: string;
  system?: string;
  difficulty?: Difficulty;
  topic?: string;
  questionCount?: number;
  learnerReflection?: string;
}

export interface AIRequest {
  tool: Tool;
  mode: Mode;
  language: Language;
  input: string;
  session_id?: string;
  context?: AIContext;
}

/** A textbook passage retrieved for a response (see api/_lib/retrieval.ts). */
export interface SourceRef {
  label: string;          // "S1" — the marker used inline in the text, e.g. [S1]
  title: string;
  section: string | null;
  chunkId: string;
  similarity: number;
  excerpt: string;
  cited: boolean;
}

/** Present on every content-generating response. */
export interface Grounding {
  grounded?: boolean;
  sources?: SourceRef[];
  removedCitations?: number;
}

// Response types
export interface ChatResponse extends Grounding {
  type: 'chat';
  answer: string;
  note?: string;
}

export interface MCQResponse extends Grounding {
  type: 'mcq';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface QuizResponse extends Grounding {
  type: 'quiz';
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface ExplainResponse extends Grounding {
  type: 'explain';
  definition: string;
  keyFeatures: string[];
  diagnosis?: string;
  managementBasics?: string;
  lowResourceConsiderations?: string;
}

export interface GuidelinesResponse extends Grounding {
  type: 'guides';
  steps: Array<{
    title: string;
    details: string[];
  }>;
  warnings: string[];
  sourceNote: string;
}

export interface ReflectResponse {
  type: 'reflect';
  prompt: string;
}

export interface CoachResponse extends Grounding {
  type: 'coach';
  hint: string;
  explanation: string;
}

export interface ClassifyResponse {
  type: 'classify';
  label: 'new_question' | 'follow_up' | 'feedback' | 'non_medical';
}

export interface ErrorResponse {
  type: 'error';
  error: string;
  raw?: string;
}

export type AIResponse = ChatResponse | MCQResponse | QuizResponse | ExplainResponse | GuidelinesResponse | ReflectResponse | CoachResponse | ClassifyResponse | ErrorResponse;

/**
 * Call the AI backend API
 * @param request - The AI request parameters
 * @returns The AI response
 * @throws Error if the request fails or returns an error response
 */
export async function callAI(request: AIRequest): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        type: 'error' as const,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: AIResponse = await response.json();

    // If the response is an error type, throw
    if (data.type === 'error') {
      throw new Error(data.raw ? `${data.error}\n\nRespuesta del modelo: ${data.raw.substring(0, 500)}` : data.error);
    }

    return data;
  } catch (error: any) {
    // Re-throw with context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to call AI service: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Helper to check if response is an error
 */
export function isErrorResponse(response: AIResponse): response is ErrorResponse {
  return response.type === 'error';
}

/**
 * Call the AI backend API with streaming support
 * @param request - The AI request parameters
 * @param onChunk - Callback function called with each chunk of content
 * @returns Promise that resolves when streaming is complete
 * @throws Error if the request fails or returns an error response
 */
export interface StreamMeta {
  grounded?: boolean;        // false = retrieval ran but found nothing relevant
  sources?: SourceRef[];     // sent once, before the text
  citations?: string[];      // labels actually cited, sent once, after the text
}

export async function callAIStream(
  request: AIRequest,
  onChunk: (content: string) => void,
  onMeta?: (meta: StreamMeta) => void,
): Promise<void> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        type: 'error' as const,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response is streaming (text/event-stream)
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    if (contentType?.includes('text/event-stream')) {
      console.log('Using streaming mode');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Streaming not supported');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const json = JSON.parse(data);
              if (json.content) {
                onChunk(json.content);
              } else if ('grounded' in json || json.sources || json.citations) {
                onMeta?.({ grounded: json.grounded, sources: json.sources, citations: json.citations });
              } else if (json.error) {
                throw new Error(json.error);
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
                if (json.content) {
                  onChunk(json.content);
                } else if ('grounded' in json || json.sources || json.citations) {
                  onMeta?.({ grounded: json.grounded, sources: json.sources, citations: json.citations });
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } else {
      // Fallback to non-streaming
      console.log('Falling back to non-streaming mode');
      const data: AIResponse = await response.json();
      if (data.type === 'error') {
        throw new Error(data.error || 'Unknown error from AI service');
      }
      // For non-streaming, call onChunk with full content
      if (data.type === 'chat') {
        if (data.grounded !== undefined) onMeta?.({ grounded: data.grounded, sources: data.sources });
        onChunk(data.answer);
      }
    }
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to call AI service: ${error?.message || 'Unknown error'}`);
  }
}

