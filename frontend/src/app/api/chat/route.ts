import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

interface ChatMessage {
  role: string;
  content: string;
  id?: string;
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

    // If we got budget data, return it directly
    if (budgetResponse?.success) {
      return new Response(budgetResponse.answer, {
        headers: { 'Content-Type': 'text/plain' }
      });
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
    
    return new Response(
      'Sorry, I encountered an error. Please try asking about Toronto\'s budget data, such as "What was the total budget in 2024?" or "How much was spent on police?"',
      { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
} 