"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Search } from "lucide-react";

interface SearchInputProps {
  onQuerySubmit: (query: string) => void;
  placeholder?: string;
}

const autocompleteSuggestions = [
  "How much did Toronto spend on police in 2024?",
  "How much did Toronto spend on fire services in 2024?",
  "How much did Toronto spend on transit in 2024?",
  "How much did Toronto spend on housing in 2024?",
  "How much did Toronto spend on parks in 2024?",
  "What are the top 5 most expensive programs in 2024?",
  "What are the top 5 most expensive programs in 2023?",
  "What are the top 3 revenue sources in 2024?",
  "What was Toronto's total revenue in 2024?",
  "What was Toronto's total revenue in 2023?",
  "What was Toronto's total expenses in 2024?",
  "How has the budget changed from 2019 to 2024?",
  "How has the budget changed from 2020 to 2024?",
  "Compare police budget 2024 vs 2023",
  "Compare fire budget 2024 vs 2023",
  "Compare transit budget 2024 vs 2023",
  "Show me Toronto's budget surplus or deficit in 2024",
  "Show me Toronto's budget surplus or deficit in 2023",
  "Which programs had the biggest increases in 2024?",
  "Which programs had the biggest decreases in 2024?",
];

export default function SearchInput({
  onQuerySubmit,
  placeholder = "Ask me anything about Toronto's budget...",
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions =
    inputValue.trim().length > 2
      ? autocompleteSuggestions
          .filter((suggestion) =>
            suggestion.toLowerCase().includes(inputValue.toLowerCase())
          )
          .slice(0, 5)
      : [];

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSuggestions(value.trim().length > 2);
    setSelectedSuggestionIndex(-1);
  };

  const handleSubmit = (query: string) => {
    onQuerySubmit(query);
    setInputValue("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === "Enter" && inputValue.trim()) {
        handleSubmit(inputValue);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSubmit(filteredSuggestions[selectedSuggestionIndex]);
        } else if (inputValue.trim()) {
          handleSubmit(inputValue);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="flex items-center space-x-4 px-6 py-4 border border-gray-200 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
        <MessageCircle className="w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
        />
        <button
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => {
            if (inputValue.trim()) {
              handleSubmit(inputValue);
            }
          }}
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg backdrop-blur-sm z-50 max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-6 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl ${
                index === selectedSuggestionIndex ? "bg-blue-50" : ""
              }`}
            >
              <span className="text-gray-700 text-sm">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
