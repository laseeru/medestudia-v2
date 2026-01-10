import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIStatus } from '@/contexts/AIStatusContext';
import { callAI, type ChatResponse, type GuidelinesResponse, isErrorResponse } from '@/lib/aiClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
  retryable?: boolean;
}

interface ChatInterfaceProps {
  mode: 'preclinical' | 'clinical-study' | 'clinical-guidelines';
  subject?: string;
}

// Chat history storage key helper
const getChatStorageKey = (mode: string, subject?: string) => {
  return `medestudia_chat_${mode}_${subject || 'default'}`;
};

const MAX_CHAT_HISTORY = 20; // Keep last 20 messages

// Context-aware placeholder examples for guidelines
const guidelinesPlaceholders = {
  es: [
    'Ej: manejo de dengue con signos de alarma',
    'Ej: crisis hipertensiva en el consultorio',
    'Ej: deshidratación en lactante',
    'Ej: neumonía adquirida en la comunidad',
  ],
  en: [
    'E.g.: dengue management with warning signs',
    'E.g.: hypertensive crisis in the clinic',
    'E.g.: infant dehydration',
    'E.g.: community-acquired pneumonia',
  ],
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, subject }) => {
  const { t, language } = useLanguage();
  const { updateStatus } = useAIStatus();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage on mount and when mode/subject changes
  useEffect(() => {
    const storageKey = getChatStorageKey(mode, subject);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }
    
    // If no stored history, show welcome message
    const getWelcomeMessage = (): string => {
      if (mode === 'preclinical') {
        return language === 'es'
          ? `¡Hola! Soy tu asistente de estudio para ${subject || 'ciencias preclínicas'}. Puedo ayudarte con explicaciones de conceptos, preguntas de estudio y práctica tipo examen. ¿En qué puedo ayudarte hoy?`
          : `Hello! I'm your study assistant for ${subject || 'preclinical sciences'}. I can help you with concept explanations, study questions, and exam-style practice. How can I help you today?`;
      } else if (mode === 'clinical-study') {
        return language === 'es'
          ? `¡Bienvenido al modo de estudio clínico! Te ayudaré a comprender la teoría y el razonamiento clínico con casos hipotéticos. ¿Qué tema te gustaría explorar?`
          : `Welcome to clinical study mode! I'll help you understand theory and clinical reasoning with hypothetical cases. What topic would you like to explore?`;
      } else {
        return language === 'es'
          ? `Estoy aquí para ayudarte a navegar las guías clínicas. Te proporcionaré información estructurada basada en las guías disponibles. ¿Qué condición o procedimiento te interesa consultar?`
          : `I'm here to help you navigate clinical guidelines. I'll provide structured information based on available guidelines. What condition or procedure would you like to consult?`;
      }
    };

    const welcomeMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: getWelcomeMessage(),
    };
    setMessages([welcomeMsg]);
  }, [mode, subject, language]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = getChatStorageKey(mode, subject);
      // Keep only last MAX_CHAT_HISTORY messages
      const toSave = messages.slice(-MAX_CHAT_HISTORY);
      try {
        localStorage.setItem(storageKey, JSON.stringify(toSave));
      } catch {
        // Ignore localStorage errors (e.g., quota exceeded)
      }
    }
  }, [messages, mode, subject]);

  const handleSend = async (retryInput?: string) => {
    const userQuery = (retryInput || input).trim();
    if (!userQuery) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!retryInput) setInput('');
    setIsTyping(true);
    setError(null);

    try {
      // Determine tool and mode for API
      const tool: 'chat' | 'guides' = mode === 'clinical-guidelines' ? 'guides' : 'chat';
      const apiMode: 'preclinico' | 'clinico_estudio' | 'clinico_guias' = 
        mode === 'preclinical' ? 'preclinico' :
        mode === 'clinical-study' ? 'clinico_estudio' :
        'clinico_guias';

      const response = await callAI({
        tool,
        mode: apiMode,
        language,
        input: userQuery,
        context: subject ? { subject } : undefined,
      });

      // Update AI status on success
      updateStatus(true);

      if (isErrorResponse(response)) {
        throw new Error(response.error || 'Unknown error from AI service');
      }

      // Format response based on type
      let responseContent = '';
      
      if (response.type === 'chat') {
        responseContent = response.answer;
        if (response.note) {
          responseContent += `\n\n[${response.note}]`;
        }
      } else if (response.type === 'guides') {
        // Format guidelines response as structured text
        const guides = response as GuidelinesResponse;
        responseContent = guides.steps.map((step, idx) => {
          const stepText = `${idx + 1}. **${step.title}**\n${step.details.map(d => `   • ${d}`).join('\n')}`;
          return stepText;
        }).join('\n\n');

        if (guides.warnings.length > 0) {
          responseContent += '\n\n**Advertencias:**\n' + guides.warnings.map(w => `• ${w}`).join('\n');
        }

        if (guides.sourceNote) {
          responseContent += `\n\n*${guides.sourceNote}*`;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    } catch (err: any) {
      // Update AI status on failure
      updateStatus(false);

      const errorMessage = err.message || (language === 'es' 
        ? 'Error al comunicarse con el servicio de IA. Por favor intenta de nuevo.'
        : 'Error communicating with AI service. Please try again.');

      setError(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        error: true,
        retryable: true,
      };

      setMessages((prev) => [...prev, errorResponse]);
      setIsTyping(false);
    }
  };

  const handleRetry = (messageId: string) => {
    setRetryingMessageId(messageId);
    // Find the user message that corresponds to this error
    const errorIndex = messages.findIndex(m => m.id === messageId && m.error);
    if (errorIndex > 0) {
      const userMessage = messages[errorIndex - 1];
      if (userMessage.role === 'user') {
        // Remove the error message and retry
        setMessages((prev) => prev.filter(m => m.id !== messageId));
        handleSend(userMessage.content);
      }
    }
    setRetryingMessageId(null);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get context-aware placeholder for guidelines
  const getPlaceholder = () => {
    if (mode === 'clinical-guidelines') {
      const placeholders = guidelinesPlaceholders[language];
      return placeholders[Math.floor(Math.random() * placeholders.length)];
    }
    return t('typeMessage');
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] border border-border rounded-xl overflow-hidden bg-card">
      {/* Mode Badge - non-interactive, subtle */}
      {mode !== 'clinical-guidelines' && (
        <div className="px-4 py-2 bg-muted/50 border-b border-border flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
            {mode === 'preclinical' && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
            {mode === 'clinical-study' && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
            {mode === 'preclinical' ? t('educationalUse') : t('educationalModeBanner')}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              message.role === 'user' && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                message.role === 'assistant' && "bg-secondary text-secondary-foreground",
                message.role === 'user' && "bg-academic text-white"
              )}
            >
              {message.role === 'assistant' ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                message.role === 'assistant' && message.error && "bg-destructive/10 border border-destructive/20 text-destructive",
                message.role === 'assistant' && !message.error && "bg-muted text-foreground",
                message.role === 'user' && "bg-academic text-white"
              )}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.error && message.retryable && (
                <div className="mt-3 pt-3 border-t border-destructive/20">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(message.id)}
                    disabled={isTyping || retryingMessageId === message.id}
                    className="w-full"
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-2", (isTyping || retryingMessageId === message.id) && "animate-spin")} />
                    {language === 'es' ? 'Reintentar' : 'Retry'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-card">
        {error && (
          <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-destructive font-medium">{error}</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            disabled={isTyping}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="shrink-0"
          >
            <Send className={cn("h-4 w-4", isTyping && "animate-pulse")} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
