'use client';

import { useEffect } from 'react';
import { useChatStore } from '../store/hooks';
import { useSocket } from '../lib/socket';

export default function ChatExample() {
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
    unsubscribeFromOnlineUsers
  } = useChatStore();

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
      // Load messages for selected user
      getMessages(selectedUser.id);
      
      // Subscribe to new messages
      subscribeToMessages();

      return () => {
        unsubscribeFromMessages();
      };
    }
  }, [selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get('text');
    
    if (!text.trim()) return;

    try {
      await sendMessage({ text });
      e.target.reset();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Users Sidebar */}
      <div className="w-1/4 bg-gray-100 p-4">
        <h2 className="text-lg font-bold mb-4">Users</h2>
        {isUsersLoading ? (
          <div>Loading users...</div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedUser?.id === user.id ? 'bg-blue-500 text-white' : 'bg-white'
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center">
                  <span>{user.name}</span>
                  {onlineUsers.includes(user.id.toString()) && (
                    <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-200 p-4 border-b">
              <h3 className="font-semibold">{selectedUser.name}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {isMessagesLoading ? (
                <div>Loading messages...</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded max-w-xs ${
                        message.sender_id === selectedUser.id
                          ? 'bg-gray-200 self-start'
                          : 'bg-blue-500 text-white self-end ml-auto'
                      }`}
                    >
                      {message.text}
                      {message.image && (
                        <img src={message.image} alt="Message" className="mt-2 max-w-full" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex">
                <input
                  type="text"
                  name="text"
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-l"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-r"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
} 