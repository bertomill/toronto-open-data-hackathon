"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  TrendingUp,
  DollarSign,
  BarChart3,
} from "lucide-react";

interface SearchInputProps {
  onQuerySubmit: (query: string) => void;
  placeholder?: string;
}

const autocompleteSuggestions = [
  {
    text: "How much did Toronto spend on police in 2024?",
    icon: DollarSign,
  },
  {
    text: "How much did Toronto spend on fire services in 2024?",
    icon: DollarSign,
  },
  {
    text: "What are the top 5 most expensive programs in 2024?",
    icon: BarChart3,
  },
  {
    text: "What are the top 3 revenue sources in 2024?",
    icon: TrendingUp,
  },
  {
    text: "How has the budget changed from 2019 to 2024?",
    icon: TrendingUp,
  },
  {
    text: "Compare police budget 2024 vs 2023",
    icon: BarChart3,
  },
  {
    text: "Show me Toronto's budget surplus or deficit in 2024",
    icon: DollarSign,
  },
  // Add more suggestions...
];

export default function SearchInput({
  onQuerySubmit,
  placeholder = "Ask me anything about Toronto's budget...",
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions =
    inputValue.trim().length > 2
      ? autocompleteSuggestions
          .filter((suggestion) =>
            suggestion.text.toLowerCase().includes(inputValue.toLowerCase())
          )
          .slice(0, 4)
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
    setIsFocused(false);
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
          handleSubmit(filteredSuggestions[selectedSuggestionIndex].text);
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
    <div className="relative max-w-3xl mx-auto">
      {/* Main Search Input */}
      <div
        className={`
        relative group transition-all duration-300 ease-out
        ${isFocused ? "scale-[1.02]" : "hover:scale-[1.01]"}
      `}
      >
        <div
          className={`
          flex items-center space-x-4 px-6 py-5 
          bg-gradient-to-r from-white via-white to-blue-50/30
          backdrop-blur-xl border-2 rounded-3xl shadow-lg
          transition-all duration-300 ease-out
          ${
            isFocused
              ? "border-blue-400/50 shadow-blue-200/50 shadow-xl bg-gradient-to-r from-white to-blue-50/50"
              : "border-gray-200/60 hover:border-blue-300/40 hover:shadow-xl"
          }
        `}
        >
          <div
            className={`
            p-2 rounded-xl transition-all duration-300
            ${
              isFocused
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 group-hover:text-blue-500"
            }
          `}
          >
            <Sparkles className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500 text-lg font-medium"
          />

          <button
            className={`
              p-3 rounded-xl transition-all duration-300 group/btn
              ${
                isFocused || inputValue.trim()
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105"
                  : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
              }
            `}
            onClick={() => {
              if (inputValue.trim()) {
                handleSubmit(inputValue);
              }
            }}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Enhanced Autocomplete Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200"
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 px-4 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
              Suggestions
            </div>
            {filteredSuggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              const isSelected = index === selectedSuggestionIndex;

              return (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={`
                    w-full text-left px-4 py-4 rounded-xl m-1 transition-all duration-200 group/suggestion
                    ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/50 shadow-md"
                        : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:border hover:border-gray-200/50"
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`
                      p-2 rounded-lg transition-all duration-200
                      ${
                        isSelected
                          ? "bg-blue-200/50 text-blue-600"
                          : "bg-gray-100 text-gray-500 group-hover/suggestion:bg-blue-100 group-hover/suggestion:text-blue-600"
                      }
                    `}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-700 text-sm font-medium leading-relaxed">
                        {suggestion.text}
                      </span>
                      <div
                        className={`
                        text-xs mt-1 px-2 py-1 rounded-full inline-block
                        ${
                          isSelected
                            ? "bg-blue-200/50 text-blue-700"
                            : "bg-gray-200/50 text-gray-600"
                        }
                      `}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
