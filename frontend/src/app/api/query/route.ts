import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { 
  executeQuery, 
  getDatabaseStats, 
  getPrograms, 
  DATABASE_SCHEMA, 
  QUERY_EXAMPLES 
} from '@/lib/database';

export const runtime = 'nodejs';

// Response schema for structured SQL generation
const QueryResponseSchema = z.object({
  sql: z.string().describe('The SQL query to execute'),
  explanation: z.string().describe('Plain English explanation of what the query does'),
  queryType: z.enum(['summary', 'trend', 'comparison', 'ranking', 'specific']).describe('Type of query being performed'),
  confidence: z.number().min(0).max(1).describe('Confidence level in the generated SQL (0-1)')
});

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(req: Request) {
  try {
    const { question, context = [] } = await req.json();

    if (!question || typeof question !== 'string') {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    // Get database context
    const stats = getDatabaseStats();
    const programs = getPrograms().slice(0, 20); // Top 20 programs for context

    // Generate SQL query using AI
    const systemPrompt = `You are a SQL expert specializing in Toronto municipal budget data analysis. 

${DATABASE_SCHEMA}

${QUERY_EXAMPLES}

Database Statistics:
- Records: ${stats.totalRecords.toLocaleString()}
- Years: ${stats.minYear}-${stats.maxYear}
- Programs: ${stats.uniquePrograms}
- Total Expenses: $${stats.totalExpenses.toLocaleString()}

Available Programs (sample):
${programs.slice(0, 10).map(p => `- ${p}`).join('\n')}

IMPORTANT RULES:
1. Only generate SELECT queries - no INSERT, UPDATE, DELETE, DROP, etc.
2. Use the exact table name: budget_data
3. Positive amounts = expenses, negative amounts = revenue
4. Use LIKE '%keyword%' for text searching (case-insensitive)
5. Always include appropriate GROUP BY when using aggregation
6. Format large numbers with proper grouping
7. Return confidence < 0.7 if the question is unclear or impossible to answer with this data

Generate a SQL query to answer the user's question about Toronto's budget data.`;

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: `Question: ${question}
      
Context from previous conversation:
${context.map((msg: ChatMessage) => `${msg.role}: ${msg.content}`).join('\n')}

Generate a SQL query to answer this question about Toronto's budget data.`,
      schema: QueryResponseSchema,
    });

    const { sql, explanation, queryType, confidence } = result.object;

    // If confidence is too low, return a helpful response
    if (confidence < 0.7) {
      return Response.json({
        success: false,
        error: 'Query confidence too low',
        suggestion: explanation,
        confidence,
        availableQueries: [
          "What was Toronto's total budget in 2024?",
          "How much did Toronto spend on police services?",
          "Show me the trend in fire department spending over the years",
          "What are the top 5 programs by spending in 2023?",
          "How much revenue did Toronto collect in 2024?"
        ]
      });
    }

    // Execute the SQL query
    let queryResults;
    try {
      queryResults = executeQuery(sql);
    } catch (error) {
      console.error('SQL execution error:', error);
      return Response.json({
        success: false,
        error: 'Failed to execute query',
        details: error instanceof Error ? error.message : 'Unknown error',
        sql
      }, { status: 500 });
    }

    // Generate a natural language response
    const responsePrompt = `Based on this SQL query and results, provide a clear, conversational answer to the user's question.

User Question: ${question}
SQL Query: ${sql}
Query Results: ${JSON.stringify(queryResults.slice(0, 10))} ${queryResults.length > 10 ? `... (${queryResults.length} total rows)` : ''}

Provide a natural, informative response that:
1. Directly answers the user's question
2. Includes specific numbers/amounts when relevant
3. Provides context or insights about the data
4. Is conversational and easy to understand
5. Mentions if this is showing expenses vs revenue when relevant

Format large numbers with commas (e.g., $1,234,567).`;

    const aiResponse = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: responsePrompt,
    });

    return Response.json({
      success: true,
      answer: aiResponse.text,
      data: queryResults,
      query: {
        sql,
        explanation,
        type: queryType,
        confidence
      },
      metadata: {
        totalRows: queryResults.length,
        executionTime: Date.now()
      }
    });

  } catch (error) {
    console.error('Query API error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 