"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Copy,
  Code,
  Database,
  Search,
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Eye,
  Table,
} from "lucide-react";
import ChartVisualization from "./ChartVisualization";

interface BudgetRecord {
  [key: string]: string | number;
}

interface AIAnalysisProps {
  data: BudgetRecord[];
  query: string;
}

interface QueryEvidence {
  sql: string;
  data: BudgetRecord[];
  confidence: number;
  queryType: string;
  totalRows: number;
  dataSource?: string;
  dataRange?: string;
  lastUpdated?: string;
  totalRecords?: number;
  shouldVisualize?: boolean;
  chartType?: "line" | "bar" | "pie" | "area" | "comparison";
  chartConfig?: {
    xField: string;
    yField: string;
    groupField?: string;
    title?: string;
  };
}

// Loading steps with icons and messages
const LOADING_STEPS = [
  { icon: Search, message: "Analyzing your question...", duration: 1000 },
  { icon: Database, message: "Searching budget database...", duration: 1500 },
  { icon: Brain, message: "Understanding data patterns...", duration: 1200 },
  { icon: Zap, message: "Preparing response...", duration: 800 },
];

// Component to render code blocks with copy functionality
function CodeBlock({
  code,
  language = "sql",
}: {
  code: string;
  language?: string;
}) {
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
          <span className="text-sm text-green-400 font-medium">
            {language.toUpperCase()} Query
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="text-green-300 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Function to render message content with code block detection and bold text
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/```(\w+)?\n([\s\S]*?)\n```/);

  return (
    <div>
      {parts.map((part, index) => {
        if (index % 3 === 0) {
          // Regular text - process bold markdown
          if (!part) return null;

          // Split by bold patterns and render
          const boldParts = part.split(/(\*\*[^*]+\*\*)/);

          return (
            <div key={index} className="whitespace-pre-wrap">
              {boldParts.map((boldPart, boldIndex) => {
                if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
                  // Bold text
                  return (
                    <strong key={boldIndex} className="font-semibold">
                      {boldPart.slice(2, -2)}
                    </strong>
                  );
                } else {
                  // Regular text
                  return boldPart;
                }
              })}
            </div>
          );
        } else if (index % 3 === 2) {
          // Code block content
          const language = parts[index - 1] || "sql";
          return <CodeBlock key={index} code={part} language={language} />;
        }
        // Skip language indicators (index % 3 === 1)
        return null;
      })}
    </div>
  );
}

