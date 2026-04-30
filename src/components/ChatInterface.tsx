import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIStatus } from '@/contexts/AIStatusContext';
import { callAI, callAIStream, type GuidelinesResponse, isErrorResponse } from '@/lib/aiClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
  retryable?: boolean;
  learningFlow?: LearningFlow;
}

interface MessageGroup {
  role: Message['role'];
  messages: Message[];
}

type LearningStage = 'reflection' | 'hint' | 'explanation';

interface LearningFlow {
  uiLanguage: 'es' | 'en';
  currentStage: LearningStage;
  reflectionPrompt: string;
  hint: string;
  explanation: string;
  reflectionInput?: string;
}

interface ChatInterfaceProps {
  mode: 'preclinical' | 'clinical-study' | 'clinical-guidelines';
  subject?: string;
  initialQuestion?: string;
  onInitialQuestionUsed?: () => void;
  fullscreen?: boolean;
}

const getSessionMetaKey = (mode: string, subject?: string) => {
  return `medestudia_chat_session_meta_${mode}_${subject || 'default'}`;
};

const getChatStorageKey = (mode: string, subject: string | undefined, sessionId: string) => {
  return `medestudia_chat_${mode}_${subject || 'default'}_${sessionId}`;
};

const MAX_CHAT_HISTORY = 20;

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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, subject, initialQuestion, onInitialQuestionUsed, fullscreen = false }) => {
  const { t, language } = useLanguage();
  const { updateStatus } = useAIStatus();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAutoSentQuestionRef = useRef<string | null>(null);

  const generateSessionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const groupMessagesByRole = (items: Message[]): MessageGroup[] => {
    const groups: MessageGroup[] = [];
    items.forEach((msg) => {
      const last = groups[groups.length - 1];
      if (last && last.role === msg.role) {
        last.messages.push(msg);
      } else {
        groups.push({ role: msg.role, messages: [msg] });
      }
    });
    return groups;
  };

  const getFriendlyErrorMessage = (detectedLanguage: 'es' | 'en') => {
    return detectedLanguage === 'es'
      ? 'Hubo un problema al procesar tu solicitud. Intenta nuevamente.'
      : 'There was a problem processing your request. Please try again.';
  };

  const detectInputLanguage = (text: string): 'es' | 'en' => {
    const normalized = text.toLowerCase();
    const spanishSignals = [
      /\b(el|la|los|las|un|una|qué|como|cómo|por qué|porque|sí|también|dónde|cuando|cuándo|dolor|paciente|enfermedad|tratamiento|diagnóstico)\b/,
      /[áéíóúñ¿¡]/,
    ];
    const englishSignals = [
      /\b(the|is|are|why|how|what|where|when|pain|patient|disease|treatment|diagnosis)\b/,
    ];

    const esScore = spanishSignals.reduce((acc, pattern) => acc + (pattern.test(normalized) ? 1 : 0), 0);
    const enScore = englishSignals.reduce((acc, pattern) => acc + (pattern.test(normalized) ? 1 : 0), 0);

    if (enScore > esScore) return 'en';
    return 'es';
  };

  const formatAssistantContent = (content: string, uiLanguage: 'es' | 'en') => {
    const fallbackHint = uiLanguage === 'es'
      ? 'Identifica primero el concepto clave (fisiopatología, diagnóstico o manejo).'
      : 'Identify first the key concept (pathophysiology, diagnosis, or management).';
    const fallbackReflection = uiLanguage === 'es'
      ? 'Antes de leer toda la respuesta, intenta explicarlo con tus propias palabras.'
      : 'Before reading the full answer, try explaining it in your own words.';
    const firstSentence = content.split('\n').map((line) => line.trim()).filter(Boolean)[0] || fallbackHint;

    const markerReflection = /(?:🧠\s*)?(?:Reflexiona primero|Think first)\s*:?\s*/i;
    const markerHint = /(?:📌\s*)?(?:Pista|Hint)\s*:?\s*/i;
    const markerExplanation = /(?:📖\s*)?(?:Explicación|Explanation)\s*:?\s*/i;
    const hasMarkers = markerReflection.test(content) || markerHint.test(content) || markerExplanation.test(content);

    if (!hasMarkers) {
      return {
        reflection: fallbackReflection,
        hint: firstSentence,
        explanation: content,
      };
    }

    const reflectionMatch = content.match(/(?:🧠\s*)?(?:Reflexiona primero|Think first)\s*:?\s*([\s\S]*?)(?=(?:📌\s*)?(?:Pista|Hint)\s*:|(?:📖\s*)?(?:Explicación|Explanation)\s*:|$)/i);
    const hintMatch = content.match(/(?:📌\s*)?(?:Pista|Hint)\s*:?\s*([\s\S]*?)(?=(?:📖\s*)?(?:Explicación|Explanation)\s*:|$)/i);
    const explanationMatch = content.match(/(?:📖\s*)?(?:Explicación|Explanation)\s*:?\s*([\s\S]*)$/i);

    return {
      reflection: reflectionMatch?.[1]?.trim() || fallbackReflection,
      hint: hintMatch?.[1]?.trim() || firstSentence,
      explanation: explanationMatch?.[1]?.trim() || content,
    };
  };

  const buildLearningFlow = (content: string, uiLanguage: 'es' | 'en'): LearningFlow => {
    const sections = formatAssistantContent(content, uiLanguage);
    return {
      uiLanguage,
      currentStage: 'reflection',
      reflectionPrompt:
        uiLanguage === 'es'
          ? 'Antes de ver la respuesta, ¿cómo lo explicarías tú?'
          : 'Before seeing the answer, how would you explain it?',
      hint: sections.hint,
      explanation: sections.explanation,
    };
  };

  const updateLearningFlow = (messageId: string, updater: (flow: LearningFlow) => LearningFlow) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const baseFlow = msg.learningFlow || buildLearningFlow(msg.content, language);
        return { ...msg, learningFlow: updater(baseFlow) };
      }),
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const metaKey = getSessionMetaKey(mode, subject);
    let nextSessionId = generateSessionId();
    try {
      const storedSessionId = localStorage.getItem(metaKey);
      if (storedSessionId) {
        nextSessionId = storedSessionId;
      } else {
        localStorage.setItem(metaKey, nextSessionId);
      }
    } catch {
      // Ignore localStorage errors
    }
    setSessionId(nextSessionId);
  }, [mode, subject]);

  useEffect(() => {
    if (!sessionId) return;
    const storageKey = getChatStorageKey(mode, subject, sessionId);
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

    const getWelcomeMessage = (): string => {
      if (mode === 'preclinical') {
        return language === 'es'
          ? `¡Hola! Soy tu asistente de estudio para ${subject || 'ciencias preclínicas'}. Puedo ayudarte con explicaciones de conceptos, preguntas de estudio y práctica tipo examen. ¿En qué puedo ayudarte hoy?`
          : `Hello! I'm your study assistant for ${subject || 'preclinical sciences'}. I can help you with concept explanations, study questions, and exam-style practice. How can I help you today?`;
      }
      if (mode === 'clinical-study') {
        return language === 'es'
          ? `¡Bienvenido al modo de estudio clínico! Te ayudaré a comprender la teoría y el razonamiento clínico con casos hipotéticos. ¿Qué tema te gustaría explorar?`
          : `Welcome to clinical study mode! I'll help you understand theory and clinical reasoning with hypothetical cases. What topic would you like to explore?`;
      }
      return language === 'es'
        ? `Estoy aquí para ayudarte a navegar las guías clínicas. Te proporcionaré información estructurada basada en las guías disponibles. ¿Qué condición o procedimiento te interesa consultar?`
        : `I'm here to help you navigate clinical guidelines. I'll provide structured information based on available guidelines. What condition or procedure would you like to consult?`;
    };

    setMessages([{ id: Date.now().toString(), role: 'assistant', content: getWelcomeMessage() }]);
  }, [mode, subject, language, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const storageKey = getChatStorageKey(mode, subject, sessionId);
    const toSave = messages.slice(-MAX_CHAT_HISTORY);
    try {
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {
      // Ignore localStorage errors
    }
  }, [messages, mode, subject, sessionId]);

  useEffect(() => {
    if (!initialQuestion?.trim() || isTyping) return;
    const normalized = initialQuestion.trim();
    if (lastAutoSentQuestionRef.current === normalized) return;

    lastAutoSentQuestionRef.current = normalized;
    handleSend(normalized);
    onInitialQuestionUsed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, isTyping]);

  const handleSend = async (retryInput?: string) => {
    const userQuery = (retryInput || input).trim();
    if (!userQuery) return;
    const detectedLanguage = detectInputLanguage(userQuery);

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userQuery };
    setMessages((prev) => [...prev, userMessage]);
    if (!retryInput) setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const tool: 'chat' | 'guides' = mode === 'clinical-guidelines' ? 'guides' : 'chat';
      const apiMode: 'preclinico' | 'clinico_estudio' | 'clinico_guias' =
        mode === 'preclinical' ? 'preclinico' : mode === 'clinical-study' ? 'clinico_estudio' : 'clinico_guias';

      const request = {
        tool,
        mode: apiMode,
        language: detectedLanguage,
        input: userQuery,
        session_id: sessionId,
        context: subject ? { subject } : undefined,
      };

      if (tool === 'chat') {
        const assistantMessageId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

        await callAIStream(request, (chunk: string) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: msg.content + chunk } : msg)),
          );
          scrollToBottom();
        });

        if (apiMode === 'clinico_estudio') {
          const note = detectedLanguage === 'es'
            ? 'Modo educativo — caso hipotético para fines de aprendizaje'
            : 'Educational mode — hypothetical case for learning purposes';
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: `${msg.content}\n\n[${note}]` } : msg)),
          );
        }

        if (apiMode === 'preclinico') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, learningFlow: buildLearningFlow(msg.content, detectedLanguage) }
                : msg,
            ),
          );
        }

        updateStatus(true);
        setIsTyping(false);
        return;
      }

      const response = await callAI(request);
      updateStatus(true);
      if (isErrorResponse(response)) {
        throw new Error(response.error || 'Unknown error from AI service');
      }

      const guides = response as GuidelinesResponse;
      let responseContent = guides.steps
        .map((step, idx) => `${idx + 1}. **${step.title}**\n${step.details.map((d) => `   • ${d}`).join('\n')}`)
        .join('\n\n');

      if (guides.warnings.length > 0) {
        responseContent += `\n\n**Advertencias:**\n${guides.warnings.map((w) => `• ${w}`).join('\n')}`;
      }
      if (guides.sourceNote) {
        responseContent += `\n\n*${guides.sourceNote}*`;
      }

      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: responseContent }]);
      setIsTyping(false);
    } catch {
      updateStatus(false);
      const errorMessage = getFriendlyErrorMessage(detectedLanguage);
      setError(errorMessage);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        error: true,
        retryable: true,
      };
      setMessages((prev) => [...prev.filter((m) => !m.error), errorResponse]);
      setIsTyping(false);
    }
  };

  const handleRetry = (messageId: string) => {
    setRetryingMessageId(messageId);
    const errorIndex = messages.findIndex((m) => m.id === messageId && m.error);
    if (errorIndex > 0) {
      const userMessage = messages[errorIndex - 1];
      if (userMessage.role === 'user') {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
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

  const handleContinueFromReflection = (messageId: string) => {
    updateLearningFlow(messageId, (flow) => ({ ...flow, currentStage: 'hint' }));
  };

  const handleRevealExplanation = (messageId: string) => {
    updateLearningFlow(messageId, (flow) => ({ ...flow, currentStage: 'explanation' }));
  };

  const getPlaceholder = () => {
    if (mode === 'preclinical') {
      return language === 'es' ? 'Ej: ¿Por qué la anemia causa fatiga?' : 'E.g.: Why does anemia cause fatigue?';
    }
    if (mode === 'clinical-guidelines') {
      const placeholders = guidelinesPlaceholders[language];
      return placeholders[Math.floor(Math.random() * placeholders.length)];
    }
    return t('typeMessage');
  };

  const handleNewConversation = () => {
    if (messages.length > 2) {
      const confirmMessage = language === 'es'
        ? '¿Iniciar una nueva conversación?'
        : 'Start a new conversation?';
      if (!window.confirm(confirmMessage)) return;
    }

    const newSessionId = generateSessionId();
    try {
      localStorage.setItem(getSessionMetaKey(mode, subject), newSessionId);
    } catch {
      // Ignore localStorage errors
    }

    setInput('');
    setError(null);
    setRetryingMessageId(null);
    setMessages([]);
    lastAutoSentQuestionRef.current = null;
    setSessionId(newSessionId);
  };

  const groupedMessages = groupMessagesByRole(messages);

  return (
    <div
      className={cn(
        "w-full flex flex-col border border-border overflow-hidden bg-card shadow-sm",
        fullscreen
          ? "h-[calc(100dvh-150px)] min-h-[460px] rounded-none md:rounded-xl md:h-[calc(100vh-220px)] md:min-h-[560px]"
          : "mx-auto max-w-[800px] h-[540px] md:h-[640px] rounded-xl"
      )}
    >
      <div className="px-3 py-2.5 md:px-4 md:py-3 bg-muted/40 border-b border-border flex items-center justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs md:text-sm">{language === 'es' ? 'Asistente activo' : 'Assistant active'}</span>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'preclinical' && (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {language === 'es' ? 'Modo: aprendizaje guiado' : 'Mode: guided learning'}
            </span>
          )}
          <Button size="sm" variant="outline" className="h-8 px-2 md:px-3 text-xs" onClick={handleNewConversation}>
            {language === 'es' ? '+ Nueva conversación' : '+ New conversation'}
          </Button>
        </div>
      </div>

      {mode !== 'clinical-guidelines' && (
        <div className="px-4 py-2 bg-muted/20 border-b border-border flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
            {mode === 'preclinical' && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
            {mode === 'clinical-study' && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
            {mode === 'preclinical' ? t('educationalUse') : t('educationalModeBanner')}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-5 space-y-5 md:space-y-6">
        {groupedMessages.map((group, groupIndex) => (
          <div
            key={`${group.role}-${groupIndex}`}
            className={cn('flex gap-3 animate-fade-in', group.role === 'user' && 'flex-row-reverse')}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                group.role === 'assistant' && 'bg-secondary text-secondary-foreground',
                group.role === 'user' && 'bg-academic text-white',
              )}
            >
              {group.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>

            <div className="max-w-[88%] md:max-w-[84%] space-y-2">
              {group.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'rounded-xl px-4 py-3 text-sm leading-relaxed transition-all duration-200',
                    group.role === 'assistant' &&
                      message.error &&
                      'bg-amber-50/60 border border-amber-200/60 text-amber-900 dark:bg-amber-900/15 dark:border-amber-600/30 dark:text-amber-100',
                    group.role === 'assistant' && !message.error && 'bg-muted text-foreground',
                    group.role === 'user' && 'bg-academic text-white',
                  )}
                >
                  {group.role === 'assistant' && !message.error && mode === 'preclinical' ? (
                    <div className="space-y-2">
                      {(() => {
                        const flow = message.learningFlow || buildLearningFlow(message.content, language);
                        const isSpanish = flow.uiLanguage === 'es';

                        if (flow.currentStage === 'reflection') {
                          return (
                            <div className="rounded-lg border border-border/60 bg-background/50 p-3 animate-fade-in transition-all duration-300">
                              <p className="text-[11px] font-medium text-muted-foreground mb-1">🧠 {isSpanish ? 'Reflexiona primero' : 'Think first'}</p>
                              <p className="whitespace-pre-wrap mb-3">{flow.reflectionPrompt}</p>
                              <input
                                type="text"
                                value={flow.reflectionInput || ''}
                                onChange={(e) =>
                                  updateLearningFlow(message.id, (current) => ({
                                    ...current,
                                    reflectionInput: e.target.value,
                                  }))
                                }
                                placeholder={isSpanish ? 'Escribe tu razonamiento...' : 'Write your reasoning...'}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              <Button
                                size="sm"
                                className="mt-3 bg-academic hover:bg-academic/90 text-white"
                                onClick={() => handleContinueFromReflection(message.id)}
                              >
                                {isSpanish ? 'Continuar' : 'Continue'}
                              </Button>
                            </div>
                          );
                        }

                        if (flow.currentStage === 'hint') {
                          return (
                            <div className="rounded-lg border border-border/60 bg-background/50 p-3 animate-fade-in transition-all duration-300">
                              <p className="text-[11px] font-medium text-muted-foreground mb-1">📌 {isSpanish ? 'Pista' : 'Hint'}</p>
                              <p className="whitespace-pre-wrap mb-3">{flow.hint}</p>
                              <Button
                                size="sm"
                                className="bg-academic hover:bg-academic/90 text-white"
                                onClick={() => handleRevealExplanation(message.id)}
                              >
                                {isSpanish ? 'Ver explicación completa' : 'See full explanation'}
                              </Button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2 animate-fade-in transition-all duration-300">
                            {flow.reflectionInput?.trim() && (
                              <div className="rounded-lg border border-academic/30 bg-academic/5 p-3">
                                <p className="text-[11px] font-medium text-muted-foreground mb-1">
                                  {isSpanish ? 'Tu reflexión' : 'Your reflection'}
                                </p>
                                <p className="whitespace-pre-wrap text-sm">{flow.reflectionInput.trim()}</p>
                              </div>
                            )}
                            <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                              <p className="text-[11px] font-medium text-muted-foreground mb-1">📖 {isSpanish ? 'Explicación' : 'Explanation'}</p>
                              <p className="whitespace-pre-wrap">{flow.explanation}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}

                  {message.error && message.retryable && (
                    <div className="mt-3 pt-3 border-t border-amber-300/30 dark:border-amber-500/20">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(message.id)}
                        disabled={isTyping || retryingMessageId === message.id}
                        className="w-full"
                      >
                        <RefreshCw className={cn('h-3 w-3 mr-2', (isTyping || retryingMessageId === message.id) && 'animate-spin')} />
                        {language === 'es' ? 'Reintentar' : 'Retry'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
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

      <div className="border-t border-border p-3 md:p-4 bg-card pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {error && (
          <div className="mb-3 p-3 rounded-lg border border-amber-300/40 bg-amber-50/60 dark:border-amber-600/30 dark:bg-amber-900/15 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-amber-900 dark:text-amber-100 font-medium">{error}</p>
            </div>
          </div>
        )}

        <p className="mb-2 text-xs text-muted-foreground">
          {language === 'es'
            ? 'Haz una pregunta médica o describe un caso clínico'
            : 'Ask a medical question or describe a clinical case'}
        </p>

        <div className="flex gap-2 items-stretch">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            disabled={isTyping}
            className="flex-1 min-h-11 rounded-lg border border-input bg-background px-3 md:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="shrink-0 min-h-11 px-4 bg-academic hover:bg-academic/90 text-white"
          >
            <Send className={cn('h-4 w-4', isTyping && 'animate-pulse')} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
