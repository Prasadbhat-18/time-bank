import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MessageCircle, 
  Send, 
  User, 
  Search, 
  X, 
  Check, 
  CheckCheck,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { groqChatService, ChatMessage, ChatConversation } from '../../services/groqChatService';
import { dataService } from '../../services/dataService';
import { User as UserType } from '../../types';

interface MessageSentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}

const MessageSentPopup: React.FC<MessageSentPopupProps> = ({ isOpen, onClose, recipientName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
          <p className="text-gray-600 mb-6">
            Your message has been delivered to <strong>{recipientName}</strong>
          </p>
          <button
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const ComprehensiveChatView: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [enhanceWithAI, setEnhanceWithAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessageSentPopup, setShowMessageSentPopup] = useState(false);
  const [lastRecipientName, setLastRecipientName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations and users
  useEffect(() => {
    if (user) {
      loadConversations();
      loadUsers();
    }
  }, [user]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to notifications and chat events
  useEffect(() => {
    if (!user) return;

    const unsubscribe = groqChatService.subscribeToNotifications(user.id, (message) => {
      console.log('🔔 New message received:', message);
      
      // Update conversations
      loadConversations();
      
      // If the message is for the currently selected conversation, update messages
      if (selectedConversation && 
          (message.senderId === selectedConversation.participants.find(p => p !== user.id))) {
        loadMessages(selectedConversation.id);
      }

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New message from ${message.senderName}`, {
          body: message.content,
          icon: '/favicon.ico',
          tag: 'chat-notification'
        });
      }
    });

    // Listen for start chat events from service cards
    const handleStartChat = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { targetUserId, targetUserName } = customEvent.detail;
      console.log('🚀 Starting chat with:', targetUserId, targetUserName);
      
      // Find the target user
      const targetUser = availableUsers.find(u => u.id === targetUserId);
      if (targetUser && user) {
        try {
          const conversation = await groqChatService.createConversation(user, targetUser);
          setSelectedConversation(conversation);
          loadMessages(conversation.id);
          loadConversations();
          
          // Switch to chat view
          window.dispatchEvent(new CustomEvent('timebank:switchToChat'));
        } catch (error) {
          console.error('Failed to start chat:', error);
        }
      }
    };

    window.addEventListener('timebank:startChat', handleStartChat);

    return () => {
      unsubscribe();
      window.removeEventListener('timebank:startChat', handleStartChat);
    };
  }, [user, selectedConversation, availableUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = () => {
    try {
      if (user) {
        const userConversations = groqChatService.getUserConversations(user.id);
        setConversations(userConversations);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await dataService.getAllRawUsers();
      setAvailableUsers(allUsers.filter((u: any) => u.id !== user?.id));
      setError(null);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    }
  };

  const loadMessages = (conversationId: string) => {
    try {
      const conversationMessages = groqChatService.getConversationMessages(conversationId);
      setMessages(conversationMessages);
      
      // Mark messages as read
      if (user) {
        groqChatService.markMessagesAsRead(conversationId, user.id);
        loadConversations(); // Refresh to update unread counts
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setLoading(true);
    setError(null);
    try {
      const receiverId = selectedConversation.participants.find(p => p !== user.id)!;
      const receiverName = selectedConversation.participantNames[receiverId];
      
      await groqChatService.sendEnhancedMessage(
        user.id,
        receiverId,
        newMessage,
        user.username || user.email,
        receiverName,
        enhanceWithAI
      );

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();
      
      // Show success popup
      setLastRecipientName(receiverName);
      setShowMessageSentPopup(true);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = async (targetUser: UserType) => {
    if (!user) return;

    try {
      const conversation = await groqChatService.createConversation(user, targetUser);
      setSelectedConversation(conversation);
      loadMessages(conversation.id);
      loadConversations();
      setShowNewChatModal(false);
      setError(null);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setError('Failed to create conversation');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getTotalUnreadCount = () => {
    return user ? groqChatService.getTotalUnreadCount(user.id) : 0;
  };

  const filteredUsers = availableUsers.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-emerald-400/80">Please log in to access messages</p>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-emerald-400/80">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] bg-white dark:dark-card rounded-xl shadow-lg overflow-hidden">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-emerald-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
                Messages
                {getTotalUnreadCount() > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {getTotalUnreadCount()}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors"
                title="Start New Chat"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to begin messaging</p>
              </div>
            ) : (
              conversations
                .filter(conversation => {
                  const otherUserId = conversation.participants.find(p => p !== user.id);
                  return otherUserId && conversation.participantNames?.[otherUserId];
                })
                .map((conversation) => {
                const otherUserId = conversation.participants.find(p => p !== user.id)!;
                const otherUserName = conversation.participantNames[otherUserId];
                const unreadCount = groqChatService.getConversationMessages(conversation.id)
                  .filter(msg => msg.receiverId === user.id && !msg.read).length;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      loadMessages(conversation.id);
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-emerald-50 border-emerald-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{otherUserName}</h3>
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage.senderId === user.id ? 'You: ' : ''}
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[18px] text-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-lg flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.participantNames[
                        selectedConversation.participants.find(p => p !== user.id)!
                      ]}
                    </h3>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === user.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${isOwn ? 'text-emerald-100' : 'text-gray-500'}`}>
                            {formatTime(message.timestamp)}
                          </span>
                          {isOwn && (
                            <div className="flex items-center">
                              {message.read ? (
                                <CheckCheck className="w-3 h-3 text-emerald-100" />
                              ) : (
                                <Check className="w-3 h-3 text-emerald-200" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={enhanceWithAI}
                      onChange={(e) => setEnhanceWithAI(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Sparkles className="w-4 h-4" />
                    Enhance with AI
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Start New Chat</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users found</p>
              ) : (
                filteredUsers.map((targetUser) => (
                  <div
                    key={targetUser.id}
                    onClick={() => handleStartNewChat(targetUser)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{targetUser.username}</h4>
                      <p className="text-sm text-gray-500">{targetUser.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Sent Popup */}
      <MessageSentPopup
        isOpen={showMessageSentPopup}
        onClose={() => setShowMessageSentPopup(false)}
        recipientName={lastRecipientName}
      />
    </div>
  );
};
