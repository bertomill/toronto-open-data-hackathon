export const runtime = 'edge';

interface ChatMessage {
  role: string;
  content: string;
  id?: string;
}

// Fallback function for basic budget analysis
function generateBudgetResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('total budget') || lowerQuery.includes('overall budget')) {
    return "Based on the Toronto budget data from 2019-2024, the total budget has grown significantly over the years.\n\nHere's a Python script to analyze the total budget:\n\n```python\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Load data\ndf = pd.read_csv('toronto_budget_combined_2024_to_2019.csv')\ndf['Amount'] = pd.to_numeric(df['Amount'].str.replace(',', ''), errors='coerce')\n\n# Calculate yearly totals\nyearly_totals = df.groupby('Year')['Amount'].apply(lambda x: x.abs().sum())\n\n# Create chart\nplt.figure(figsize=(10, 6))\nyearly_totals.plot(kind='bar')\nplt.title('Toronto Total Budget by Year')\nplt.ylabel('Amount ($)')\nplt.show()\n\nprint('Budget by year:')\nfor year, amount in yearly_totals.items():\n    print(f'{year}: ${amount:,.0f}')\n```";
  }
  
  if (lowerQuery.includes('police') || lowerQuery.includes('law enforcement')) {
    return "Police services represent a significant portion of Toronto's budget.\n\nHere's a Python script to analyze police spending:\n\n```python\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Load data\ndf = pd.read_csv('toronto_budget_combined_2024_to_2019.csv')\ndf['Amount'] = pd.to_numeric(df['Amount'].str.replace(',', ''), errors='coerce')\n\n# Filter police data\npolice_data = df[df['Program'].str.contains('Police', case=False, na=False)]\n\n# Calculate police spending by year\npolice_yearly = police_data.groupby('Year')['Amount'].apply(lambda x: x.abs().sum())\n\n# Create chart\nplt.figure(figsize=(10, 6))\npolice_yearly.plot(kind='line', marker='o')\nplt.title('Police Budget Trend')\nplt.ylabel('Amount ($)')\nplt.show()\n\nprint(f'Total police budget: ${police_yearly.sum():,.0f}')\n```";
  }
  
  if (lowerQuery.includes('revenue') || lowerQuery.includes('income')) {
    return "Toronto's revenue comes from various sources. Revenues are negative values in the dataset.\n\nHere's a Python script to analyze revenue:\n\n```python\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Load data\ndf = pd.read_csv('toronto_budget_combined_2024_to_2019.csv')\ndf['Amount'] = pd.to_numeric(df['Amount'].str.replace(',', ''), errors='coerce')\n\n# Filter revenue data (negative amounts)\nrevenue_data = df[df['Amount'] < 0].copy()\nrevenue_data['Amount'] = revenue_data['Amount'].abs()\n\n# Calculate yearly revenue\nyearly_revenue = revenue_data.groupby('Year')['Amount'].sum()\n\n# Create chart\nplt.figure(figsize=(10, 6))\nyearly_revenue.plot(kind='bar')\nplt.title('Revenue by Year')\nplt.ylabel('Amount ($)')\nplt.show()\n\nprint(f'Total revenue: ${yearly_revenue.sum():,.0f}')\n```";
  }
  
  if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('year over year')) {
    return "To analyze budget trends over time, you can compare the same programs across different years (2019-2024).\n\nHere's a Python script for trend analysis:\n\n```python\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Load data\ndf = pd.read_csv('toronto_budget_combined_2024_to_2019.csv')\ndf['Amount'] = pd.to_numeric(df['Amount'].str.replace(',', ''), errors='coerce')\n\n# Separate expenses and revenues\nexpenses = df[df['Amount'] > 0]\nrevenues = df[df['Amount'] < 0]\n\n# Calculate yearly trends\nyearly_expenses = expenses.groupby('Year')['Amount'].sum()\nyearly_revenues = revenues.groupby('Year')['Amount'].apply(lambda x: x.abs().sum())\n\n# Create chart\nplt.figure(figsize=(12, 6))\nplt.plot(yearly_expenses.index, yearly_expenses.values, marker='o', label='Expenses')\nplt.plot(yearly_revenues.index, yearly_revenues.values, marker='s', label='Revenues')\nplt.title('Budget Trends: Expenses vs Revenues')\nplt.ylabel('Amount ($)')\nplt.legend()\nplt.show()\n\n# Calculate growth rates\ngrowth_rates = yearly_expenses.pct_change() * 100\nprint('Year-over-year growth rates:')\nfor year, rate in growth_rates.items():\n    if not pd.isna(rate):\n        print(f'{year}: {rate:.1f}%')\n```";
  }
  
  if (lowerQuery.includes('department') || lowerQuery.includes('program')) {
    return "The budget data is organized by Programs (departments), Services, and Activities.\n\nHere's a Python script to analyze departments:\n\n```python\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Load data\ndf = pd.read_csv('toronto_budget_combined_2024_to_2019.csv')\ndf['Amount'] = pd.to_numeric(df['Amount'].str.replace(',', ''), errors='coerce')\n\n# Filter for expenses only\nexpenses = df[df['Amount'] > 0]\n\n# Analyze programs\nprogram_totals = expenses.groupby('Program')['Amount'].sum().sort_values(ascending=False)\n\n# Create chart for top 15 programs\nplt.figure(figsize=(12, 8))\ntop_15 = program_totals.head(15)\nplt.barh(range(len(top_15)), top_15.values)\nplt.yticks(range(len(top_15)), [p[:40] for p in top_15.index])\nplt.title('Top 15 Programs by Total Budget (2019-2024)')\nplt.xlabel('Total Budget ($)')\nplt.show()\n\nprint('Top 10 Programs:')\nfor i, (program, amount) in enumerate(program_totals.head(10).items(), 1):\n    print(f'{i:2d}. {program[:50]}: ${amount:,.0f}')\n```";
  }
  
  return "I can help you analyze Toronto's budget data from 2019-2024.\n\nHere's a Python script to get started:\n\n```python\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Load the data\ndf = pd.read_csv('toronto_budget_combined_2024_to_2019.csv')\n\n# Basic info\nprint(f'Total rows: {len(df):,}')\nprint(f'Years: {sorted(df[\"Year\"].unique())}')\nprint(f'Programs: {df[\"Program\"].nunique()}')\n\n# Convert amounts\ndf['Amount'] = pd.to_numeric(df['Amount'].str.replace(',', ''), errors='coerce')\n\n# Yearly budget trend\nyearly_totals = df.groupby('Year')['Amount'].apply(lambda x: x.abs().sum())\n\nplt.figure(figsize=(10, 6))\nyearly_totals.plot(kind='line', marker='o')\nplt.title('Total Budget Trend')\nplt.ylabel('Amount ($)')\nplt.show()\n\nprint('Ask me about: total budget, police spending, revenue, trends, or departments')\n```";
}

