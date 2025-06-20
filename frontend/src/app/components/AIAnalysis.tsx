'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User, Loader2, Copy, Code, Database } from 'lucide-react';

interface BudgetRecord {
  [key: string]: string | number;
}

interface AIAnalysisProps {
  data: BudgetRecord[];
  query: string;
}

// Component to render Python code blocks with copy functionality
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-900 rounded-lg p-4 my-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Python Script</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="text-green-300 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Function to render message content with code block detection
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/```python\n([\s\S]*?)\n```/);
  
  return (
    <div>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          // Regular text
          return part ? (
            <div key={index} className="whitespace-pre-wrap">
              {part}
            </div>
          ) : null;
        } else {
          // Python code block
          return <CodeBlock key={index} code={part} />;
        }
      })}
    </div>
  );
}

export default function AIAnalysis({ data, query }: AIAnalysisProps) {
  const [messages, setMessages] = useState<Array<{id: string, role: string, content: string}>>(() => {
    if (query) {
      return [{ id: '1', role: 'user', content: query }];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response || 'I apologize, but I couldn\'t generate a response for your query.'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error while analyzing your query. Please try again or rephrase your question.

The Toronto budget analysis system can help you with:
- Year-specific expense queries (e.g., "What were the 2023 expenses?")
- Department spending analysis (e.g., "Police budget trends")
- Utility cost trends (e.g., "Hydro costs over time")
- Revenue analysis and comparisons

Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle initial query
  useEffect(() => {
    if (query && messages.length === 1 && messages[0].role === 'user') {
      // Simulate form submission for initial query
      const submitInitialQuery = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          const botMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.response || 'I apologize, but I couldn\'t generate a response for your query.'
          };

          setMessages(prev => [...prev, botMessage]);
        } catch (error) {
          console.error('Analysis error:', error);
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I encountered an error while analyzing your query. Please try again or rephrase your question.

The Toronto budget analysis system can help you with:
- Year-specific expense queries (e.g., "What were the 2023 expenses?")
- Department spending analysis (e.g., "Police budget trends")
- Utility cost trends (e.g., "Hydro costs over time")
- Revenue analysis and comparisons

Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      };
      
      submitInitialQuery();
    }
  }, [query, messages.length]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <Bot className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Toronto Budget AI Analyst</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center space-x-1">
          <Database className="w-3 h-3" />
          <span>Live Data Analysis</span>
        </span>
      </div>

      {/* Chat Messages */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Ask me anything about Toronto&apos;s budget data!</p>
            <p className="text-sm text-gray-400 mt-2">
              I&apos;ll analyze the live dataset and provide detailed insights with data-driven answers.
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`flex space-x-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <div className={`flex space-x-3 max-w-4xl ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className={`px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <MessageContent content={message.content} />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex space-x-3 justify-start">
            <div className="flex space-x-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-800">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing live budget data...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about budget trends, spending, or compare departments..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Dataset Context */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Live Analysis:</strong> Connected to Toronto budget dataset with {data.length.toLocaleString()} records from 2019-2024.
          <br />
          <strong>Powered by:</strong> Advanced data analysis engine with real-time query processing.
        </p>
      </div>
    </div>
  );
} 