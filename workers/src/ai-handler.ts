// workers/src/ai-handler.ts

interface AIRequest {
  message: string;
  context: string;
  sessionId: string;
}

export async function handleAIRequest(ai: any, request: AIRequest): Promise<string> {
  try {
    const systemPrompt = `You are an expert technical interviewer conducting a ${request.context}. 
Be professional, encouraging, and provide constructive feedback. 
Ask follow-up questions to assess deeper understanding.
Keep responses concise and focused.`;

    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.message }
      ]
    });

    // Log the actual response to debug
    console.log('AI Response:', JSON.stringify(response, null, 2));

    // Handle different response formats from Cloudflare AI
    if (typeof response === 'string') {
      return response;
    }
    
    // Try response.response first (most common format)
    if (response?.response && typeof response.response === 'string') {
      return response.response;
    }
    
    // Try result.response
    if (response?.result?.response && typeof response.result.response === 'string') {
      return response.result.response;
    }

    // Try to extract from array format
    if (Array.isArray(response) && response.length > 0) {
      if (typeof response[0] === 'string') {
        return response[0];
      }
      if (response[0]?.response) {
        return response[0].response;
      }
    }

    // If we get here, log the issue and return a valid string
    console.error('Could not extract text from AI response:', response);
    return "I received your message. Could you please provide more details about what you'd like to discuss?";
    
  } catch (error: any) {
    console.error('AI request failed:', error);
    
    // Return a valid string, never undefined or an object
    return "I'm currently experiencing technical difficulties. Let me try to help you anyway - could you please elaborate on your question?";
  }
}