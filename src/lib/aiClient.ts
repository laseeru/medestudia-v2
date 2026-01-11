/**
 * AI Client - Frontend helper for calling the DeepSeek backend API
 */

export type Tool = 'chat' | 'mcq' | 'quiz' | 'explain' | 'guides';
export type Mode = 'preclinico' | 'clinico_estudio' | 'clinico_guias';
export type Language = 'es' | 'en';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AIContext {
  subject?: string;
  rotation?: string;
  system?: string;
  difficulty?: Difficulty;
  topic?: string;
}

export interface AIRequest {
  tool: Tool;
  mode: Mode;
  language: Language;
  input: string;
  context?: AIContext;
}

// Response types
export interface ChatResponse {
  type: 'chat';
  answer: string;
  note?: string;
}

export interface MCQResponse {
  type: 'mcq';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface QuizResponse {
  type: 'quiz';
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface ExplainResponse {
  type: 'explain';
  definition: string;
  keyFeatures: string[];
  diagnosis?: string;
  managementBasics?: string;
  lowResourceConsiderations?: string;
}

export interface GuidelinesResponse {
  type: 'guides';
  steps: Array<{
    title: string;
    details: string[];
  }>;
  warnings: string[];
  sourceNote: string;
}

export interface ErrorResponse {
  type: 'error';
  error: string;
  raw?: string;
}

export type AIResponse = ChatResponse | MCQResponse | QuizResponse | ExplainResponse | GuidelinesResponse | ErrorResponse;

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
      throw new Error(data.error || 'Unknown error from AI service');
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
export async function callAIStream(
  request: AIRequest,
  onChunk: (content: string) => void
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
    if (contentType?.includes('text/event-stream')) {
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
      const data: AIResponse = await response.json();
      if (data.type === 'error') {
        throw new Error(data.error || 'Unknown error from AI service');
      }
      // For non-streaming, call onChunk with full content
      if (data.type === 'chat') {
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

