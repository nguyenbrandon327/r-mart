'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { useChatStore, useAuthStore } from '../../../store/hooks';
import { selectMessagesForChat } from '../../../store/slices/chatSlice';
import { useSocket } from '../../../lib/socket';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, SendIcon, ImageIcon, XIcon, ArrowLeftIcon, CheckIcon, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';

// Optimized message content component with memoization
const MessageContent = memo(({ message, isCurrentUser, onImageClick }) => {
  const isImageOnly = message.image && !message.text;
  
  // Image-only message without bubble
  if (isImageOnly) {
    return (
      <div className="max-w-xs lg:max-w-md">
        <Image
          src={message.image}
          alt="Message attachment"
          width={200}
          height={200}
          className="rounded-2xl object-cover max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onImageClick(message.image)}
        />
      </div>
    );
  }
  
  // Regular message with bubble
  return (
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
            className="rounded-lg object-cover max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onImageClick(message.image)}
          />
        </div>
      )}
    </div>
  );
});

MessageContent.displayName = 'MessageContent';

export default function ChatPage({ params }) {
  const { chatId: chatULID } = params;
  const router = useRouter();
  const {
    chats,
    selectedChat,
    isMessagesLoading,
    typingUsers,
    unreadCount,
    onlineUsers,
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
    leaveChatRoom,
    removeChatFromUnread
  } = useChatStore();

  // Helper function to extract username from email (same as UserLink component)
  const getUsername = (email) => {
    return email ? email.split('@')[0] : '';
  };

  // Get messages for the current chat using selector
  const messages = useSelector(state => selectMessagesForChat(state, chatULID));

  const { user: currentUser, socket } = useAuthStore();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [activeProductImage, setActiveProductImage] = useState(0);

  // Socket connection is now handled globally in NavigationWrapper

  // Load chats and find the current chat
  useEffect(() => {
    getChats();
  }, []);

  // Find the chat data from the chats list
  useEffect(() => {
    if (chats.length > 0 && chatULID) {
      const foundChat = chats.find(chat => chat.ulid === chatULID);
      if (foundChat) {
        console.log('🔄 CHAT SELECTION: Found chat data:', foundChat.ulid);
        setChatData(foundChat);
        // Only set selected chat if it's different from current
        if (!selectedChat || selectedChat.ulid !== foundChat.ulid) {
          console.log('🔄 CHAT SELECTION: Setting selected chat to:', foundChat.ulid, 'from previous:', selectedChat?.ulid);
          setSelectedChat(foundChat);
        } else {
          console.log('🔄 CHAT SELECTION: Chat already selected, no change needed');
        }
      } else {
        // Chat not found, redirect to inbox
        console.log('🔄 CHAT SELECTION: Chat not found, redirecting to inbox');
        router.push('/inbox');
      }
    }
  }, [chats, chatULID, selectedChat?.ulid, router]); // Removed setSelectedChat, use selectedChat.ulid instead

  // Load messages when chat is selected and join chat room
  useEffect(() => {
    if (selectedChat && selectedChat.ulid === chatULID) {
      console.log('📂 CHAT LOAD: Loading messages for chat:', selectedChat.ulid);
      clearMessages();
      getMessages(selectedChat.ulid);
      
      // Join the chat room for real-time features (still using internal ID for socket rooms)
      joinChatRoom(selectedChat.id);
      
      // Mark messages as seen when entering the chat
      console.log('📂 CHAT LOAD: Marking messages as seen on chat enter');
      markMessagesAsSeen(selectedChat.ulid);
      
      // Remove this chat from unread list since user is viewing it
      console.log('📂 CHAT LOAD: Removing chat from unread on enter');
      removeChatFromUnread(selectedChat.id);
    }

    // Cleanup: leave chat room when component unmounts or chat changes
    return () => {
      if (selectedChat) {
        console.log('📂 CHAT CLEANUP: Leaving chat room:', selectedChat.id);
        leaveChatRoom(selectedChat.id);
        // Stop typing when leaving chat
        if (isTyping) {
          emitTyping(selectedChat.id, false);
          setIsTyping(false);
        }
      }
    };
  }, [selectedChat, chatULID]);

  // Auto-mark messages as seen when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && selectedChat && isTabVisible) {
      console.log('👁️ CHAT PAGE: Auto-marking messages as seen:', {
        messagesCount: messages.length,
        chatULID: selectedChat.ulid,
        isTabVisible,
        lastMessage: messages[messages.length - 1]
      });
      // Mark messages as seen immediately if user is actively viewing the chat
      markMessagesAsSeen(selectedChat.ulid);
      // Remove from unread list when messages are seen
      removeChatFromUnread(selectedChat.id);
      console.log('➖ CHAT PAGE: Removed chat from unread:', selectedChat.ulid);
    }
  }, [messages.length, selectedChat?.ulid, isTabVisible]);

  // Subscribe to online users
  useEffect(() => {
    subscribeToOnlineUsers();
    return () => {
      unsubscribeFromOnlineUsers();
    };
  }, []);

  // Handle socket subscription - now always subscribe when socket is ready
  useEffect(() => {
    console.log('Socket/Chat subscription check:', {
      socketExists: !!socket,
      socketConnected: socket?.connected,
      selectedChatId: selectedChat?.id,
      hasCurrentUser: !!currentUser
    });
    
    if (socket?.connected && currentUser) {
      console.log('Socket ready - subscribing to messages globally');
      
      const timer = setTimeout(() => {
        subscribeToMessages();
      }, 200);

      return () => {
        console.log('Cleanup: clearing subscription timer');
        clearTimeout(timer);
      };
    }
  }, [socket?.connected, currentUser]); // Removed selectedChat dependency

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

      await sendMessage(formData, selectedChat.ulid);
      setMessageText('');
      removeImage();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };



  const formatMessageTime = (timestamp, showDate = false) => {
    const date = new Date(timestamp);
    
    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };
    
    if (showDate) {
      const dateOptions = {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      };
      return date.toLocaleString('en-US', dateOptions);
    }
    
    return date.toLocaleString('en-US', timeOptions);
  };

  // Check if we should show timestamp before this message
  const shouldShowTimestamp = (currentMessage, index) => {
    if (index === 0) return true; // Always show timestamp for first message
    
    const previousMessage = messages[index - 1];
    const currentTime = new Date(currentMessage.created_at);
    const previousTime = new Date(previousMessage.created_at);
    
    // Check if it's a different day
    const currentDate = currentTime.toLocaleDateString('en-US');
    const previousDate = previousTime.toLocaleDateString('en-US');
    const isDifferentDay = currentDate !== previousDate;
    
    // Show timestamp if more than 5 minutes have passed OR it's a different day
    const timeDifference = (currentTime - previousTime) / (1000 * 60); // in minutes
    return timeDifference > 5 || isDifferentDay;
  };

  // Check if we should show date with timestamp
  const shouldShowDate = (currentMessage, index) => {
    if (index === 0) return true; // Always show date for first message
    
    const previousMessage = messages[index - 1];
    const currentTime = new Date(currentMessage.created_at);
    const previousTime = new Date(previousMessage.created_at);
    
    // Show date if it's a different day in PST
    const pstDateOptions = { timeZone: 'America/Los_Angeles' };
    const currentDatePST = currentTime.toLocaleDateString('en-US', pstDateOptions);
    const previousDatePST = previousTime.toLocaleDateString('en-US', pstDateOptions);
    
    return currentDatePST !== previousDatePST;
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

  // Check if a user is online
  const isOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.includes(userId.toString());
  };

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log('👀 TAB VISIBILITY: Changed to', isVisible ? 'visible' : 'hidden');
      setIsTabVisible(isVisible);
      
      // Mark messages as seen when user returns to the tab
      if (isVisible && selectedChat && messages.length > 0) {
        console.log('👀 TAB VISIBILITY: Marking messages as seen on return to tab');
        markMessagesAsSeen(selectedChat.ulid);
        // Remove from unread list when messages are seen
        removeChatFromUnread(selectedChat.id);
      }
    };

    // Set initial visibility state
    const initialVisibility = document.visibilityState === 'visible';
    console.log('👀 TAB VISIBILITY: Initial state:', initialVisibility ? 'visible' : 'hidden');
    setIsTabVisible(initialVisibility);
    
    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedChat, messages.length, markMessagesAsSeen]);

  // Handle image enlargement
  const handleImageClick = useCallback((imageSrc) => {
    setEnlargedImage(imageSrc);
  }, []);

  const handleCloseEnlargedImage = useCallback(() => {
    setEnlargedImage(null);
  }, []);

  // Handle clicking outside the enlarged image to close it
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && enlargedImage) {
        handleCloseEnlargedImage();
      }
    };

    if (enlargedImage) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [enlargedImage, handleCloseEnlargedImage]);

  // Set the main displayed product image without opening gallery
  const setMainProductImage = (index) => {
    setActiveProductImage(index);
  };

  // Get product images or fallback
  const getProductImages = () => {
    if (chatData?.product_images && chatData.product_images.length > 0) {
      return chatData.product_images;
    } else if (chatData?.product_image) {
      // Legacy support for old products with single image
      return [chatData.product_image];
    }
    return [];
  };

  if (!chatData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-base-200 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="h-[calc(100vh-4.25rem)] bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto h-[calc(100vh-4.25rem)] flex bg-white">
        {/* LEFT COLUMN - Chat */}
        <div className="flex-1 flex flex-col lg:border-r border-base-content/10">
          {/* User Header */}
          <div className="p-4 border-b border-base-content/10 bg-base-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/inbox" className="btn btn-ghost btn-circle btn-sm">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                
                <div className="relative">
                  <Link 
                    href={`/profile/${chatData.other_user_username || getUsername(chatData.other_user_email)}`} 
                    className="block"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                  </Link>
                  {/* Online Status Indicator */}
                  {isOnline(chatData.other_user_id) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-base-100"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <Link 
                    href={`/profile/${chatData.other_user_username || getUsername(chatData.other_user_email)}`} 
                    className="font-semibold text-base-content hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {chatData.other_user_name}
                  </Link>
                  {currentChatTypingUsers.length > 0 ? (
                    <p className="text-sm text-primary animate-pulse">
                      typing...
                    </p>
                  ) : (
                    <p className="text-sm text-base-content/60">
                      {isOnline(chatData.other_user_id) ? 'Online' : 'Offline'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                            {formatMessageTime(message.created_at, shouldShowDate(message, index))}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <MessageContent 
                          message={message} 
                          isCurrentUser={isCurrentUser}
                          onImageClick={handleImageClick}
                        />
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

        {/* RIGHT COLUMN - Product Information (Hidden on mobile) */}
        <div className="hidden lg:flex w-80 bg-base-50 border-l border-base-content/10 overflow-y-auto">
          {chatData.product_name ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-base-content mb-4">Product Details</h3>
              
              {/* Product Images with Thumbnail Navigation */}
              {(() => {
                const images = getProductImages();
                return images.length > 0 ? (
                  <div className="mb-4">
                    {/* Main Image */}
                    <div className="mb-3 aspect-square">
                      <Image
                        src={images[activeProductImage]}
                        alt={`${chatData.product_name} - Image ${activeProductImage + 1}`}
                        width={300}
                        height={300}
                        className="rounded-lg object-cover w-full h-full cursor-pointer"
                        onClick={() => handleImageClick(images[activeProductImage])}
                      />
                    </div>
                    
                    {/* Thumbnail Navigation - only show if multiple images */}
                    {images.length > 1 && (
                      <div className="flex flex-wrap gap-1 pb-2">
                        {images.map((image, index) => (
                          <div 
                            key={index}
                            className={`relative w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${index === activeProductImage ? 'border-primary' : 'border-transparent'}`}
                            onClick={() => setMainProductImage(index)}
                          >
                            <Image
                              src={image}
                              alt={`${chatData.product_name} - Thumbnail ${index + 1}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 bg-base-200 rounded-lg aspect-square flex items-center justify-center">
                    <p className="text-base-content/40">No image available</p>
                  </div>
                );
              })()}
              
              {/* Product Info */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-base-content">{chatData.product_name}</h4>
                </div>
                
                {chatData.product_price && (
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      ${parseFloat(chatData.product_price).toFixed(2)}
                    </p>
                  </div>
                )}
                
                {chatData.product_condition && (
                  <div>
                    <h5 className="font-medium text-base-content mb-1">Condition</h5>
                    <span className="badge badge-secondary">
                      {chatData.product_condition}
                    </span>
                  </div>
                )}
              </div>
              
              {/* View Full Details Button */}
              {chatData.product_slug && (
                <div className="mt-6 pt-4 border-t border-base-content/10">
                  <Link 
                    href={`/product/${chatData.product_slug}`}
                    className="btn btn-outline btn-primary btn-sm w-full bg-white"
                  >
                    View Full Details
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-base-content/60">No product associated with this chat</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Image Enlargement Overlay */}
    {enlargedImage && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        onClick={handleCloseEnlargedImage}
      >
        <div className="relative max-w-full max-h-full animate-in zoom-in-95 duration-200">
          <Image
            src={enlargedImage}
            alt="Enlarged view"
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
          />
          <button
            onClick={handleCloseEnlargedImage}
            className="absolute top-4 right-4 btn btn-circle btn-sm bg-black bg-opacity-50 border-none text-white hover:bg-opacity-75 transition-all duration-200"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    )}
    </AuthGuard>
  );
} 