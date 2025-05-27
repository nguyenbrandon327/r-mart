'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatStore, useAuthStore } from '../../store/hooks';
import { useSocket } from '../../lib/socket';
import { UserCircleIcon, SendIcon, ImageIcon, XIcon, SmileIcon } from 'lucide-react';
import Image from 'next/image';

export default function InboxPage() {
  const {
    messages,
    users,
    selectedUser,
    isUsersLoading,
    isMessagesLoading,
    onlineUsers,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToOnlineUsers,
    unsubscribeFromOnlineUsers,
    clearMessages
  } = useChatStore();

  const { user: currentUser, socket } = useAuthStore();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Initialize socket connection
  useSocket();

  useEffect(() => {
    // Load users when component mounts
    getUsers();
    
    // Subscribe to online users
    subscribeToOnlineUsers();

    return () => {
      unsubscribeFromOnlineUsers();
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      console.log('Selected user changed, setting up for user:', selectedUser.id);
      
      // Clear previous messages and load new ones
      console.log('Clearing messages and loading new ones');
      clearMessages();
      getMessages(selectedUser.id);

      return () => {
        console.log('Cleanup: unsubscribing from messages');
        unsubscribeFromMessages();
      };
    }
  }, [selectedUser]);

  // Single effect to handle socket subscription - only when both user is selected AND socket is ready
  useEffect(() => {
    console.log('Socket/User subscription check:', {
      socketExists: !!socket,
      socketConnected: socket?.connected,
      selectedUserId: selectedUser?.id,
      hasCurrentUser: !!currentUser
    });
    
    if (selectedUser && socket?.connected && currentUser) {
      console.log('All conditions met - subscribing to messages for user:', selectedUser.id);
      
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        subscribeToMessages();
      }, 200);

      return () => {
        console.log('Cleanup: clearing subscription timer');
        clearTimeout(timer);
      };
    }
  }, [socket?.connected, selectedUser, currentUser]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    console.log('Messages updated in component, count:', messages.length);
    console.log('Current messages:', messages);
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setMessageText('');
    setSelectedImage(null);
    setPreviewImage(null);
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
    if (!selectedUser) return;

    try {
      const formData = new FormData();
      if (messageText.trim()) {
        formData.append('text', messageText.trim());
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await sendMessage(formData);
      setMessageText('');
      removeImage();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOnline = (userId) => {
    return onlineUsers.includes(userId.toString());
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* Users Sidebar */}
        <div className="w-80 bg-base-100 border-r border-base-content/10 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-base-content/10">
            <h1 className="text-xl font-bold text-base-content">Messages</h1>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto">
            {isUsersLoading ? (
              <div className="flex items-center justify-center p-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center p-8 text-base-content/60">
                No users available to chat with
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-base-200 ${
                      selectedUser?.id === user.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="relative">
                      <div className="avatar">
                        <div className="w-12 rounded-full">
                          {user.profile_pic ? (
                            <Image
                              src={user.profile_pic}
                              alt={user.name}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <UserCircleIcon className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                      {isOnline(user.id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-base-100"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base-content truncate">{user.name}</p>
                      <p className="text-sm text-base-content/60 truncate">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-base-100">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-base-content/10 bg-base-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        {selectedUser.profile_pic ? (
                          <Image
                            src={selectedUser.profile_pic}
                            alt={selectedUser.name}
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
                    {isOnline(selectedUser.id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-base-100"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base-content">{selectedUser.name}</h3>
                    <p className="text-sm text-base-content/60">
                      {isOnline(selectedUser.id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
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
                      <p>Start a conversation with {selectedUser.name}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.sender_id === currentUser?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
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
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-primary-content/70' : 'text-base-content/60'
                          }`}>
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
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
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="textarea textarea-bordered w-full resize-none min-h-[2.5rem] max-h-32"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-base-200">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-bold text-base-content mb-2">Welcome to Messages</h2>
                <p className="text-base-content/60">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
