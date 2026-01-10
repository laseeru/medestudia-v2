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

