"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { TrendingUp, BarChart3, Search, DollarSign } from "lucide-react";
import Image from "next/image";
import AIAnalysis from "../components/analysis/AIAnalysis";
import TorontoBudgetHero from "@/components/ui/TorontoBudgetHero";
import Sidebar from "@/components/ui/Sidebar";
import DataDispensations from "@/components/DataDispensations";
import DataViewer from "@/components/DataViewer";
import HowItWorks from "@/components/HowItWorks";
import { cn } from "@/lib/utils";
import { BudgetData } from "@/types";
import SearchInput from "@/components/analysis/SearchInput";

export default function Home() {
  const [data, setData] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [showHero, setShowHero] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetch("/toronto_budget_combined_2024_to_2019.csv");
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const budgetData = results.data as BudgetData[];
          setData(budgetData);
          processData(budgetData);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const processData = (budgetData: BudgetData[]) => {
    let total = 0;

    budgetData.forEach((row) => {
      const amountStr = row.Amount || "0";
      const amount = parseFloat(amountStr.replace(/,/g, "")) || 0;
      total += Math.abs(amount);
    });

    setTotalBudget(total);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const handleQuerySubmit = (query: string) => {
    setSelectedQuery(query);
    setShowAI(true);
    setShowHero(false);
  };

  const handleStartExploring = () => {
    // Just scroll to the search section, keep hero visible
    const searchSection = document.getElementById("search-section");
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setShowAI(false);
    setShowHero(page === "home");
  };

  const handleSidebarCollapseChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  const quickSuggestions = [
    "How has the budget changed from 2019 to 2024?",
    "What are the top 5 most expensive programs in 2024?",
    "How much did Toronto spend on Fire Services in 2024?",
    "What was Toronto's total revenue vs expenses in 2023?",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onCollapseChange={handleSidebarCollapseChange}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        {/* Home Page */}
        {currentPage === "home" && (
          <>
            {/* Show Hero Section */}
            {showHero && !showAI && (
              <div className="relative">
                <TorontoBudgetHero onStartExploring={handleStartExploring} />
              </div>
            )}

            {/* Main Content Section - Always show unless in AI mode */}
            {!showAI && (
              <div id="search-section">
                {/* Background Image for main content - only show when hero is not visible */}
                {!showHero && (
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: "url('/Toronto-cartoon.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}

                {/* Content Overlay */}
                <div className="relative z-10">
                  {/* Minimal Header - only show when hero is not visible */}
                  {!showHero && (
                    <header className="px-6 py-4 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-md border-b border-blue-400/30 shadow-sm">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 relative bg-white rounded-full shadow-md border border-blue-300/50 overflow-hidden">
                              <Image
                                src="/dollarsense.png"
                                alt="DollarSense"
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <span className="text-xl font-semibold text-white">
                              DollarSense
                            </span>
                          </div>
                          <div className="text-sm text-blue-200 font-medium bg-blue-800/30 px-3 py-1 rounded-full border border-blue-400/30">
                            Toronto Budget Explorer
                          </div>
                        </div>
                      </div>
                    </header>
                  )}

                  {/* Main Content */}
                  <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
                    {/* Logo and Welcome - only show when hero is not visible */}
                    {!showHero && (
                      <div className="text-center mb-16">
                        <div className="w-32 h-32 mx-auto mb-8 relative bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 overflow-hidden">
                          <Image
                            src="/dollarsense.png"
                            alt="DollarSense"
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-sm max-w-3xl mx-auto">
                          <h1 className="text-5xl font-normal text-gray-800 mb-6">
                            Hello there
                          </h1>
                          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
                            What would you like to know about Toronto&apos;s
                            budget? I can help you analyze spending patterns,
                            compare programs, or explore financial trends from
                            2019 to 2024.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Search Input with Autocomplete */}
                    <div className="mb-10" id="search-input">
                      <SearchInput
                        onQuerySubmit={handleQuerySubmit}
                        placeholder="Ask a question about Toronto's budget..."
                      />
                    </div>

                    {/* Enhanced Suggestions */}
                    <div className="mb-12">
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-full border border-gray-200/50">
                          <p className="text-gray-600 text-sm font-medium">
                            Or try asking...
                          </p>
                        </div>
                      </div>
                      <div className="max-w-2xl mx-auto space-y-4">
                        {quickSuggestions.map((suggestion, index) => {
                          // Assign different icons based on suggestion content
                          const getIcon = (text: string) => {
                            if (
                              text.includes("top") ||
                              text.includes("expensive")
                            )
                              return BarChart3;
                            if (text.includes("revenue") || text.includes("vs"))
                              return TrendingUp;
                            if (
                              text.includes("changed") ||
                              text.includes("2019")
                            )
                              return TrendingUp;
                            return DollarSign;
                          };

                          const IconComponent = getIcon(suggestion);

                          return (
                            <button
                              key={index}
                              onClick={() => handleQuerySubmit(suggestion)}
                              className="w-full group relative overflow-hidden bg-gradient-to-r from-white via-white to-blue-50/20 backdrop-blur-sm border border-gray-200/60 rounded-2xl hover:shadow-xl hover:border-blue-300/40 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              <div className="relative flex items-center space-x-4 px-6 py-5">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 group-hover:from-blue-100 group-hover:to-blue-200/50 transition-all duration-300">
                                  <IconComponent className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                                </div>

                                <div className="flex-1 text-left">
                                  <span className="text-gray-700 group-hover:text-gray-900 font-medium leading-relaxed transition-colors duration-300">
                                    {suggestion}
                                  </span>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                  <div className="p-2 rounded-lg bg-blue-100/50">
                                    <Search className="w-4 h-4 text-blue-600" />
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dataset Stats */}
                    <div className="bg-gray-50/90 backdrop-blur-sm rounded-3xl p-8 border border-gray-100">
                      <h3 className="text-lg font-medium text-gray-800 mb-6 text-center">
                        Dataset Overview
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-semibold text-gray-800 mb-1">
                            {formatCompactCurrency(totalBudget)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Budget
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-semibold text-gray-800 mb-1">
                            6
                          </div>
                          <div className="text-sm text-gray-600">Years</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-semibold text-gray-800 mb-1">
                            {data.length.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Records</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-semibold text-gray-800 mb-1">
                            {new Set(data.map((d) => d.Program)).size}
                          </div>
                          <div className="text-sm text-gray-600">Programs</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <footer className="text-center py-8 px-6">
                    <p className="text-sm text-gray-500">
                      DollarSense may display inaccurate info, including about
                      budget data, so double-check responses.{" "}
                      <span className="underline cursor-pointer hover:text-gray-700">
                        Privacy Notice
                      </span>
                    </p>
                  </footer>
                </div>
              </div>
            )}

            {/* AI Analysis Section - Only show when AI is active */}
            {showAI && (
              <div className="min-h-screen bg-white">
                {/* Background Image for AI content */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: "url('/Toronto-cartoon.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />

                {/* Content Overlay */}
                <div className="relative z-10">
                  {/* Header for AI mode */}
                  <header className="px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 relative bg-white rounded-full shadow-md border border-gray-200 overflow-hidden">
                            <Image
                              src="/dollarsense.png"
                              alt="DollarSense"
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <span className="text-xl font-semibold text-gray-800">
                            DollarSense
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 font-medium bg-gray-100/80 px-3 py-1 rounded-full">
                          Toronto Budget Explorer
                        </div>
                      </div>
                    </div>
                  </header>

                  {/* AI Analysis Content */}
                  <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <button
                          onClick={() => {
                            setShowAI(false);
                            setSelectedQuery("");
                            setShowHero(true);
                          }}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <span>←</span>
                          <span>Back to search</span>
                        </button>
                      </div>
                      <AIAnalysis data={data} query={selectedQuery} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Data Dispensations Page */}
        {currentPage === "dispensations" && <DataDispensations data={data} />}

        {/* Data Viewer Page */}
        {currentPage === "viewer" && <DataViewer data={data} />}

        {/* How It Works Page */}
        {currentPage === "how-it-works" && <HowItWorks />}
      </div>
    </div>
  );
}
