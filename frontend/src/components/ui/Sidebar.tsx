"use client";

import { useState } from 'react';
import { Home, Database, Table, Menu, X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ currentPage, onPageChange, onCollapseChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false); // Mobile menu state
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse state

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      description: 'Main dashboard and AI analysis'
    },
    {
      id: 'dispensations',
      label: 'Data Dispensations',
      icon: Database,
      description: 'Budget allocations and distributions'
    },
    {
      id: 'viewer',
      label: 'Data Viewer',
      icon: Table,
      description: 'Browse raw budget data'
    },
    {
      id: 'how-it-works',
      label: 'How It Works',
      icon: Lightbulb,
      description: 'Technical architecture overview'
    }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:bg-white/90 transition-all"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop collapse toggle */}
      <button
        onClick={handleToggleCollapse}
        className={cn(
          "hidden md:flex fixed top-4 z-50 p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white/30 transition-all duration-300",
          isCollapsed ? "left-20" : "left-60"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-xl z-40 transition-all duration-300 ease-in-out",
        // Mobile responsive
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Desktop width based on collapsed state
        isCollapsed ? "md:w-20" : "md:w-64",
        // Mobile always full width when open
        "w-64"
      )}>
        {/* Header */}
        <div className={cn(
          "p-6 border-b border-white/20",
          isCollapsed && "md:p-4"
        )}>
          <div className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed ? "md:justify-center md:space-x-0" : "space-x-3"
          )}>
            <div className="w-10 h-10 relative bg-white/90 rounded-full shadow-md border border-white/30 overflow-hidden flex-shrink-0">
              <Image
                src="/dollarsense.png"
                alt="DollarSense"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
            <div className={cn(
              "transition-all duration-300 overflow-hidden",
              isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
            )}>
              <h1 className="text-lg font-semibold text-gray-800 whitespace-nowrap">DollarSense</h1>
              <p className="text-xs text-gray-600 whitespace-nowrap">Toronto Budget Explorer</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "p-4 space-y-2",
          isCollapsed && "md:p-2"
        )}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left rounded-lg transition-all duration-300 group relative",
                  isCollapsed ? "md:p-3 md:flex md:justify-center" : "p-3",
                  isActive 
                    ? "bg-white/20 text-gray-800 border border-white/30 shadow-sm" 
                    : "hover:bg-white/10 text-gray-700 hover:text-gray-900"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={cn(
                  "flex items-center transition-all duration-300",
                  isCollapsed ? "md:justify-center md:space-x-0" : "space-x-3"
                )}>
                  <IconComponent className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-gray-700" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  <div className={cn(
                    "transition-all duration-300 overflow-hidden",
                    isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
                  )}>
                    <div className="font-medium whitespace-nowrap">{item.label}</div>
                    <div className={cn(
                      "text-xs whitespace-nowrap",
                      isActive ? "text-gray-600" : "text-gray-500"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </div>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="hidden md:block absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 border-t border-white/20",
          isCollapsed && "md:p-2"
        )}>
          <div className={cn(
            "text-xs text-gray-600 text-center transition-all duration-300 overflow-hidden",
            isCollapsed ? "md:opacity-0" : "opacity-100"
          )}>
            <p>Toronto Open Data Hackathon</p>
            <p className="mt-1">Budget Transparency Tool</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
} 