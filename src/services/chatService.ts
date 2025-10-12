import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  userId?: string;
  username?: string;
}

export interface ChatCompletion {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: string;
}

class ChatService {
  async generateResponse(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<ChatCompletion> {
    try {
      const systemMessage = systemPrompt || `
You are a helpful assistant for TimeBank, a skill-sharing platform where people exchange services using time credits. 
Your role is to:
1. Help users negotiate service terms and agreements
2. Clarify service details, pricing, and scheduling
3. Facilitate clear communication between service providers and requesters
4. Suggest fair time credit pricing based on service complexity
5. Help resolve disputes or misunderstandings

Be professional, fair, and helpful. Always encourage mutual respect and clear agreements.
      `.trim();

      const chatMessages = [
        { role: 'system' as const, content: systemMessage },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const completion = await groq.chat.completions.create({
        messages: chatMessages,
        model: 'mixtral-8x7b-32768', // Fast and capable model
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false,
      });

      const responseContent = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

      return {
        id: `ai-${Date.now()}`,
        content: responseContent,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating chat response:', error);
      return {
        id: `ai-error-${Date.now()}`,
        content: 'I apologize, but I encountered an error. Please try again later.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async generateTermsAgreement(
    serviceTitle: string,
    serviceDescription: string,
    duration: number,
    creditsPerHour: number,
    additionalNotes?: string
  ): Promise<string> {
    const prompt = `
Generate a fair and clear service agreement for a TimeBank service exchange with these details:

Service: ${serviceTitle}
Description: ${serviceDescription}
Duration: ${duration} hours
Rate: ${creditsPerHour} credits per hour
Additional Notes: ${additionalNotes || 'None'}

Create a professional but friendly agreement that covers:
1. Service details and expectations
2. Timing and scheduling
3. Credit transfer terms
4. Cancellation policy
5. Quality expectations

Keep it concise but comprehensive. Use a warm, community-focused tone.
    `.trim();

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.5,
        max_tokens: 800,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate agreement. Please create terms manually.';
    } catch (error) {
      console.error('Error generating terms agreement:', error);
      return 'Unable to generate agreement. Please create terms manually.';
    }
  }

  async moderateMessage(content: string): Promise<{ isAppropriate: boolean; reason?: string }> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{
          role: 'system',
          content: 'You are a content moderator. Analyze the following message and respond with "APPROPRIATE" if it\'s suitable for a professional skill-sharing platform, or "INAPPROPRIATE: [reason]" if it contains offensive content, spam, or inappropriate material.'
        }, {
          role: 'user',
          content: content
        }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.1,
        max_tokens: 100,
      });

      const response = completion.choices[0]?.message?.content || 'APPROPRIATE';
      
      if (response.startsWith('INAPPROPRIATE')) {
        return {
          isAppropriate: false,
          reason: response.replace('INAPPROPRIATE:', '').trim()
        };
      }

      return { isAppropriate: true };
    } catch (error) {
      console.error('Error moderating message:', error);
      // Default to allowing the message if moderation fails
      return { isAppropriate: true };
    }
  }
}

export const chatService = new ChatService();
