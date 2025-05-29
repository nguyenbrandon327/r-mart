'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore, useAuthStore } from '../../../store/hooks';
import { useSocket } from '../../../lib/socket';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, SendIcon, ImageIcon, XIcon, ArrowLeftIcon, Trash2Icon, CheckIcon, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ChatPage({ params }) {
  const { chatId } = params;
  const router = useRouter();
  const {
    messages,
    chats,
    selectedChat,
    isMessagesLoading,
    typingUsers,
    getChats,
    getMessages,
    sendMessage,
    markMessagesAsSeen,
    setSelectedChat,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToOnlineUsers,
    unsubscribeFromOnlineUsers,
    clearMessages,
    deleteChat,
    emitTyping,
    joinChatRoom,
    leaveChatRoom
  } = useChatStore();

  const { user: currentUser, socket } = useAuthStore();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize socket connection
  useSocket();

  // Load chats and find the current chat
  useEffect(() => {
    getChats();
  }, []);

  // Find the chat data from the chats list
  useEffect(() => {
    if (chats.length > 0 && chatId) {
      const foundChat = chats.find(chat => chat.id === parseInt(chatId));
      if (foundChat) {
        setChatData(foundChat);
        setSelectedChat(foundChat);
      } else {
        // Chat not found, redirect to inbox
        router.push('/inbox');
      }
    }
  }, [chats, chatId, setSelectedChat, router]);

  // Load messages when chat is selected and join chat room
  useEffect(() => {
    if (selectedChat && selectedChat.id === parseInt(chatId)) {
      console.log('Loading messages for chat:', selectedChat.id);
      clearMessages();
      getMessages(selectedChat.id);
      
      // Join the chat room for real-time features
      joinChatRoom(selectedChat.id);
      
      // Mark messages as seen when entering the chat
      markMessagesAsSeen(selectedChat.id);
    }

    // Cleanup: leave chat room when component unmounts or chat changes
    return () => {
      if (selectedChat) {
        leaveChatRoom(selectedChat.id);
        // Stop typing when leaving chat
        if (isTyping) {
          emitTyping(selectedChat.id, false);
          setIsTyping(false);
        }
      }
    };
  }, [selectedChat, chatId]);

  // Auto-mark messages as seen when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && selectedChat) {
      // Mark messages as seen after a short delay to ensure they're visible
      const timer = setTimeout(() => {
        markMessagesAsSeen(selectedChat.id);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [messages.length, selectedChat?.id]);

  // Subscribe to online users
  useEffect(() => {
    subscribeToOnlineUsers();
    return () => {
      unsubscribeFromOnlineUsers();
    };
  }, []);

  // Handle socket subscription
  useEffect(() => {
    console.log('Socket/Chat subscription check:', {
      socketExists: !!socket,
      socketConnected: socket?.connected,
      selectedChatId: selectedChat?.id,
      hasCurrentUser: !!currentUser
    });
    
    if (selectedChat && socket?.connected && currentUser) {
      console.log('All conditions met - subscribing to messages for chat:', selectedChat.id);
      
      const timer = setTimeout(() => {
        subscribeToMessages();
      }, 200);

      return () => {
        console.log('Cleanup: clearing subscription timer');
        clearTimeout(timer);
      };
    }
  }, [socket?.connected, selectedChat, currentUser]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle typing events
  const handleTypingStart = useCallback(() => {
    if (!isTyping && selectedChat) {
      setIsTyping(true);
      emitTyping(selectedChat.id, true);
    }
  }, [isTyping, selectedChat, emitTyping]);

  const handleTypingStop = useCallback(() => {
    if (isTyping && selectedChat) {
      setIsTyping(false);
      emitTyping(selectedChat.id, false);
    }
  }, [isTyping, selectedChat, emitTyping]);

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
    
    // Handle typing indicators
    if (e.target.value.trim()) {
      handleTypingStart();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 3000);
    } else {
      // If input is empty, stop typing immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      handleTypingStop();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() && !selectedImage) return;
    if (!selectedChat) return;

    // Stop typing when sending message
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    handleTypingStop();

    try {
      const formData = new FormData();
      if (messageText.trim()) {
        formData.append('text', messageText.trim());
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await sendMessage(formData, selectedChat.id);
      setMessageText('');
      removeImage();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deleteChat(chatData.id);
        router.push('/inbox');
      } catch (error) {
        console.error('Failed to delete chat:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if we should show timestamp before this message
  const shouldShowTimestamp = (currentMessage, index) => {
    if (index === 0) return true; // Always show timestamp for first message
    
    const previousMessage = messages[index - 1];
    const currentTime = new Date(currentMessage.created_at);
    const previousTime = new Date(previousMessage.created_at);
    
    // Show timestamp if more than 5 minutes have passed
    const timeDifference = (currentTime - previousTime) / (1000 * 60); // in minutes
    return timeDifference > 5;
  };

  // Get typing users for current chat (excluding current user)
  const currentChatTypingUsers = selectedChat ? 
    (typingUsers[selectedChat.id] || []).filter(userId => userId !== currentUser?.id?.toString()) 
    : [];

  // Check if a message has been seen
  const isMessageSeen = (message) => {
    return message.seen_at && message.sender_id === currentUser?.id;
  };

  // Get the most recent message sent by current user
  const getMostRecentUserMessage = () => {
    const userMessages = messages.filter(msg => msg.sender_id === currentUser?.id);
    return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
  };

  // Get the most recent seen message sent by current user
  const getMostRecentSeenUserMessage = () => {
    const userMessages = messages.filter(msg => msg.sender_id === currentUser?.id && msg.seen_at);
    return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
  };

  // Get status text for a specific message
  const getMessageStatus = (message) => {
    const mostRecentUserMessage = getMostRecentUserMessage();
    const mostRecentSeenUserMessage = getMostRecentSeenUserMessage();
    
    // If this is the most recent seen message, show "Seen"
    if (mostRecentSeenUserMessage && message.id === mostRecentSeenUserMessage.id) {
      return 'Seen';
    }
    
    // If this is the most recent message and it hasn't been seen, show "Delivered"
    if (mostRecentUserMessage && message.id === mostRecentUserMessage.id && !message.seen_at) {
      return 'Delivered';
    }
    
    return null;
  };

  if (!chatData) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto h-screen flex flex-col bg-base-100">
        {/* Chat Header */}
        <div className="p-4 border-b border-base-content/10 bg-base-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/inbox" className="btn btn-ghost btn-circle btn-sm">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              
              <div className="relative">
                <div className="avatar">
                  <div className="w-10 rounded-full">
                    {chatData.other_user_profile_pic ? (
                      <Image
                        src={chatData.other_user_profile_pic}
                        alt={chatData.other_user_name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserCircleIcon className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-base-content">{chatData.other_user_name}</h3>
                {currentChatTypingUsers.length > 0 ? (
                  <p className="text-sm text-primary animate-pulse">
                    typing...
                  </p>
                ) : chatData.product_name ? (
                  <p className="text-sm text-base-content/60">
                    About: {chatData.product_name}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="btn btn-ghost btn-circle btn-sm text-error"
              title="Delete chat"
            >
              {isDeleting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Trash2Icon className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Product info if available */}
          {chatData.product_name && (
            <div className="mt-3 p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-3">
                {chatData.product_image && (
                  <Image
                    src={chatData.product_image}
                    alt={chatData.product_name}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">{chatData.product_name}</p>
                  {chatData.product_price && (
                    <p className="text-sm text-primary font-semibold">
                      ${parseFloat(chatData.product_price).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isMessagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-base-content/60">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>Start a conversation with {chatData.other_user_name}</p>
                {chatData.product_name && (
                  <p className="text-sm mt-1">About {chatData.product_name}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUser?.id;
                const mostRecentUserMessage = getMostRecentUserMessage();
                const isTheMostRecentUserMessage = mostRecentUserMessage && message.id === mostRecentUserMessage.id;
                const mostRecentSeenUserMessage = getMostRecentSeenUserMessage();
                const isTheMostRecentSeenUserMessage = mostRecentSeenUserMessage && message.id === mostRecentSeenUserMessage.id;
                const shouldShowStatus = isCurrentUser && (isTheMostRecentSeenUserMessage || (isTheMostRecentUserMessage && !message.seen_at));
                
                return (
                  <div key={message.id}>
                    {/* Timestamp above message if needed */}
                    {shouldShowTimestamp(message, index) && (
                      <div className="flex justify-center mb-2">
                        <span className="text-xs text-base-content/50 bg-base-200 px-3 py-1 rounded-full">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isCurrentUser
                            ? 'bg-primary text-primary-content'
                            : 'bg-base-200 text-base-content'
                        }`}
                      >
                        {message.text && (
                          <p className="break-words">{message.text}</p>
                        )}
                        {message.image && (
                          <div className={message.text ? 'mt-2' : ''}>
                            <Image
                              src={message.image}
                              alt="Message attachment"
                              width={200}
                              height={200}
                              className="rounded-lg object-cover max-w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show status after appropriate user messages */}
                    {shouldShowStatus && getMessageStatus(message) && (
                      <div className="flex justify-end mt-1">
                        <p className="text-xs text-base-content/50 mr-4">
                          {getMessageStatus(message)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          
          {/* Typing indicator */}
          {currentChatTypingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-base-200 text-base-content">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Image Preview */}
        {previewImage && (
          <div className="p-4 border-t border-base-content/10">
            <div className="relative inline-block">
              <Image
                src={previewImage}
                alt="Preview"
                width={100}
                height={100}
                className="rounded-lg object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-base-content/10">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost btn-circle btn-sm"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <div className="flex-1">
              <textarea
                value={messageText}
                onChange={handleMessageChange}
                placeholder="Type a message..."
                className="textarea textarea-bordered w-full resize-none min-h-[2.5rem] max-h-32"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                onBlur={handleTypingStop}
              />
            </div>
            
            <button
              type="submit"
              disabled={!messageText.trim() && !selectedImage}
              className="btn btn-primary btn-circle"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 