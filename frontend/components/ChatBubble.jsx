'use client';

import {useState} from 'react';
import Image from 'next/image';
import {SendIcon} from 'lucide-react';


export default function ChatBubble() {
    const [chatbotOpen, setChatbotOpen] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [messages, setMessages] = useState([]);

  function handleSendMessage(e) {
    e.preventDefault();
    if (!messageText.trim()) return;

    setMessages((prev) => [...prev, messageText]);
    setMessageText("");
  }

  return (
    <>
      {/*Chatbot*/}
      {chatbotOpen && (
        <div
          className="
            fixed bottom-24 right-6
            w-80 h-96
            bg-base-100
            border border-base-content/10
            rounded-xl
            shadow-xl
            flex flex-col
          "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-base-content/10 font-medium">
            Chatbot
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-base-content/60 mt-10">
                
                <p>Chatbot testing</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="flex justify-end">
                  <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg max-w-[75%]">
                    {msg}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-3 border-t border-base-content/10">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                rows={1}
                className="
                  textarea textarea-bordered
                  w-full resize-none
                  min-h-[2.5rem] max-h-24
                  text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!messageText.trim()}
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    

    <button className={'fixed bottom-6 right-6 h-14 w-14 rounded-full flex items-center justify-center text-white bg-blue-400 text-2xl'}
        onClick={()=>setChatbotOpen(!chatbotOpen)}>
            <span className="flex items-center justify-center">
            {chatbotOpen ? "X":<ChatbotButton/>}</span>
    </button>
    </>
);
}




function ChatbotButton() {
    return (
        <svg width="24"
        height="24"
        viewBox=""
        fill="none"
        stroke="currentColor"
        strokeLinecap='round'
        strokeLinejoin='round'>

            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>

        </svg>
    );
}