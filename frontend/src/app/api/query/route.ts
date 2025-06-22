import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { 
  executeQuery, 
  getDatabaseStats, 
  getPrograms, 
  DATABASE_SCHEMA, 
  QUERY_EXAMPLES 
} from '@/lib/database';

export const runtime = 'nodejs';

// Simplified response schema
const QueryResponseSchema = z.object({
  sql: z.string().describe('The SQL query to execute'),
  answer: z.string().describe('Natural language answer to the user question'),
  queryType: z.enum(['summary', 'trend', 'comparison', 'ranking', 'specific']).describe('Type of query being performed'),
  confidence: z.number().min(0).max(1).describe('Confidence level in the generated SQL (0-1)')
});

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    // Get database context
    const stats = getDatabaseStats();
    const programs = getPrograms().slice(0, 20);

    // Generate SQL query and answer in one AI call
    const systemPrompt = `You are a Toronto budget data analyst. Generate a SQL query and provide a direct answer.

${DATABASE_SCHEMA}

${QUERY_EXAMPLES}

Database Statistics:
- Records: ${stats.totalRecords.toLocaleString()}
- Years: ${stats.minYear}-${stats.maxYear}
- Programs: ${stats.uniquePrograms}
- Total Expenses: $${stats.totalExpenses.toLocaleString()}

Available Programs (sample):
${programs.slice(0, 10).map(p => `- ${p}`).join('\n')}

RULES:
1. Only SELECT queries - no INSERT, UPDATE, DELETE, DROP
2. Table name: budget_data
3. Positive amounts = expenses, negative amounts = revenue
4. Use LIKE '%keyword%' for text search
5. Include GROUP BY with aggregations
6. Set confidence < 0.5 only if question is completely unclear

Generate SQL and provide a conversational answer with specific numbers.`;

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: `Question: ${question}

Generate SQL to answer this and provide a clear response with specific data.`,
      schema: QueryResponseSchema,
    });

    const { sql, answer, queryType, confidence } = result.object;

    // Lower confidence threshold for better reliability
    if (confidence < 0.5) {
      return Response.json({
        success: false,
        error: 'Question unclear',
        suggestion: answer,
        confidence,
        examples: [
          "What was Toronto's total budget in 2024?",
          "How much did Toronto spend on police?",
          "Show me fire department spending trends",
          "Top 5 programs by spending in 2023",
          "Toronto's revenue in 2024"
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
        error: 'Query execution failed',
        sql,
        suggestion: "Try rephrasing your question or ask about Toronto's budget, spending, or revenue."
      }, { status: 500 });
    }

    // Update the answer with actual results
    const finalAnswer = queryResults.length > 0 
      ? `${answer}\n\nBased on ${queryResults.length} records found.`
      : "No data found matching your query. Try asking about a different time period or department.";

    return Response.json({
      success: true,
      answer: finalAnswer,
      data: queryResults,
      query: {
        sql,
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
      suggestion: "Please try asking a simpler question about Toronto's budget."
    }, { status: 500 });
  }
} 