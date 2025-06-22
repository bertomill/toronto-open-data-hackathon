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
    const conversationHistory = messages.slice(0, -1);

    // First, try to query our budget database
    let budgetResponse = null;
    try {
      const queryResponse = await fetch(`${req.url.replace('/api/chat', '/api/query')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: latestMessage.content,
          context: conversationHistory
        }),
      });

      if (queryResponse.ok) {
        budgetResponse = await queryResponse.json();
      }
    } catch (error) {
      console.warn('Budget query failed, falling back to general chat:', error);
    }

    // If we got a successful budget query response, use it
    if (budgetResponse?.success) {
      const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: `You are a helpful assistant for the Toronto Budget Navigator app. 

You have access to Toronto's municipal budget data and have just executed a query to answer the user's question.

Budget Query Results:
- Question: ${latestMessage.content}
- Answer: ${budgetResponse.answer}
- SQL Query: ${budgetResponse.query.sql}
- Data Points: ${budgetResponse.metadata.totalRows} results
- Query Type: ${budgetResponse.query.type}
- Confidence: ${budgetResponse.query.confidence}

Present this information in a conversational, helpful way. If the user asks for visualizations or charts, suggest what type of chart would work best with this data.

If asked about the data source or methodology, mention that this is based on Toronto's official budget data from 2019-2024.`,
        messages: [
          ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: latestMessage.content
          },
          {
            role: 'assistant',
            content: `Based on the budget analysis, here's what I found: ${budgetResponse.answer}

The SQL query used was: \`${budgetResponse.query.sql}\`

This query returned ${budgetResponse.metadata.totalRows} results with a confidence score of ${budgetResponse.query.confidence}.`
          }
        ],
      });

      return result.toDataStreamResponse();
    }

    // If no budget data was relevant, provide general assistance
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a helpful assistant for the Toronto Budget Navigator app. 

This app helps users explore and understand Toronto's municipal budget data from 2019-2024. 

If users ask about budget-related topics, help them formulate good questions such as:
- "What was Toronto's total budget in 2024?"
- "How much did Toronto spend on police services?"
- "Show me the trend in fire department spending over the years"
- "What are the top programs by spending?"
- "How much revenue did Toronto collect last year?"

You can also help with general app usage, data interpretation, and suggest what types of visualizations might be useful for different types of budget data.

Be conversational and helpful. If the user's question doesn't seem to be about Toronto's budget, still try to be helpful while gently steering the conversation toward budget-related topics.`,
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Fallback response
    return new Response(
      JSON.stringify({ 
        error: 'Sorry, I encountered an error. Please try asking about Toronto\'s budget data, such as "What was the total budget in 2024?" or "How much was spent on police services?"' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 