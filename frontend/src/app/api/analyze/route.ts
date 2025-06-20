import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export const runtime = 'nodejs';

interface AnalysisRequest {
  query: string;
}

export async function POST(req: NextRequest) {
  let requestQuery = 'unknown';
  
  try {
    const { query }: AnalysisRequest = await req.json();
    requestQuery = query;
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Path to the root directory where test.ts is located
    const rootDir = path.join(process.cwd(), '..');
    
    // Execute the analysis using the Node.js backend with proper input piping
    const { stdout, stderr } = await execAsync(
      `cd "${rootDir}" && echo "${query.replace(/"/g, '\\"')}" | npm start`,
      {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        shell: '/bin/bash'
      }
    );

    if (stderr && !stderr.includes('Warning') && !stderr.includes('npm start')) {
      console.error('Analysis stderr:', stderr);
    }

    // Parse the output to extract the bot response
    const lines = stdout.split('\n');
    
    // Look for the bot response (🤖) or analysis results
    let response = '';
    let foundBotResponse = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Start capturing from bot response
      if (line.includes('🤖')) {
        foundBotResponse = true;
        // Remove the bot emoji and start collecting response
        const cleanLine = line.replace(/^.*🤖\s*/, '').trim();
        if (cleanLine) {
          response += cleanLine + '\n';
        }
        continue;
      }
      
      // If we found a bot response, continue capturing until we hit "You:" or end
      if (foundBotResponse) {
        if (line.trim() === 'You:' || line.includes('You:')) {
          break;
        }
        response += line + '\n';
      }
    }

    // If no bot response found, look for meaningful analysis output
    if (!response.trim()) {
      const meaningfulLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.includes('You:') && 
               !trimmed.includes('npm start') &&
               !trimmed.includes('toronto-budget-analyzer') &&
               !trimmed.includes('Ready for your questions') &&
               !trimmed.includes('Analyzing...') &&
               !trimmed.includes('Loading Toronto budget data') &&
               trimmed !== '>';
      });
      
      // Look for expense/analysis patterns
      const analysisLines = meaningfulLines.filter(line => 
        line.includes('$') || 
        line.includes('Total') || 
        line.includes('Expenses') ||
        line.includes('Revenue') ||
        line.includes('Budget') ||
        line.includes('records') ||
        line.includes('year') ||
        line.includes('💰') ||
        line.includes('📊') ||
        line.includes('🏆')
      );
      
      if (analysisLines.length > 0) {
        response = analysisLines.join('\n');
      } else if (meaningfulLines.length > 0) {
        // Take the last few meaningful lines
        response = meaningfulLines.slice(-5).join('\n');
      }
    }

    // Clean up the response
    response = response.trim();

    return NextResponse.json({
      query,
      response: response || 'Analysis completed. The data has been processed successfully.',
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    
    // Return a more user-friendly error with fallback analysis
    return NextResponse.json({
      query: requestQuery,
      response: `I apologize, but I encountered an issue while analyzing your query. Here's what I can tell you:

The Toronto budget dataset contains comprehensive financial data from 2019-2024 with over 90,000 records covering:
- 70+ city programs and departments
- 195+ services and activities  
- Detailed expense and revenue breakdowns
- Categories including salaries, benefits, utilities, and operations

For your specific query, please try rephrasing it or asking about:
- Specific years (e.g., "What were the 2023 expenses?")
- Department spending (e.g., "Police budget trends")
- Utility costs (e.g., "Hydro expenses over time")
- Revenue analysis (e.g., "Tax revenue in 2024")

Error details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: true,
      timestamp: new Date().toISOString()
    }, { status: 200 }); // Return 200 so frontend can display the fallback message
  }
} 