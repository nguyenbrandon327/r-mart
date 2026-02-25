'use client';

import { useState, useRef, useEffect } from 'react';
import { SendIcon, Loader2, Trash2, Sparkles, User, Bot, ImagePlus, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ChatBubble() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pathname = usePathname();
  const [chatSize, setChatSize] = useState({ width: 384, height: 500 });
  const [chatPos, setChatPos] = useState({ right: 24, bottom: 96 });
  const resizeRef = useRef(null);

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

  useEffect(() => {
    function onMouseMove(e) {
      if (!resizeRef.current) return;
      const { startX, startY, startW, startH, startR, startB, dir } = resizeRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let w = startW, h = startH, r = startR, b = startB;

      if (dir.includes('w')) w = startW - dx;
      if (dir.includes('e')) w = startW + dx;
      if (dir.includes('n')) h = startH - dy;
      if (dir.includes('s')) h = startH + dy;

      w = Math.max(300, Math.min(700, w));
      h = Math.max(300, Math.min(800, h));

      if (dir.includes('e')) r = startR - (w - startW);
      if (dir.includes('s')) b = startB - (h - startH);

      r = Math.max(0, r);
      b = Math.max(80, b);
      w = Math.min(w, window.innerWidth - r - 16);
      h = Math.min(h, window.innerHeight - b - 16);
      w = Math.max(300, w);
      h = Math.max(300, h);

      setChatSize({ width: w, height: h });
      setChatPos({ right: r, bottom: b });
    }

    function onMouseUp() {
      if (resizeRef.current) {
        resizeRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  function startResize(e, dir) {
    e.preventDefault();
    e.stopPropagation();
    const cursors = {
      n: 'ns-resize', s: 'ns-resize', w: 'ew-resize', e: 'ew-resize',
      nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
    };
    resizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      startW: chatSize.width, startH: chatSize.height,
      startR: chatPos.right, startB: chatPos.bottom,
      dir,
    };
    document.body.style.cursor = cursors[dir];
    document.body.style.userSelect = 'none';
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB");
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearSelectedImage() {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if ((!messageText.trim() && !selectedImage) || isLoading) return;

    const userMessage = messageText.trim();
    const hasImage = !!selectedImage;
    const previewUrl = imagePreview;

    setMessageText("");
    const imgFile = selectedImage;
    clearSelectedImage();

    setMessages((prev) => [...prev, {
      role: 'user',
      content: userMessage || "(image uploaded)",
      timestamp: Date.now(),
      imagePreview: previewUrl,
    }]);

    setIsLoading(true);

    try {
      let fetchOpts;

      if (hasImage) {
        const formData = new FormData();
        formData.append("image", imgFile);
        if (userMessage) formData.append("message", userMessage);
        if (sessionId) formData.append("sessionId", sessionId);
        formData.append("currentPage", pathname);
        fetchOpts = { method: "POST", credentials: "include", body: formData };
      } else {
        fetchOpts = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: userMessage, sessionId, currentPage: pathname }),
        };
      }

      const response = await fetch(`${API_URL}/api/chatbot/message`, fetchOpts);
      const data = await response.json();

      if (response.ok) {
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.agent) setCurrentAgent(data.agent);

        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: data.timestamp || Date.now(),
          agent: data.agent,
        }]);
      } else {
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
    return content
      .split('\n')
      .map((line, i) => {
        // Markdown images: ![alt](url)
        line = line.replace(
          /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
          '<img src="$2" alt="$1" class="rounded-lg mt-1 mb-1 max-w-full max-h-36 object-cover" loading="lazy" />'
        );
        // Markdown links: [text](url) — must run after image replace to avoid double-matching
        line = line.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-blue-500 hover:underline font-medium" target="_self">$1</a>'
        );
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
            fixed
            bg-base-100
            border border-base-content/10
            rounded-2xl
            shadow-2xl
            flex flex-col
            z-50
            overflow-hidden
          "
          style={{
            width: chatSize.width,
            height: chatSize.height,
            right: chatPos.right,
            bottom: chatPos.bottom,
          }}
        >
          {/* Resize handles */}
          {[
            { dir: 'n',  cursor: 'ns-resize',  cls: 'top-0 left-3 right-3 h-1.5' },
            { dir: 's',  cursor: 'ns-resize',  cls: 'bottom-0 left-3 right-3 h-1.5' },
            { dir: 'w',  cursor: 'ew-resize',  cls: 'left-0 top-3 bottom-3 w-1.5' },
            { dir: 'e',  cursor: 'ew-resize',  cls: 'right-0 top-3 bottom-3 w-1.5' },
            { dir: 'nw', cursor: 'nw-resize',  cls: 'top-0 left-0 w-3 h-3' },
            { dir: 'ne', cursor: 'ne-resize',  cls: 'top-0 right-0 w-3 h-3' },
            { dir: 'sw', cursor: 'sw-resize',  cls: 'bottom-0 left-0 w-3 h-3' },
            { dir: 'se', cursor: 'se-resize',  cls: 'bottom-0 right-0 w-3 h-3' },
          ].map(({ dir, cursor, cls }) => (
            <div
              key={dir}
              className={`absolute z-10 ${cls}`}
              style={{ cursor }}
              onMouseDown={(e) => startResize(e, dir)}
            />
          ))}

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
                  >
                    {msg.imagePreview && (
                      <img
                        src={msg.imagePreview}
                        alt="Uploaded"
                        className="rounded-lg mb-2 max-h-40 object-cover"
                      />
                    )}
                    <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>
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
            {imagePreview && (
              <div className="relative inline-block mb-2">
                <img src={imagePreview} alt="Preview" className="h-16 rounded-lg object-cover border border-base-content/10" />
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost btn-sm px-2"
                disabled={isLoading}
                title="Upload image for visual search"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <textarea
                ref={inputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Ask me anything or upload an image..."
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
                disabled={(!messageText.trim() && !selectedImage) || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <SendIcon className="w-5 h-5" />
                )}
              </button>
            </form>
            <p className="text-xs text-base-content/40 mt-2 text-center">
              Enter to send • Shift+Enter for new line • Upload image for visual search
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
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rotate-0' 
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
