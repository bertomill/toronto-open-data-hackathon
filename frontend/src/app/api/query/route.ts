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

// Use Node.js runtime for database access
export const runtime = 'nodejs';

// Define schema for validating SQL query generation output
const SQLGenerationSchema = z.object({
  // The actual SQL query string to be executed
  sql: z.string().describe('The SQL query to execute'),
  // Type of analysis being performed
  queryType: z.enum(['summary', 'trend', 'comparison', 'ranking', 'specific']).describe('Type of query being performed'),
  // Confidence score for the generated SQL
  confidence: z.number().min(0).max(1).describe('Confidence level in the generated SQL (0-1)')
});

export async function POST(req: Request) {
  try {
    // Extract question from request body
    const { question } = await req.json();

    // Validate question input
    if (!question || typeof question !== 'string') {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    // Get context and statistics from SQLite database used for budget queries
    const stats = getDatabaseStats();
    const programs = getPrograms().slice(0, 20); // Get sample of programs

    // Construct prompt for SQL generation
    // This includes database schema, examples, and rules
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

    // Generate SQL query using AI model
    const sqlResult = await generateObject({
      model: openai('gpt-4o-mini'),
      system: sqlGenerationPrompt,
      prompt: `Question: ${question}

Generate the appropriate SQL query to answer this question.`,
      schema: SQLGenerationSchema,
    });

    const { sql, queryType, confidence } = sqlResult.object;

    // Handle low confidence responses with helpful suggestions
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

    // Execute the generated SQL query safely
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

    // Generate natural language response from query results
    // This prompt ensures clear, accurate answers based on actual data
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
6. INCLUDES A "EVIDENCE" SECTION showing the SQL query and key data points

Format your response like this:
[Main answer paragraph]

**📊 Evidence:**
\`\`\`sql
${sql}
\`\`\`

**📋 Data Summary:**
- [Key data points from results]
- [Total records found: ${queryResults.length}]
- [Any notable patterns or insights]

Important: Use the REAL numbers from the data, not placeholders!`;

    // Generate human-friendly answer from the results
    const answerResult = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: answerGenerationPrompt,
    });

    // Return successful response with all relevant data
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
        executionTime: Date.now(),
        dataSource: "City of Toronto Open Data - Budget & Financial Data",
        dataRange: `${stats.minYear}-${stats.maxYear}`,
        lastUpdated: "2024-12-01", // You can make this dynamic
        totalRecords: stats.totalRecords
      }
    });

  } catch (error) {
    // Handle any unexpected errors
    console.error('Query API error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      suggestion: "Please try asking a simpler question about Toronto's budget."
    }, { status: 500 });
  }
} 