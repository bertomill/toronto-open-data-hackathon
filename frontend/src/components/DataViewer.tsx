"use client";

import { useState, useMemo } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface BudgetData {
  Program: string;
  Service: string;
  Activity: string;
  "Expense/Revenue": string;
  "Category Name": string;
  "Sub-Category Name": string;
  "Commitment item": string;
  Amount: string;
  Year: string;
  [key: string]: string;
}

interface DataViewerProps {
  data: BudgetData[];
}

export default function DataViewer({ data }: DataViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedProgram, setSelectedProgram] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(data.map((d) => d.Year))].sort().reverse();
    return ["All", ...uniqueYears];
  }, [data]);

  const programs = useMemo(() => {
    const uniquePrograms = [...new Set(data.map((d) => d.Program))].sort();
    return ["All", ...uniquePrograms.slice(0, 20)]; // Limit to first 20 for performance
  }, [data]);

  const types = useMemo(() => {
    return ["All", "Expense", "Revenue"];
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch =
        searchTerm === "" ||
        Object.values(row).some((value) =>
          value?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesYear = selectedYear === "All" || row.Year === selectedYear;
      const matchesProgram =
        selectedProgram === "All" || row.Program === selectedProgram;

      const amount = parseFloat(row.Amount?.replace(/,/g, "") || "0");
      const isRevenue = row["Expense/Revenue"] === "Revenues" || amount < 0;
      const isExpense = row["Expense/Revenue"] === "Expenses" || amount >= 0;

      const matchesType =
        selectedType === "All" ||
        (selectedType === "Expense" && isExpense) ||
        (selectedType === "Revenue" && isRevenue);

      return matchesSearch && matchesYear && matchesProgram && matchesType;
    });
  }, [data, searchTerm, selectedYear, selectedProgram, selectedType]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value?.replace(/,/g, "") || "0");
    if (num === 0) return "$0";

    if (Math.abs(num) >= 1e6) {
      return `$${(num / 1e6).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1e3) {
      return `$${(num / 1e3).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  const exportData = () => {
    const csvContent = [
      Object.keys(filteredData[0] || {}),
      ...filteredData.map((row) => Object.values(row)),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "toronto_budget_data.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Data Viewer
            </h1>
            <p className="text-gray-600">
              Browse and explore Toronto&apos;s raw budget data
            </p>
          </div>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search all fields..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Program Filter */}
          <select
            value={selectedProgram}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            {programs.map((program) => (
              <option key={program} value={program}>
                {program === "All" ? "All Programs" : program}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All Types" : type}
              </option>
            ))}
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
          {filteredData.length.toLocaleString()} results
        </div>

        {/* Pagination */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>

          <span className="px-3 py-1 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commitment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => {
                const amount = parseFloat(row.Amount?.replace(/,/g, "") || "0");
                const isRevenue =
                  row["Expense/Revenue"] === "Revenues" || amount < 0;
                const type = isRevenue ? "Revenue" : "Expense";

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {row.Year}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                      title={row.Program}
                    >
                      {row.Program}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                      title={row.Service}
                    >
                      {row.Service}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                      title={row["Category Name"]}
                    >
                      {row["Category Name"]}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span
                        className={
                          isRevenue ? "text-green-600" : "text-red-600"
                        }
                      >
                        {formatCurrency(row.Amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          isRevenue
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {type}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                      title={row["Commitment item"]}
                    >
                      {row["Commitment item"]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Pagination */}
      <div className="flex items-center justify-center mt-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center space-x-1 px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-600"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="flex items-center space-x-1 px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-600"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