// Loading component with animated steps
function LoadingSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-blue-600" />
      </div>
      <div className="bg-gray-50 px-4 py-3 rounded-lg">
        {LOADING_STEPS.map((step, index) => {
          const IconComponent = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div
              key={index}
              className={`flex items-center space-x-2 transition-all duration-300 ${
                index > 0 ? "mt-2" : ""
              } ${
                isActive
                  ? "text-blue-600"
                  : isCompleted
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {isActive ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCompleted ? (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              ) : (
                <IconComponent className="w-4 h-4" />
              )}
              <span className={`text-sm ${isActive ? "font-medium" : ""}`}>
                {step.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Component to render evidence section
function EvidenceSection({ evidence }: { evidence: QueryEvidence }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedData, setCopiedData] = useState(false);
  const [dataViewMode, setDataViewMode] = useState<"table" | "json">("table");

  const copyToClipboard = async (text: string, type: "sql" | "data") => {
    await navigator.clipboard.writeText(text);
    if (type === "sql") {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedData(true);
      setTimeout(() => setCopiedData(false), 2000);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
      >
        <Eye className="w-4 h-4" />
        <span>Show Evidence</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* SQL Query */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  Generated SQL Query
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Confidence: {Math.round(evidence.confidence * 100)}%
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(evidence.sql, "sql")}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedSql ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <pre className="text-xs bg-gray-900 text-green-300 p-3 rounded-lg overflow-x-auto">
              <code>{evidence.sql}</code>
            </pre>
          </div>

          {/* Data Display */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Query Results ({evidence.totalRows} records)
                </span>
                <div className="flex bg-gray-100 rounded text-xs overflow-hidden">
                  <button
                    onClick={() => setDataViewMode("table")}
                    className={`px-2 py-1 flex items-center space-x-1 transition-colors ${
                      dataViewMode === "table"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <Table className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                  <button
                    onClick={() => setDataViewMode("json")}
                    className={`px-2 py-1 flex items-center space-x-1 transition-colors ${
                      dataViewMode === "json"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(evidence.data, null, 2),
                    "data"
                  )
                }
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedData ? "Copied!" : "Copy JSON"}</span>
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg max-h-60 overflow-auto">
              {dataViewMode === "table" ? (
                <DataTable data={evidence.data} maxRows={20} />
              ) : (
                <pre className="text-xs text-gray-700">
                  <code>
                    {JSON.stringify(evidence.data.slice(0, 5), null, 2)}
                    {evidence.data.length > 5 &&
                      `\n... and ${evidence.data.length - 5} more records`}
                  </code>
                </pre>
              )}
            </div>
          </div>

          {/* Query Metadata */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-800 space-y-1">
              <div>
                <strong>Query Type:</strong> {evidence.queryType}
              </div>
              <div>
                <strong>Total Records:</strong>{" "}
                {evidence.totalRows.toLocaleString()}
              </div>
              <div>
                <strong>Confidence Score:</strong>{" "}
                {Math.round(evidence.confidence * 100)}%
              </div>
              {evidence.dataSource && (
                <div>
                  <strong>Data Source:</strong> {evidence.dataSource}
                </div>
              )}
              {evidence.dataRange && (
                <div>
                  <strong>Data Period:</strong> {evidence.dataRange}
                </div>
              )}
              {evidence.totalRecords && (
                <div>
                  <strong>Dataset Size:</strong>{" "}
                  {evidence.totalRecords.toLocaleString()} total records
                </div>
              )}
              {evidence.lastUpdated && (
                <div>
                  <strong>Last Updated:</strong> {evidence.lastUpdated}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to render data in table format
function DataTable({
  data,
  maxRows = 10,
}: {
  data: BudgetRecord[];
  maxRows?: number;
}) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm">No data to display</div>;
  }

  const columns = Object.keys(data[0]);
  const displayData = data.slice(0, maxRows);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((column) => (
              <th
                key={column}
                className="px-2 py-1 text-left font-medium text-gray-700 border-b"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, index) => (
            <tr
              key={index}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              {columns.map((column) => (
                <td key={column} className="px-2 py-1 text-gray-600 border-b">
                  {typeof row[column] === "number"
                    ? row[column].toLocaleString()
                    : String(row[column] || "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          Showing {maxRows} of {data.length.toLocaleString()} rows
        </div>
      )}
    </div>
  );
}

export default function AIAnalysis({ query }: AIAnalysisProps) {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: string;
      content: string;
      evidence?: QueryEvidence;
    }>
  >(() => {
    if (query) {
      return [{ id: "1", role: "user", content: query }];
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const initialQueryExecuted = useRef(false);

  const advanceLoadingStep = useCallback(() => {
    setLoadingStep((prev) => {
      if (prev < LOADING_STEPS.length - 1) {
        setTimeout(
          () => advanceLoadingStep(),
          LOADING_STEPS[prev + 1]?.duration || 1000
        );
        return prev + 1;
      }
      return prev;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLoadingStep(0);

    // Start loading animation
    setTimeout(() => advanceLoadingStep(), LOADING_STEPS[0].duration);

    try {
      // First try the query API directly to get evidence
      let queryEvidence: QueryEvidence | null = null;
      try {
        const queryResponse = await fetch("/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: input.trim() }),
        });

        if (queryResponse.ok) {
          const queryData = await queryResponse.json();
          if (queryData.success) {
            queryEvidence = {
              sql: queryData.query.sql,
              data: queryData.data,
              confidence: queryData.query.confidence,
              queryType: queryData.query.type,
              totalRows: queryData.metadata.totalRows,
              dataSource: queryData.metadata.dataSource,
              dataRange: queryData.metadata.dataRange,
              lastUpdated: queryData.metadata.lastUpdated,
              totalRecords: queryData.metadata.totalRecords,
              shouldVisualize: queryData.visualization?.shouldVisualize,
              chartType: queryData.visualization?.chartType,
              chartConfig: queryData.visualization?.chartConfig,
            };
          }
        }
      } catch (error) {
        console.warn("Direct query failed:", error);
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      let assistantContent = "";
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        evidence: queryEvidence || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith('0:"')) {
            // Extract the content from the streaming format
            const match = line.match(/^0:"(.*)"/);
            if (match) {
              const content = match[1]
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"');
              assistantContent = content; // Use the full content, not append

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I encountered an error while processing your question. Please try again or rephrase your question.

I can help you analyze Toronto&apos;s budget data with questions like:
- "What was Toronto&apos;s total budget in 2024?"
- "How much did Toronto spend on police services?"
- "Show me the trend in fire department spending over the years"
- "What are the top 5 programs by spending?"
- "How much revenue did Toronto collect last year?"

Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  // Handle initial query
  useEffect(() => {
    if (
      query &&
      messages.length === 1 &&
      messages[0].role === "user" &&
      !initialQueryExecuted.current
    ) {
      initialQueryExecuted.current = true;

      // Simulate form submission for initial query
      const submitInitialQuery = async () => {
        setIsLoading(true);
        setLoadingStep(0);

        // Start loading animation
        setTimeout(() => advanceLoadingStep(), LOADING_STEPS[0].duration);

        try {
          const userMessage = messages[0];

          // First try the query API directly to get evidence
          let queryEvidence: QueryEvidence | null = null;
          try {
            const queryResponse = await fetch("/api/query", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ question: userMessage.content }),
            });

            if (queryResponse.ok) {
              const queryData = await queryResponse.json();
              if (queryData.success) {
                queryEvidence = {
                  sql: queryData.query.sql,
                  data: queryData.data,
                  confidence: queryData.query.confidence,
                  queryType: queryData.query.type,
                  totalRows: queryData.metadata.totalRows,
                  dataSource: queryData.metadata.dataSource,
                  dataRange: queryData.metadata.dataRange,
                  lastUpdated: queryData.metadata.lastUpdated,
                  totalRecords: queryData.metadata.totalRecords,
                  shouldVisualize: queryData.visualization?.shouldVisualize,
                  chartType: queryData.visualization?.chartType,
                  chartConfig: queryData.visualization?.chartConfig,
                };
              }
            }
          } catch (error) {
            console.warn("Direct query failed:", error);
          }

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [
                { role: userMessage.role, content: userMessage.content },
              ],
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Handle streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response stream available");
          }

          let assistantContent = "";
          const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "",
            evidence: queryEvidence || undefined,
          };

          setMessages((prev) => [...prev, assistantMessage]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith('0:"')) {
                // Extract the content from the streaming format
                const match = line.match(/^0:"(.*)"/);
                if (match) {
                  const content = match[1]
                    .replace(/\\n/g, "\n")
                    .replace(/\\"/g, '"');
                  assistantContent = content; // Use the full content, not append

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error("Initial query error:", error);
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I encountered an error while analyzing your query. Please try again or rephrase your question.

I can help you analyze Toronto&apos;s budget data with questions like:
- "What was Toronto&apos;s total budget in 2024?"
- "How much did Toronto spend on police services?"  
- "Show me the trend in fire department spending over the years"
- "What are the top 5 programs by spending?"
- "How much revenue did Toronto collect last year?"

Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
          setMessages((prev) => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
          setLoadingStep(0);
        }
      };

      submitInitialQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, advanceLoadingStep]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <Bot className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Toronto Budget AI Analyst
        </h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center space-x-1">
          <Database className="w-3 h-3" />
          <span>AI-Powered SQL Analysis</span>
        </span>
      </div>

      {/* Chat Messages */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Ask me anything about Toronto&apos;s budget data!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}

            <div
              className={`max-w-3xl px-4 py-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-gray-50 text-gray-900"
              }`}
            >
              <MessageContent content={message.content} />
              {message.role === "assistant" &&
                message.evidence?.shouldVisualize &&
                message.evidence.chartType &&
                message.evidence.chartConfig && (
                  <div className="mt-4">
                    <ChartVisualization
                      data={message.evidence.data}
                      chartType={message.evidence.chartType}
                      config={message.evidence.chartConfig}
                    />
                  </div>
                )}
              {message.role === "assistant" && message.evidence && (
                <EvidenceSection evidence={message.evidence} />
              )}
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && <LoadingSteps currentStep={loadingStep} />}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
