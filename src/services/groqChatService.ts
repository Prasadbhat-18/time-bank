import { User } from '../types';

// Groq API configuration
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'your_groq_api_key_here';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  senderName: string;
  receiverName: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

class GroqChatService {
  private conversations: Map<string, ChatConversation> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private notificationCallbacks: Map<string, (message: ChatMessage) => void> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Load data from localStorage
  private loadFromStorage() {
    try {
      const conversationsData = localStorage.getItem('timebank_conversations');
      const messagesData = localStorage.getItem('timebank_messages');

      if (conversationsData) {
        const conversations = JSON.parse(conversationsData);
        this.conversations = new Map(Object.entries(conversations));
      }

      if (messagesData) {
        const messages = JSON.parse(messagesData);
        Object.entries(messages).forEach(([conversationId, msgs]) => {
          this.messages.set(conversationId, msgs as ChatMessage[]);
        });
      }
    } catch (error) {
      console.error('Error loading chat data from storage:', error);
    }
  }

  // Save data to localStorage
  private saveToStorage() {
    try {
      const conversationsObj = Object.fromEntries(this.conversations);
      const messagesObj = Object.fromEntries(this.messages);

      localStorage.setItem('timebank_conversations', JSON.stringify(conversationsObj));
      localStorage.setItem('timebank_messages', JSON.stringify(messagesObj));
    } catch (error) {
      console.error('Error saving chat data to storage:', error);
    }
  }

  // Generate conversation ID from two user IDs
  private generateConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  // Create or get existing conversation
  async createConversation(user1: User, user2: User): Promise<ChatConversation> {
    const conversationId = this.generateConversationId(user1.id, user2.id);
    
    if (this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId)!;
    }

    const conversation: ChatConversation = {
      id: conversationId,
      participants: [user1.id, user2.id],
      participantNames: {
        [user1.id]: user1.username || user1.email,
        [user2.id]: user2.username || user2.email
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.conversations.set(conversationId, conversation);
    this.messages.set(conversationId, []);
    this.saveToStorage();

    return conversation;
  }

  // Send a message
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    senderName: string,
    receiverName: string
  ): Promise<ChatMessage> {
    const conversationId = this.generateConversationId(senderId, receiverId);
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      receiverId,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      senderName,
      receiverName
    };

    // Add message to conversation
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
    }
    
    this.messages.get(conversationId)!.push(message);

    // Update conversation
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.lastMessage = message;
      conversation.unreadCount += 1;
      conversation.updatedAt = new Date().toISOString();
      this.conversations.set(conversationId, conversation);
    }

    this.saveToStorage();

    // Trigger notification for receiver
    const receiverCallback = this.notificationCallbacks.get(receiverId);
    if (receiverCallback) {
      receiverCallback(message);
    }

    return message;
  }

  // Get conversations for a user
  getUserConversations(userId: string): ChatConversation[] {
    const userConversations: ChatConversation[] = [];
    
    this.conversations.forEach((conversation) => {
      if (conversation.participants.includes(userId)) {
        userConversations.push(conversation);
      }
    });

    // Sort by last update time
    return userConversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Get messages for a conversation
  getConversationMessages(conversationId: string): ChatMessage[] {
    return this.messages.get(conversationId) || [];
  }

  // Mark messages as read
  markMessagesAsRead(conversationId: string, userId: string): void {
    const messages = this.messages.get(conversationId);
    if (messages) {
      messages.forEach(message => {
        if (message.receiverId === userId && !message.read) {
          message.read = true;
        }
      });

      // Update unread count
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        const unreadMessages = messages.filter(
          msg => msg.receiverId === userId && !msg.read
        );
        conversation.unreadCount = unreadMessages.length;
        this.conversations.set(conversationId, conversation);
      }

      this.saveToStorage();
    }
  }

  // Get total unread count for a user
  getTotalUnreadCount(userId: string): number {
    let totalUnread = 0;
    
    this.conversations.forEach((conversation) => {
      if (conversation.participants.includes(userId)) {
        const messages = this.messages.get(conversation.id) || [];
        const unreadForUser = messages.filter(
          msg => msg.receiverId === userId && !msg.read
        ).length;
        totalUnread += unreadForUser;
      }
    });

    return totalUnread;
  }

  // Subscribe to notifications for a user
  subscribeToNotifications(userId: string, callback: (message: ChatMessage) => void): () => void {
    this.notificationCallbacks.set(userId, callback);
    
    return () => {
      this.notificationCallbacks.delete(userId);
    };
  }

  // Enhanced message with AI assistance (using Groq)
  async sendEnhancedMessage(
    senderId: string,
    receiverId: string,
    content: string,
    senderName: string,
    receiverName: string,
    enhanceWithAI: boolean = false
  ): Promise<ChatMessage> {
    let finalContent = content;

    if (enhanceWithAI && content.trim()) {
      try {
        const enhancedContent = await this.enhanceMessageWithGroq(content);
        finalContent = enhancedContent || content;
      } catch (error) {
        console.warn('AI enhancement failed, using original message:', error);
      }
    }

    return this.sendMessage(senderId, receiverId, finalContent, senderName, receiverName);
  }

  // Enhance message using Groq API
  private async enhanceMessageWithGroq(message: string): Promise<string> {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that improves messages for a time-banking service platform. Make messages clearer, more professional, and friendly while keeping the original meaning. Keep responses concise and under 200 characters.'
            },
            {
              role: 'user',
              content: `Please improve this message for a service booking conversation: "${message}"`
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || message;
    } catch (error) {
      console.error('Groq API enhancement failed:', error);
      return message;
    }
  }

  // Clear all chat data (for testing)
  clearAllData(): void {
    this.conversations.clear();
    this.messages.clear();
    localStorage.removeItem('timebank_conversations');
    localStorage.removeItem('timebank_messages');
  }
}

export const groqChatService = new GroqChatService();
