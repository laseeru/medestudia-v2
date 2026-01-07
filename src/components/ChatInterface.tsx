import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  mode: 'preclinical' | 'clinical-study' | 'clinical-guidelines';
  subject?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, subject }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getWelcomeMessage = (): string => {
    if (mode === 'preclinical') {
      return `¡Hola! Soy tu asistente de estudio para ${subject || 'ciencias preclínicas'}. Puedo ayudarte con explicaciones de conceptos, preguntas de estudio y práctica tipo examen. ¿En qué puedo ayudarte hoy?`;
    } else if (mode === 'clinical-study') {
      return `¡Bienvenido al modo de estudio clínico! Te ayudaré a comprender la teoría y el razonamiento clínico con casos hipotéticos. ¿Qué tema te gustaría explorar?`;
    } else {
      return `Estoy aquí para ayudarte a navegar las guías clínicas. Te proporcionaré información estructurada basada en las guías disponibles. ¿Qué condición o procedimiento te interesa consultar?`;
    }
  };

  useEffect(() => {
    // Add welcome message on mount
    const welcomeMsg: Message = {
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(),
    };
    setMessages([welcomeMsg]);
  }, [mode, subject]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response (placeholder for actual AI integration)
    setTimeout(() => {
      const responseContent = getMockResponse(mode, input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getMockResponse = (mode: string, query: string): string => {
    if (mode === 'preclinical') {
      return `Esta es una respuesta educativa de ejemplo sobre tu pregunta: "${query}". 

En un entorno real, proporcionaría explicaciones detalladas sobre conceptos preclínicos, con énfasis en:
• Fundamentos teóricos
• Aplicaciones prácticas
• Puntos clave para el estudio

[Contenido representativo - se integrará con material curricular oficial cubano]`;
    } else if (mode === 'clinical-study') {
      return `Excelente pregunta sobre "${query}".

Desde una perspectiva de estudio clínico, consideremos:
• Presentación típica del caso
• Diagnóstico diferencial
• Enfoque de razonamiento clínico

[Modo educativo - caso hipotético para fines de aprendizaje]`;
    } else {
      return `Según la guía consultada, para "${query}":

**Pasos iniciales recomendados:**
1. Evaluación inicial del paciente
2. Estudios complementarios sugeridos
3. Criterios de derivación

*Fuente: Guía representativa (contenido de ejemplo)*

[Las guías clínicas oficiales cubanas se integrarán tras aprobación institucional]`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] border border-border rounded-xl overflow-hidden bg-card">
      {/* Mode Banner */}
      {mode !== 'clinical-guidelines' && (
        <div className="px-4 py-2 bg-muted border-b border-border">
          <p className="text-xs text-muted-foreground text-center">
            {mode === 'preclinical' ? t('educationalUse') : t('educationalModeBanner')}
          </p>
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
                message.role === 'user' && "bg-primary text-primary-foreground"
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
                message.role === 'assistant' && "bg-muted text-foreground",
                message.role === 'user' && "bg-primary text-primary-foreground"
              )}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
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
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessage')}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
