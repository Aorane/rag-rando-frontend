'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/search';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  // Exemples de requêtes pour aider l'utilisateur
  const suggestions = [
    "Randonnée familiale près du Mont Aigoual",
    "Circuit avec des cascades et des rivières",
    "Parcours panoramique sur 3-4 heures"
  ];

  const renderMessageContent = (content: any) => {
    // Si c'est un objet JSON (comme la réponse structurée)
    if (typeof content === 'object' && content !== null) {
      try {
        if (content.summary) {
          return (
            <div className="space-y-3">
              <div className="font-semibold">{content.summary.title}</div>
              <div>{content.summary.interpretation}</div>
              
              {/* {content.analysis?.main_points && content.analysis.main_points.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">Points principaux :</div>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {content.analysis.main_points.map((point: string, i: number) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )} */}
              
              {content.highlights && content.highlights.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">Randonnées recommandées :</div>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {content.highlights.slice(0, 3).map((highlight: {id: string, text: string}, i: number) => (
                      <li key={highlight.id}>{highlight.text}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        // Si c'est un autre type d'objet, on le convertit en JSON
        console.log('autre type d\'objet', content);
        
        return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
      } catch (e) {
        return String(content);
      }
    }
    
    // Pour le markdown simple (titres, listes)
    if (typeof content === 'string') {
      // Conversion basique du markdown
      return content
        .split('\n')
        .map((line, i) => {
          // Titres
          if (line.startsWith('**') && line.endsWith('**')) {
            return <div key={i} className="font-bold">{line.slice(2, -2)}</div>;
          }
          // Points de liste numérotés
          if (/^\d+\.\s/.test(line)) {
            return <div key={i} className="ml-4">• {line.replace(/^\d+\.\s/, '')}</div>;
          }
          // Lignes normales
          return line ? <div key={i}>{line}</div> : <br key={i} />;
        });
    }
    
    // Valeur par défaut
    return String(content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-scroll p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {renderMessageContent(msg.content)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Suggestions pour démarrer la conversation */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Suggestions :</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-full 
                         hover:bg-green-50 hover:text-green-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Formulaire d'entrée */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Décrivez votre randonnée idéale..."
            disabled={isLoading}
            className="w-full p-2 pl-4 pr-10 border border-gray-300 rounded-full focus:outline-none 
                     focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full 
                     bg-green-600 text-white hover:bg-green-700 transition-colors 
                     disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 