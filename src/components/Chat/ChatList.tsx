import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatConversation, ChatMessage } from '../../types';
import { dataService } from '../../services/dataService';
import { ChatModal } from './ChatModal';

export const ChatList: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      try {
        const userConversations = await dataService.getConversations(user.id);
        setConversations(userConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getOtherParticipant = (conversation: ChatConversation) => {
    const otherUserId = conversation.participants.find(id => id !== user?.id);
    return otherUserId === conversation.service?.provider_id ? 
      conversation.service?.provider?.username : 
      'Unknown User';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading conversations...</span>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center p-8">
        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-600">
          Start chatting with service providers by clicking "Chat First" when booking a service.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-500" />
          Your Conversations
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => setSelectedConversation(conversation)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.title}
                  </h3>
                  {conversation.terms_agreed && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span>with {getOtherParticipant(conversation)}</span>
                </div>

                {conversation.service && (
                  <div className="text-sm text-gray-500 mb-2">
                    Service: {conversation.service.title}
                  </div>
                )}

                {conversation.last_message && (
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.last_message.content}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end text-xs text-gray-500 ml-2">
                <span>{formatTime(conversation.updated_at)}</span>
                {conversation.terms_agreed && (
                  <span className="text-green-600 font-medium mt-1">Terms Agreed</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedConversation && (
        <ChatModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          onMessageSent={async (message: ChatMessage) => {
            await dataService.sendMessage(message);
            // Refresh conversations to update last message
            if (user) {
              const updated = await dataService.getConversations(user.id);
              setConversations(updated);
            }
          }}
          onTermsAgreed={async (termsContent: string) => {
            await dataService.agreeToTerms(selectedConversation.id, termsContent);
            setSelectedConversation(null);
            // Refresh conversations
            if (user) {
              const updated = await dataService.getConversations(user.id);
              setConversations(updated);
            }
          }}
        />
      )}
    </div>
  );
};