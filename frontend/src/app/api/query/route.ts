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

// Schema for SQL generation only
const SQLGenerationSchema = z.object({
  sql: z.string().describe('The SQL query to execute'),
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

    // First, generate just the SQL query
    const sqlGenerationPrompt = `You are a Toronto budget data analyst. Generate a SQL query to answer the user's question.

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

Generate ONLY the SQL query to answer this question.`;

    const sqlResult = await generateObject({
      model: openai('gpt-4o-mini'),
      system: sqlGenerationPrompt,
      prompt: `Question: ${question}

Generate the appropriate SQL query to answer this question.`,
      schema: SQLGenerationSchema,
    });

    const { sql, queryType, confidence } = sqlResult.object;

    // Lower confidence threshold for better reliability
    if (confidence < 0.5) {
      return Response.json({
        success: false,
        error: 'Question unclear',
        suggestion: 'Could you please rephrase your question about Toronto\'s budget data?',
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

    // Generate natural language answer using the actual query results
    const answerGenerationPrompt = `You are a Toronto budget data analyst. The user asked: "${question}"

The SQL query was: ${sql}

The query returned ${queryResults.length} record(s) with the following data:
${JSON.stringify(queryResults, null, 2)}

Provide a clear, conversational answer that:
1. Directly answers the user's question
2. Uses the ACTUAL numbers from the query results
3. Formats large numbers clearly (e.g., "$15.5 billion" instead of "$15475414089.78")
4. Provides context when helpful
5. Is concise but informative

Important: Use the REAL numbers from the data, not placeholders!`;

    const answerResult = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: answerGenerationPrompt,
    });

    return Response.json({
      success: true,
      answer: answerResult.text,
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