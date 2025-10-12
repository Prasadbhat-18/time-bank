import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage, ChatConversation } from '../../types';
import { chatService } from '../../services/chatService';

interface ChatModalProps {
  conversation: ChatConversation;
  onClose: () => void;
  onMessageSent: (message: ChatMessage) => void;
  onTermsAgreed: (termsContent: string) => void;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isAI?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser, isAI = false }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageTypeIcon = () => {
    switch (message.message_type) {
      case 'terms_proposal':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'terms_agreement':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'system':
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const bubbleClass = isCurrentUser
    ? 'ml-auto bg-emerald-500 text-white'
    : isAI
    ? 'mr-auto bg-blue-100 text-blue-900 border border-blue-200'
    : 'mr-auto bg-gray-100 text-gray-900';

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleClass}`}>
        {message.message_type !== 'text' && (
          <div className="flex items-center gap-2 mb-2 text-sm opacity-75">
            {getMessageTypeIcon()}
            <span className="font-medium">
              {message.message_type === 'terms_proposal' && 'Terms Proposal'}
              {message.message_type === 'terms_agreement' && 'Terms Agreement'}
              {message.message_type === 'system' && 'System'}
            </span>
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div className="flex items-center justify-between mt-2 text-xs opacity-60">
          <span>{message.sender?.username || 'Unknown'}</span>
          <span>{formatTime(message.created_at)}</span>
        </div>
        {isAI && (
          <div className="mt-1 text-xs opacity-50 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            AI Assistant
          </div>
        )}
      </div>
    </div>
  );
};

export const ChatModal: React.FC<ChatModalProps> = ({ 
  conversation, 
  onClose, 
  onMessageSent, 
  onTermsAgreed 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsProposal, setShowTermsProposal] = useState(false);
  const [proposedTerms, setProposedTerms] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load initial messages - in a real app, this would come from dataService
    const initialMessages: ChatMessage[] = [
      {
        id: 'system-1',
        conversation_id: conversation.id,
        sender_id: 'system',
        content: `Welcome to the chat for "${conversation.service?.title}". Use this space to discuss service details, terms, and arrangements. An AI assistant is available to help with negotiations.`,
        message_type: 'system',
        created_at: new Date().toISOString(),
      }
    ];
    setMessages(initialMessages);
  }, [conversation.id, conversation.service?.title]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsLoading(true);
    
    try {
      // Check message content
      const moderation = await chatService.moderateMessage(newMessage.trim());
      if (!moderation.isAppropriate) {
        alert(`Message not sent: ${moderation.reason}`);
        setIsLoading(false);
        return;
      }

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: user.id,
        sender: user,
        content: newMessage.trim(),
        message_type: 'text',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      onMessageSent(userMessage);
      setNewMessage('');

      // Generate AI response if the conversation needs assistance
      if (newMessage.toLowerCase().includes('help') || 
          newMessage.toLowerCase().includes('terms') ||
          newMessage.toLowerCase().includes('price') ||
          newMessage.toLowerCase().includes('fair')) {
        
        // Convert ChatMessage to chatService format
        const chatServiceMessages = [...messages, userMessage].map(msg => ({
          id: msg.id,
          role: msg.sender_id === 'ai-assistant' ? 'assistant' as const : 'user' as const,
          content: msg.content,
          timestamp: msg.created_at,
          userId: msg.sender_id,
          username: msg.sender?.username,
        }));
        
        const aiResponse = await chatService.generateResponse(chatServiceMessages);
        const aiMessage: ChatMessage = {
          id: aiResponse.id,
          conversation_id: conversation.id,
          sender_id: 'ai-assistant',
          sender: {
            id: 'ai-assistant',
            username: 'AI Assistant',
            email: 'ai@timebank.com',
            bio: 'AI helper for TimeBank',
            reputation_score: 5.0,
            total_reviews: 0,
            created_at: new Date().toISOString(),
          },
          content: aiResponse.content,
          message_type: 'text',
          is_ai_generated: true,
          created_at: aiResponse.timestamp,
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTerms = async () => {
    if (!conversation.service || !user) return;

    setIsLoading(true);
    try {
      const termsContent = await chatService.generateTermsAgreement(
        conversation.service.title,
        conversation.service.description,
        2, // Default duration
        conversation.service.credits_per_hour,
        'Generated by AI assistant based on service details'
      );

      setProposedTerms(termsContent);
      setShowTermsProposal(true);
    } catch (error) {
      console.error('Error generating terms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    if (!proposedTerms || !user) return;

    const termsMessage: ChatMessage = {
      id: `terms-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: user.id,
      sender: user,
      content: proposedTerms,
      message_type: 'terms_agreement',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, termsMessage]);
    onTermsAgreed(proposedTerms);
    setShowTermsProposal(false);
    setProposedTerms('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              Chat: {conversation.title}
            </h2>
            {conversation.service && (
              <p className="text-sm text-gray-600 mt-1">
                Service: {conversation.service.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {conversation.terms_agreed ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Terms Agreed
              </div>
            ) : (
              <button
                onClick={handleGenerateTerms}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition disabled:opacity-50"
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Generate Terms
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender_id === user?.id}
              isAI={message.is_ai_generated}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Terms Proposal Modal */}
        {showTermsProposal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80%] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Proposed Terms
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {proposedTerms}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTermsProposal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  >
                    Review Later
                  </button>
                  <button
                    onClick={handleAcceptTerms}
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                  >
                    Accept Terms
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};