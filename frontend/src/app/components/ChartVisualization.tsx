"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartVisualizationProps } from "@/types";

// Color palette for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
];

// Format large numbers for display
const formatNumber = (value: string | number): string => {
  const num = Number(value);
  if (isNaN(num)) return String(value);

  if (Math.abs(num) >= 1e9) {
    return `$${(num / 1e9).toFixed(1)}B`;
  } else if (Math.abs(num) >= 1e6) {
    return `$${(num / 1e6).toFixed(1)}M`;
  } else if (Math.abs(num) >= 1e3) {
    return `$${(num / 1e3).toFixed(1)}K`;
  }
  return `$${num.toLocaleString()}`;
};

// Custom tooltip for better formatting
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${formatNumber(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartVisualization({
  data,
  chartType,
  config,
}: ChartVisualizationProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No data available for visualization
      </div>
    );
  }

  // Prepare data for charts
  const chartData = data.map((item) => ({
    ...item,
    [config.yField]: Number(item[config.yField]) || 0,
  }));

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xField} className="text-sm" />
            <YAxis tickFormatter={formatNumber} className="text-sm" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={config.yField}
              stroke="#0088FE"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        );

      case "bar":
      case "comparison":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={config.xField}
              className="text-sm"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis tickFormatter={formatNumber} className="text-sm" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey={config.yField} fill="#0088FE" />
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(1)}%`
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey={config.yField}
              nameKey={config.xField}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Chart type not supported
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      {config.title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          {config.title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-500 text-center">
        Showing {data.length} data points
      </div>
    </div>
  );
}
