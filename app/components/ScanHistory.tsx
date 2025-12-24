"use client";

import { useState, useEffect } from "react";
import { cacheManager } from "@/lib/cache-manager";

interface ScanHistoryProps {
  onSelectUrl: (url: string) => void;
}

export default function ScanHistory({ onSelectUrl }: ScanHistoryProps) {
  const [history, setHistory] = useState<
    Array<{ url: string; timestamp: number; violations: number }>
  >([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const h = cacheManager.getHistory();
    setHistory(h);
  };

  const handleClearHistory = () => {
    if (confirm("Clear all scan history?")) {
      cacheManager.clearHistory();
      cacheManager.clearCache();
      setHistory([]);
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Recent Scans ({history.length})
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Scan History</h3>
            <button
              onClick={handleClearHistory}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectUrl(item.url);
                  setIsOpen(false);
                }}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.url}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.violations === 0
                          ? "bg-green-100 text-green-800"
                          : item.violations < 5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.violations} issues
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
