'use client';

import { useEffect, useState } from 'react';
import { useChatStore, useAuthStore } from '../../store/hooks';
import { useSocket } from '../../lib/socket';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, MessageSquareIcon, Trash2Icon, ShoppingBagIcon, CheckIcon, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function InboxPage() {
  const {
    chats,
    isChatsLoading,
    onlineUsers,
    getChats,
    subscribeToOnlineUsers,
    unsubscribeFromOnlineUsers,
    deleteChat,
    updateChatLastMessage
  } = useChatStore();

  const { user: currentUser, socket } = useAuthStore();
  const router = useRouter();
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [timeUpdateTrigger, setTimeUpdateTrigger] = useState(0);

  // Initialize socket connection
  useSocket();

  useEffect(() => {
    // Load chats when component mounts
    getChats();
    
    // Subscribe to online users
    subscribeToOnlineUsers();

    return () => {
      unsubscribeFromOnlineUsers();
    };
  }, []);

  // Real-time updates for new messages
  useEffect(() => {
    if (socket?.connected && currentUser) {
      const handleNewMessage = (newMessage) => {
        console.log('Inbox received new message:', newMessage);
        // Update the chat list locally with the new message
        updateChatLastMessage(
          newMessage.chat_id, 
          newMessage.text || (newMessage.image ? 'Image' : 'Message'), 
          newMessage.created_at
        );
      };

      socket.on("newMessage", handleNewMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }
  }, [socket?.connected, currentUser, updateChatLastMessage]);

  // Update time display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdateTrigger(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleChatClick = (chatId) => {
    router.push(`/inbox/${chatId}`);
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      setDeletingChatId(chatId);
      try {
        await deleteChat(chatId);
      } catch (error) {
        console.error('Failed to delete chat:', error);
      } finally {
        setDeletingChatId(null);
      }
    }
  };

  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.abs(now - date) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const isOnline = (userId) => {
    return onlineUsers.includes(userId.toString());
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  // Check if the current user sent the last message and if it's been seen
  const getLastMessageStatus = (chat) => {
    if (!chat.last_message || !currentUser) return null;
    
    // This would need to be enhanced with actual seen status from the backend
    // For now, we'll show a simple indicator
    return null;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-base-content">Messages</h1>
          <p className="text-base-content/60 mt-1">Your conversations</p>
        </div>

        {/* Chats List */}
        <div className="bg-base-100 rounded-lg shadow-lg">
          {isChatsLoading ? (
            <div className="flex items-center justify-center p-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center p-12">
              <MessageSquareIcon className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-base-content mb-2">No conversations yet</h3>
              <p className="text-base-content/60 mb-4">
                Start a conversation by contacting a seller from a product page
              </p>
              <Link href="/" className="btn btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-base-content/10">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-4 hover:bg-base-200 cursor-pointer transition-colors group"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="avatar">
                        <div className="w-14 rounded-full">
                          {chat.other_user_profile_pic ? (
                            <Image
                              src={chat.other_user_profile_pic}
                              alt={chat.other_user_name}
                              width={56}
                              height={56}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                              <UserCircleIcon className="w-9 h-9 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                      {isOnline(chat.other_user_id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-base-100"></div>
                      )}
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-base-content truncate">
                          {chat.other_user_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {chat.last_message_at && (
                            <span className="text-xs text-base-content/60 flex-shrink-0">
                              {formatLastMessageTime(chat.last_message_at)}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                            disabled={deletingChatId === chat.id}
                            className="btn btn-ghost btn-circle btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete chat"
                          >
                            {deletingChatId === chat.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <Trash2Icon className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      {chat.product_name && (
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingBagIcon className="w-3 h-3 text-base-content/40" />
                          <span className="text-xs text-base-content/60 truncate">
                            {chat.product_name}
                          </span>
                          {chat.product_price && (
                            <span className="text-xs text-primary font-medium">
                              ${parseFloat(chat.product_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Last Message */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <p className="text-sm text-base-content/60 truncate">
                            {chat.last_message 
                              ? truncateMessage(chat.last_message)
                              : 'No messages yet'
                            }
                          </p>
                          {/* Seen indicator would go here - needs backend support for proper implementation */}
                        </div>
                        {chat.message_count > 0 && (
                          <span className="badge badge-primary badge-sm ml-2">
                            {chat.message_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Image */}
                    {chat.product_image && (
                      <div className="flex-shrink-0">
                        <Image
                          src={chat.product_image}
                          alt={chat.product_name}
                          width={64}
                          height={64}
                          className="rounded-lg object-cover w-16 h-16"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