export async function POST(req: Request) {
  const { messages }: { messages: ChatMessage[] } = await req.json();
  
  // Get the latest user message
  const latestMessage = messages[messages.length - 1];
  
  // Generate a session ID
  const sessionId = `toronto-budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Try to call the Toronto MCP endpoint
    const response = await fetch('https://toronto-mcp.s-a62.workers.dev/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Mcp-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "query",
        params: {
          query: latestMessage.content,
          context: messages.slice(0, -1).map((msg: ChatMessage) => ({
            role: msg.role,
            content: msg.content
          }))
        },
        id: 1
      })
    });

    let responseText = '';
    
    if (response.ok) {
      const data = await response.json();
      
      // Extract the response from JSON-RPC format
      if (data.result && !data.error) {
        responseText = data.result.response || data.result.message || data.result.content || JSON.stringify(data.result);
      } else {
        // MCP failed, use fallback
        responseText = generateBudgetResponse(latestMessage.content);
      }
    } else {
      // MCP endpoint not available, use fallback
      responseText = generateBudgetResponse(latestMessage.content);
    }
    
    // Create a ReadableStream to match the expected streaming format
    const stream = new ReadableStream({
      start(controller) {
        // Send the response as a chunk
        const chunk = `0:"${responseText.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
        controller.enqueue(new TextEncoder().encode(chunk));
        
        // End the stream
        controller.enqueue(new TextEncoder().encode('d\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('MCP API error:', error);
    
    // Use fallback response
    const fallbackResponse = generateBudgetResponse(latestMessage.content);
    
    const stream = new ReadableStream({
      start(controller) {
        const chunk = `0:"${fallbackResponse.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
        controller.enqueue(new TextEncoder().encode(chunk));
        controller.enqueue(new TextEncoder().encode('d\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    });
  }
} 