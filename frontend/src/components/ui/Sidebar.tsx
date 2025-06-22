"use client";

import { useState } from 'react';
import { Home, Database, Table, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-lg z-40 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
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
            <div>
              <h1 className="text-lg font-semibold text-gray-800">DollarSense</h1>
              <p className="text-xs text-gray-500">Toronto Budget Explorer</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
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
                  "w-full text-left p-3 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                )}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={cn(
                    "h-5 w-5",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className={cn(
                      "text-xs",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
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