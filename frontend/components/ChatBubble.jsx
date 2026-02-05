'use client';

import { useState, useRef, useEffect } from 'react';
import { SendIcon, Loader2, Trash2, Sparkles, User, Bot } from 'lucide-react';
import { usePathname } from 'next/navigation';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ChatBubble() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pathname = usePathname();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (chatbotOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatbotOpen]);

  // Add welcome message when first opened
  useEffect(() => {
    if (chatbotOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "👋 Hi! I'm your marketplace assistant. I can help you:\n\n• **Sell items** - Create listings, get price estimates\n• **Find products** - Search, compare, get recommendations\n• **Stay safe** - Scam detection, policy questions\n\nHow can I help you today?",
        timestamp: Date.now(),
      }]);
    }
  }, [chatbotOpen]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    setMessageText("");

    // Add user message to UI immediately
    setMessages((prev) => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    }]);

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId,
          currentPage: pathname,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store session ID for continuity
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }

        // Track which agent responded
        if (data.agent) {
          setCurrentAgent(data.agent);
        }

        // Add assistant response
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: data.timestamp || Date.now(),
          agent: data.agent,
        }]);
      } else {
        // Handle error response
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.message || "Sorry, I couldn't process your request. Please try again.",
          timestamp: Date.now(),
          isError: true,
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please check your internet connection and try again.",
        timestamp: Date.now(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClearChat() {
    try {
      await fetch(`${API_URL}/api/chatbot/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
    }

    setMessages([{
      role: 'assistant',
      content: "Chat cleared! How can I help you?",
      timestamp: Date.now(),
    }]);
    setCurrentAgent(null);
  }

  // Get agent display name
  function getAgentName(agent) {
    switch (agent) {
      case 'SELLER_COPILOT':
        return '🏷️ Seller Copilot';
      case 'BUYER_ASSISTANT':
        return '🛒 Buyer Assistant';
      case 'SUPPORT_SECURITY':
        return '🛡️ Support';
      default:
        return '🤖 Assistant';
    }
  }

  // Format message content (handle markdown-like formatting)
  function formatMessage(content) {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Bold
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return `<li key="${i}" class="ml-4">${line.slice(2)}</li>`;
        }
        return line;
      })
      .join('<br/>');
  }

  return (
    <>
      {/* Chatbot Window */}
      {chatbotOpen && (
        <div
          className="
            fixed bottom-24 right-6
            w-96 h-[500px]
            bg-base-100
            border border-base-content/10
            rounded-2xl
            shadow-2xl
            flex flex-col
            z-50
            overflow-hidden
          "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-base-content/10 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Marketplace Assistant</span>
              </div>
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {currentAgent && (
              <div className="text-xs text-white/80 mt-1">
                {getAgentName(currentAgent)}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/30">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : msg.isError 
                        ? 'bg-error/20 text-error'
                        : 'bg-base-300 text-base-content'}
                  `}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div
                    className={`
                      px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : msg.isError
                          ? 'bg-error/10 text-error border border-error/20 rounded-bl-md'
                          : 'bg-base-100 text-base-content border border-base-content/10 rounded-bl-md shadow-sm'
                      }
                    `}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-base-content" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-base-100 border border-base-content/10 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm text-base-content/60">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 border-t border-base-content/10 bg-base-100">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Ask me anything..."
                rows={1}
                disabled={isLoading}
                className="
                  textarea textarea-bordered
                  w-full resize-none
                  min-h-[2.5rem] max-h-24
                  text-sm
                  focus:outline-none focus:border-blue-500
                "
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!messageText.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <SendIcon className="w-5 h-5" />
                )}
              </button>
            </form>
            <p className="text-xs text-base-content/40 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        className={`
          fixed bottom-6 right-6 
          h-14 w-14 
          rounded-full 
          flex items-center justify-center 
          text-white 
          shadow-lg
          transition-all duration-300
          z-50
          ${chatbotOpen 
            ? 'bg-base-300 text-base-content rotate-0' 
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:scale-105'
          }
        `}
        onClick={() => setChatbotOpen(!chatbotOpen)}
      >
        {chatbotOpen ? (
          <span className="text-2xl font-light">×</span>
        ) : (
          <ChatbotIcon />
        )}
      </button>
    </>
  );
}

function ChatbotIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}
