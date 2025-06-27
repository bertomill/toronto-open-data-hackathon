import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ChatMessage } from '@/types';

export const runtime = 'edge';

// Function to create a streaming response from text
function createStreamingResponse(text: string) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Split text into chunks for streaming effect
      const words = text.split(' ');
      let currentText = '';
      
      const sendChunk = (index: number) => {
        if (index < words.length) {
          currentText += (index > 0 ? ' ' : '') + words[index];
          const chunk = `0:"${currentText.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
          controller.enqueue(encoder.encode(chunk));
          
          // Send next chunk after a small delay
          setTimeout(() => sendChunk(index + 1), 50);
        } else {
          controller.close();
        }
      };
      
      sendChunk(0);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();
    
    // Get the latest user message
    const latestMessage = messages[messages.length - 1];

    // Try to query our budget database first
    let budgetResponse = null;
    try {
      const queryResponse = await fetch(`${req.url.replace('/api/chat', '/api/query')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: latestMessage.content
        }),
      });

      if (queryResponse.ok) {
        budgetResponse = await queryResponse.json();
      }
    } catch (error) {
      console.warn('Budget query failed:', error);
    }

    // If we got budget data, return it as a streaming response
    if (budgetResponse?.success) {
      return createStreamingResponse(budgetResponse.answer);
    }

    // Fallback to general assistance if no budget data found
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a helpful assistant for the Toronto Budget Navigator app. 

This app helps users explore Toronto's municipal budget data from 2019-2024. 

If users ask budget-related questions, suggest they try:
- "What was Toronto's total budget in 2024?"
- "How much did Toronto spend on police?"
- "Show me fire department spending trends"
- "Top programs by spending in 2023"
- "Toronto's revenue in 2024"

Be conversational and helpful. If the question wasn't about Toronto's budget, try to be helpful while steering toward budget topics.`,
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return error as streaming response for consistency
    const errorText = 'Sorry, I encountered an error. Please try asking about Toronto\'s budget data, such as "What was the total budget in 2024?" or "How much was spent on police?"';
    return createStreamingResponse(errorText);
  }
} 