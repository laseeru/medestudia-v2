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

  useEffect(() => {
    const welcomeMsg: Message = {
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(),
    };
    setMessages([welcomeMsg]);
  }, [mode, subject, language]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    const userQuery = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responseContent = getMockResponse(mode, userQuery);
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
    // Always reference the user's query in the response
    if (mode === 'preclinical') {
      return language === 'es'
        ? `Sobre tu pregunta acerca de "${query}":

Este es un tema importante en las ciencias preclínicas. A continuación te presento los puntos clave:

**Conceptos fundamentales:**
• Bases fisiológicas y su relevancia para la comprensión clínica
• Mecanismos moleculares involucrados
• Correlación estructura-función

**Aplicación práctica:**
• Importancia en el razonamiento diagnóstico futuro
• Puntos de alto rendimiento para exámenes

[Contenido educativo representativo — se integrará con material curricular oficial cubano]`
        : `Regarding your question about "${query}":

This is an important topic in preclinical sciences. Here are the key points:

**Fundamental concepts:**
• Physiological basis and its relevance for clinical understanding
• Molecular mechanisms involved
• Structure-function correlation

**Practical application:**
• Importance in future diagnostic reasoning
• High-yield points for exams

[Representative educational content — will be integrated with official Cuban curricular material]`;
    } else if (mode === 'clinical-study') {
      return language === 'es'
        ? `Excelente pregunta sobre "${query}".

**Enfoque de estudio clínico:**

1. **Presentación típica:** Las manifestaciones clínicas de ${query} incluyen signos y síntomas característicos que debemos reconocer en la práctica.

2. **Diagnóstico diferencial:** Es fundamental considerar otras entidades que pueden presentarse de manera similar.

3. **Razonamiento clínico:** En el contexto cubano, priorizamos la historia clínica y el examen físico como herramientas diagnósticas fundamentales.

**Puntos clave para el examen:**
• Reconocimiento de patrones clínicos
• Uso racional de estudios complementarios
• Enfoque terapéutico según recursos disponibles

[Modo educativo — caso hipotético para fines de aprendizaje]`
        : `Excellent question about "${query}".

**Clinical study approach:**

1. **Typical presentation:** Clinical manifestations of ${query} include characteristic signs and symptoms we must recognize in practice.

2. **Differential diagnosis:** It's essential to consider other entities that may present similarly.

3. **Clinical reasoning:** In the Cuban context, we prioritize clinical history and physical examination as fundamental diagnostic tools.

**Key exam points:**
• Recognition of clinical patterns
• Rational use of complementary studies
• Therapeutic approach according to available resources

[Educational mode — hypothetical case for learning purposes]`;
    } else {
      // Clinical guidelines mode - structured, step-based
      return language === 'es'
        ? `**Consulta: ${query}**

Según las guías consultadas, se recomienda el siguiente enfoque:

---

**Pasos iniciales:**
1. Evaluación clínica inicial y estratificación de riesgo
2. Identificación de signos de alarma o criterios de gravedad
3. Decisión sobre nivel de atención requerido

**Evaluación:**
• Historia clínica enfocada en el problema actual
• Examen físico dirigido
• Estudios complementarios según disponibilidad y necesidad clínica

**Criterios clave:**
• Indicaciones de manejo ambulatorio vs. hospitalización
• Signos que requieren derivación a nivel superior
• Seguimiento recomendado

---

*Fuente: Guía representativa (contenido de ejemplo).*

*Las guías clínicas oficiales cubanas se integrarán tras la aprobación institucional.*`
        : `**Query: ${query}**

According to consulted guidelines, the following approach is recommended:

---

**Initial steps:**
1. Initial clinical evaluation and risk stratification
2. Identification of warning signs or severity criteria
3. Decision on required level of care

**Evaluation:**
• Clinical history focused on current problem
• Directed physical examination
• Complementary studies according to availability and clinical need

**Key criteria:**
• Indications for outpatient vs. hospital management
• Signs requiring referral to higher level
• Recommended follow-up

---

*Source: Representative guideline (sample content).*

*Official Cuban clinical guidelines will be integrated after institutional approval.*`;
    }
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
                message.role === 'assistant' && "bg-muted text-foreground",
                message.role === 'user' && "bg-academic text-white"
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
            placeholder={getPlaceholder()}
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
