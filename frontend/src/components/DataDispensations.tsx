"use client";

import { useState, useMemo } from 'react';
import { PieChart, BarChart3, TrendingUp, DollarSign, Building, Calendar } from 'lucide-react';

interface BudgetData {
  Program: string;
  Service: string;
  Activity: string;
  'Expense/Revenue': string;
  'Category Name': string;
  'Sub-Category Name': string;
  'Commitment item': string;
  Amount: string;
  Year: string;
  [key: string]: string;
}

interface DataDispensationsProps {
  data: BudgetData[];
}

export default function DataDispensations({ data }: DataDispensationsProps) {
  const [selectedYear, setSelectedYear] = useState('2024');

  const years = useMemo(() => {
    const uniqueYears = [...new Set(data.map(d => d.Year))].sort().reverse();
    return uniqueYears;
  }, [data]);

  const yearData = useMemo(() => {
    return data.filter(d => d.Year === selectedYear);
  }, [data, selectedYear]);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const programSummary = useMemo(() => {
    const programTotals = new Map<string, number>();
    
    yearData.forEach(row => {
      const amount = parseFloat(row.Amount?.replace(/,/g, '') || '0');
      const program = row.Program || 'Unknown';
      
      if (amount > 0) { // Only expenses
        programTotals.set(program, (programTotals.get(program) || 0) + amount);
      }
    });

    return Array.from(programTotals.entries())
      .map(([program, amount]) => ({ program, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [yearData]);

  const revenueVsExpenses = useMemo(() => {
    let totalRevenue = 0;
    let totalExpenses = 0;

    yearData.forEach(row => {
      const amountStr = row.Amount
      .replace(/[$,]/g, '')  // Remove $ and commas
      .replace(/\((.*)\)/, '-$1'); // Convert (100) to -100
    
    const amount = parseFloat(amountStr) || 0;
      
      if (row['Expense/Revenue'] === 'Revenues') {
        totalRevenue += Math.abs(amount); // Revenue can be positive or negative
      } else {
        totalExpenses += Math.abs(amount); // Expenses are always positive
      }
    });

    return { totalRevenue, totalExpenses };
  }, [yearData]);

  const categoryBreakdown = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    
    yearData.forEach(row => {
      const amount = parseFloat(row.Amount?.replace(/,/g, '') || '0');
      const category = row['Category Name'] || 'Unknown';
      
      if (amount > 0) {
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
      }
    });

    return Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [yearData]);

  console.log( formatCurrency(revenueVsExpenses.totalExpenses))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Dispensations</h1>
            <p className="text-gray-600">Budget allocations and distributions across Toronto&apos;s programs and services</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueVsExpenses.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueVsExpenses.totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Programs</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(yearData.map(d => d.Program)).size}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budget Year</p>
              <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Programs */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Top Programs by Spending</h3>
          </div>
          <div className="space-y-4">
            {programSummary.map((item) => (
              <div key={item.program} className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate pr-2">
                      {item.program}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(item.amount / programSummary[0].amount) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center mb-6">
            <PieChart className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
          </div>
          <div className="space-y-4">
            {categoryBreakdown.map((item, index) => {
              const colors = [
                'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
                'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500'
              ];
              return (
                <div key={item.category} className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]} mr-3`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 truncate pr-2">
                        {item.category}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget Balance */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Balance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(revenueVsExpenses.totalRevenue)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(revenueVsExpenses.totalExpenses)}
            </div>
            <div className="text-sm text-gray-600">Total Expenses</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              revenueVsExpenses.totalRevenue - revenueVsExpenses.totalExpenses >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formatCurrency(Math.abs(revenueVsExpenses.totalRevenue - revenueVsExpenses.totalExpenses))}
            </div>
            <div className="text-sm text-gray-600">
              {revenueVsExpenses.totalRevenue - revenueVsExpenses.totalExpenses >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 