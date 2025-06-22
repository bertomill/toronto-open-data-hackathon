"use client";

import { useState } from 'react';
import { 
  Brain, 
  Database, 
  ArrowRight, 
  Code, 
  Zap, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function HowItWorks() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const architectureSteps = [
    {
      id: 'user-input',
      title: 'User Input',
      icon: MessageSquare,
      description: 'User asks a question about Toronto\'s budget',
      color: 'bg-blue-500',
      details: [
        'User types a natural language question',
        'Input is validated and sanitized',
        'Question is sent to the query processing API'
      ]
    },
    {
      id: 'llm-processing',
      title: 'LLM Analysis',
      icon: Brain,
      description: 'AI analyzes the question and generates SQL',
      color: 'bg-purple-500',
      details: [
        'OpenAI GPT-4 processes the natural language query',
        'AI understands budget context and data structure',
        'Generates appropriate SQL query for the CSV data',
        'Includes confidence scoring for query relevance'
      ]
    },
    {
      id: 'data-query',
      title: 'Data Query',
      icon: Database,
      description: 'SQL query executes against budget dataset',
      color: 'bg-green-500',
      details: [
        'Generated SQL runs against Toronto budget CSV data',
        'Data is filtered, aggregated, and processed',
        'Results are validated and formatted',
        'Error handling for invalid or complex queries'
      ]
    },
    {
      id: 'response-generation',
      title: 'Response Generation',
      icon: Zap,
      description: 'AI formats results into human-readable answer',
      color: 'bg-orange-500',
      details: [
        'LLM processes raw query results',
        'Generates natural language explanation',
        'Adds context and insights to the data',
        'Formats numbers and creates visualizations'
      ]
    }
  ];

  const apiEndpoints = [
    {
      endpoint: '/api/query',
      method: 'POST',
      description: 'Main query processing endpoint',
      input: 'Natural language question about budget data',
      output: 'Structured response with data and explanations',
      codeExample: `{
  "query": "How much did Toronto spend on police in 2024?",
  "confidence": 0.8,
  "sql": "SELECT SUM(Amount) FROM budget WHERE Program LIKE '%Police%' AND Year = '2024'",
  "results": [...],
  "explanation": "Toronto spent $1.2B on police services in 2024..."
}`
    },
    {
      endpoint: '/api/chat',
      method: 'POST',
      description: 'Conversational interface endpoint',
      input: 'Chat message with conversation context',
      output: 'Contextual response maintaining conversation flow',
      codeExample: `{
  "message": "What about fire services?",
  "context": [...],
  "response": "Fire services had a budget of $650M in 2024..."
}`
    }
  ];

  const dataFlow = [
    {
      step: 1,
      title: 'Data Loading',
      description: 'CSV file is loaded and parsed using Papa Parse library',
      tech: 'React + Papa Parse',
      code: `Papa.parse(csvText, {
  header: true,
  complete: (results) => {
    setData(results.data);
  }
});`
    },
    {
      step: 2,
      title: 'Query Processing',
      description: 'Natural language is converted to SQL using OpenAI',
      tech: 'OpenAI GPT-4 + Prompt Engineering',
      code: `const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system", 
      content: "You are a SQL expert for Toronto budget data..."
    },
    {
      role: "user",
      content: userQuery
    }
  ]
});`
    },
    {
      step: 3,
      title: 'Data Execution',
      description: 'SQL query runs against in-memory dataset',
      tech: 'JavaScript Array Methods',
      code: `const results = data.filter(row => {
  // SQL WHERE conditions
  return row.Program.includes('Police') && 
         row.Year === '2024';
}).reduce((sum, row) => {
  // SQL aggregation
  return sum + parseFloat(row.Amount);
}, 0);`
    },
    {
      step: 4,
      title: 'Response Generation',
      description: 'Results are formatted into natural language',
      tech: 'OpenAI + Template Processing',
      code: `const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "Format this data into a clear answer..."
    },
    {
      role: "user", 
      content: \`Query: \${query}\\nResults: \${JSON.stringify(results)}\`
    }
  ]
});`
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">How It Works</h1>
        <p className="text-gray-600">
          Understand the technical architecture behind DollarSense and how AI processes your budget queries
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Architecture Overview' },
              { id: 'api', label: 'API Endpoints' },
              { id: 'dataflow', label: 'Data Flow' },
              { id: 'technical', label: 'Technical Details' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Architecture Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Process Flow */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-6 text-black">Process Flow</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {architectureSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.id} className="relative">
                    <div className="text-center">
                      <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-sm text-gray-600 mb-4">{step.description}</p>
                      
                      <button
                        onClick={() => toggleSection(step.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mx-auto"
                      >
                        View Details
                        {expandedSection === step.id ? (
                          <ChevronUp className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    </div>

                    {/* Arrow to next step */}
                    {index < architectureSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 -right-3 z-10">
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* Expanded Details */}
                    {expandedSection === step.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Technologies */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-6 text-black">Key Technologies</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Brain className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">OpenAI GPT-4</h4>
                <p className="text-sm text-gray-600">
                  Powers natural language understanding and SQL generation
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Code className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Next.js + React</h4>
                <p className="text-sm text-gray-600">
                  Frontend framework with server-side API routes
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Database className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">CSV Processing</h4>
                <p className="text-sm text-gray-600">
                  In-memory data processing with Papa Parse
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Endpoints Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {apiEndpoints.map((api, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono mr-3">
                  {api.method}
                </span>
                <code className="text-lg font-mono text-gray-900">{api.endpoint}</code>
              </div>
              <p className="text-gray-600 mb-4">{api.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Input</h4>
                  <p className="text-sm text-gray-600">{api.input}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Output</h4>
                  <p className="text-sm text-gray-600">{api.output}</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Example Response</h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{api.codeExample}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Flow Tab */}
      {activeTab === 'dataflow' && (
        <div className="space-y-6">
          {dataFlow.map((flow, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start mb-4">
                <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                  {flow.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{flow.title}</h3>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {flow.tech}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{flow.description}</p>
                  
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
                      <code>{flow.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Technical Details Tab */}
      {activeTab === 'technical' && (
        <div className="space-y-6">
          {/* System Requirements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4">System Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Frontend</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Next.js 15.3.4+</li>
                  <li>• React 18+</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Framer Motion</li>
                  <li>• Papa Parse</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Backend</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Node.js 18+</li>
                  <li>• OpenAI API</li>
                  <li>• Next.js API Routes</li>
                  <li>• CSV Data Processing</li>
                  <li>• Vercel AI SDK</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Performance Considerations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4">Performance Considerations</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Data Loading</h4>
                  <p className="text-sm text-gray-600">
                    CSV data (~165KB) is loaded once on page load and kept in memory for fast querying
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">API Rate Limits</h4>
                  <p className="text-sm text-gray-600">
                    OpenAI API calls are optimized with confidence scoring to reduce unnecessary requests
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Caching Strategy</h4>
                  <p className="text-sm text-gray-600">
                    Query results could be cached client-side for repeated questions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Measures */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4">Security Measures</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Input Sanitization</h4>
                  <p className="text-sm text-gray-600">
                    All user inputs are validated and sanitized before processing
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">API Key Protection</h4>
                  <p className="text-sm text-gray-600">
                    OpenAI API keys are stored securely in environment variables
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">SQL Injection Prevention</h4>
                  <p className="text-sm text-gray-600">
                    Generated queries are validated against a whitelist of allowed operations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 